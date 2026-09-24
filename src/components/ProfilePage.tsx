import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CAPITAL_AI_VERSION } from '../platform/Branding/runtimeBrand';
import { authFetch } from '../lib/authFetch';
import { SecuritySettingsPanel } from './SecuritySettingsPanel';
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
  Download,
  ShieldCheck,
  KeyRound,
  AtSign,
  Phone,
  TrendingUp,
} from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  username: string;
  phoneNumber: string;
  phoneVerified: boolean;
  avatarId: string;
  avatarColor: string;
  preferredAssetClass: 'Crypto' | 'Stocks' | 'Commodities' | 'Forex';
  riskProfile: 'Sicherheitsorientiert' | 'Ausgewogen' | 'Spekulativ' | 'Hochfrequenz-Trading';
  capital: number;
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  customAvatarUrl?: string;
  favoriteCryptocurrencies: string[];
  favoriteStocks: string[];
  portfolioAssets: string[];
  investmentHorizon: 'Kurzfristig' | 'Mittelfristig' | 'Langfristig';
  experienceLevel: 'Einsteiger' | 'Fortgeschritten' | 'Erfahren' | 'Professionell';
  preferredCurrency: 'EUR' | 'USD' | 'CHF' | 'GBP';
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

const CRYPTO_ASSETS = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'AVAX'];
const STOCK_ASSETS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA'];
const PORTFOLIO_ASSETS = [...CRYPTO_ASSETS, ...STOCK_ASSETS, 'EUR', 'USD', 'XAU'];

