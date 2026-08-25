/**
 * SEO-ROADMAP-0001 / N2 — deterministic social-media script templates.
 * Educational tone only; no invented market numbers or buy/sell signals.
 * Marketing emojis reinforce nearby concepts but never encode market signals.
 */

import { SUPPORT_EMAIL } from '../../src/config/ownerConfig';
import {
  CAPITAL_AI_EMOJI,
  CAPITAL_AI_EMOJI_TAG,
  MARKETING_EMOJI_LEXICON,
  decorateMarketingText,
} from './marketingEmojiLexicon';
import {
  PLATFORM_CHARACTER_LIMITS,
  conservativeCharacterCount,
  type SocialMediaTextPlatform,
} from './platformCharacterLimits';

export type TemplateLocale = 'de' | 'en';

export interface ScriptTemplateInput {
  topic: string;
  locale?: TemplateLocale;
  contextNote?: string;
  ctaText?: string;
  hostAName?: string;
  hostBName?: string;
}

export interface ThreadTweet { index: number; text: string }
export interface PodcastOutlineEntry { speaker: string; role: 'host' | 'cohost'; text: string }
export interface VideoSceneOutline {
  sceneNumber: number;
  timestamp: string;
  onScreenText: string;
  audioScript: string;
  visualAction: string;
}

export interface MarketingPack {
  linkedinPost: string;
  twitterThread: string[];
  instagramCaption: string;
  tiktokDescription: string;
  youtubeDescription: string;
  facebookPost: string;
  hashtags: string[];
  ctaButtonText: string;
  supportEmail: string;
  brandEmoji: string;
  brandEmojiTag: string;
  standaloneEmojiTags: string[];
}

export interface ScriptPackage {
  topic: string;
  locale: TemplateLocale;
  seriesTitle: string;
  overallStrategySummary: string;
  thread: ThreadTweet[];
  podcastOutline: PodcastOutlineEntry[];
  youtubeLongformOutline: VideoSceneOutline[];
  marketingPack: MarketingPack;
  disclaimer: string;
  authorship: 'ai_assisted';
  humanReviewed: false;
  generatedAt: string;
}

const DISCLAIMER_DE =
  'Keine Anlageberatung. Bildungsinhalt von CAPITAL-AI. Vergangene Entwicklungen sind kein Indikator für zukünftige Ergebnisse.';
const DISCLAIMER_EN =
  'Not investment advice. Educational content by CAPITAL-AI. Past performance is not indicative of future results.';

const EMOJI = {
  capitalAi: CAPITAL_AI_EMOJI,
  intelligence: MARKETING_EMOJI_LEXICON.intelligence.emoji,
  security: MARKETING_EMOJI_LEXICON.security.emoji,
  warning: MARKETING_EMOJI_LEXICON.warning.emoji,
  access: MARKETING_EMOJI_LEXICON.access.emoji,
  finance: MARKETING_EMOJI_LEXICON.governance.emoji,
  support: MARKETING_EMOJI_LEXICON.support.emoji,
  breakPattern: MARKETING_EMOJI_LEXICON.breakPattern.emoji,
  momentum: MARKETING_EMOJI_LEXICON.momentum.emoji,
  celebration: MARKETING_EMOJI_LEXICON.celebration.emoji,
  topScore: MARKETING_EMOJI_LEXICON.topScore.emoji,
  bigBang: MARKETING_EMOJI_LEXICON.bigBang.emoji,
  luckyWingsTag: MARKETING_EMOJI_LEXICON.luckyWingsTag.emoji,
} as const;

function normalizeTopic(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 200);
}

function assertPlatformText(
  platform: SocialMediaTextPlatform,
  text: string,
  field: string,
): string {
  const characterCount = conservativeCharacterCount(text);
  const maxCharacters = PLATFORM_CHARACTER_LIMITS[platform].maxCharacters;
  if (characterCount > maxCharacters) {
    throw new Error(
      `${field} exceeds ${platform} character limit (${characterCount}/${maxCharacters}).`,
    );
  }
  return text;
}

