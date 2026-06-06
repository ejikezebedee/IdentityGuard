import React, { useMemo, useState } from 'react';
import { AppView, Alias, RiskReport, UserState, VaultSession } from './types';
import { ICONS } from './constants';
import { cryptoService } from './services/cryptoService';
import { geminiService } from './services/geminiService';
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
  });

  const [inputContext, setInputContext] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputDOB, setInputDOB] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const [generatedAlias, setGeneratedAlias] = useState<Alias | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskReport>(emptyReport);
  const [copiedId, setCopiedId] = useState('');

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
      setUserState({ isLocked: false, vaultReady: true, aliasHistory: aliases });
      setCurrentView(AppView.DASHBOARD);
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'Vault unlock failed.');
    }
  };

  const persistAliases = async (aliases: Alias[]) => {
    if (!session) return;
    await vaultService.save(session, aliases);
    setUserState(prev => ({ ...prev, aliasHistory: aliases }));
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
    setGeneratedAlias(null);
    setRiskReport(emptyReport);
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
      </main>
    </div>
  );
};

export default App;