function AssetSelection({ label, options, selected, onChange }: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-[10px] font-bold uppercase tracking-widest text-white/55">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((symbol) => {
          const active = selected.includes(symbol);
          return (
            <button key={symbol} type="button" aria-pressed={active} onClick={() => onChange(active ? selected.filter((value) => value !== symbol) : [...selected, symbol])} className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition ${active ? 'border-brand-cyan/50 bg-brand-cyan/15 text-brand-cyan' : 'border-white/10 bg-white/5 text-white/50 hover:text-white'}`}>
              {symbol}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProfilePage({ profile, onUpdateProfile }: ProfilePageProps) {
  const [name, setName] = useState(profile.name);
  const [email] = useState(profile.email);
  const [username, setUsername] = useState(profile.username);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [preferredAssetClass, setPreferredAssetClass] = useState(profile.preferredAssetClass);
  const [riskProfile, setRiskProfile] = useState(profile.riskProfile);
  const [capital, setCapital] = useState(profile.capital);
  const [avatarId, setAvatarId] = useState(profile.avatarId);
  const [customAvatarUrl, setCustomAvatarUrl] = useState(profile.customAvatarUrl || '');
  const [favoriteCryptocurrencies, setFavoriteCryptocurrencies] = useState(profile.favoriteCryptocurrencies);
  const [favoriteStocks, setFavoriteStocks] = useState(profile.favoriteStocks);
  const [portfolioAssets, setPortfolioAssets] = useState(profile.portfolioAssets);
  const [investmentHorizon, setInvestmentHorizon] = useState(profile.investmentHorizon);
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel);
  const [preferredCurrency, setPreferredCurrency] = useState(profile.preferredCurrency);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Client-visible profile snapshot export state. This intentionally does not
  // claim to be a complete server-side GDPR archive because this view has no
  // authoritative access to billing, auth, session, audit or backtest stores.
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const activeAvatar = AVATARS.find((av) => av.id === avatarId) || AVATARS[0];
  const AvatarIcon = activeAvatar.icon;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setProfileError(null);

    try {
      const nextProfile: UserProfile = {
        name,
        email: profile.email,
        username,
        phoneNumber,
        phoneVerified: profile.phoneVerified && phoneNumber === profile.phoneNumber,
        avatarId,
        avatarColor: activeAvatar.color,
        preferredAssetClass,
        riskProfile,
        capital,
        subscriptionTier: profile.subscriptionTier,
        customAvatarUrl,
        favoriteCryptocurrencies,
        favoriteStocks,
        portfolioAssets,
        investmentHorizon,
        experienceLevel,
        preferredCurrency,
        id: profile.id,
      };
      const response = await authFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(nextProfile),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Profil konnte nicht gespeichert werden.');
      onUpdateProfile(nextProfile);
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Profil konnte nicht gespeichert werden.');
      setSaving(false);
    }
  };

  const handleAvatarFile = async (file: File) => {
    setUploadingAvatar(true);
    setProfileError(null);
    try {
      const payload = new FormData();
      payload.set('avatar', file);
      const response = await authFetch('/api/auth/profile/avatar', { method: 'POST', body: payload });
      const body = await response.json().catch(() => null);
      if (!response.ok || typeof body?.avatarUrl !== 'string') {
        throw new Error(body?.error || 'Avatar konnte nicht gespeichert werden.');
      }
      setCustomAvatarUrl(body.avatarUrl);
      onUpdateProfile({ ...profile, name, avatarId, avatarColor: activeAvatar.color, preferredAssetClass, riskProfile, capital, customAvatarUrl: body.avatarUrl });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Avatar konnte nicht gespeichert werden.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemoval = async () => {
    setUploadingAvatar(true);
    setProfileError(null);
    try {
      const response = await authFetch('/api/auth/profile/avatar', { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Avatar konnte nicht entfernt werden.');
      }
      setCustomAvatarUrl('');
      onUpdateProfile({ ...profile, name, avatarId, avatarColor: activeAvatar.color, preferredAssetClass, riskProfile, capital, customAvatarUrl: undefined });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Avatar konnte nicht entfernt werden.');
    } finally {
      setUploadingAvatar(false);
    }
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
          username,
          phone_number: phoneNumber || null,
          phone_verified: profile.phoneVerified,
          preferred_asset_class: preferredAssetClass,
          risk_profile: riskProfile,
          allocated_capital_usd: capital,
          avatar_id: avatarId,
          avatar_style: activeAvatar.label,
          has_custom_avatar: Boolean(customAvatarUrl),
          favorite_cryptocurrencies: favoriteCryptocurrencies,
          favorite_stocks: favoriteStocks,
          portfolio_assets: portfolioAssets,
          investment_horizon: investmentHorizon,
          experience_level: experienceLevel,
          preferred_currency: preferredCurrency,
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
      <div className="mx-auto flex max-w-4xl gap-2 rounded-xl border border-white/10 bg-black/40 p-1.5" role="tablist" aria-label="Kontoeinstellungen">
        <button type="button" role="tab" aria-selected={activeTab === 'profile'} onClick={() => setActiveTab('profile')} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-wider transition ${activeTab === 'profile' ? 'bg-brand-primary text-black' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}>
          <User size={15} /> Profil
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'settings'} onClick={() => setActiveTab('settings')} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-wider transition ${activeTab === 'settings' ? 'bg-brand-cyan text-black' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}>
          <KeyRound size={15} /> Einstellungen
        </button>
      </div>

      <div className={activeTab === 'profile' ? 'space-y-6' : 'hidden'}>
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
                  if (file) void handleAvatarFile(file);
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) void handleAvatarFile(file);
                  };
                  input.click();
                }}
              >
                <div className="text-white/60 group-hover/upload:text-brand-primary text-xs font-medium font-sans flex flex-col items-center gap-1">
                  <Download size={16} className="text-white/40 group-hover/upload:text-brand-primary group-hover/upload:scale-110 transition-all rotate-180" />
                  <span>{uploadingAvatar ? 'Bild wird sicher gespeichert…' : 'Bild ablegen oder anklicken'}</span>
                  <span className="text-[9px] text-white/30 font-mono">PNG, JPG, WebP · maximal 2 MB</span>
                </div>
              </div>
              {customAvatarUrl && (
                <button
                  type="button"
                  onClick={() => void handleAvatarRemoval()}
                  disabled={uploadingAvatar}
                  className="w-full py-1 text-[10px] uppercase font-bold tracking-wider text-score-worst hover:brightness-110 transition-colors font-mono"
                >
                  Bild entfernen
                </button>
              )}
            </div>

          </div>

          {/* Right column: Edit Details Form */}
          <div className="flex-1 w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white font-display">Benutzerprofil verwalten</h2>
              <p className="text-xs text-white/50 mt-1 font-sans">
                Pflege deine persönlichen Angaben und Einstellungen. Deine Änderungen werden geschützt deinem Konto zugeordnet.
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
                      readOnly
                      aria-readonly="true"
                      className="w-full bg-black/40 border border-white/15 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white/60 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="profile-username-input" className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Benutzername</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input id="profile-username-input" type="text" required minLength={3} maxLength={32} pattern="[a-z0-9][a-z0-9._-]{2,31}" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} autoComplete="username" className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="profile-phone-input" className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Telefonnummer (optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input id="profile-phone-input" type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} autoComplete="tel" placeholder="+491701234567" className="w-full bg-black/60 border border-white/25 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                  <p className={`text-[10px] ${profile.phoneVerified && phoneNumber === profile.phoneNumber ? 'text-emerald-300' : 'text-white/35'}`}>{profile.phoneVerified && phoneNumber === profile.phoneNumber ? 'Verifiziert und für Recovery nutzbar' : 'Nach dem Speichern unter Einstellungen per SMS verifizieren'}</p>
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

              <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-3">
                <label className="space-y-1.5 text-[10px] font-bold uppercase tracking-widest text-white/55">Anlagehorizont
                  <select value={investmentHorizon} onChange={(event) => setInvestmentHorizon(event.target.value as UserProfile['investmentHorizon'])} className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2.5 text-sm normal-case text-white"><option>Kurzfristig</option><option>Mittelfristig</option><option>Langfristig</option></select>
                </label>
                <label className="space-y-1.5 text-[10px] font-bold uppercase tracking-widest text-white/55">Erfahrung
                  <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value as UserProfile['experienceLevel'])} className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2.5 text-sm normal-case text-white"><option>Einsteiger</option><option>Fortgeschritten</option><option>Erfahren</option><option>Professionell</option></select>
                </label>
                <label className="space-y-1.5 text-[10px] font-bold uppercase tracking-widest text-white/55">Referenzwährung
                  <select value={preferredCurrency} onChange={(event) => setPreferredCurrency(event.target.value as UserProfile['preferredCurrency'])} className="mt-1 w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2.5 text-sm normal-case text-white"><option>EUR</option><option>USD</option><option>CHF</option><option>GBP</option></select>
                </label>
              </div>

              <div className="space-y-5 rounded-xl border border-brand-cyan/15 bg-brand-cyan/[0.03] p-4">
                <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-cyan" /><h3 className="text-xs font-black uppercase tracking-wider text-white">Watchlist &amp; Portfolio</h3></div>
                <AssetSelection label="Lieblings-Kryptowährungen" options={CRYPTO_ASSETS} selected={favoriteCryptocurrencies} onChange={setFavoriteCryptocurrencies} />
                <AssetSelection label="Lieblings-Aktien" options={STOCK_ASSETS} selected={favoriteStocks} onChange={setFavoriteStocks} />
                <AssetSelection label="Aktuelles Portfolio" options={PORTFOLIO_ASSETS} selected={portfolioAssets} onChange={setPortfolioAssets} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="text-xs text-white/40 flex items-center gap-1">
                  <Award size={14} className="text-brand-primary" />
                  Persönliche Änderungen werden erst nach erfolgreicher Backend-Speicherung übernommen.
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
              {profileError && <p role="alert" className="text-xs text-red-300">{profileError}</p>}
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

      </div>

      {activeTab === 'settings' && <SecuritySettingsPanel phoneNumber={phoneNumber} phoneVerified={profile.phoneVerified && phoneNumber === profile.phoneNumber} />}
    </div>
  );
}
