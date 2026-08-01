/**
 * ADR-0020: Ueberarbeitet gegenueber dem Google-AI-Studio-Handover. Der bisherige
 * "Fallback": bei jedem OAuth-Fehler (Popup blockiert, Netzwerkfehler, Provider nicht
 * konfiguriert) wurde das Konto einfach lokal als "connected" markiert
 * (handleToggleConnection(platform, true)), inklusive eines frei waehlbaren Handle-Textfelds.
 * Das war der UI-seitige Zwilling der serverseitigen Fake-connect-Luecke (siehe
 * socialMediaRoutes.ts) - beides wurde entfernt. Verbinden funktioniert jetzt ausschliesslich
 * ueber den echten OAuth-Popup-Handshake; schlaegt er fehl, wird ein Klartextfehler angezeigt
 * statt eines vorgetaeuschten Erfolgs.
 */
import React, { useState, useEffect } from 'react';
import {
  SocialAccount,
  SupportedAccountPlatform
} from '../platform/SocialMediaEngine/types';
import { SocialMediaGeneratorService, SocialMediaAccessStatus } from '../platform/SocialMediaEngine/SocialMediaGeneratorService';
import {
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Key,
  AlertCircle,
  Lock,
  Crown
} from 'lucide-react';

interface Props {
  onAccountsUpdated?: (accounts: SocialAccount[]) => void;
}

const PLATFORM_CONFIGS: {
  id: SupportedAccountPlatform;
  name: string;
  badgeColor: string;
  iconBg: string;
  docUrl: string;
  scopesText: string;
  description: string;
}[] = [
  {
    id: 'youtube',
    name: 'YouTube & Shorts',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    iconBg: 'bg-red-600',
    docUrl: 'https://developers.google.com/youtube/v3',
    scopesText: 'youtube.upload, youtube.readonly',
    description: 'Direktes Hochladen von YouTube Shorts, Long-Form Videos und automatische Video-Titeleingabe.'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    iconBg: 'bg-black border border-white/20',
    docUrl: 'https://developers.tiktok.com/',
    scopesText: 'user.info.basic, video.upload, video.publish',
    description: 'Veroeffentliche TikTok-Videos direkt ueber die Content Posting API (vor App-Review zunaechst als Entwurf im Postfach).'
  },
  {
    id: 'instagram',
    name: 'Instagram Reels & Feed',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    iconBg: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600',
    docUrl: 'https://developers.facebook.com/docs/instagram-api',
    scopesText: 'instagram_basic, instagram_content_publish',
    description: 'Meta Graph API Integration fuer Instagram Reels ueber das verknuepfte Business-Konto der Page.'
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    badgeColor: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    iconBg: 'bg-neutral-900 border border-white/20',
    docUrl: 'https://developer.x.com/en/docs',
    scopesText: 'tweet.write, tweet.read, offline.access',
    description: 'Automatisches Posten von X-Threads, Teasern und Direktlinks zu den Episoden.'
  },
  {
    id: 'facebook',
    name: 'Facebook Pages & Reels',
    badgeColor: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    iconBg: 'bg-blue-600',
    docUrl: 'https://developers.facebook.com/docs/graph-api',
    scopesText: 'pages_manage_posts, pages_show_list',
    description: 'Meta Business Suite Anbindung fuer Facebook Seiten-Posts und Reels-Videobeitraege.'
  }
];

