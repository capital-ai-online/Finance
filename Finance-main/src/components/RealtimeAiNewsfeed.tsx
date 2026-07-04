/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * No-Demo-Data-Policy note: the previous version of this component shipped
 * with a hardcoded list of fake "breaking news" headlines attributed to
 * real assets (BTC, AAPL, TSLA, ETH, GLD, ...), a fake "AI model routing"
 * label per item (e.g. "Claude 3.5 Sonnet (Deep-Review)"), a static fake
 * "98.4% Evidenzqualität" confidence score, and a `setInterval` generator
 * that kept inventing new fabricated headlines/stats every 14 seconds for
 * random real assets. None of it was real. This rewrite uses only real
 * articles from the already-integrated `/api/news` endpoint (NewsAPI.org).
 * If no API key is configured server-side, it shows an honest empty state
 * instead of any invented content.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ArrowRight, RefreshCw, Lock, Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';

interface RealNewsItem {
  id: string;
  headline: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  time: string;
  source: string;
  url: string | null;
}

interface RealtimeAiNewsfeedProps {
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpgradeClick: () => void;
  selectedSymbol?: string;
}

export function RealtimeAiNewsfeed({ subscriptionTier, onUpgradeClick }: RealtimeAiNewsfeedProps) {
  const [articles, setArticles] = useState<RealNewsItem[]>([]);
  const [activeArticle, setActiveArticle] = useState<RealNewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data && data.status === 'NOT_IMPLEMENTED') {
        setNotConfigured(true);
        setArticles([]);
      } else if (Array.isArray(data)) {
        setNotConfigured(false);
        setArticles(data);
      } else {
        setArticles([]);
      }
    } catch (e: any) {
      setError('Newsfeed konnte nicht geladen werden.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    // Real refresh — re-fetch actual articles periodically instead of
    // inventing new ones locally.
    const interval = setInterval(loadNews, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Free tier sees only the first 2 articles in full; the rest are locked
  // behind an upgrade prompt (this is a genuine access-tier decision, not
  // fabricated content — the underlying articles are real either way).
  const isLockedForTier = (index: number) => subscriptionTier === 'Free' && index >= 2;

  const handleArticleClick = (article: RealNewsItem, index: number) => {
    if (isLockedForTier(index)) {
      onUpgradeClick();
      return;
    }
    setActiveArticle(article);
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-blue-500 to-emerald-500" />

      <div className="space-y-4">
        <div className="flex justify-between items-start border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
                Capital AI Newsfeed
              </span>
            </div>
            <h3 className="text-lg font-black text-white font-display mt-1">Marktnachrichten</h3>
            <p className="text-xs text-white/50">Echte Artikel via NewsAPI.org — keine generierten Meldungen</p>
          </div>
          <button
            onClick={loadNews}
            disabled={loading}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all cursor-pointer disabled:opacity-50"
            title="Newsfeed aktualisieren"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-aif-gold-DEFAULT' : ''} />
          </button>
        </div>

        <div className="space-y-3 pt-1">
          {loading && articles.length === 0 && (
            <p className="text-xs text-white/40 text-center py-6">Lade echte Marktnachrichten...</p>
          )}

          {!loading && notConfigured && (
            <div className="text-xs text-white/40 text-center py-6 flex flex-col items-center gap-2">
              <Newspaper className="w-6 h-6 text-white/20" />
              <span>Live-Newsfeed ist derzeit nicht konfiguriert (NEWS_API_KEY fehlt serverseitig).</span>
            </div>
          )}

          {!loading && error && (
            <p className="text-xs text-red-400 text-center py-6">{error}</p>
          )}

          {!loading && !notConfigured && !error && articles.length === 0 && (
            <p className="text-xs text-white/40 text-center py-6">Aktuell keine Artikel verfügbar.</p>
          )}

          {articles.map((item, index) => {
            const isBullish = item.sentiment === 'positive';
            const isBearish = item.sentiment === 'negative';
            const isLocked = isLockedForTier(index);

            return (
              <div
                key={item.id}
                onClick={() => handleArticleClick(item, index)}
                className={`group/item border p-3.5 rounded-xl cursor-pointer transition-all duration-300 relative ${
                  isLocked
                    ? 'bg-white/[0.01] border-white/5 opacity-55 hover:opacity-80 pb-9'
                    : 'bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-violet-950/10'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] text-white/40 font-mono">{item.time}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-white/35 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                      {item.source}
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      isBullish ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isBearish ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-white/10 text-white/60 border border-white/20'
                    }`}>
                      {item.sentiment}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white mt-2 leading-snug group-hover/item:text-aif-gold-DEFAULT transition-colors pr-6">
                  {item.headline}
                </h4>

                {isLocked ? (
                  <div className="absolute right-3 bottom-2.5 flex items-center gap-1.5 text-xs font-bold text-aif-gold-DEFAULT font-mono bg-black/80 px-2 py-1 rounded border border-aif-gold-DEFAULT/20 shadow-lg z-10">
                    <Lock size={11} />
                    <span>PRO SPECTRUM</span>
                  </div>
                ) : (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all">
                    <ArrowRight size={14} className="text-aif-gold-DEFAULT" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 text-[10px] font-mono text-white/30 flex justify-between items-center">
        <span>Quelle: NewsAPI.org</span>
        <span className="text-emerald-400 font-bold">DSGVO Compliant</span>
      </div>

      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveArticle(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-white/15 p-6 rounded-2xl max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-indigo-500" />
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-xs font-black bg-white/10 text-white px-2.5 py-1 rounded">
                  {activeArticle.source}
                </span>
                <span className="text-xs text-white/40 font-mono">{activeArticle.time}</span>
              </div>
              <h3 className="text-base font-bold text-white font-display mb-3 leading-snug">
                {activeArticle.headline}
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  {activeArticle.summary}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                {activeArticle.url && (
                  <a
                    href={activeArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} />
                    <span>Vollständigen Artikel lesen</span>
                  </a>
                )}
                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
