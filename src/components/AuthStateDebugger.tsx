import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  ShieldAlert, 
  Database, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Copy, 
  Lock, 
  Eye, 
  EyeOff,
  Globe,
  UserCheck
} from 'lucide-react';

export function AuthStateDebugger() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showRawSession, setShowRawSession] = useState<boolean>(false);
  const [showRawUser, setShowRawUser] = useState<boolean>(false);
  const [reachabilityStatus, setReachabilityStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [reachabilityError, setReachabilityError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Environment variables presence (masked for security compliance)
  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const envAnonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

  const maskValue = (val: string) => {
    if (!val) return 'Nicht konfiguriert / Leer';
    if (val.length <= 10) return '*** (zu kurz)';
    return `${val.substring(0, 6)}...${val.substring(val.length - 6)}`;
  };

  const loadDebugData = async () => {
    setLoading(true);
    if (!supabase) {
      setSessionData(null);
      setUserData(null);
      setLoading(false);
      setReachabilityStatus('error');
      setReachabilityError('Supabase-Client konnte nicht initialisiert werden (URL oder Key fehlt).');
      return;
    }

    try {
      // 1. Get raw session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      setSessionData(session);

      // 2. Get user info
      if (session?.user) {
        setUserData(session.user);
      } else {
        // Try getting user directly in case session is stale
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          setUserData(user);
        } else {
          setUserData(null);
        }
      }

      // 3. Reachability test (pinging Supabase auth api if URL is provided)
      if (envUrl) {
        const cleanUrl = envUrl.replace(/\/$/, "");
        const start = performance.now();
        const response = await fetch(`${cleanUrl}/auth/v1/health`, {
          headers: {
            'apikey': envAnonKey,
          }
        });
        const duration = Math.round(performance.now() - start);
        if (response.ok) {
          setReachabilityStatus('success');
          setReachabilityError(`Verbindung erfolgreich (${duration}ms)`);
        } else {
          setReachabilityStatus('error');
          setReachabilityError(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        setReachabilityStatus('error');
        setReachabilityError('Keine Supabase URL konfiguriert.');
      }
    } catch (err: any) {
      console.warn('[Auth Debugger] Failed to fetch auth status:', err);
      setReachabilityStatus('error');
      setReachabilityError(err?.message || 'Unbekannter Netzwerk- oder API-Fehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadDebugData();
    setRefreshing(false);
  };

  const copyDebugInfoToClipboard = () => {
    const debugPayload = {
      timestamp: new Date().toISOString(),
      supabaseConfigured: isSupabaseConfigured(),
      envUrlConfigured: !!envUrl,
      envKeyConfigured: !!envAnonKey,
      reachability: {
        status: reachabilityStatus,
        details: reachabilityError
      },
      sessionExists: !!sessionData,
      sessionExpiresAt: sessionData?.expires_at ? new Date(sessionData.expires_at * 1000).toISOString() : null,
      userExists: !!userData,
      userId: userData?.id || null,
      userEmail: userData?.email || null,
      userRole: userData?.role || null,
      userIsAnonymous: userData?.is_anonymous || false,
      authProvider: userData?.app_metadata?.provider || null,
      identitiesCount: userData?.identities?.length || 0,
      localStorageTokenExists: !!localStorage.getItem('mcc_user_session')
    };

    navigator.clipboard.writeText(JSON.stringify(debugPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="auth-state-debugger-panel" className="bg-[#1c1c1f]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
      {/* Visual Accent Layer */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="text-aif-gold-DEFAULT" size={20} />
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">
              Auth State Debugger
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/10 text-white/40">
              MODUL-1 SECURE
            </span>
          </div>
          <p className="text-xs text-white/60">
            Echtzeit-Diagnose des Supabase-Verbindungsstatus, der Sitzungsdaten und der JWT-Validierung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Diagnosedaten aktualisieren"
          >
            <RefreshCw size={12} className={`${refreshing ? 'animate-spin' : ''}`} />
            <span>Aktualisieren</span>
          </button>

          <button
            onClick={copyDebugInfoToClipboard}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Diagnosereport in Zwischenablage kopieren"
          >
            <Copy size={12} />
            <span>{copied ? 'Kopiert!' : 'Report kopieren'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="w-8 h-8 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest animate-pulse">
            Sammle Diagnosedaten...
          </span>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Supabase Client Status */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block mb-1">
                  Supabase Client
                </span>
                <span className="text-xs font-bold text-white block">
                  Initialisierung
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {isSupabaseConfigured() ? (
                  <>
                    <CheckCircle2 className="text-emerald-400" size={16} />
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Bereit</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-rose-400 animate-pulse" size={16} />
                    <span className="text-xs font-mono text-rose-400 font-bold uppercase">Fehlt</span>
                  </>
                )}
              </div>
            </div>

            {/* Reachability Status */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block mb-1">
                  API-Erreichbarkeit
                </span>
                <span className="text-xs font-bold text-white block">
                  Auth Health Endpoint
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {reachabilityStatus === 'success' ? (
                  <>
                    <Globe className="text-emerald-400 animate-pulse" size={16} />
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Erreichbar</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-rose-400 animate-pulse" size={16} />
                    <span className="text-xs font-mono text-rose-400 font-bold uppercase">Fehlgeschlagen</span>
                  </>
                )}
              </div>
            </div>

            {/* Active Session Status */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block mb-1">
                  Sitzungstyp (Session)
                </span>
                <span className="text-xs font-bold text-white block">
                  Eingeloggter Status
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {sessionData ? (
                  <>
                    <UserCheck className="text-aif-gold-DEFAULT" size={16} />
                    <span className="text-xs font-mono text-aif-gold-DEFAULT font-bold uppercase">
                      {sessionData.user?.is_anonymous ? 'Gast-Modus' : 'Registriert'}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="text-white/30" size={16} />
                    <span className="text-xs font-mono text-white/40 font-bold uppercase">
                      Nicht angemeldet
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Local Storage Cache */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block mb-1">
                  LocalState Cache
                </span>
                <span className="text-xs font-bold text-white block">
                  mcc_user_session
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {localStorage.getItem('mcc_user_session') ? (
                  <>
                    <CheckCircle2 className="text-emerald-400" size={16} />
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Vorhanden</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-amber-400" size={16} />
                    <span className="text-xs font-mono text-amber-400 font-bold uppercase font-semibold">Leer</span>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Diagnostic Info List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Environment Variables & Connections */}
            <div className="p-5 rounded-xl bg-black/30 border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Database size={14} className="text-aif-gold-DEFAULT" />
                <span>Verbindungsdetails & Parameter</span>
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                  <span className="text-white/50 font-mono">VITE_SUPABASE_URL</span>
                  <span className="font-mono text-white font-semibold bg-white/5 px-2 py-0.5 rounded text-[11px]" title={envUrl || 'Nicht definiert'}>
                    {maskValue(envUrl)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                  <span className="text-white/50 font-mono">VITE_SUPABASE_ANON_KEY</span>
                  <span className="font-mono text-white font-semibold bg-white/5 px-2 py-0.5 rounded text-[11px]" title={envAnonKey || 'Nicht definiert'}>
                    {maskValue(envAnonKey)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                  <span className="text-white/50 font-mono">Client-Instanz-Status</span>
                  <span className="font-mono text-white">
                    {supabase ? 'Initialisiert & Geladen' : 'Null / Nicht initialisiert'}
                  </span>
                </div>

                <div className="flex flex-col text-xs space-y-1 pt-1">
                  <span className="text-white/50 font-mono">Fehlermeldungen / Server-Feedback:</span>
                  <span className={`font-mono px-2.5 py-1.5 rounded text-[11px] leading-normal border ${
                    reachabilityStatus === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}>
                    {reachabilityError || 'Keine Fehler erfasst.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: User / Token Session Overview */}
            <div className="p-5 rounded-xl bg-black/30 border border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Key size={14} className="text-aif-gold-DEFAULT" />
                <span>Benutzer- & Sitzungs-Metadaten</span>
              </h4>

              {sessionData ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                    <span className="text-white/50 font-mono">User ID (UUID)</span>
                    <span className="font-mono text-white text-[11px] tracking-tight truncate max-w-[200px]" title={userData?.id}>
                      {userData?.id || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                    <span className="text-white/50 font-mono">E-Mail Adresse</span>
                    <span className="font-mono text-white">
                      {userData?.email || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                    <span className="text-white/50 font-mono">Auth-Provider</span>
                    <span className="font-mono text-white uppercase text-[11px]">
                      {userData?.app_metadata?.provider || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                    <span className="text-white/50 font-mono">Sitzungs-Ablaufzeit</span>
                    <span className="font-mono text-white text-[11px]">
                      {sessionData.expires_at 
                        ? new Date(sessionData.expires_at * 1000).toLocaleString('de-DE') 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <Lock className="text-white/20" size={24} />
                  <p className="text-xs text-white/50 font-medium">
                    Keine aktive Authentifizierungs-Sitzung gefunden.
                  </p>
                  <p className="text-[10px] text-white/30 max-w-xs font-mono uppercase tracking-wider">
                    Melden Sie sich an, um Token-Metadaten einzusehen.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Collapsible raw outputs */}
          <div className="space-y-4 pt-2 border-t border-white/5">
            
            {/* Raw Session JSON */}
            <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
              <button
                onClick={() => setShowRawSession(!showRawSession)}
                className="w-full px-5 py-3.5 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors text-xs font-mono font-bold uppercase tracking-wider text-white/80"
              >
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-aif-gold-DEFAULT" />
                  <span>Raw Supabase Session Info (JSON)</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
                  <span>{showRawSession ? 'Verbergen' : 'Anzeigen'}</span>
                  {showRawSession ? <EyeOff size={12} /> : <Eye size={12} />}
                </div>
              </button>
              
              {showRawSession && (
                <div className="p-4 bg-neutral-950/90 border-t border-white/5 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
                  {sessionData ? (
                    <pre>{JSON.stringify({
                      ...sessionData,
                      // Mask actual JWT token strings for security, but indicate presence and lengths
                      access_token: sessionData.access_token ? `[JWT_BEARER_TOKEN] Length: ${sessionData.access_token.length} chars` : null,
                      refresh_token: sessionData.refresh_token ? `[JWT_REFRESH_TOKEN] Length: ${sessionData.refresh_token.length} chars` : null
                    }, null, 2)}</pre>
                  ) : (
                    <div className="text-white/40 py-2">null (Keine Sitzung aktiv)</div>
                  )}
                </div>
              )}
            </div>

            {/* Raw User Object JSON */}
            <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
              <button
                onClick={() => setShowRawUser(!showRawUser)}
                className="w-full px-5 py-3.5 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors text-xs font-mono font-bold uppercase tracking-wider text-white/80"
              >
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-aif-gold-DEFAULT" />
                  <span>Raw Supabase User Object (JSON)</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
                  <span>{showRawUser ? 'Verbergen' : 'Anzeigen'}</span>
                  {showRawUser ? <EyeOff size={12} /> : <Eye size={12} />}
                </div>
              </button>
              
              {showRawUser && (
                <div className="p-4 bg-neutral-950/90 border-t border-white/5 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
                  {userData ? (
                    <pre>{JSON.stringify(userData, null, 2)}</pre>
                  ) : (
                    <div className="text-white/40 py-2">null (Kein Benutzerobjekt geladen)</div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Quick Troubleshooting Guide */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs flex gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h5 className="font-bold text-amber-500">Häufige Konfigurations-Fehler & Lösungen:</h5>
              <ul className="list-disc list-inside space-y-1 text-white/70 leading-normal font-sans font-medium">
                <li>
                  <strong className="text-white">Fehlende URL/Anon-Key:</strong> Falls "Supabase-Client" auf "Fehlt" steht, wurden die Umgebungsvariablen nicht korrekt in AI Studio geladen. Bitte überprüfen Sie Ihr Setup im Einstellungsmenü.
                </li>
                <li>
                  <strong className="text-white">API-Fehler (401/403):</strong> Das Anon-Key ist fehlerhaft oder abgelaufen. Stellen Sie sicher, dass <code className="font-mono text-amber-200">VITE_SUPABASE_PUBLISHABLE_KEY</code> exakt mit dem Anon/Public Key Ihres Projekts übereinstimmt.
                </li>
                <li>
                  <strong className="text-white">CORS- oder Netzwerkfehler:</strong> Prüfen Sie unter Supabase &gt; API Settings die erlaubten Herkunftsdomänen (Origins). Unsere Entwicklungs-URL muss freigegeben sein.
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
