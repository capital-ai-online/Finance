/**
 * SEO-ROADMAP-0001 / N1 — text-only content generation (no media rendering).
 * Deterministic templates first; optional LLM enrichment can be added later via
 * generateStructuredWithFallback without changing the public contract.
 *
 * Financial-claim policy: no invented prices/scores; educational tone + disclaimer.
 */

export type TextPlatform = 'x' | 'facebook' | 'community';

export type ContentFormat = 'tweet' | 'facebook_post' | 'community_post' | 'thread';

export interface GenerateTextRequest {
  topic: string;
  format?: ContentFormat;
  platforms?: TextPlatform[];
  locale?: 'de' | 'en';
  /** Optional product/context line, not treated as a market claim */
  contextNote?: string;
}

export interface GeneratedTextVariant {
  platform: TextPlatform;
  format: ContentFormat;
  text: string;
  charCount: number;
  disclaimer: string;
}

export interface GenerateTextResult {
  topic: string;
  locale: 'de' | 'en';
  variants: GeneratedTextVariant[];
  authorship: 'ai_assisted';
  generatedAt: string;
  /** Always false in this scaffold — N4 owns approval workflow */
  humanReviewed: boolean;
}

const DISCLAIMER_DE =
  'Keine Anlageberatung. Bildungsinhalt von CAPITAL-AI. Vergangene Entwicklungen sind kein Indikator für zukünftige Ergebnisse.';

const DISCLAIMER_EN =
  'Not investment advice. Educational content by CAPITAL-AI. Past performance is not indicative of future results.';

function normalizeTopic(topic: string): string {
  return topic.replace(/\s+/g, ' ').trim().slice(0, 200);
}

function buildTweet(topic: string, locale: 'de' | 'en', note?: string): string {
  if (locale === 'en') {
    return [
      `Quick take: ${topic}`,
      note ? `Context: ${note}` : null,
      'Focus on process over prediction — margin of safety, evidence, risk.',
      '#CapitalAI #InvestingEducation',
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `Kurz erklärt: ${topic}`,
    note ? `Kontext: ${note}` : null,
    'Prozess vor Prognose — Margin of Safety, Evidenz, Risiko.',
    '#CapitalAI #Finanzbildung',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildFacebook(topic: string, locale: 'de' | 'en', note?: string): string {
  if (locale === 'en') {
    return [
      `Today's learning focus: ${topic}`,
      '',
      note || 'We prioritise transparent methods over hype.',
      '',
      'CAPITAL-AI is built for structured, compliance-aware analysis — not hot tips.',
      '',
      DISCLAIMER_EN,
    ].join('\n');
  }
  return [
    `Lernfokus heute: ${topic}`,
    '',
    note || 'Wir setzen auf nachvollziehbare Methoden statt Hype.',
    '',
    'CAPITAL-AI unterstützt strukturierte, compliance-bewusste Analyse — keine Kurztipps.',
    '',
    DISCLAIMER_DE,
  ].join('\n');
}

function buildCommunity(topic: string, locale: 'de' | 'en', note?: string): string {
  if (locale === 'en') {
    return [
      `Discussion prompt: ${topic}`,
      '',
      note || 'What evidence would change your view?',
      '',
      'Share sources, not slogans. Educational thread only.',
      '',
      DISCLAIMER_EN,
    ].join('\n');
  }
  return [
    `Diskussionsimpuls: ${topic}`,
    '',
    note || 'Welche Evidenz würde deine Sicht ändern?',
    '',
    'Quellen statt Slogans. Rein bildungsorientiert.',
    '',
    DISCLAIMER_DE,
  ].join('\n');
}

export function generateTextContent(input: GenerateTextRequest): GenerateTextResult {
  const topic = normalizeTopic(input.topic || '');
  if (!topic) {
    throw new Error('topic is required');
  }

  const locale = input.locale === 'en' ? 'en' : 'de';
  const platforms: TextPlatform[] =
    input.platforms && input.platforms.length > 0
      ? input.platforms
      : ['x', 'facebook', 'community'];

  const disclaimer = locale === 'en' ? DISCLAIMER_EN : DISCLAIMER_DE;
  const note = input.contextNote?.trim().slice(0, 280);

  const variants: GeneratedTextVariant[] = platforms.map((platform) => {
    let format: ContentFormat;
    let text: string;
    if (platform === 'x') {
      format = 'tweet';
      text = buildTweet(topic, locale, note);
      if (text.length > 280) text = text.slice(0, 277) + '…';
    } else if (platform === 'facebook') {
      format = 'facebook_post';
      text = buildFacebook(topic, locale, note);
    } else {
      format = 'community_post';
      text = buildCommunity(topic, locale, note);
    }
    return { platform, format, text, charCount: text.length, disclaimer };
  });

  return {
    topic,
    locale,
    variants,
    authorship: 'ai_assisted',
    generatedAt: new Date().toISOString(),
    humanReviewed: false,
  };
}
