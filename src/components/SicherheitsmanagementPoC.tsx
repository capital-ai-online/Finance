import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  User, 
  Database, 
  Lock, 
  Unlock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Terminal, 
  Fingerprint, 
  Eye, 
  EyeOff 
} from 'lucide-react';

interface IamLog {
  timestamp: string;
  user: string; // Masked/anonymized email
  role: string;
  action: string;
  status: 'SUCCESS' | 'DENIED' | 'STEP_UP_REQ' | 'WARNING';
  zone: string;
}

export default function SicherheitsmanagementPoC() {
  // Current session states
  const [selectedRole, setSelectedRole] = useState<'user' | 'supervisor' | 'admin' | 'owner'>('user');
  const [currentUserEmail, setCurrentUserEmail] = useState('sven.kulessa@capital-ai.online');
  const [hasPasskey, setHasPasskey] = useState(true);
  const [isPasskeyVerified, setIsPasskeyVerified] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [is2FaVerified, setIs2FaVerified] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showTokenPayload, setShowTokenPayload] = useState(false);

  // Simulation parameters
  const [stepUpRequired, setStepUpRequired] = useState(false);
  const [stepUpActionName, setStepUpActionName] = useState('');
  const [stepUpSuccess, setStepUpSuccess] = useState<string | null>(null);
  const [simulatedResponse, setSimulatedResponse] = useState<{ status: number; body: string } | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  // Local state for the logs
  const [iamLogs, setIamLogs] = useState<IamLog[]>([
    {
      timestamp: new Date(Date.now() - 3600000).toLocaleString(),
      user: 'sv**.*u*****@capital-ai.online',
      role: 'owner',
      action: 'INITIAL_IAM_BOOT',
      status: 'SUCCESS',
      zone: 'System Kernel'
    },
    {
      timestamp: new Date(Date.now() - 1800000).toLocaleString(),
      user: 'an**.*y**@capital-ai.online',
      role: 'admin',
      action: 'ACCESS_AUDIT_LOG',
      status: 'SUCCESS',
      zone: '/api/admin/hygiene/adr'
    }
  ]);

  // Generate simulated JWT
  const generateSimulatedJwt = () => {
    const payload = {
      iss: 'capital-ai-auth-server',
      sub: currentUserEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked for safety
      role: selectedRole,
      hasMfa: isPasskeyVerified && is2FaVerified,
      exp: Math.floor(Date.now() / 1000) + (isLoggedIn ? 900 : 0), // 15 mins
      jti: 'token_' + Math.random().toString(36).substr(2, 9)
    };
    return btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + btoa(JSON.stringify(payload)) + '.signature_verified_sha256';
  };

  const [jwt, setJwt] = useState('');

  useEffect(() => {
    setJwt(generateSimulatedJwt());
  }, [selectedRole, currentUserEmail, isPasskeyVerified, is2FaVerified, isLoggedIn]);

  const addLog = (user: string, role: string, action: string, status: 'SUCCESS' | 'DENIED' | 'STEP_UP_REQ' | 'WARNING', zone: string) => {
    // Mask email for GDPR compliance
    const parts = user.split('@');
    const name = parts[0];
    const domain = parts[1] || 'capital-ai.online';
    const maskedName = name.length > 3 
      ? name.substring(0, 2) + '***' + name.substring(name.length - 1)
      : name.substring(0, 1) + '***';
    const maskedUser = `${maskedName}@${domain}`;

    const newLog: IamLog = {
      timestamp: new Date().toLocaleString(),
      user: maskedUser,
      role,
      action,
      status,
      zone
    };
    setIamLogs(prev => [newLog, ...prev]);
  };

  // Auth simulators
  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsPasskeyVerified(selectedRole === 'user' ? false : true); // Assume auto-verified for lower, owner must step up
    setIs2FaVerified(selectedRole === 'owner' ? true : false);
    addLog(currentUserEmail, selectedRole, 'LOGIN_ATTEMPT', 'SUCCESS', 'Auth Gateway');
    setSimulatedResponse({
      status: 200,
      body: JSON.stringify({ message: 'Login erfolgreich.', role: selectedRole, mfa: selectedRole === 'owner' }, null, 2)
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsPasskeyVerified(false);
    setIs2FaVerified(false);
    setStepUpRequired(false);
    setStepUpSuccess(null);
    setSimulatedResponse(null);
    setActiveZone(null);
    addLog(currentUserEmail, selectedRole, 'LOGOUT', 'SUCCESS', 'Auth Gateway');
  };

  // Access Zone simulators
  const tryAccessZone = (zoneName: string, requiredRole: string[]) => {
    setActiveZone(zoneName);
    
    if (!isLoggedIn) {
      addLog(currentUserEmail, selectedRole, `ACCESS_ZONE_ATTEMPT (${zoneName})`, 'DENIED', zoneName);
      setSimulatedResponse({
        status: 401,
        body: JSON.stringify({ error: 'Nicht authentifiziert. JWT-Token fehlt.', hint: 'Bitte loggen Sie sich zuerst ein.' }, null, 2)
      });
      return;
    }

    if (!requiredRole.includes(selectedRole)) {
      addLog(currentUserEmail, selectedRole, `ACCESS_ZONE_ATTEMPT (${zoneName})`, 'DENIED', zoneName);
      setSimulatedResponse({
        status: 403,
        body: JSON.stringify({ 
          error: 'Zugriff verweigert. Unzureichende Rechte.', 
          required: requiredRole, 
          actual: selectedRole,
          emblem: '⊞ CAPITAL-AI CORE SECURITY'
        }, null, 2)
      });
      return;
    }

    // Owner specific zone config access (restricting server config)
    if (zoneName === '/server/config' && selectedRole === 'owner') {
      if (!isPasskeyVerified || !is2FaVerified) {
        addLog(currentUserEmail, selectedRole, `ACCESS_ZONE_ATTEMPT (${zoneName})`, 'STEP_UP_REQ', zoneName);
        setStepUpActionName('ACCESS_ZONE_/server/config');
        setStepUpRequired(true);
        setSimulatedResponse({
          status: 401,
          body: JSON.stringify({ 
            error: 'MFA_REQUIRED', 
            message: 'Für den Zugriff auf sensible Systemdateien (/server/config) ist eine FIDO2/Passkey- & 2FA-Bestätigung erforderlich.',
            stepUpNeeded: true
          }, null, 2)
        });
        return;
      }
    }

    // Success access
    addLog(currentUserEmail, selectedRole, `ACCESS_ZONE_GRANTED (${zoneName})`, 'SUCCESS', zoneName);
    let mockResult = '';
    if (zoneName === 'Public Dashboard') {
      mockResult = JSON.stringify({ status: 'live', marketFeed: 'active', assets: 28 }, null, 2);
    } else if (zoneName === '/api/admin/hygiene/adr') {
      mockResult = JSON.stringify({ success: true, count: 8, directory: 'docs/adr/*.md' }, null, 2);
    } else if (zoneName === '/server/config') {
      mockResult = JSON.stringify({ 
        DATABASE_URL: 'postgresql://owner_usr:******@cloudsql.gcp.internal:5432/capital_db',
        SUPABASE_JWT_SECRET: 'super-secure-sha256-key-******',
        BREAK_GLASS_RECOVERY_PHRASE: 'ACTIVE',
        COMPLIANCE_KEY_SIGNATURE: 'RSA_4096_BETA_0.5.4'
      }, null, 2);
    }

    setSimulatedResponse({
      status: 200,
      body: mockResult
    });
  };

  // Critical compliance action (Stufe 6 Freigabe)
  const triggerComplianceSeal = () => {
    if (!isLoggedIn) {
      setSimulatedResponse({
        status: 401,
        body: JSON.stringify({ error: 'Authentifizierung erforderlich.' }, null, 2)
      });
      return;
    }

    if (selectedRole !== 'owner') {
      addLog(currentUserEmail, selectedRole, 'TRIGGER_COMPLIANCE_SEAL_FAIL', 'DENIED', 'Compliance Value Chain');
      setSimulatedResponse({
        status: 403,
        body: JSON.stringify({ 
          error: 'Nur der verifizierte Plattform-Inhaber (Owner) darf die Wahrheitskennzeichnung Stufe 6 ausführen.',
          actualRole: selectedRole
        }, null, 2)
      });
      return;
    }

    // Require Step-Up Authentication
    addLog(currentUserEmail, selectedRole, 'COMPLIANCE_SEAL_STEP_UP_REQUIRED', 'STEP_UP_REQ', 'Compliance Value Chain');
    setStepUpActionName('COMPLIANCE_SEAL_SIGNATURE');
    setStepUpRequired(true);
    setSimulatedResponse({
      status: 401,
      body: JSON.stringify({ 
        error: 'STEP_UP_AUTH_REQUIRED', 
        message: 'Kritische Stufe 6 Zertifizierung erfordert FIDO2/Passkey Biometrie-Verifizierung (Step-up Auth).' 
      }, null, 2)
    });
  };

  // Satisfy step up simulation
  const verifyStepUp = (method: 'passkey' | '2fa') => {
    if (method === 'passkey') {
      setIsPasskeyVerified(true);
      addLog(currentUserEmail, selectedRole, 'STEP_UP_VERIFICATION_PASSKEY', 'SUCCESS', 'Auth Kernel');
    } else {
      setIs2FaVerified(true);
      addLog(currentUserEmail, selectedRole, 'STEP_UP_VERIFICATION_2FA', 'SUCCESS', 'Auth Kernel');
    }

    // If both verified
    const nextPasskey = method === 'passkey' ? true : isPasskeyVerified;
    const next2Fa = method === '2fa' ? true : is2FaVerified;

    if (nextPasskey && next2Fa) {
      setStepUpRequired(false);
      setStepUpSuccess('Zustand verifiziert! Step-Up erfolgreich abgeschlossen.');
      
      if (stepUpActionName === 'COMPLIANCE_SEAL_SIGNATURE') {
        addLog(currentUserEmail, selectedRole, 'COMPLIANCE_SEAL_SIGNED_SUCCESS', 'SUCCESS', 'Compliance Value Chain');
        setSimulatedResponse({
          status: 200,
          body: JSON.stringify({
            message: '🟢 Stufe 6 Compliance-Wahrheitskennzeichnung erfolgreich signiert!',
            signee: 'Sven Kulessa (Inhaber)',
            timestamp: new Date().toISOString(),
            status: 'EXTERNALLY_VERIFIED',
            complianceCode: 'CAPITAL-AI-SEAL-99382-0.5.4',
            emblem: '⊞ CAPITAL-AI CORE COMPLIANCE'
          }, null, 2)
        });
      } else if (stepUpActionName === 'ACCESS_ZONE_/server/config') {
        addLog(currentUserEmail, selectedRole, 'ACCESS_ZONE_GRANTED (/server/config)', 'SUCCESS', '/server/config');
        setSimulatedResponse({
          status: 200,
          body: JSON.stringify({ 
            DATABASE_URL: 'postgresql://owner_usr:******@cloudsql.gcp.internal:5432/capital_db',
            SUPABASE_JWT_SECRET: 'super-secure-sha256-key-******',
            BREAK_GLASS_RECOVERY_PHRASE: 'ACTIVE',
            COMPLIANCE_KEY_SIGNATURE: 'RSA_4096_BETA_0.5.4'
          }, null, 2)
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-aif-gold-DEFAULT/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 flex items-center justify-center text-aif-gold-DEFAULT shrink-0">
            <Shield size={20} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <span>Proof of Concept: Sicherheitsmanagement & Compliance</span>
              <span className="text-[9px] bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 px-2 py-0.5 rounded font-bold">ADR-0003.5</span>
            </h3>
            <p className="text-[11px] text-white/50 leading-relaxed font-sans max-w-3xl mt-0.5">
              Diese interaktive Sandbox demonstriert die Koppelung der revisionssicheren Compliance-Wertschöpfungskette an das gehärtete FIDO2/Passkey Multi-Faktor-Authentifizierungsmodell (IAM) der Plattform.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COL 1: IDENTITY ACCESS PANEL */}
        <div className="xl:col-span-1 bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-5 text-left">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={13} className="text-aif-gold-DEFAULT" />
              <span>1. Identitäts- & Rollenkonfiguration</span>
            </h4>
          </div>

          <div className="space-y-3.5">
            {/* Owner email identifier input */}
            <div>
              <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">E-Mail-Adresse (Simuliert)</label>
              <input 
                type="email" 
                value={currentUserEmail}
                onChange={(e) => setCurrentUserEmail(e.target.value)}
                placeholder="sven.kulessa@capital-ai.online"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-aif-gold-DEFAULT/50 transition-colors"
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="text-[10px] font-mono text-white/40 uppercase block mb-1.5">Zuweisbare Systemrolle</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'user', label: 'User', desc: 'Standardzugang' },
                  { id: 'supervisor', label: 'Supervisor', desc: 'Sven Kulessa' },
                  { id: 'admin', label: 'Admin', desc: 'Compliance Team' },
                  { id: 'owner', label: 'Owner (Inhaber)', desc: 'Revisions-Vollrecht' },
                ].map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRole(role.id as any);
                        addLog(currentUserEmail, role.id, `ROLE_SWITCH_TO_${role.id.toUpperCase()}`, 'WARNING', 'Client Console');
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-aif-gold-DEFAULT/10 border-aif-gold-DEFAULT text-white shadow-[0_0_12px_rgba(245,196,83,0.1)]' 
                          : 'bg-black/20 border-white/5 hover:border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono block">{role.label}</span>
                        {isSelected && <ShieldCheck size={12} className="text-aif-gold-DEFAULT" />}
                      </div>
                      <span className="text-[9px] text-white/40 block mt-0.5">{role.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Multi-Factor Status LEDs */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-2">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">Multi-Faktor Sicherheitsstatus (MFA)</span>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 font-mono">1. Primär: Passkey (WebAuthn/FIDO2)</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isPasskeyVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                  <span className={`text-[10px] font-mono font-bold ${isPasskeyVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPasskeyVerified ? 'ACTIVE' : 'LOCKED'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 font-mono">2. Sekundär: 2FA TOTP (Google Auth)</span>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${is2FaVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                  <span className={`text-[10px] font-mono font-bold ${is2FaVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                    {is2FaVerified ? 'ACTIVE' : 'LOCKED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Login / Logout Controls */}
            <div className="pt-2">
              {!isLoggedIn ? (
                <button
                  onClick={handleLogin}
                  className="w-full py-2.5 bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Unlock size={12} />
                  <span>Session starten (Simuliere Login)</span>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock size={12} />
                  <span>Session beenden (Logout)</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* COL 2: CORE SECURITY ZONE ACTION PANEL */}
        <div className="xl:col-span-1 bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-5 text-left">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
              <Database size={13} className="text-[#06B6D4]" />
              <span>2. Zugriffsbeschränkte Zonen & Actions</span>
            </h4>
          </div>

          <p className="text-[11px] text-white/55 leading-normal">
            Klicken Sie auf die verschiedenen REST-Endpunkte und Systeme, um die serverseitigen IAM- und MFA-Prüfungen der neuen Architektur zu triggern.
          </p>

          <div className="space-y-3">
            {/* Zone 1: Public Dashboard */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Zone A: Public Dashboard Data</span>
                <span className="text-[9px] font-mono text-white/40 block">Mindestrolle: JEDER</span>
              </div>
              <button
                onClick={() => tryAccessZone('Public Dashboard', ['user', 'supervisor', 'admin', 'owner'])}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] uppercase rounded-lg border border-white/5 cursor-pointer"
              >
                Abfragen
              </button>
            </div>

            {/* Zone 2: Admin/Supervisor Document Manager */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Zone B: /api/admin/hygiene/adr</span>
                <span className="text-[9px] font-mono text-amber-400 block">Mindestrolle: SUPERVISOR / ADMIN / OWNER</span>
              </div>
              <button
                onClick={() => tryAccessZone('/api/admin/hygiene/adr', ['supervisor', 'admin', 'owner'])}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono text-[10px] uppercase rounded-lg border border-amber-500/20 cursor-pointer"
              >
                Abfragen
              </button>
            </div>

            {/* Zone 3: Super-Secure Owner-Only Config */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Zone C: /server/config (RESTRICTED)</span>
                <span className="text-[9px] font-mono text-red-400 block">Rolle: OWNER (MFA Zwang!)</span>
              </div>
              <button
                onClick={() => tryAccessZone('/server/config', ['owner'])}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-[10px] uppercase rounded-lg border border-red-500/20 cursor-pointer"
              >
                Abfragen
              </button>
            </div>

            {/* CRITICAL COMPLIANCE ACTION: STUFE 6 SEAL */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-white/40 uppercase block">3. Compliance-Wertschöpfung (Revisions-Freigabe)</span>
              <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-3.5 space-y-3">
                <div className="flex items-start gap-2">
                  <Fingerprint size={16} className="text-purple-400 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">Stufe 6: Compliance-Wahrheitskennzeichnung</span>
                    <span className="text-[9px] text-white/50 leading-relaxed block mt-0.5">
                      Glaubwürdiger, rechtlich belastbarer Audit-Trail zur Freigabe für externe Auditoren. Verlangt Step-Up FIDO2 MFA-Zertifizierung.
                    </span>
                  </div>
                </div>

                <button
                  onClick={triggerComplianceSeal}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-[10px] uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={11} />
                  <span>Zertifikat Stufe 6 signieren</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* COL 3: LIVE BACKEND RESPONSE TERMINAL & JWT ANALYSIS */}
        <div className="xl:col-span-1 bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4 text-left flex flex-col min-h-[500px]">
          <div className="border-b border-white/5 pb-3 flex justify-between items-center">
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={13} className="text-emerald-400" />
              <span>3. Live Simulation Output</span>
            </h4>
            <span className="text-[8px] font-mono text-white/30 uppercase">Secure REST Output</span>
          </div>

          {/* SIMULATED JWT DECRYPTOR DRAWER */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Generated Client-JWT Token</span>
              <button 
                onClick={() => setShowTokenPayload(!showTokenPayload)}
                className="text-[9px] font-mono text-white/40 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {showTokenPayload ? <EyeOff size={11} /> : <Eye size={11} />}
                <span>{showTokenPayload ? 'Signatur' : 'Payload'} anzeigen</span>
              </button>
            </div>
            
            <p className="font-mono text-[9px] text-white/50 break-all select-all bg-black/60 p-2 rounded border border-white/5 max-h-[50px] overflow-y-auto">
              {jwt}
            </p>

            <AnimatePresence mode="wait">
              {showTokenPayload && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-black/60 p-2.5 rounded border border-white/5 overflow-hidden text-[9px] font-mono text-[#E5C17C]"
                >
                  <p className="text-[8px] font-bold uppercase text-white/30 mb-1">// Entschlüsseltes Token-Inhalt (Decoded JWT)</p>
                  <div>
                    <span className="text-white/40">"iss":</span> "capital-ai-auth-server",
                  </div>
                  <div>
                    <span className="text-white/40">"sub":</span> "sv**.*u*****@capital-ai.online",
                  </div>
                  <div>
                    <span className="text-white/40">"role":</span> "{selectedRole}",
                  </div>
                  <div>
                    <span className="text-white/40">"hasMfa":</span> {isPasskeyVerified && is2FaVerified ? 'true' : 'false'},
                  </div>
                  <div>
                    <span className="text-white/40">"exp":</span> {Math.floor(Date.now() / 1000) + 900} (15m Ablaufschutz),
                  </div>
                  <div>
                    <span className="text-white/40">"jti":</span> "token_83k9a21"
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP UP PROMPT IF REQUIRED */}
          <AnimatePresence>
            {stepUpRequired && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldAlert size={16} />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">Step-Up MFA Verifizierung</span>
                </div>
                <p className="text-[10px] text-white/70 font-sans leading-relaxed">
                  Bestätigen Sie Ihren Biometrie-Sicherheitsfaktor (Passkey/TOTP) zur Freigabe des übermittelten Kommandos:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => verifyStepUp('passkey')}
                    className="p-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[10px] uppercase transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Fingerprint size={12} />
                    <span>Passkey</span>
                  </button>
                  <button
                    onClick={() => verifyStepUp('2fa')}
                    className="p-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-mono font-bold text-[10px] uppercase transition-colors cursor-pointer flex items-center justify-center gap-1 border border-amber-500/30"
                  >
                    <KeyRound size={12} />
                    <span>Google 2FA</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP UP SUCCESS MSG */}
          {stepUpSuccess && !stepUpRequired && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-xl flex items-center gap-2">
              <CheckCircle size={14} />
              <span>{stepUpSuccess}</span>
            </div>
          )}

          {/* REST SIMULATION VIEW */}
          <div className="flex-1 bg-black p-3.5 rounded-xl border border-white/5 font-mono text-[10px] text-white/80 overflow-y-auto space-y-2 min-h-[180px]">
            <div className="flex justify-between items-center text-white/40 border-b border-white/5 pb-1 mb-2">
              <span>SIMULATED SERVER RESPONSE</span>
              {simulatedResponse && (
                <span className={`px-1.5 py-0.5 rounded font-bold ${simulatedResponse.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  HTTP {simulatedResponse.status}
                </span>
              )}
            </div>

            {simulatedResponse ? (
              <pre className="text-left font-mono leading-normal whitespace-pre-wrap max-h-[200px] overflow-y-auto select-all">
                {simulatedResponse.body}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center py-12 text-white/30 text-center">
                <p>Warten auf API-Anfrage im Sicherheits-Dashboard...</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ANONYMIZED IAM AUDIT TRAIL */}
      <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 text-left space-y-3.5">
        <div className="border-b border-white/5 pb-3 flex justify-between items-center">
          <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
            <Terminal size={13} className="text-purple-400" />
            <span>MFA & IAM Access Audit Log (`IAM_ACCESS_LOG`) — GDPR Compliant</span>
          </h4>
          <span className="text-[9px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">REVISIONS-SICHER</span>
        </div>

        <p className="text-[10px] text-white/50 leading-relaxed max-w-3xl">
          Sämtliche IAM-Zugriffe werden separat vom Standard-Eventlog verschlüsselt und unveränderbar protokolliert. Gemäß DSGVO (Art. 32) werden E-Mail-Adressen und sensitive Parameter unkenntlich maskiert, bevor sie im Audit-Trail hinterlegt werden.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-white/80 font-mono">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase">
                <th className="pb-2.5">Zeitstempel</th>
                <th className="pb-2.5">Identität (Maskiert)</th>
                <th className="pb-2.5">Rolle</th>
                <th className="pb-2.5">Aktion / Command</th>
                <th className="pb-2.5">System-Zone</th>
                <th className="pb-2.5 text-right">MFA-Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {iamLogs.map((log, index) => {
                const statusColors = {
                  SUCCESS: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
                  DENIED: 'text-rose-400 bg-rose-500/10 border border-rose-500/20',
                  STEP_UP_REQ: 'text-amber-400 bg-amber-500/10 border border-amber-500/20 animate-pulse',
                  WARNING: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                };
                return (
                  <tr key={index} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 text-white/50">{log.timestamp}</td>
                    <td className="py-2.5 font-bold text-white/90">{log.user}</td>
                    <td className="py-2.5">
                      <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded font-bold uppercase text-white/70">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-cyan-300">{log.action}</td>
                    <td className="py-2.5 text-white/40">{log.zone}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[log.status]}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