function validateThread(entries: ThreadTweet[]): ThreadTweet[] {
  for (const entry of entries) {
    assertPlatformText('x', entry.text, `twitterThread[${entry.index}]`);
  }
  return entries;
}

function supportLine(): string {
  return `${EMOJI.support} Support: ${SUPPORT_EMAIL}`;
}

function principles(locale: TemplateLocale): string[] {
  return locale === 'en'
    ? [
        `${EMOJI.intelligence} Evidence and explainability over hype.`,
        `${EMOJI.security} Transparent methods and traceable inputs.`,
        `${EMOJI.warning} Risk first — uncertainty stays visible.`,
      ]
    : [
        `${EMOJI.intelligence} Evidenz und Erklärbarkeit statt Hype.`,
        `${EMOJI.security} Transparente Methoden und nachvollziehbare Inputs.`,
        `${EMOJI.warning} Risiko zuerst — Unsicherheit bleibt sichtbar.`,
      ];
}

function buildThread(
  locale: TemplateLocale,
  topic: string,
  note: string | undefined,
  cta: string,
  disclaimer: string,
): ThreadTweet[] {
  if (locale === 'en') {
    return validateThread([
      { index: 1, text: `1/ ${EMOJI.capitalAi} ${EMOJI.intelligence} ${topic} — a structured learning thread (not advice).` },
      { index: 2, text: `2/ ${EMOJI.finance} Define the question clearly. What decision are you actually trying to improve?${note ? ` Context: ${note}` : ''}` },
      { index: 3, text: `3/ ${EMOJI.security} Separate facts from narratives. Prefer primary sources and transparent methods.` },
      { index: 4, text: `4/ ${EMOJI.warning} Risk first: what can go wrong, and how would you notice early?` },
      { index: 5, text: `5/ ${EMOJI.access} ${cta}. ${disclaimer}` },
      { index: 6, text: `6/ ${supportLine()}` },
    ]);
  }

  return validateThread([
    { index: 1, text: `1/ ${EMOJI.capitalAi} ${EMOJI.intelligence} ${topic} — Lern-Thread (keine Beratung).` },
    { index: 2, text: `2/ ${EMOJI.finance} Frage schärfen: Welche Entscheidung soll besser werden?${note ? ` Kontext: ${note}` : ''}` },
    { index: 3, text: `3/ ${EMOJI.security} Fakten von Narrativen trennen. Primärquellen und transparente Methoden bevorzugen.` },
    { index: 4, text: `4/ ${EMOJI.warning} Risiko zuerst: Was kann schiefgehen — und woran merkst du es früh?` },
    { index: 5, text: `5/ ${EMOJI.access} ${cta}. ${disclaimer}` },
    { index: 6, text: `6/ ${supportLine()}` },
  ]);
}

function buildPodcast(
  locale: TemplateLocale,
  topic: string,
  note: string | undefined,
  cta: string,
  disclaimer: string,
  hostA: string,
  hostB: string,
): PodcastOutlineEntry[] {
  return locale === 'en'
    ? [
        { speaker: hostA, role: 'host', text: `Today we unpack ${topic} — education only, no recommendations.` },
        { speaker: hostB, role: 'cohost', text: note ? `Starting point: ${note}` : `Let's start with definitions and what we will not claim.` },
        { speaker: hostA, role: 'host', text: 'Method over narrative: evidence, assumptions, and failure modes.' },
        { speaker: hostB, role: 'cohost', text: 'Practical checklist for listeners who want a repeatable process.' },
        { speaker: hostA, role: 'host', text: `Wrap-up: ${cta}. ${disclaimer}` },
      ]
    : [
        { speaker: hostA, role: 'host', text: `Heute zerlegen wir ${topic} — rein bildungsorientiert, keine Empfehlung.` },
        { speaker: hostB, role: 'cohost', text: note ? `Ausgangspunkt: ${note}` : 'Wir starten mit Definitionen und dem, was wir nicht behaupten.' },
        { speaker: hostA, role: 'host', text: 'Methode statt Narrativ: Evidenz, Annahmen, Fehlerbilder.' },
        { speaker: hostB, role: 'cohost', text: 'Praktische Checkliste für einen wiederholbaren Prozess.' },
        { speaker: hostA, role: 'host', text: `Abschluss: ${cta}. ${disclaimer}` },
      ];
}

