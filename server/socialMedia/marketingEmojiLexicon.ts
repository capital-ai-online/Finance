/**
 * Canonical CAPITAL-AI marketing emoji semantics.
 *
 * Emojis reinforce wording that is already present in source copy. The resolver
 * never invents bullish/bearish patterns, scores, governance claims, security
 * properties or other factual assertions.
 */

export interface MarketingEmojiSemantic {
  emoji: string;
  keywords: readonly string[];
  purpose: string;
  signalSensitive?: boolean;
  autoApply?: boolean;
}

/**
 * CAPITAL-AI has no private Unicode code point. This portable composite is the
 * canonical brand emoji for text channels; `:capital_ai:` is the stable
 * shortcode for systems that support custom-emoji rendering later.
 */
export const CAPITAL_AI_EMOJI = '🧠✦';
export const CAPITAL_AI_EMOJI_TAG = ':capital_ai:';

export const MARKETING_EMOJI_LEXICON = {
  capitalAi: {
    emoji: CAPITAL_AI_EMOJI,
    keywords: ['capital-ai', 'capital ai', 'capital-ai.online'],
    purpose: 'CAPITAL-AI brand signature',
    autoApply: false,
  },
  intelligence: {
    emoji: '🧠',
    keywords: ['ai', 'ki', 'intelligenz', 'analyse', 'evidenz', 'explainability', 'erklärbarkeit'],
    purpose: 'AI, intelligence, analysis, evidence and explainability',
  },
  security: {
    emoji: '🔐',
    keywords: ['mfa', 'multi-factor', 'multifaktor', 'sicherheit', 'security', 'authentifizierung', 'authentication'],
    purpose: 'MFA, security and protected access',
  },
  warning: {
    emoji: '⚠️',
    keywords: ['warnung', 'warning', 'risiko', 'risk', 'unsicherheit', 'uncertainty'],
    purpose: 'Risk, warnings and uncertainty',
  },
  access: {
    emoji: '🎫',
    keywords: ['zugang', 'access', 'trial', 'abo', 'subscription', 'ticket'],
    purpose: 'Access, trial, subscription and CTA framing',
  },
  governance: {
    emoji: '🏦',
    keywords: ['governance', 'geschäftsführer', 'geschaeftsfuehrer', 'management', 'executive', 'geschäftsführung', 'geschaeftsfuehrung'],
    purpose: 'Governance, management and executive context',
  },
  support: {
    emoji: '📧',
    keywords: ['support', 'kontakt', 'contact', 'email', 'e-mail'],
    purpose: 'Support and contact',
  },
  breakPattern: {
    emoji: '⛓️‍💥',
    keywords: ['pattern break', 'pattern-break', 'durchbrechen', 'break the pattern', 'prozess statt hype'],
    purpose: 'Breaking an established pattern or narrative',
  },
  momentum: {
    emoji: '🚀',
    keywords: ['aufwind', 'hype', 'bullisch', 'bullische pattern', 'bullisches pattern', 'bullish', 'bullish pattern', 'momentum'],
    purpose: 'Explicit momentum, hype or bullish-pattern wording',
    signalSensitive: true,
  },
  celebration: {
    emoji: '🥳',
    keywords: ['erfolg', 'success', 'meilenstein', 'milestone', 'launch', 'release', 'geschafft', 'achievement'],
    purpose: 'Celebration, achievements, launches and milestones',
  },
  topScore: {
    emoji: '💯',
    keywords: ['top score', 'top scores', 'top-score', 'top-scores', 'bestwert', 'höchstwert', 'hoechstwert', '100/100'],
    purpose: 'Explicit top-score or best-score wording',
    signalSensitive: true,
  },
  bigBang: {
    emoji: '💥',
    keywords: ['big bang', 'big-bang', 'durchbruch', 'breakthrough', 'impact'],
    purpose: 'Big Bang, breakthrough or high-impact wording',
  },
  luckyWingsTag: {
    emoji: '🍀🪽🍀',
    keywords: [],
    purpose: 'Owner-defined standalone CAPITAL-AI social tag',
    autoApply: false,
  },
} as const satisfies Record<string, MarketingEmojiSemantic>;

export type MarketingEmojiKey = keyof typeof MARKETING_EMOJI_LEXICON;

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('de-DE')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Return deterministic emoji matches for words explicitly present in copy. */
export function resolveMarketingEmojis(text: string): string[] {
  const normalized = normalize(text);
  if (!normalized) return [];

  const matches: string[] = [];
  const semantics = Object.values(MARKETING_EMOJI_LEXICON) as MarketingEmojiSemantic[];
  for (const semantic of semantics) {
    if (semantic.autoApply === false) continue;
    if (!semantic.keywords.some((keyword) => normalized.includes(normalize(keyword)))) continue;
    if (!matches.includes(semantic.emoji)) matches.push(semantic.emoji);
  }
  return matches;
}

/** Prefix source copy with matching emojis without modifying its factual claim. */
export function decorateMarketingText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const prefix = resolveMarketingEmojis(trimmed).filter((emoji) => !trimmed.includes(emoji));
  return prefix.length ? `${prefix.join(' ')} ${trimmed}` : trimmed;
}
