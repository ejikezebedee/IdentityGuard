import React, { useMemo, useState } from 'react';
import { AppView, Alias, RiskReport, SubscriptionPlan, UserState, VaultSession } from './types';
import { ICONS } from './constants';
import { accountService } from './services/accountService';
import { cryptoService } from './services/cryptoService';
import { geminiService } from './services/geminiService';
import { syncService } from './services/syncService';
import { vaultService } from './services/vaultService';

const emptyReport: RiskReport = {
  summary: 'Generate an alias to see a local risk briefing.',
  score: 0,
  findings: [],
  recommendations: [],
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [session, setSession] = useState<VaultSession | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [userState, setUserState] = useState<UserState>({
    isLocked: true,
    vaultReady: false,
    aliasHistory: [],
    customer: accountService.loadProfile(),
    syncState: syncService.load(),
    auditEvents: accountService.loadAuditEvents(),
  });

  const [inputContext, setInputContext] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputDOB, setInputDOB] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const [generatedAlias, setGeneratedAlias] = useState<Alias | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskReport>(emptyReport);
  const [copiedId, setCopiedId] = useState('');
  const [accountEmail, setAccountEmail] = useState(userState.customer?.email || '');
  const [accountName, setAccountName] = useState(userState.customer?.displayName || '');
  const [syncEndpoint, setSyncEndpoint] = useState(userState.syncState.endpoint);

  const activeAliases = userState.aliasHistory.filter(alias => !alias.isRevoked).length;
  const revokedAliases = userState.aliasHistory.length - activeAliases;

  const averageRisk = useMemo(() => {
    if (!generatedAlias || riskReport.score === 0) return 0;
    return riskReport.score;
  }, [generatedAlias, riskReport.score]);

  const handleUnlock = async () => {
    setUnlockError('');
    try {
      const nextSession = await vaultService.unlock(passphrase);
      const aliases = await vaultService.load(nextSession);
      setSession(nextSession);
      setUserState(prev => ({
        ...prev,
        isLocked: false,
        vaultReady: true,
        aliasHistory: aliases,
        customer: accountService.loadProfile(),
        syncState: syncService.load(),
        auditEvents: accountService.loadAuditEvents(),
      }));
      setCurrentView(AppView.DASHBOARD);
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'Vault unlock failed.');
    }
  };

  const persistAliases = async (aliases: Alias[]) => {
    if (!session) return;
    await vaultService.save(session, aliases);
    const nextSyncState = syncService.markPending(aliases);
    setUserState(prev => ({ ...prev, aliasHistory: aliases, syncState: nextSyncState }));
  };

  const handleGenerate = async () => {
    if (!inputContext || !inputName || !inputDOB || !inputAddress || !session) return;

    setIsGenerating(true);
    try {
      const identity = {
        fullName: inputName,
        dob: inputDOB,
        address: inputAddress,
        context: inputContext,
      };
      const generated = await cryptoService.generateAlias(identity);
      const report = await geminiService.fastAnalysis(inputContext);

      const newAlias: Alias = {
        id: crypto.randomUUID(),
        hash: generated.alias,
        fingerprint: generated.fingerprint,
        context: inputContext.trim(),
        timestamp: Date.now(),
        tags: inputContext.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 4),
        isRevoked: false,
      };

      const aliases = [newAlias, ...userState.aliasHistory];
      await persistAliases(aliases);
      const auditEvents = accountService.recordAudit({
        action: 'Alias generated',
        detail: `Created a defensive alias for ${newAlias.context}.`,
        severity: 'Info',
      });
      setUserState(prev => ({ ...prev, auditEvents }));
      setGeneratedAlias(newAlias);
      setRiskReport(report);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAlias = async (alias: Alias) => {
    await navigator.clipboard.writeText(alias.hash);
    setCopiedId(alias.id);
    window.setTimeout(() => setCopiedId(''), 1600);
  };

  const revokeAlias = async (aliasId: string) => {
    const aliases = userState.aliasHistory.map(alias =>
      alias.id === aliasId ? { ...alias, isRevoked: true } : alias
    );
    await persistAliases(aliases);
    const auditEvents = accountService.recordAudit({
      action: 'Alias revoked',
      detail: 'A stored alias was retired from active use.',
      severity: 'Warning',
    });
    setUserState(prev => ({ ...prev, auditEvents }));
  };

  const exportVault = () => {
    const blob = new Blob([JSON.stringify(userState.aliasHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `identityguard-vault-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearVault = async () => {
    if (!session) return;
    await persistAliases([]);
    vaultService.clear();
    const auditEvents = accountService.recordAudit({
      action: 'Vault cleared',
      detail: 'All local vault aliases were removed from this browser.',
      severity: 'Critical',
    });
    setUserState(prev => ({ ...prev, auditEvents }));
    setGeneratedAlias(null);
    setRiskReport(emptyReport);
  };

  const handleAccountSave = () => {
    if (!accountEmail.trim()) return;

    const profile = userState.customer
      ? accountService.saveProfile({
        ...userState.customer,
        email: accountEmail.trim().toLowerCase(),
        displayName: accountName.trim() || userState.customer.displayName,
      })
      : accountService.createProfile(accountEmail, accountName);

    setUserState(prev => ({
      ...prev,
      customer: profile,
      auditEvents: accountService.loadAuditEvents(),
    }));
  };

  const handleVerifyEmail = () => {
    if (!userState.customer) return;
    const profile = accountService.verifyEmail(userState.customer);
    setUserState(prev => ({
      ...prev,
      customer: profile,
      auditEvents: accountService.loadAuditEvents(),
    }));
  };

  const handlePlanChange = (plan: SubscriptionPlan) => {
    if (!userState.customer) return;
    const profile = accountService.updatePlan(userState.customer, plan);
    setUserState(prev => ({
      ...prev,
      customer: profile,
      auditEvents: accountService.loadAuditEvents(),
    }));
  };

  const handleSyncConfigure = () => {
    const nextSyncState = syncService.configure(syncEndpoint);
    setUserState(prev => ({ ...prev, syncState: nextSyncState }));
  };

  const handleSyncCheck = () => {
    const nextSyncState = syncService.completeSync();
    const auditEvents = accountService.recordAudit({
      action: 'Sync readiness checked',
      detail: nextSyncState.message,
      severity: 'Info',
    });
    setUserState(prev => ({ ...prev, syncState: nextSyncState, auditEvents }));
  };

  const isFormComplete = inputContext && inputName && inputDOB && inputAddress;

  const NavItem = ({ view, icon, label }: { view: AppView; icon: React.ReactNode; label: string }) => (
    <button
      className={`nav-item ${currentView === view ? 'active' : ''}`}
      onClick={() => setCurrentView(view)}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  if (userState.isLocked) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="brand-mark">
            <ICONS.Shield />
          </div>
          <p className="eyebrow">Local-first privacy tool</p>
          <h1>IdentityGuard</h1>
          <p className="auth-copy">
            Create one-use digital aliases and store them in an encrypted browser vault.
            No identity record is sent to a server in default mode.
          </p>
          <label className="field-label" htmlFor="passphrase">Vault passphrase</label>
          <input
            id="passphrase"
            type="password"
            value={passphrase}
            onChange={event => setPassphrase(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') handleUnlock();
            }}
            placeholder="Minimum 8 characters"
            autoComplete="current-password"
          />
          {unlockError && <p className="error-text">{unlockError}</p>}
          <button className="primary-action" onClick={handleUnlock} type="button">
            <ICONS.Lock /> Unlock local vault
          </button>
          <p className="fine-print">
            This project is defensive software. Use it to reduce identity reuse and improve privacy hygiene.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-badge"><ICONS.Shield /></span>
          <div>
            <strong>IdentityGuard</strong>
            <small>Encrypted alias vault</small>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary">
          <NavItem view={AppView.DASHBOARD} icon={<ICONS.Shield />} label="Dashboard" />
          <NavItem view={AppView.GENERATE} icon={<ICONS.Sparkles />} label="Generate" />
          <NavItem view={AppView.VAULT} icon={<ICONS.History />} label="Vault" />
          <NavItem view={AppView.AI_TOOLS} icon={<ICONS.Globe />} label="Risk" />
          <NavItem view={AppView.ACCOUNT} icon={<ICONS.User />} label="Account" />
          <NavItem view={AppView.SYNC} icon={<ICONS.Cloud />} label="Sync" />
          <NavItem view={AppView.BILLING} icon={<ICONS.CreditCard />} label="Billing" />
        </nav>
        <div className="sidebar-note">
          <span>Vault key</span>
          <strong>AES-GCM 256</strong>
          <small>Derived locally with PBKDF2</small>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">No-server mode active</p>
            <h2>{currentView === AppView.DASHBOARD ? 'Privacy Control Room' : currentView}</h2>
          </div>
          <div className="status-pill">
            <span />
            Local vault unlocked
          </div>
        </header>

        {currentView === AppView.DASHBOARD && (
          <section className="dashboard-grid">
            <article className="hero-card">
              <div>
                <p className="eyebrow">Current posture</p>
                <h3>{activeAliases} active aliases</h3>
                <p>
                  Each alias is generated locally, stored encrypted, and intended for one service context only.
                </p>
              </div>
              <div className="hero-meter" aria-label={`Risk score ${averageRisk}`}>
                <span>{averageRisk || '--'}</span>
                <small>Latest risk</small>
              </div>
            </article>

            <article className="metric-card">
              <span>Revoked</span>
              <strong>{revokedAliases}</strong>
              <small>Retired aliases</small>
            </article>
            <article className="metric-card">
              <span>Rotation</span>
              <strong>{cryptoService.getNextRotationDate()}</strong>
              <small>Suggested review</small>
            </article>
            <article className="metric-card">
              <span>Mode</span>
              <strong>{userState.vaultReady ? 'Local' : 'Locked'}</strong>
              <small>No backend required</small>
            </article>
            <article className="metric-card">
              <span>Account</span>
              <strong>{userState.customer ? userState.customer.plan : 'Guest'}</strong>
              <small>{userState.customer?.emailVerified ? 'Email verified' : 'Local test profile'}</small>
            </article>
            <article className="metric-card">
              <span>Sync</span>
              <strong>{userState.syncState.status}</strong>
              <small>{userState.syncState.pendingItems} pending records</small>
            </article>
            <article className="metric-card">
              <span>Audit</span>
              <strong>{userState.auditEvents.length}</strong>
              <small>Recent local events</small>
            </article>
          </section>
        )}

        {currentView === AppView.GENERATE && (
          <section className="split-layout">
            <article className="panel">
              <p className="eyebrow">Generate alias</p>
              <h3>Bind one alias to one real-world context.</h3>
              <div className="form-grid">
                <label>
                  Service context
                  <input value={inputContext} onChange={event => setInputContext(event.target.value)} placeholder="Business banking, crypto exchange, vendor onboarding" />
                </label>
                <label>
                  Full legal name
                  <input value={inputName} onChange={event => setInputName(event.target.value)} placeholder="Name used for the identity workflow" />
                </label>
                <label>
                  Date of birth
                  <input type="date" value={inputDOB} onChange={event => setInputDOB(event.target.value)} />
                </label>
                <label>
                  Residential address
                  <textarea value={inputAddress} onChange={event => setInputAddress(event.target.value)} rows={3} placeholder="Address used for this identity workflow" />
                </label>
              </div>
              <button className="primary-action wide" disabled={!isFormComplete || isGenerating} onClick={handleGenerate} type="button">
                <ICONS.Sparkles /> {isGenerating ? 'Generating locally...' : 'Generate secure alias'}
              </button>
            </article>

            <article className="panel result-panel">
              <p className="eyebrow">Latest alias</p>
              {generatedAlias ? (
                <>
                  <code className="alias-output">{generatedAlias.hash}</code>
                  <div className="result-actions">
                    <button onClick={() => copyAlias(generatedAlias)} type="button"><ICONS.Copy /> {copiedId === generatedAlias.id ? 'Copied' : 'Copy'}</button>
                    <button onClick={() => revokeAlias(generatedAlias.id)} type="button"><ICONS.Trash /> Revoke</button>
                  </div>
                  <dl className="detail-list">
                    <div><dt>Fingerprint</dt><dd>{generatedAlias.fingerprint}</dd></div>
                    <div><dt>Context</dt><dd>{generatedAlias.context}</dd></div>
                    <div><dt>Created</dt><dd>{new Date(generatedAlias.timestamp).toLocaleString()}</dd></div>
                  </dl>
                </>
              ) : (
                <p className="empty-state">Generated aliases will appear here with copy, revoke, and export controls.</p>
              )}
            </article>
          </section>
        )}

        {currentView === AppView.VAULT && (
          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Encrypted vault</p>
                <h3>{userState.aliasHistory.length} stored aliases</h3>
              </div>
              <div className="button-row">
                <button onClick={exportVault} disabled={userState.aliasHistory.length === 0} type="button"><ICONS.Download /> Export</button>
                <button onClick={clearVault} disabled={userState.aliasHistory.length === 0} type="button"><ICONS.Trash /> Clear</button>
              </div>
            </div>
            <div className="vault-list">
              {userState.aliasHistory.length === 0 && <p className="empty-state">The vault is empty.</p>}
              {userState.aliasHistory.map(alias => (
                <article className={`vault-item ${alias.isRevoked ? 'revoked' : ''}`} key={alias.id}>
                  <div>
                    <strong>{alias.context}</strong>
                    <code>{alias.hash}</code>
                    <small>{alias.fingerprint} | {new Date(alias.timestamp).toLocaleDateString()}</small>
                  </div>
                  <div className="button-row">
                    <button onClick={() => copyAlias(alias)} type="button"><ICONS.Copy /> {copiedId === alias.id ? 'Copied' : 'Copy'}</button>
                    {!alias.isRevoked && <button onClick={() => revokeAlias(alias.id)} type="button"><ICONS.Trash /> Revoke</button>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {currentView === AppView.AI_TOOLS && (
          <section className="split-layout">
            <article className="panel">
              <p className="eyebrow">Risk model</p>
              <h3>{riskReport.summary}</h3>
              <div className="score-block">
                <span>{riskReport.score || '--'}</span>
                <small>Local risk score</small>
              </div>
              <p>
                Optional AI can be connected through a private backend endpoint, but the default open-source build uses local deterministic analysis only.
              </p>
            </article>
            <article className="panel">
              <p className="eyebrow">Findings</p>
              <div className="finding-list">
                {riskReport.findings.length === 0 && <p className="empty-state">Generate an alias to create a risk briefing.</p>}
                {riskReport.findings.map(finding => (
                  <div className="finding" key={finding.label}>
                    <span className={`risk-dot ${finding.level.toLowerCase()}`} />
                    <div>
                      <strong>{finding.label} ({finding.level})</strong>
                      <p>{finding.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              {riskReport.recommendations.length > 0 && (
                <ul className="recommendations">
                  {riskReport.recommendations.map(item => <li key={item}>{item}</li>)}
                </ul>
              )}
            </article>
          </section>
        )}

        {currentView === AppView.ACCOUNT && (
          <section className="split-layout">
            <article className="panel">
              <p className="eyebrow">SaaS account</p>
              <h3>Prepare a customer profile for hosted IdentityGuard.</h3>
              <p>
                Use a test email during development. This local profile validates onboarding flow without exposing private vault content.
              </p>
              <div className="form-grid">
                <label>
                  Email address
                  <input value={accountEmail} onChange={event => setAccountEmail(event.target.value)} placeholder="tester@example.com" type="email" />
                </label>
                <label>
                  Display name
                  <input value={accountName} onChange={event => setAccountName(event.target.value)} placeholder="IdentityGuard tester" />
                </label>
              </div>
              <div className="button-row">
                <button className="primary-inline" onClick={handleAccountSave} disabled={!accountEmail.trim()} type="button">
                  <ICONS.User /> Save test account
                </button>
                <button onClick={handleVerifyEmail} disabled={!userState.customer || userState.customer.emailVerified} type="button">
                  <ICONS.Check /> Mark email verified
                </button>
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Account status</p>
              {userState.customer ? (
                <dl className="detail-list">
                  <div><dt>Email</dt><dd>{userState.customer.email}</dd></div>
                  <div><dt>Name</dt><dd>{userState.customer.displayName}</dd></div>
                  <div><dt>Plan</dt><dd>{userState.customer.plan}</dd></div>
                  <div><dt>Email status</dt><dd>{userState.customer.emailVerified ? 'Verified' : 'Pending test verification'}</dd></div>
                  <div><dt>Created</dt><dd>{new Date(userState.customer.createdAt).toLocaleString()}</dd></div>
                </dl>
              ) : (
                <p className="empty-state">No SaaS test account has been created on this browser.</p>
              )}
            </article>
          </section>
        )}

        {currentView === AppView.SYNC && (
          <section className="split-layout">
            <article className="panel">
              <p className="eyebrow">Encrypted sync</p>
              <h3>Configure a private backend endpoint.</h3>
              <p>
                The frontend only stores endpoint readiness. A production backend must accept encrypted vault blobs and must never require raw identity fields.
              </p>
              <div className="form-grid">
                <label>
                  Sync endpoint
                  <input value={syncEndpoint} onChange={event => setSyncEndpoint(event.target.value)} placeholder="https://api.example.com/v1/sync" />
                </label>
              </div>
              <div className="button-row">
                <button className="primary-inline" onClick={handleSyncConfigure} type="button">
                  <ICONS.Cloud /> Save sync settings
                </button>
                <button onClick={handleSyncCheck} disabled={!userState.syncState.enabled} type="button">
                  <ICONS.Check /> Run readiness check
                </button>
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Sync posture</p>
              <div className="score-block square">
                <span>{userState.syncState.pendingItems}</span>
                <small>Pending</small>
              </div>
              <dl className="detail-list">
                <div><dt>Status</dt><dd>{userState.syncState.status}</dd></div>
                <div><dt>Endpoint</dt><dd>{userState.syncState.endpoint || 'Not configured'}</dd></div>
                <div><dt>Last check</dt><dd>{userState.syncState.lastSyncAt ? new Date(userState.syncState.lastSyncAt).toLocaleString() : 'Not checked'}</dd></div>
                <div><dt>Message</dt><dd>{userState.syncState.message}</dd></div>
              </dl>
            </article>
          </section>
        )}

        {currentView === AppView.BILLING && (
          <section className="split-layout">
            <article className="panel">
              <p className="eyebrow">Commercial plans</p>
              <h3>Validate SaaS packaging before connecting payments.</h3>
              <p>
                Plan selection is local-only in this build. Connect Stripe, Paddle, or Lemon Squeezy in the backend before collecting money.
              </p>
              <div className="plan-grid">
                {(['Free', 'Pro', 'Team'] as SubscriptionPlan[]).map(plan => (
                  <button
                    className={`plan-card ${userState.customer?.plan === plan ? 'selected' : ''}`}
                    disabled={!userState.customer}
                    key={plan}
                    onClick={() => handlePlanChange(plan)}
                    type="button"
                  >
                    <strong>{plan}</strong>
                    <span>{plan === 'Free' ? '$0' : plan === 'Pro' ? '$9/mo' : '$29/mo'}</span>
                    <small>
                      {plan === 'Free'
                        ? 'Local vault and manual export'
                        : plan === 'Pro'
                          ? 'Encrypted sync and risk workflows'
                          : 'Shared policy, audit, and admin controls'}
                    </small>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Audit trail</p>
              <div className="audit-list">
                {userState.auditEvents.length === 0 && <p className="empty-state">Account and vault events will appear here.</p>}
                {userState.auditEvents.map(event => (
                  <article className={`audit-item ${event.severity.toLowerCase()}`} key={event.id}>
                    <strong>{event.action}</strong>
                    <p>{event.detail}</p>
                    <small>{new Date(event.timestamp).toLocaleString()} | {event.severity}</small>
                  </article>
                ))}
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