function buildYoutube(
  locale: TemplateLocale,
  topic: string,
  note: string | undefined,
  cta: string,
  disclaimer: string,
): VideoSceneOutline[] {
  return locale === 'en'
    ? [
        { sceneNumber: 1, timestamp: '0:00', onScreenText: topic, audioScript: `Welcome. This episode is about ${topic}. Educational content only.`, visualAction: 'Title card, calm fintech aesthetic' },
        { sceneNumber: 2, timestamp: '0:45', onScreenText: 'Definitions', audioScript: note || 'We define terms and scope before any interpretation.', visualAction: 'Simple diagram / bullet points' },
        { sceneNumber: 3, timestamp: '3:00', onScreenText: 'Process', audioScript: 'Walk through a transparent process: inputs, assumptions, risks.', visualAction: 'Step-by-step animation' },
        { sceneNumber: 4, timestamp: '8:00', onScreenText: 'Risk', audioScript: 'What can invalidate the analysis? How do we monitor that?', visualAction: 'Risk checklist on screen' },
        { sceneNumber: 5, timestamp: '11:00', onScreenText: cta, audioScript: `${cta}. ${disclaimer}`, visualAction: 'End card with disclaimer' },
      ]
    : [
        { sceneNumber: 1, timestamp: '0:00', onScreenText: topic, audioScript: `Willkommen. Thema: ${topic}. Rein bildungsorientiert.`, visualAction: 'Titelkarte, ruhige Fintech-Ästhetik' },
        { sceneNumber: 2, timestamp: '0:45', onScreenText: 'Definitionen', audioScript: note || 'Zuerst Begriffe und Scope — bevor interpretiert wird.', visualAction: 'Einfaches Diagramm / Stichpunkte' },
        { sceneNumber: 3, timestamp: '3:00', onScreenText: 'Prozess', audioScript: 'Transparenter Ablauf: Inputs, Annahmen, Risiken.', visualAction: 'Schritt-für-Schritt-Animation' },
        { sceneNumber: 4, timestamp: '8:00', onScreenText: 'Risiko', audioScript: 'Was widerlegt die Analyse? Woran merken wir das?', visualAction: 'Risiko-Checkliste' },
        { sceneNumber: 5, timestamp: '11:00', onScreenText: cta, audioScript: `${cta}. ${disclaimer}`, visualAction: 'Endkarte mit Disclaimer' },
      ];
}

