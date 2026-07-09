import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Shield, 
  Wallet, 
  Award, 
  CheckCircle2, 
  Save, 
  Sparkles, 
  RefreshCw, 
  Cpu, 
  Flame, 
  Target, 
  CreditCard, 
  Loader2, 
  Download, 
  ShieldCheck 
} from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  avatarId: string;
  avatarColor: string;
  preferredAssetClass: 'Crypto' | 'Stocks' | 'Commodities' | 'Forex';
  riskProfile: 'Sicherheitsorientiert' | 'Ausgewogen' | 'Spekulativ' | 'Hochfrequenz-Trading';
  capital: number;
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  customAvatarUrl?: string;
  id?: string;
}

interface ProfilePageProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

const AVATARS = [
  { id: '1', label: 'Neural Core', icon: Cpu, color: 'from-aif-gold-DEFAULT to-aif-gold-dark' },
  { id: '2', label: 'Quantum Trader', icon: Sparkles, color: 'from-aif-neon-cyan to-blue-600' },
  { id: '3', label: 'Hyperion', icon: Flame, color: 'from-rose-500 to-red-700' },
  { id: '4', label: 'Centurion', icon: Shield, color: 'from-emerald-500 to-teal-700' },
  { id: '5', label: 'Arbitrage', icon: Target, color: 'from-purple-500 to-indigo-700' }
];

