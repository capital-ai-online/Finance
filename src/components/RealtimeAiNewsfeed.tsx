import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { VerifiedNewsFeed } from './VerifiedNewsFeed';

interface RealtimeAiNewsfeedProps {
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpgradeClick: () => void;
  selectedSymbol?: string;
  searchQuery?: string;
  categoryFilter?: string;
  prioritySymbols?: string[];
  onTriggerPushNotification?: (data: {
    symbol: string;
    name: string;
    score: number;
    oldScore: number;
    headline: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    type: string;
    isOnWatchlist: boolean;
  }) => void;
  watchlist?: string[];
  maxDisplayItems?: number;
}

/**
 * Canonical UI projection for the AI Newsfeed Viewer.
 *
 * Supersession 2026-08-22:
 * - retired hard-coded and dynamically fabricated financial headlines/insights;
 * - all visible news now originates from /api/news -> NewsApiEvidenceProvider;
 * - heuristic sentiment is presentation metadata only and never mutates an asset score;
 * - no push notification or ranking event is fabricated from an article.
 */
export function RealtimeAiNewsfeed(props: RealtimeAiNewsfeedProps) {
  const symbol = props.selectedSymbol?.trim().toUpperCase() ?? '';
  const limit = Math.max(1, Math.min(10, props.maxDisplayItems ?? 3));

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-emerald-200">
          <ShieldCheck className="h-4 w-4" />
          <span>Evidence-only Newsfeed · keine synthetischen Schlagzeilen · kein direkter Score-Impact</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wide text-white/35">Tier: {props.subscriptionTier}</span>
      </div>

      <VerifiedNewsFeed
        symbol={symbol}
        limit={limit}
        title={symbol ? `AI Newsfeed Viewer · ${symbol}` : 'AI Newsfeed Viewer'}
      />
    </div>
  );
}