function buildMarketingPack(
  locale: TemplateLocale,
  topic: string,
  note: string | undefined,
  cta: string,
  disclaimer: string,
  thread: ThreadTweet[],
): MarketingPack {
  const hashtags = locale === 'en'
    ? ['#CapitalAI', '#InvestingEducation', '#RiskManagement', '#FinTech']
    : ['#CapitalAI', '#Finanzbildung', '#Risikomanagement', '#FinTech'];
  const conceptLines = principles(locale);
  const support = supportLine();
  const fallback = locale === 'en'
    ? `${EMOJI.breakPattern} Process over hype.`
    : `${EMOJI.breakPattern} Prozess statt Hype.`;
  const title = locale === 'en'
    ? `${EMOJI.capitalAi} ${EMOJI.intelligence} Learning note: ${topic}`
    : `${EMOJI.capitalAi} ${EMOJI.intelligence} Lernnotiz: ${topic}`;

  const longDescription = [
    title,
    '',
    note || fallback,
    '',
    ...conceptLines,
    '',
    `${EMOJI.access} ${cta}`,
    support,
    '',
    disclaimer,
    '',
    hashtags.join(' '),
  ].join('\n');

  const instagramCaption = [
    `${EMOJI.capitalAi} ${EMOJI.intelligence} ${topic}`,
    '',
    note || fallback,
    '',
    ...conceptLines,
    '',
    `${EMOJI.access} ${cta}`,
    support,
    '',
    disclaimer,
    '',
    hashtags.join(' '),
  ].join('\n');

  const tiktokDescription = [
    `${EMOJI.capitalAi} ${EMOJI.intelligence} ${topic} — ${locale === 'en' ? 'education only' : 'nur Bildung'}.`,
    `${EMOJI.security} ${locale === 'en' ? 'Transparent process' : 'Transparenter Prozess'}. ${EMOJI.warning} ${locale === 'en' ? 'Risk stays visible' : 'Risiko bleibt sichtbar'}.`,
    note || fallback,
    `${EMOJI.access} ${cta}`,
    support,
    disclaimer,
    hashtags.join(' '),
  ].join('\n');

  const youtubeDescription = [
    `${EMOJI.capitalAi} ${EMOJI.intelligence} ${topic}`,
    '',
    note || fallback,
    '',
    `${EMOJI.finance} ${locale === 'en' ? 'Structured financial analysis and education.' : 'Strukturierte Finanzanalyse und Finanzbildung.'}`,
    ...conceptLines,
    '',
    `${EMOJI.access} ${cta}`,
    support,
    '',
    disclaimer,
    '',
    hashtags.join(' '),
  ].join('\n');

  const facebookPost = [
    `${EMOJI.capitalAi} ${EMOJI.intelligence} ${topic}`,
    '',
    note || fallback,
    '',
    ...conceptLines,
    '',
    `${EMOJI.access} ${cta}`,
    support,
    '',
    disclaimer,
    '',
    hashtags.join(' '),
  ].join('\n');

  return {
    linkedinPost: assertPlatformText('linkedin', longDescription, 'linkedinPost'),
    twitterThread: thread.map((entry) => assertPlatformText('x', entry.text, `twitterThread[${entry.index}]`)),
    instagramCaption: assertPlatformText('instagram', instagramCaption, 'instagramCaption'),
    tiktokDescription: assertPlatformText('tiktok', tiktokDescription, 'tiktokDescription'),
    youtubeDescription: assertPlatformText('youtube', youtubeDescription, 'youtubeDescription'),
    facebookPost: assertPlatformText('facebook', facebookPost, 'facebookPost'),
    hashtags,
    ctaButtonText: cta,
    supportEmail: SUPPORT_EMAIL,
    brandEmoji: CAPITAL_AI_EMOJI,
    brandEmojiTag: CAPITAL_AI_EMOJI_TAG,
    standaloneEmojiTags: [EMOJI.luckyWingsTag],
  };
}

export function buildScriptPackage(input: ScriptTemplateInput): ScriptPackage {
  const topic = normalizeTopic(input.topic || '');
  if (!topic) throw new Error('topic is required');

  const locale: TemplateLocale = input.locale === 'en' ? 'en' : 'de';
  const note = input.contextNote?.trim().slice(0, 280);
  const socialNote = note ? decorateMarketingText(note) : undefined;
  const cta = input.ctaText?.trim() || (locale === 'en' ? 'Learn more on CAPITAL-AI' : 'Mehr erfahren auf CAPITAL-AI');
  const hostA = input.hostAName?.trim() || 'Alex';
  const hostB = input.hostBName?.trim() || 'Sam';
  const disclaimer = locale === 'en' ? DISCLAIMER_EN : DISCLAIMER_DE;
  const thread = buildThread(locale, topic, socialNote, cta, disclaimer);

  return {
    topic,
    locale,
    seriesTitle: `CAPITAL-AI Briefing: ${topic}`,
    overallStrategySummary: locale === 'en'
      ? `Educational multi-format package on “${topic}”. Process over prediction; evidence and risk framing; no investment recommendations.`
      : `Bildungs-Paket zu „${topic}“. Prozess vor Prognose; Evidenz- und Risiko-Framing; keine Anlageempfehlung.`,
    thread,
    podcastOutline: buildPodcast(locale, topic, note, cta, disclaimer, hostA, hostB),
    youtubeLongformOutline: buildYoutube(locale, topic, note, cta, disclaimer),
    marketingPack: buildMarketingPack(locale, topic, socialNote, cta, disclaimer, thread),
    disclaimer,
    authorship: 'ai_assisted',
    humanReviewed: false,
    generatedAt: new Date().toISOString(),
  };
}
