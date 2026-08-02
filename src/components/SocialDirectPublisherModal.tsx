/**
 * ADR-0020: Ueberarbeitet gegenueber dem Google-AI-Studio-Handover - publishContent() liefert
 * jetzt ein {success, message, results}-Objekt statt eines rohen Fetch-Response-Bodys (siehe
 * SocialMediaGeneratorService.ts), und item.mediaUrl wird an den Publish-Request durchgereicht:
 * ohne dieses Feld schlaegt die Veroeffentlichung fuer YouTube/TikTok/Instagram jetzt mit einer
 * expliziten Fehlermeldung fehl (server/socialMedia/platformPublishers.ts), statt wie im
 * Handover-Prototyp eine aus Date.now() erfundene Erfolgs-URL zurueckzugeben.
 */
import React, { useState, useEffect } from 'react';
import {
  GeneratedMediaItem,
  SocialAccount,
  SupportedAccountPlatform,
  PublishExecutionType,
  PublishLogEntry
} from '../platform/SocialMediaEngine/types';
import { SocialMediaGeneratorService } from '../platform/SocialMediaEngine/SocialMediaGeneratorService';
import {
  Send,
  Clock,
  FileText,
  CheckCircle2,
  X,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Calendar,
  Copy,
  Check
} from 'lucide-react';

interface Props {
  item: GeneratedMediaItem;
  isOpen: boolean;
  onClose: () => void;
}

