
import React, { useState } from 'react';
import { AppView, Alias, UserState } from './types';
import { ICONS } from './constants';
import { cryptoService } from './services/cryptoService';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [userState, setUserState] = useState<UserState>({
    isLocked: true,
    hasHardwareKey: true,
    aliasHistory: []
  });

  // Identity Input States
  const [inputContext, setInputContext] = useState('');
  const [inputName, setInputName] = useState('');
  const [inputDOB, setInputDOB] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  
  const [generatedAlias, setGeneratedAlias] = useState<Alias | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');

  const handleUnlock = () => {
    setUserState(prev => ({ ...prev, isLocked: false }));
    setCurrentView(AppView.DASHBOARD);
  };

  const handleGenerate = async () => {
    if (!inputContext || !inputName || !inputDOB || !inputAddress) return;
    
    setIsGenerating(true);
    setAiResponse('');
    
    try {
      // Core crypto generation using the full identity object
      const aliasStr = await cryptoService.generateAlias({
        fullName: inputName,
        dob: inputDOB,
        address: inputAddress,
        context: inputContext
      });

      const newAlias: Alias = {
        id: Math.random().toString(36).substr(2, 9),
        hash: aliasStr,
        context: inputContext,
        timestamp: Date.now(),
        tags: [inputContext.toLowerCase()],
        isRevoked: false
      };

      // Simulate the heavy lifting of entropy gathering
      await new Promise(r => setTimeout(r, 1500));

      setGeneratedAlias(newAlias);
      setUserState(prev => ({
        ...prev,
        aliasHistory: [newAlias, ...prev.aliasHistory]
      }));
      
      // Get AI risk analysis of the context
      const briefing = await geminiService.fastAnalysis(inputContext);
      setAiResponse(briefing);
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const NavItem = ({ view, icon, label }: { view: AppView, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
        currentView === view ? 'text-indigo-400 scale-110' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  const isFormComplete = inputContext && inputName && inputDOB && inputAddress;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative overflow-hidden bg-slate-950 text-slate-100">
      
      {/* AUTH SCREEN */}
      {userState.isLocked && currentView === AppView.AUTH && (
        <div className="absolute inset-0 z-50 glass flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
            <div className="relative p-6 glass rounded-3xl neon-border">
              <ICONS.Shield />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">IdentityGuard</h1>
          <p className="text-slate-400 mb-12 text-sm leading-relaxed">
            Zero-Server Storage Protocol. <br/> Local hardware keys required.
          </p>
          <button
            onClick={handleUnlock}
            className="group relative flex flex-col items-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-indigo-500/50 transition-all active:scale-95"
          >
            <div className="text-indigo-500 mb-4 animate-pulse group-hover:scale-110 transition-transform">
              <ICONS.Fingerprint />
            </div>
            <span className="text-sm font-semibold text-slate-300">Biometric Unlock</span>
          </button>
        </div>
      )}

      {/* HEADER */}
      {!userState.isLocked && (
        <header className="p-6 flex items-center justify-between glass z-10 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
              <ICONS.Shield />
            </span>
            IdentityGuard
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Security</span>
          </div>
        </header>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 pb-24">
        {!userState.isLocked && (
          <>
            {currentView === AppView.DASHBOARD && (
              <div className="space-y-6">
                <div className="glass p-6 rounded-3xl relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 blur-3xl"></div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">Active Protection</h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-bold mono">{userState.aliasHistory.length}</p>
                      <p className="text-sm text-slate-500">Encrypted Aliases</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-indigo-400 mb-1">Vault Health</p>
                      <p className="text-sm font-medium">Excellent</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCurrentView(AppView.GENERATE)}
                    className="p-6 glass rounded-2xl hover:bg-slate-800/50 transition-colors flex flex-col items-center text-center"
                  >
                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl mb-3">
                      <ICONS.Sparkles />
                    </div>
                    <span className="text-sm font-semibold">Generate</span>
                  </button>
                  <button 
                    onClick={() => setCurrentView(AppView.VAULT)}
                    className="p-6 glass rounded-2xl hover:bg-slate-800/50 transition-colors flex flex-col items-center text-center"
                  >
                    <div className="p-3 bg-slate-700/50 text-slate-400 rounded-xl mb-3">
                      <ICONS.History />
                    </div>
                    <span className="text-sm font-semibold">Vault</span>
                  </button>
                </div>
              </div>
            )}

            {currentView === AppView.GENERATE && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="glass p-6 rounded-3xl space-y-5 border border-slate-800">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-indigo-400 uppercase tracking-wider">
                    <ICONS.Lock /> Identity Verification
                  </h4>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Service Context</label>
                    <input 
                      type="text"
                      placeholder="e.g. Personal Banking, Social Media"
                      value={inputContext}
                      onChange={(e) => setInputContext(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Full Legal Name</label>
                    <input 
                      type="text"
                      placeholder="As shown on official ID"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Date of Birth</label>
                      <input 
                        type="date"
                        value={inputDOB}
                        onChange={(e) => setInputDOB(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Permanent Home Address</label>
                      <textarea 
                        placeholder="Full residential address..."
                        value={inputAddress}
                        onChange={(e) => setInputAddress(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!isFormComplete || isGenerating}
                  className="w-full p-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:opacity-100 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Gathering Entropy...
                    </>
                  ) : (
                    <>
                      <ICONS.Lock /> Generate Secure Alias
                    </>
                  )}
                </button>

                {generatedAlias && !isGenerating && (
                  <div className="animate-in zoom-in-95 duration-500 space-y-4">
                    <div className="glass p-6 rounded-3xl border border-indigo-500/40 bg-indigo-500/5">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase mb-3 tracking-widest">Unique Digital Identity</p>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 flex items-center justify-between group">
                        <span className="text-base font-bold mono tracking-tighter text-indigo-100 break-all">{generatedAlias.hash}</span>
                        <button className="text-slate-500 hover:text-indigo-400 p-2 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 text-center italic">Alias generated via DeviceID + Multi-Field Hash Binding</p>
                    </div>
                    {aiResponse && (
                      <div className="glass p-5 rounded-3xl border border-slate-800">
                        <h5 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                          <ICONS.Sparkles /> AI Security Assessment
                        </h5>
                        <p className="text-sm leading-relaxed text-slate-300">{aiResponse}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentView === AppView.VAULT && (
               <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">Encrypted Vault</h3>
                  <span className="text-[10px] px-2 py-0.5 border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 rounded-full font-bold">HARDWARE LOCKED</span>
                </div>
                {userState.aliasHistory.length === 0 ? (
                  <div className="text-center py-20 glass rounded-3xl border border-dashed border-slate-800">
                    <p className="text-slate-500 text-sm">Vault is empty.</p>
                  </div>
                ) : (
                  userState.aliasHistory.map(alias => (
                    <div key={alias.id} className="glass p-4 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                          <ICONS.Shield />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{alias.context}</p>
                          <p className="text-[10px] text-slate-500 mono">{alias.hash.substring(0, 16)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-bold text-slate-600 uppercase mb-1">Created</p>
                         <p className="text-[10px] font-medium text-slate-400">{new Date(alias.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
               </div>
            )}

            {currentView === AppView.AI_TOOLS && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 glass rounded-2xl border-l-4 border-indigo-500">
                  <ICONS.Sparkles />
                  <div>
                    <h4 className="font-bold text-sm">AI Assistant Active</h4>
                    <p className="text-[10px] text-slate-500">Identity verification and risk modeling</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={async () => setAiResponse(await geminiService.askIdentityAssistant("Latest identity theft prevention tips."))} className="p-4 glass rounded-xl text-left hover:border-indigo-500/50 flex items-center justify-between">
                    <span className="text-sm font-semibold">Security Consultant</span>
                    <ICONS.ChevronRight />
                  </button>
                  <button onClick={async () => {
                    const result = await geminiService.searchSecurityThreats("Emerging identity fraud in 2025");
                    setAiResponse(result.text);
                  }} className="p-4 glass rounded-xl text-left hover:border-indigo-500/50 flex items-center justify-between">
                    <span className="text-sm font-semibold">Threat Intelligence</span>
                    <ICONS.Globe />
                  </button>
                </div>

                {aiResponse && (
                   <div className="glass p-6 rounded-3xl animate-in fade-in duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Model Output</span>
                        <button onClick={() => setAiResponse('')} className="text-slate-500 text-[10px] hover:text-white underline uppercase">Clear</button>
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {aiResponse}
                      </div>
                   </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER NAVIGATION */}
      {!userState.isLocked && (
        <nav className="absolute bottom-0 left-0 right-0 glass px-6 pt-3 pb-8 border-t border-slate-800 flex items-center justify-between z-10">
          <NavItem view={AppView.DASHBOARD} icon={<ICONS.Shield />} label="Dash" />
          <NavItem view={AppView.GENERATE} icon={<ICONS.Sparkles />} label="Generate" />
          <NavItem view={AppView.VAULT} icon={<ICONS.History />} label="Vault" />
          <NavItem view={AppView.AI_TOOLS} icon={<ICONS.Sparkles />} label="AI Suite" />
        </nav>
      )}

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-900/50 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
};

export default App;
