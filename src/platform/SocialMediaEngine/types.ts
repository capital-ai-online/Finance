/**
 * CAPITAL-AI Social Media & Podcast Generator Engine - Type Definitions
 * Version: 0.6.0
 * Decoupled Enterprise Module
 *
 * ADR-0020: Uebernommen aus dem Google-AI-Studio-Handover unveraendert fuer den
 * Content-Generation-Teil (SocialMediaQuestionnaire ... SocialMediaSeriesPackage) - dieser Teil
 * wurde nicht auditiert oder implementiert, da der zugehoerige Service
 * (SocialMediaGeneratorService.generateSeries/-FallbackPackage, Web-Speech-Audio-Preview,
 * Export-Funktionen) im Handover fehlte. Siehe ADR-0020 Abschnitt 3 fuer die Scope-Begruendung.
 *
 * Der Account-/Publishing-Teil (ab "Social Media Account Integration") wurde gegenueber dem
 * Handover geaendert: PublishRequestPayload hat ein neues optionales mediaUrl-Feld, weil eine
 * echte Veroeffentlichung auf Video-Plattformen (YouTube/TikTok/Instagram Reels) eine oeffentlich
 * erreichbare Medien-URL braucht - der Handover-Prototyp hatte dafuer ueberhaupt kein Feld und
 * taeuschte stattdessen einen Erfolg mit einer aus Date.now() konstruierten Fake-URL vor.
 */

export type PlatformType = 'tiktok' | 'youtube' | 'reels' | 'podcast' | 'multiplatform';

export type ContentFormat =
  | 'tiktok_short'         // 15-60s vertical video
  | 'reels_short'          // 30-90s vertical video
  | 'youtube_longform'     // 8-15m horizontal video
  | 'youtube_short'        // 30-60s vertical video
  | 'podcast_dual_host'    // 10-30m dual host interview/dialogue
  | 'podcast_solo'         // 5-15m solo host deep dive
  | 'linkedin_video_pack'; // B2B video + slide deck script

export type ToneOfVoice =
  | 'viral_high_energy'
  | 'professional_expert'
  | 'conversational_friendly'
  | 'analytical_provocative'
  | 'storytelling_suspense';

export type TargetAudience =
  | 'gen_z_investors'
  | 'b2b_decision_makers'
  | 'crypto_traders'
  | 'retail_investors'
  | 'general_public'
  | 'tech_enthusiasts';

export type MarketingGoal =
  | 'lead_generation'
  | 'app_installs'
  | 'brand_awareness'
  | 'community_growth'
  | 'educational_authority';

export interface SocialMediaQuestionnaire {
  topic: string;
  niche: string;
  keyUSP?: string;
  platforms: PlatformType[];
  format: ContentFormat;
  seriesCount: number; // 1 to 10
  targetAudience: TargetAudience;
  tone: ToneOfVoice;
  marketingGoal: MarketingGoal;
  ctaText: string;
  hostAName: string;
  hostBName?: string;
  language: 'de' | 'en';
  additionalInstructions?: string;
}

export interface ScriptScene {
  sceneNumber: number;
  timestamp: string;
  visualAction: string;
  cameraAngle: string;
  speaker?: string;
  audioScript: string;
  onScreenText: string;
  bRollCue?: string;
  soundEffect?: string;
}

export interface PodcastDialogueEntry {
  id: string;
  speaker: string;
  role: 'host' | 'cohost' | 'guest';
  text: string;
  timestamp: string;
  ssmlVoice?: string;
  audioCue?: string; // e.g. "[Chime sound]", "[Laughs]", "[Intro Jingle]"
}

