import React from 'react';

const BADGE_ASSETS: Record<string, { src: string; label: string }> = {
  starter: { src: '/brand/subscriptions/starter.webp', label: 'Starter Abonnement' },
  pro: { src: '/brand/subscriptions/pro.webp', label: 'Pro Abonnement' },
  enterprise: { src: '/brand/subscriptions/enterprise.webp', label: 'Enterprise Abonnement' },
  founder: { src: '/brand/subscriptions/founder.webp', label: 'Founder Abonnement' },
};

export function SubscriptionStatusBadge({ tier, compact = false }: { tier: string; compact?: boolean }) {
  const normalizedTier = String(tier || 'Free').trim().toLowerCase();
  const badge = BADGE_ASSETS[normalizedTier];

  if (!badge) {
    return (
      <div
        data-subscription-badge="free"
        className={compact
          ? 'flex min-h-7 items-center rounded-lg border border-slate-500/35 bg-slate-500/10 px-2 text-[8px] font-black uppercase tracking-wider text-slate-300'
          : 'flex min-h-12 items-center rounded-xl border border-slate-500/35 bg-slate-500/10 px-4 text-xs font-black uppercase tracking-[0.18em] text-slate-300'
        }
        aria-label="Free Abonnement"
      >
        FREE · ABONNEMENT
      </div>
    );
  }

  return (
    <img
      data-subscription-badge={normalizedTier}
      src={badge.src}
      alt={badge.label}
      className={compact
        ? 'block h-7 w-auto max-w-[72px] object-contain'
        : 'block h-auto w-full max-w-[280px] object-contain'
      }
      loading="eager"
      decoding="async"
    />
  );
}