export function SocialAccountManager({ onAccountsUpdated }: Props) {
  // ADR-0021: Zugriff auf dieses Tool ist auf Owner-IAM-Rolle oder 'Founder'-Abonnenten
  // beschraenkt. Der Server erzwingt das ohnehin auf jedem echten Endpunkt (401/403) - diese
  // clientseitige Pruefung ist reine UX (klare Meldung statt kaputter/leerer Ansicht), keine
  // Sicherheitsgrenze.
  const [access, setAccess] = useState<SocialMediaAccessStatus | null>(null);

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<{ platform: string; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      const status = await SocialMediaGeneratorService.checkAccess();
      setAccess(status);
      if (status.allowed) {
        loadAccounts();
      } else {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Nur Nachrichten vom eigenen Origin akzeptieren - der Callback-Screen
      // (socialMediaRoutes.ts renderCallbackPage) sendet explizit mit window.location.origin
      // als targetOrigin, nicht mit '*'.
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        loadAccounts();
        setConnectingPlatform(null);
        setConnectError(null);
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        setConnectingPlatform(null);
        setConnectError({ platform: event.data.platform || 'unknown', message: 'Verbindung wurde vom Anbieter abgelehnt.' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const accs = await SocialMediaGeneratorService.fetchConnectedAccounts();
    setAccounts(accs || []);
    setLoading(false);
    if (onAccountsUpdated) onAccountsUpdated(accs || []);
  };

  const handleOAuthConnect = async (platform: SupportedAccountPlatform) => {
    setConnectingPlatform(platform);
    setConnectError(null);

    try {
      const authUrl = await SocialMediaGeneratorService.getAuthUrl(platform);
      if (!authUrl) {
        setConnectError({ platform, message: 'Keine Autorisierungs-URL erhalten.' });
        setConnectingPlatform(null);
        return;
      }

      const authWindow = window.open(authUrl, `oauth_${platform}`, 'width=600,height=700,scrollbars=yes');
      if (!authWindow) {
        setConnectError({ platform, message: 'Popup wurde blockiert. Bitte Popups fuer diese Seite erlauben.' });
        setConnectingPlatform(null);
        return;
      }
      // connectingPlatform bleibt gesetzt, bis das postMessage-Event (Erfolg/Fehler) eintrifft
      // oder der Nutzer das Popup manuell schliesst (dafuer gibt es aktuell keinen Timeout -
      // ein spaeteres erneutes Klicken auf "Verbinden" setzt den Zustand ohnehin zurueck).
    } catch (err: any) {
      setConnectError({ platform, message: err?.message || 'Verbindung fehlgeschlagen.' });
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: SupportedAccountPlatform) => {
    const updatedAccs = await SocialMediaGeneratorService.disconnectAccount(platform);
    if (updatedAccs) {
      setAccounts(updatedAccs);
      if (onAccountsUpdated) onAccountsUpdated(updatedAccs);
    }
  };

  // Zugriffsstatus noch nicht geladen -> kurzer, unauffaelliger Ladezustand statt eines
  // Flackerns zwischen "kein Zugriff" und dem eigentlichen Tool.
  if (access === null) {
    return (
      <div className="flex items-center justify-center py-16 text-white/40 text-xs gap-2">
        <RefreshCw size={14} className="animate-spin" />
        <span>Zugriff wird geprüft...</span>
      </div>
    );
  }

  if (!access.allowed) {
    const restrictedMessage =
      access.reason === 'unauthenticated'
        ? 'Bitte melde dich an, um auf das Social Media Direct Publishing Hub zuzugreifen.'
        : access.reason === 'insufficient-tier'
        ? 'Dieses Tool ist ausschließlich Owner-Accounts und Abonnenten des Founder-Tarifs vorbehalten.'
        : 'Zugriffsprüfung derzeit nicht möglich. Bitte später erneut versuchen.';

    return (
      <div className="p-8 rounded-2xl bg-neutral-900 border border-white/10 shadow-xl text-center max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-aif-gold-DEFAULT/15 border border-aif-gold-DEFAULT/30 flex items-center justify-center">
          {access.reason === 'insufficient-tier' ? (
            <Crown size={24} className="text-aif-gold-DEFAULT" />
          ) : (
            <Lock size={24} className="text-aif-gold-DEFAULT" />
          )}
        </div>
        <h3 className="text-base font-bold text-white">Zugriff beschränkt</h3>
        <p className="text-xs text-white/60 leading-relaxed">{restrictedMessage}</p>
        {access.reason === 'insufficient-tier' && (
          <p className="text-[11px] text-white/40">
            Das Social Media Direct Publishing Hub (YouTube/TikTok/Instagram/X/Facebook-Veröffentlichung) ist Teil des Founder-Tarifs.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Notice Banner */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10 space-y-2 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-aif-gold-DEFAULT" />
            Social Media Direct Publishing Hub
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            OAuth 2.0 & Graph API
          </span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          Verknuepfe deine Konten einmalig per echtem OAuth-2.0-Handshake. YouTube/TikTok/Instagram
          erfordern fuer die Veroeffentlichung ein oeffentlich erreichbares Video-Asset
          (mediaUrl) - X und Facebook unterstuetzen zusaetzlich reine Text-Posts ohne Video.
        </p>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORM_CONFIGS.map(cfg => {
          const acc = accounts.find(a => a.platform === cfg.id);
          const isConnected = acc?.status === 'connected';
          const isConnecting = connectingPlatform === cfg.id;
          const error = connectError?.platform === cfg.id ? connectError.message : null;

          return (
            <div
              key={cfg.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isConnected
                  ? 'bg-neutral-900/90 border-aif-gold-DEFAULT/40 shadow-lg shadow-aif-gold-DEFAULT/5'
                  : 'bg-neutral-900/50 border-white/10 opacity-90'
              }`}
            >
              <div>
                {/* Card Top Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs ${cfg.iconBg}`}>
                      {cfg.id.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{cfg.name}</h4>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${cfg.badgeColor}`}>
                        {isConnected ? 'VERBUNDEN' : 'NICHT VERBUNDEN'}
                      </span>
                    </div>
                  </div>

                  <a
                    href={cfg.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    title="API Dokumentation ansehen"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                <p className="text-xs text-white/60 mb-4 leading-relaxed">{cfg.description}</p>

                {isConnected && acc ? (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 mb-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 font-medium">Account Handle:</span>
                      <span className="font-bold text-aif-gold-DEFAULT">{acc.handle}</span>
                    </div>
                    {acc.followersCount !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 font-medium">Follower / Abonnenten:</span>
                        <span className="font-mono text-white/90">{acc.followersCount.toLocaleString()}</span>
                      </div>
                    )}
                    {acc.connectedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 font-medium">Verknuepft am:</span>
                        <span className="font-mono text-white/70">{new Date(acc.connectedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 text-[11px] text-white/40 font-mono">Scopes: {cfg.scopesText}</div>
                )}

                {error && (
                  <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-1.5">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-white/10">
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(cfg.id)}
                    className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle size={14} />
                    Verbindung Trennen
                  </button>
                ) : (
                  <button
                    onClick={() => handleOAuthConnect(cfg.id)}
                    disabled={isConnecting}
                    className="w-full py-2.5 rounded-xl bg-aif-gold-DEFAULT hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md shadow-aif-gold-DEFAULT/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Verbinde mit OAuth...</span>
                      </>
                    ) : (
                      <>
                        <Key size={14} />
                        <span>Mit {cfg.name} Verbinden</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