export interface GeneratedMediaItem {
  id: string;
  episodeNumber: number;
  title: string;
  format: ContentFormat;
  primaryPlatform: PlatformType;
  estimatedDuration: string;
  viralPotentialScore: number; // 1-100
  hookOptions: {
    hookText: string;
    hookStyle: 'curiosity' | 'controversial' | 'data_driven' | 'story';
    estimatedRetentionRate: string;
  }[];
  podcastDialogue?: PodcastDialogueEntry[];
  videoStoryboard?: ScriptScene[];
  fullMonologueScript?: string;
  thumbnailPrompt: string;
  thumbnailSvgPreview?: string;
  marketingPack: {
    linkedinPost: string;
    twitterThread: string[];
    instagramCaption: string;
    tiktokDescription: string;
    hashtags: string[];
    ctaButtonText: string;
  };
  audioSsml: string;
  /** ADR-0020: oeffentlich erreichbare URL des gerenderten Video-/Audio-Assets, sofern
   *  vorhanden. Ohne dieses Feld koennen Video-Plattformen (YouTube/TikTok/Instagram) nicht
   *  real veroeffentlicht werden - siehe PublishRequestPayload.mediaUrl. */
  mediaUrl?: string;
}

export interface SocialMediaSeriesPackage {
  id: string;
  createdAt: string;
  version: string;
  decoupledModule: boolean;
  questionnaire: SocialMediaQuestionnaire;
  overallStrategySummary: string;
  seriesTitle: string;
  items: GeneratedMediaItem[];
}

// ---------------------------------------------------------
// Social Media Account Integration & Direct Publisher Types
// ---------------------------------------------------------

export type SupportedAccountPlatform = 'youtube' | 'tiktok' | 'instagram' | 'x' | 'facebook';

export type SocialAccountStatus = 'connected' | 'disconnected' | 'token_expired' | 'connecting';

export interface SocialAccount {
  id: string;
  platform: SupportedAccountPlatform;
  accountName: string;
  handle: string;
  avatarUrl?: string;
  status: SocialAccountStatus;
  connectedAt?: string;
  scopes: string[];
  followersCount?: number;
  channelId?: string;
  /** ADR-0020: NIE ein echtes Token, ausschliesslich eine gekuerzte, nicht-reversible
   *  Anzeige-Referenz (letzte 4 Zeichen der Konto-ID) - siehe tokenStore.ts. Der Handover-
   *  Prototyp nannte dieses Feld gleich, fuellte es aber mit `token_${platform}_${Date.now()}`ein
   *  frei erfundener Wert ohne jeden Bezug zu einem echten Token. */
  accessTokenMasked?: string;
}

export type PublishExecutionType = 'instant' | 'scheduled' | 'draft';

export interface PublishRequestPayload {
  episodeId: string;
  episodeTitle: string;
  seriesTitle: string;
  targetPlatforms: SupportedAccountPlatform[];
  publishType: PublishExecutionType;
  scheduledAt?: string; // ISO String
  customCaptions: Partial<Record<SupportedAccountPlatform, string>>;
  videoTitle?: string;
  hashtags: string[];
  mediaType: 'short_video' | 'podcast_audio' | 'long_video' | 'social_post' | 'thread';
  /** ADR-0020 (neu): oeffentlich erreichbare URL des zu veroeffentlichenden Video-/Audio-Assets.
   *  Erforderlich fuer youtube/tiktok/instagram (Video-Content); optional fuer x/facebook, die
   *  auch reine Text-Posts unterstuetzen. Fehlt sie fuer eine Video-Plattform, schlaegt die
   *  Veroeffentlichung fuer diese Plattform mit einer expliziten Fehlermeldung fehl, statt eine
   *  Erfolgs-URL vorzutaeuschen. */
  mediaUrl?: string;
}

export interface PublishLogEntry {
  id: string;
  episodeId: string;
  episodeTitle: string;
  platform: SupportedAccountPlatform;
  accountHandle: string;
  status: 'published' | 'scheduled' | 'failed' | 'draft';
  publishType: PublishExecutionType;
  publishedUrl?: string;
  scheduledAt?: string;
  timestamp: string;
  errorMessage?: string;
}

export interface SocialPlatformConfig {
  id: SupportedAccountPlatform;
  name: string;
  iconName: string;
  color: string;
  apiDocUrl: string;
  requiredScopes: string[];
  description: string;
}