export function SocialDirectPublisherModal({ item, isOpen, onClose }: Props) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SupportedAccountPlatform[]>([]);
  const [publishType, setPublishType] = useState<PublishExecutionType>('instant');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().substring(0, 16)
  );

  const [customCaptions, setCustomCaptions] = useState<Partial<Record<SupportedAccountPlatform, string>>>({});
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishLogEntry[] | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      setCustomCaptions({
        youtube: `${item.title}\n\n${item.marketingPack.ctaButtonText}`,
        tiktok: item.marketingPack.tiktokDescription,
        instagram: item.marketingPack.instagramCaption,
        x: item.marketingPack.twitterThread[0] || item.title,
        facebook: item.marketingPack.linkedinPost
      });
      setPublishResults(null);
      setPublishMessage(null);
    }
  }, [isOpen, item]);

  const loadAccounts = async () => {
    const accs = await SocialMediaGeneratorService.fetchConnectedAccounts();
    setAccounts(accs || []);
    const connected = (accs || []).filter(a => a.status === 'connected').map(a => a.platform);
    setSelectedPlatforms(connected);
  };

  if (!isOpen) return null;

  const togglePlatform = (p: SupportedAccountPlatform) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter(x => x !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleExecutePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Bitte waehle mindestens eine Plattform fuer die Veroeffentlichung aus.');
      return;
    }

    setPublishing(true);

    const payload = {
      episodeId: item.id,
      episodeTitle: item.title,
      seriesTitle: item.title,
      targetPlatforms: selectedPlatforms,
      publishType,
      scheduledAt: publishType === 'scheduled' ? new Date(scheduledDate).toISOString() : undefined,
      customCaptions,
      hashtags: item.marketingPack.hashtags,
      mediaType: (item.format.includes('short') ? 'short_video' : item.format.includes('podcast') ? 'podcast_audio' : 'social_post') as
        'short_video' | 'podcast_audio' | 'long_video' | 'social_post' | 'thread',
      // ADR-0020: ohne mediaUrl scheitert die Veroeffentlichung auf Video-Plattformen ehrlich
      // (siehe platformPublishers.ts) statt eine Fake-URL zu liefern.
      mediaUrl: item.mediaUrl,
    };

    const res = await SocialMediaGeneratorService.publishContent(payload);
    setPublishing(false);

    if (res) {
      setPublishResults(res.results);
      setPublishMessage(res.message || null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/15 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-white shadow-2xl relative">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <X size={18} />
        </button>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/30">
              Direkt-Publisher Engine
            </span>
            <span className="text-xs text-white/40">&bull;</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">Folge {item.episodeNumber}</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">{item.title}</h2>
          <p className="text-xs text-white/60 mt-1">
            Veroeffentliche diesen Inhalt sofort direkt auf deinen verknuepften Social-Media-Accounts oder plane die Veroeffentlichung ein.
          </p>
          {!item.mediaUrl && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-1.5">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>Kein Video-Asset (mediaUrl) vorhanden. YouTube/TikTok/Instagram schlagen fehl - X und Facebook posten trotzdem als Text.</span>
            </div>
          )}
        </div>

        {publishResults ? (
          <div className="space-y-4 p-5 rounded-2xl bg-black/50 border border-white/10">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>{publishMessage || 'Veroeffentlichung verarbeitet.'}</span>
            </div>

            <div className="space-y-3 pt-2">
              {publishResults.map(res => (
                <div key={res.id} className="p-3.5 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-aif-gold-DEFAULT uppercase tracking-wider">{res.platform}</span>
                    <span className="text-white/60">{res.accountHandle}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      res.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {res.status === 'scheduled' ? 'Geplant' : res.status === 'draft' ? 'Entwurf' : res.status === 'failed' ? 'Fehlgeschlagen' : 'Veroeffentlicht'}
                    </span>
                  </div>

                  {res.publishedUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={res.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-aif-gold-DEFAULT/20 hover:bg-aif-gold-DEFAULT/30 text-aif-gold-DEFAULT font-bold flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Post Ansehen
                      </a>
                      <button
                        onClick={() => handleCopyUrl(res.publishedUrl!)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
                        title="URL Kopieren"
                      >
                        {copiedUrl === res.publishedUrl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  ) : res.errorMessage ? (
                    <span className="text-red-300 text-[11px] max-w-xs text-right">{res.errorMessage}</span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="pt-3">
              <button
                onClick={() => setPublishResults(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all"
              >
                Weitere Plattformen verwalten
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            <div className="space-y-3">
              <label className="text-xs font-bold text-aif-gold-DEFAULT uppercase tracking-wider flex items-center gap-1.5">
                <Send size={14} /> 1. Ziel-Plattformen auswaehlen
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {(['youtube', 'tiktok', 'instagram', 'x', 'facebook'] as SupportedAccountPlatform[]).map(p => {
                  const acc = accounts.find(a => a.platform === p);
                  const isConnected = acc?.status === 'connected';
                  const isSelected = selectedPlatforms.includes(p);

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => isConnected && togglePlatform(p)}
                      disabled={!isConnected}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        !isConnected
                          ? 'bg-black/20 border-white/5 text-white/30 cursor-not-allowed'
                          : isSelected
                          ? 'bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT text-white shadow-md'
                          : 'bg-black/30 hover:bg-black/50 border-white/10 text-white/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold capitalize mb-1">
                        <span>{p}</span>
                        {isSelected && <CheckCircle2 size={12} className="text-aif-gold-DEFAULT" />}
                      </div>
                      <span className={`text-[9px] font-mono block ${isConnected ? 'text-emerald-400' : 'text-white/40'}`}>
                        {isConnected ? (acc?.handle || 'Verb.') : 'Nicht verbunden'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-aif-gold-DEFAULT uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} /> 2. Veroeffentlichungs-Modus
              </label>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPublishType('instant')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    publishType === 'instant'
                      ? 'bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT text-white'
                      : 'bg-black/30 border-white/10 text-white/60'
                  }`}
                >
                  <div className="font-bold text-xs text-white mb-0.5">Sofort Veroeffentlichen</div>
                  <div className="text-[10px] text-white/50">Direkter API Call</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishType('scheduled')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    publishType === 'scheduled'
                      ? 'bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT text-white'
                      : 'bg-black/30 border-white/10 text-white/60'
                  }`}
                >
                  <div className="font-bold text-xs text-white mb-0.5">Terminieren</div>
                  <div className="text-[10px] text-white/50">Fuer spaeter einplanen</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishType('draft')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    publishType === 'draft'
                      ? 'bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT text-white'
                      : 'bg-black/30 border-white/10 text-white/60'
                  }`}
                >
                  <div className="font-bold text-xs text-white mb-0.5">Entwurf Speichern</div>
                  <div className="text-[10px] text-white/50">In Warteschlange</div>
                </button>
              </div>

              {publishType === 'scheduled' && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                  <Calendar size={16} className="text-aif-gold-DEFAULT shrink-0" />
                  <div className="flex-1">
                    <label className="text-[11px] text-white/60 block mb-1">Datum & Uhrzeit fuer die Veroeffentlichung</label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                    />
                  </div>
                </div>
              )}
              {publishType === 'scheduled' && (
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Terminierte Posts werden protokolliert; der automatische Versand zum Zielzeitpunkt
                  (Scheduler-Job) ist Folgearbeit (ADR-0020 Backlog) und muss aktuell manuell erneut
                  ausgeloest werden.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-aif-gold-DEFAULT uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> 3. Beitrags-Text pro Plattform anpassen
              </label>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {selectedPlatforms.map(p => (
                  <div key={p} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                    <span className="text-[11px] font-bold text-aif-gold-DEFAULT uppercase tracking-wide">{p} Caption:</span>
                    <textarea
                      value={customCaptions[p] || ''}
                      onChange={e => setCustomCaptions({ ...customCaptions, [p]: e.target.value })}
                      className="w-full h-16 p-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecutePublish}
                disabled={publishing || selectedPlatforms.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:from-amber-400 hover:to-aif-gold-DEFAULT text-black font-extrabold text-sm transition-all shadow-xl shadow-aif-gold-DEFAULT/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {publishing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Veroeffentliche auf {selectedPlatforms.length} Plattformen...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>
                      {publishType === 'instant' ? 'Jetzt Auf ' : publishType === 'scheduled' ? 'Veroeffentlichung Einplanen Auf ' : 'Entwurf Speichern Fuer '}
                      {selectedPlatforms.length} Plattform(en)
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
