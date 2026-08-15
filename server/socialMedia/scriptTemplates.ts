/**
 * SEO-ROADMAP-0001 / N2 — deterministic script templates.
 * Educational tone only; no invented market numbers or buy/sell signals.
 */

export type TemplateLocale = 'de' | 'en';

export interface ScriptTemplateInput {
  topic: string;
  locale?: TemplateLocale;
  contextNote?: string;
  ctaText?: string;
  hostAName?: string;
  hostBName?: string;
}

export interface ThreadTweet {
  index: number;
  text: string;
}

export interface PodcastOutlineEntry {
  speaker: string;
  role: 'host' | 'cohost';
  text: string;
}

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
  hashtags: string[];
  ctaButtonText: string;
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

function t(topic: string): string {
  return topic.replace(/\s+/g, ' ').trim().slice(0, 200);
}

export function buildScriptPackage(input: ScriptTemplateInput): ScriptPackage {
  const topic = t(input.topic || '');
  if (!topic) throw new Error('topic is required');

  const locale: TemplateLocale = input.locale === 'en' ? 'en' : 'de';
  const note = input.contextNote?.trim().slice(0, 280);
  const cta =
    input.ctaText?.trim() ||
    (locale === 'en' ? 'Learn more on CAPITAL-AI' : 'Mehr erfahren auf CAPITAL-AI');
  const hostA = input.hostAName?.trim() || (locale === 'en' ? 'Alex' : 'Alex');
  const hostB = input.hostBName?.trim() || (locale === 'en' ? 'Sam' : 'Sam');
  const disclaimer = locale === 'en' ? DISCLAIMER_EN : DISCLAIMER_DE;

  const seriesTitle =
    locale === 'en' ? `CAPITAL-AI Briefing: ${topic}` : `CAPITAL-AI Briefing: ${topic}`;

  const overallStrategySummary =
    locale === 'en'
      ? `Educational multi-format package on “${topic}”. Process over prediction; evidence and risk framing; no investment recommendations.`
      : `Bildungs-Paket zu „${topic}“. Prozess vor Prognose; Evidenz- und Risiko-Framing; keine Anlageempfehlung.`;

  const thread: ThreadTweet[] =
    locale === 'en'
      ? [
          { index: 1, text: `1/ ${topic} — a structured learning thread (not advice).` },
          {
            index: 2,
            text: `2/ Define the question clearly. What decision are you actually trying to improve?${note ? ` Context: ${note}` : ''}`,
          },
          {
            index: 3,
            text: `3/ Separate facts from narratives. Prefer primary sources and transparent methods.`,
          },
          {
            index: 4,
            text: `4/ Risk first: what can go wrong, and how would you notice early?`,
          },
          {
            index: 5,
            text: `5/ ${cta}. ${disclaimer}`,
          },
        ]
      : [
          { index: 1, text: `1/ ${topic} — Lern-Thread (keine Beratung).` },
          {
            index: 2,
            text: `2/ Frage schärfen: Welche Entscheidung soll besser werden?${note ? ` Kontext: ${note}` : ''}`,
          },
          {
            index: 3,
            text: `3/ Fakten von Narrativen trennen. Primärquellen und transparente Methoden bevorzugen.`,
          },
          {
            index: 4,
            text: `4/ Risiko zuerst: Was kann schiefgehen — und woran merkst du es früh?`,
          },
          {
            index: 5,
            text: `5/ ${cta}. ${disclaimer}`,
          },
        ];

  const podcastOutline: PodcastOutlineEntry[] =
    locale === 'en'
      ? [
          {
            speaker: hostA,
            role: 'host',
            text: `Today we unpack ${topic} — education only, no recommendations.`,
          },
          {
            speaker: hostB,
            role: 'cohost',
            text: note
              ? `Starting point: ${note}`
              : `Let's start with definitions and what we will not claim.`,
          },
          {
            speaker: hostA,
            role: 'host',
            text: `Method over narrative: evidence, assumptions, and failure modes.`,
          },
          {
            speaker: hostB,
            role: 'cohost',
            text: `Practical checklist for listeners who want a repeatable process.`,
          },
          {
            speaker: hostA,
            role: 'host',
            text: `Wrap-up: ${cta}. ${disclaimer}`,
          },
        ]
      : [
          {
            speaker: hostA,
            role: 'host',
            text: `Heute zerlegen wir ${topic} — rein bildungsorientiert, keine Empfehlung.`,
          },
          {
            speaker: hostB,
            role: 'cohost',
            text: note
              ? `Ausgangspunkt: ${note}`
              : `Wir starten mit Definitionen und dem, was wir nicht behaupten.`,
          },
          {
            speaker: hostA,
            role: 'host',
            text: `Methode statt Narrativ: Evidenz, Annahmen, Fehlerbilder.`,
          },
          {
            speaker: hostB,
            role: 'cohost',
            text: `Praktische Checkliste für einen wiederholbaren Prozess.`,
          },
          {
            speaker: hostA,
            role: 'host',
            text: `Abschluss: ${cta}. ${disclaimer}`,
          },
        ];

  const youtubeLongformOutline: VideoSceneOutline[] =
    locale === 'en'
      ? [
          {
            sceneNumber: 1,
            timestamp: '0:00',
            onScreenText: topic,
            audioScript: `Welcome. This episode is about ${topic}. Educational content only.`,
            visualAction: 'Title card, calm fintech aesthetic',
          },
          {
            sceneNumber: 2,
            timestamp: '0:45',
            onScreenText: 'Definitions',
            audioScript: note || 'We define terms and scope before any interpretation.',
            visualAction: 'Simple diagram / bullet points',
          },
          {
            sceneNumber: 3,
            timestamp: '3:00',
            onScreenText: 'Process',
            audioScript: 'Walk through a transparent process: inputs, assumptions, risks.',
            visualAction: 'Step-by-step animation',
          },
          {
            sceneNumber: 4,
            timestamp: '8:00',
            onScreenText: 'Risk',
            audioScript: 'What can invalidate the analysis? How do we monitor that?',
            visualAction: 'Risk checklist on screen',
          },
          {
            sceneNumber: 5,
            timestamp: '11:00',
            onScreenText: cta,
            audioScript: `${cta}. ${disclaimer}`,
            visualAction: 'End card with disclaimer',
          },
        ]
      : [
          {
            sceneNumber: 1,
            timestamp: '0:00',
            onScreenText: topic,
            audioScript: `Willkommen. Thema: ${topic}. Rein bildungsorientiert.`,
            visualAction: 'Titelkarte, ruhige Fintech-Ästhetik',
          },
          {
            sceneNumber: 2,
            timestamp: '0:45',
            onScreenText: 'Definitionen',
            audioScript: note || 'Zuerst Begriffe und Scope — bevor interpretiert wird.',
            visualAction: 'Einfaches Diagramm / Stichpunkte',
          },
          {
            sceneNumber: 3,
            timestamp: '3:00',
            onScreenText: 'Prozess',
            audioScript: 'Transparenter Ablauf: Inputs, Annahmen, Risiken.',
            visualAction: 'Schritt-für-Schritt-Animation',
          },
          {
            sceneNumber: 4,
            timestamp: '8:00',
            onScreenText: 'Risiko',
            audioScript: 'Was widerlegt die Analyse? Woran merken wir das?',
            visualAction: 'Risiko-Checkliste',
          },
          {
            sceneNumber: 5,
            timestamp: '11:00',
            onScreenText: cta,
            audioScript: `${cta}. ${disclaimer}`,
            visualAction: 'Endkarte mit Disclaimer',
          },
        ];

  const hashtags =
    locale === 'en'
      ? ['#CapitalAI', '#InvestingEducation', '#RiskManagement', '#FinTech']
      : ['#CapitalAI', '#Finanzbildung', '#Risikomanagement', '#FinTech'];

  const marketingPack: MarketingPack =
    locale === 'en'
      ? {
          linkedinPost: [
            `Learning note: ${topic}`,
            '',
            note || 'We prioritise process transparency over predictions.',
            '',
            disclaimer,
            '',
            hashtags.join(' '),
          ].join('\n'),
          twitterThread: thread.map((x) => x.text),
          instagramCaption: `${topic}\n\n${note || 'Process over hype.'}\n\n${disclaimer}\n\n${hashtags.join(' ')}`,
          tiktokDescription: `${topic} — education only. ${cta}`,
          hashtags,
          ctaButtonText: cta,
        }
      : {
          linkedinPost: [
            `Lernnotiz: ${topic}`,
            '',
            note || 'Prozess-Transparenz vor Prognose.',
            '',
            disclaimer,
            '',
            hashtags.join(' '),
          ].join('\n'),
          twitterThread: thread.map((x) => x.text),
          instagramCaption: `${topic}\n\n${note || 'Prozess statt Hype.'}\n\n${disclaimer}\n\n${hashtags.join(' ')}`,
          tiktokDescription: `${topic} — nur Bildung. ${cta}`,
          hashtags,
          ctaButtonText: cta,
        };

  return {
    topic,
    locale,
    seriesTitle,
    overallStrategySummary,
    thread,
    podcastOutline,
    youtubeLongformOutline,
    marketingPack,
    disclaimer,
    authorship: 'ai_assisted',
    humanReviewed: false,
    generatedAt: new Date().toISOString(),
  };
}