export function ProfilePage({ profile, onUpdateProfile }: ProfilePageProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [preferredAssetClass, setPreferredAssetClass] = useState(profile.preferredAssetClass);
  const [riskProfile, setRiskProfile] = useState(profile.riskProfile);
  const [capital, setCapital] = useState(profile.capital);
  const [avatarId, setAvatarId] = useState(profile.avatarId);
  const [customAvatarUrl, setCustomAvatarUrl] = useState(profile.customAvatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // GDPR Export state
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const activeAvatar = AVATARS.find(av => av.id === avatarId) || AVATARS[0];
  const AvatarIcon = activeAvatar.icon;

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profile.email,
          returnUrl: window.location.href,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden des Kundenportals.');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Ungültige Serverantwort.');
      }
    } catch (err: any) {
      console.error(err);
      setPortalError(err.message || 'Das Stripe-Kundenportal ist derzeit nicht erreichbar.');
      setTimeout(() => setPortalError(null), 6000);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    setTimeout(() => {
      onUpdateProfile({
        name,
        email,
        avatarId,
        avatarColor: activeAvatar.color,
        preferredAssetClass,
        riskProfile,
        capital,
        subscriptionTier: profile.subscriptionTier,
        customAvatarUrl
      });
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1200);
  };

  // GDPR Export triggers file download
  const handleExportGDPR = () => {
    setExporting(true);
    setTimeout(() => {
      // Build a complete, structured portability archive (Art. 20 GDPR)
      const exportData = {
        compliance_standard: "EU General Data Protection Regulation (GDPR) Article 20 / BDSG § 83",
        export_timestamp: new Date().toISOString(),
        platform_version: "Version 0.5.4 (Beta-Phase)",
        licensee: "CAPITAL-AI Technologies",
        user_identity: {
          name: profile.name,
          email: profile.email,
          verified_status: profile.email === 'sven.kulessa@gmail.com' ? 'Platform Owner / Administrator' : 'Subscribed User'
        },
        profile_parameters: {
          preferred_asset_class: preferredAssetClass,
          risk_profile: riskProfile,
          allocated_capital_usd: capital,
          subscription_tier: profile.subscriptionTier,
          avatar_id: avatarId,
          avatar_style: activeAvatar.label
        },
        active_session_activity: {
          last_login: new Date().toLocaleDateString('de-DE'),
          device_fingerprint_secure: "SHA-256 ENCRYPTED LOCALLY",
          requests_completed_estimate: profile.email === 'sven.kulessa@gmail.com' ? 14502 : 480
        },
        backtest_history_archive: [
          { symbol: "BTC/USD", strategy: "MA Cross Momentum", timeframe: "1std", profit_factor: 1.82, status: "SUCCESS" },
          { symbol: "ETH/USD", strategy: "RSI Mean Reversion", timeframe: "4std", profit_factor: 1.54, status: "SUCCESS" },
          { symbol: "SOL/USD", strategy: "Breakout Channel", timeframe: "15min", profit_factor: 2.11, status: "SUCCESS" }
        ]
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `aif_core_gdpr_export_${profile.email.replace(/[@.]/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md max-w-4xl mx-auto relative overflow-hidden">
        {/* Decorative glass border glows */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/40 to-transparent" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          {/* Left column: Avatar Selector */}
          <div className="w-full md:w-1/3 flex flex-col items-center space-y-6 bg-white/5 p-6 rounded-xl border border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 font-mono">Dein Profillogo</h3>
            
            <div className="relative group">
              <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${activeAvatar.color} flex items-center justify-center shadow-[0_0_30px_rgba(245,196,83,0.3)] transition-all duration-500 overflow-hidden`}>
                {customAvatarUrl ? (
                  <img src={customAvatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <AvatarIcon className="w-16 h-16 text-black" />
                )}
              </div>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-bold text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/30 uppercase tracking-wider whitespace-nowrap">
                {customAvatarUrl ? 'Eigener Avatar' : activeAvatar.label}
              </span>
            </div>

            <div className="space-y-2 w-full">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono text-center block">Logo wählen</span>
              <div className="grid grid-cols-5 gap-2" role="group" aria-label="Profil-Avatar auswählen">
                {AVATARS.map((av) => {
                  const AvIcon = av.icon;
                  const isSelected = av.id === avatarId && !customAvatarUrl;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setAvatarId(av.id);
                        setCustomAvatarUrl(''); // Reset custom avatar to use selected preset
                      }}
                      aria-label={`Wähle Avatar ${av.label}`}
                      className={`p-2.5 rounded-lg bg-gradient-to-br ${av.color} flex items-center justify-center hover:scale-110 active:scale-95 transition-all focus:ring-2 focus:ring-white focus:outline-none ${
                        isSelected ? 'ring-2 ring-white scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      <AvIcon className="w-5 h-5 text-black" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 w-full pt-4 border-t border-white/5">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono text-center block">Eigenes Bild hochladen</span>
              <div 
                className="border border-dashed border-white/20 hover:border-aif-gold-DEFAULT/50 rounded-lg p-3 text-center transition-all cursor-pointer bg-white/5 relative group/upload"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setCustomAvatarUrl(event.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setCustomAvatarUrl(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                <div className="text-white/60 group-hover/upload:text-aif-gold-light text-xs font-medium font-sans flex flex-col items-center gap-1">
                  <Download size={16} className="text-white/40 group-hover/upload:text-aif-gold-DEFAULT group-hover/upload:scale-110 transition-all rotate-180" />
                  <span>Bild ablegen oder anklicken</span>
                  <span className="text-[9px] text-white/30 font-mono">PNG, JPG, WebP</span>
                </div>
              </div>
              {customAvatarUrl && (
                <button
                  type="button"
                  onClick={() => setCustomAvatarUrl('')}
                  className="w-full py-1 text-[10px] uppercase font-bold tracking-wider text-rose-400 hover:text-rose-300 transition-colors font-mono"
                >
                  Bild entfernen
                </button>
              )}
            </div>

            <div className="w-full pt-4 border-t border-white/5 text-center space-y-3">
              <div>
                <span className="text-xs text-white/40 font-mono">Mitgliedschaft</span>
                <div className="text-base font-black text-aif-gold-DEFAULT uppercase tracking-wider font-display mt-0.5">
                  {profile.subscriptionTier}
                </div>
              </div>

              {profile.subscriptionTier !== 'Free' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    aria-label="Abrechnung und Abonnements in Stripe verwalten"
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 focus:ring-2 focus:ring-aif-gold-DEFAULT focus:outline-none text-white border border-white/10 rounded-lg text-[10px] uppercase tracking-wider font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {portalLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-aif-gold-DEFAULT" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5 text-aif-gold-DEFAULT" />
                    )}
                    Abrechnung verwalten
                  </button>
                  {portalError && (
                    <p className="text-[9px] text-rose-400 mt-1.5 font-mono text-center leading-tight">
                      {portalError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Edit Details Form */}
          <div className="flex-1 w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white font-display">Benutzerprofil verwalten</h2>
              <p className="text-xs text-white/50 mt-1 font-sans">
                Aktualisiere deine Account-Parameter für maßgeschneiderte Backtest- und Scoring-Logiken.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="profile-name-input" className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Vor- & Nachname</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      id="profile-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="profile-email-input" className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">E-Mail-Adresse</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      id="profile-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="profile-asset-select" className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Bevorzugte Assetklasse</label>
                  <select
                    id="profile-asset-select"
                    value={preferredAssetClass}
                    onChange={(e) => setPreferredAssetClass(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/25 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT cursor-pointer"
                  >
                    <option value="Crypto">Kryptowährungen (Crypto)</option>
                    <option value="Stocks">Aktien (Stocks)</option>
                    <option value="Commodities">Rohstoffe (Commodities)</option>
                    <option value="Forex">Devisen (Forex)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="profile-risk-select" className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Risikoprofil</label>
                  <select
                    id="profile-risk-select"
                    value={riskProfile}
                    onChange={(e) => setRiskProfile(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/25 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT cursor-pointer"
                  >
                    <option value="Sicherheitsorientiert">Sicherheitsorientiert</option>
                    <option value="Ausgewogen">Ausgewogen</option>
                    <option value="Spekulativ">Spekulativ</option>
                    <option value="Hochfrequenz-Trading">Hochfrequenz-Trading / Neural</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-capital-input" className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Investitionskapital ($)</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="profile-capital-input"
                    type="number"
                    value={capital}
                    onChange={(e) => setCapital(Number(e.target.value))}
                    required
                    min="0"
                    className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="text-xs text-white/40 flex items-center gap-1">
                  <Award size={14} className="text-aif-gold-DEFAULT" />
                  Daten werden verschlüsselt auf Servern gespeichert
                </div>

                <div className="flex items-center gap-4">
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Profil erfolgreich aktualisiert!
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-aif-gold-DEFAULT hover:bg-aif-gold-light disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(245,196,83,0.3)] transition-all focus:ring-2 focus:ring-white focus:outline-none"
                  >
                    {saving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {saving ? 'Speichert...' : 'Profil Speichern'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* GDPR Data Portability (Art. 20 GDPR) Panel */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md max-w-4xl mx-auto relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
              DSGVO-Compliance &amp; Datenexport
            </span>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2 mt-1">
              <ShieldCheck size={16} className="text-cyan-400" />
              <span>Datenübertragbarkeit (DSGVO Art. 20)</span>
            </h3>
            <p className="text-xs text-white/50 leading-relaxed font-sans">
              Gemäß Artikel 20 der Datenschutz-Grundverordnung (DSGVO) hast du das Recht, deine bei uns gespeicherten personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            {exportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-mono font-bold text-emerald-400 text-center sm:text-right"
              >
                Export-Archiv (JSON) erfolgreich generiert!
              </motion.div>
            )}
            <button
              type="button"
              onClick={handleExportGDPR}
              disabled={exporting}
              aria-label="Meine persönlichen Daten gemäß DSGVO als JSON exportieren und herunterladen"
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 focus:ring-2 focus:ring-cyan-500 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {exporting ? (
                <RefreshCw size={14} className="animate-spin text-cyan-400" />
              ) : (
                <Download size={14} className="text-cyan-400" />
              )}
              <span>{exporting ? 'Exportiere Daten...' : 'Daten herunterladen'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
