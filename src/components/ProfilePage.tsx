import React, { useState } from 'react';
import { motion } from 'motion/react';
import PasskeySettings from './PasskeySettings';
import TotpSettings from './TotpSettings';
import { CAPITAL_AI_VERSION } from '../platform/Branding/runtimeBrand';
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
  ShieldCheck,
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
  { id: '1', label: 'Neural Core', icon: Cpu, color: 'from-brand-primary to-brand-primary' },
  { id: '2', label: 'Quantum Trader', icon: Sparkles, color: 'from-brand-cyan to-brand-accent' },
  { id: '3', label: 'Hyperion', icon: Flame, color: 'from-score-worst to-brand-danger' },
  { id: '4', label: 'Centurion', icon: Shield, color: 'from-score-best to-brand-success' },
  { id: '5', label: 'Arbitrage', icon: Target, color: 'from-brand-accent to-brand-accent' },
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

  // Client-visible profile snapshot export state. This intentionally does not
  // claim to be a complete server-side GDPR archive because this view has no
  // authoritative access to billing, auth, session, audit or backtest stores.
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const activeAvatar = AVATARS.find((av) => av.id === avatarId) || AVATARS[0];
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
        customAvatarUrl,
      });
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1200);
  };

  const handleExportGDPR = () => {
    setExporting(true);
    setTimeout(() => {
      // Export only values this UI actually owns or receives. Never fabricate
      // sessions, request counts, device fingerprints, backtests or account roles.
      const exportData = {
        schema_version: '1.0.0',
        export_type: 'client_profile_snapshot',
        export_scope:
          'Client-visible profile values only. Billing, authentication, session, audit and backtest data are not included in this browser-side snapshot.',
        legal_context: 'GDPR Article 20 portability support — scoped profile snapshot',
        export_timestamp: new Date().toISOString(),
        platform_version: CAPITAL_AI_VERSION,
        brand: 'CAPITAL-AI',
        profile: {
          id: profile.id ?? null,
          name: profile.name,
          email: profile.email,
          preferred_asset_class: preferredAssetClass,
          risk_profile: riskProfile,
          allocated_capital_usd: capital,
          subscription_tier: profile.subscriptionTier,
          avatar_id: avatarId,
          avatar_style: activeAvatar.label,
          has_custom_avatar: Boolean(customAvatarUrl),
        },
      };

      const dataStr =
        'data:application/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `capital_ai_profile_export_${profile.email.replace(/[@.]/g, '_')}.json`,
      );
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
        {/* Decorative glass border glow uses the canonical brand role. */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent" />

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          {/* Left column: Avatar Selector */}
          <div className="w-full md:w-1/3 flex flex-col items-center space-y-6 bg-white/5 p-6 rounded-xl border border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 font-mono">Dein Profillogo</h3>

            <div className="relative group">
              <div
                className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${activeAvatar.color} flex items-center justify-center transition-all duration-500 overflow-hidden`}
                style={{ boxShadow: '0 0 30px color-mix(in srgb, var(--color-brand-primary) 30%, transparent)' }}
              >
                {customAvatarUrl ? (
                  <img src={customAvatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <AvatarIcon className="w-16 h-16 text-black" />
                )}
              </div>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-bold text-brand-primary border border-brand-primary/30 uppercase tracking-wider whitespace-nowrap">
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
                        setCustomAvatarUrl('');
                      }}
                      aria-label={`Wähle Avatar ${av.label}`}
                      className={`p-2.5 rounded-lg bg-gradient-to-br ${av.color} flex items-center justify-center hover:scale-110 active:scale-95 transition-all focus:ring-2 focus:ring-brand-primary focus:outline-none ${
                        isSelected ? 'ring-2 ring-brand-primary scale-105' : 'opacity-60 hover:opacity-100'
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
                className="border border-dashed border-white/20 hover:border-brand-primary/50 rounded-lg p-3 text-center transition-all cursor-pointer bg-white/5 relative group/upload"
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
                <div className="text-white/60 group-hover/upload:text-brand-primary text-xs font-medium font-sans flex flex-col items-center gap-1">
                  <Download size={16} className="text-white/40 group-hover/upload:text-brand-primary group-hover/upload:scale-110 transition-all rotate-180" />
                  <span>Bild ablegen oder anklicken</span>
                  <span className="text-[9px] text-white/30 font-mono">PNG, JPG, WebP</span>
                </div>
              </div>
              {customAvatarUrl && (
                <button
                  type="button"
                  onClick={() => setCustomAvatarUrl('')}
                  className="w-full py-1 text-[10px] uppercase font-bold tracking-wider text-score-worst hover:brightness-110 transition-colors font-mono"
                >
                  Bild entfernen
                </button>
              )}
            </div>

            <div className="w-full pt-4 border-t border-white/5 text-center space-y-3">
              <div>
                <span className="text-xs text-white/40 font-mono">Mitgliedschaft</span>
                <div className="text-base font-black text-brand-primary uppercase tracking-wider font-display mt-0.5">
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
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 focus:ring-2 focus:ring-brand-primary focus:outline-none text-white border border-white/10 rounded-lg text-[10px] uppercase tracking-wider font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {portalLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
                    )}
                    Abrechnung verwalten
                  </button>
                  {portalError && (
                    <p className="text-[9px] text-score-worst mt-1.5 font-mono text-center leading-tight">
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
                  <label htmlFor="profile-name-input" className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Vor- &amp; Nachname</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      id="profile-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                      className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                    onChange={(e) => setPreferredAssetClass(e.target.value as UserProfile['preferredAssetClass'])}
                    className="w-full bg-black/60 border border-white/25 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
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
                    onChange={(e) => setRiskProfile(e.target.value as UserProfile['riskProfile'])}
                    className="w-full bg-black/60 border border-white/25 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
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
                    className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="text-xs text-white/40 flex items-center gap-1">
                  <Award size={14} className="text-brand-primary" />
                  Profiländerungen und Export enthalten keine synthetischen Aktivitätsdaten.
                </div>

                <div className="flex items-center gap-4">
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs font-mono font-bold text-score-best flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Profil erfolgreich aktualisiert!
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-brand-primary hover:brightness-110 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
                    style={{ boxShadow: '0 0 15px color-mix(in srgb, var(--color-brand-primary) 30%, transparent)' }}
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

      {/* Scoped profile portability snapshot; not a fabricated complete account archive. */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md max-w-4xl mx-auto relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 uppercase">
              DSGVO Art. 20 · Profil-Snapshot
            </span>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2 mt-1">
              <ShieldCheck size={16} className="text-brand-cyan" />
              <span>Client-sichtbare Profildaten exportieren</span>
            </h3>
            <p className="text-xs text-white/50 leading-relaxed font-sans">
              Dieser JSON-Export enthält ausschließlich die Werte, die dieser Profilansicht tatsächlich vorliegen. Billing-, Auth-, Session-, Audit- und Backtest-Daten werden hier nicht erfunden und sind in diesem browserseitigen Snapshot nicht enthalten.
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            {exportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-mono font-bold text-score-best text-center sm:text-right"
              >
                Profil-Snapshot (JSON) erfolgreich generiert.
              </motion.div>
            )}
            <button
              type="button"
              onClick={handleExportGDPR}
              disabled={exporting}
              aria-label="Client-sichtbare Profildaten als JSON exportieren und herunterladen"
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 focus:ring-2 focus:ring-brand-cyan border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {exporting ? (
                <RefreshCw size={14} className="animate-spin text-brand-cyan" />
              ) : (
                <Download size={14} className="text-brand-cyan" />
              )}
              <span>{exporting ? 'Exportiere Profil...' : 'Profil-Snapshot herunterladen'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADR-0003.5: echte Passkey/WebAuthn-Verwaltung (Supabase Auth Passkey Beta),
          ersetzt die zuvor nur clientseitig simulierte Proof-of-Concept-Komponente,
          die im Admin-Panel unter "sicherheit_poc" versteckt war. */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
        <PasskeySettings />
      </div>

      {/* ADR-0003.5 / Audit ARCH-AUDIT-0002 (D9): TOTP-Setup fuer Step-Up-geschuetzte
          Owner-Aktionen (z.B. Versions-Bump). Ohne diese Oberflaeche gab es keinen Weg,
          jemals ein Step-Up-Token zu erzeugen. */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
        <TotpSettings />
      </div>
    </div>
  );
}
