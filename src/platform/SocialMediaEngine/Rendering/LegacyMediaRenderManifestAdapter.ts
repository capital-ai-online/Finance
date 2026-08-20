import {
  MEDIA_PROJECT_BRAND_TOKEN_SOURCE,
  MEDIA_PROJECT_SCHEMA_VERSION,
  type MediaProjectV2,
  type MediaSceneLayer,
} from '../Contracts/MediaProject';
import { assertMediaProjectV2 } from '../Contracts/MediaProjectValidation';

export const LEGACY_MEDIA_RENDER_MANIFEST_SCHEMA_VERSION = '1.0.0' as const;
export const LEGACY_MEDIA_DEFAULT_FPS = 30 as const;

const LEGACY_MAX_SCENES = 8;
const LEGACY_MIN_TOTAL_SECONDS = 5;
const LEGACY_MAX_TOTAL_SECONDS = 60;
const LEGACY_MIN_SCENE_SECONDS = 1;
const LEGACY_MAX_SCENE_SECONDS = 20;
const URI_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;

export interface LegacyMediaRenderSceneV1 {
  title: string;
  body: string;
  durationSeconds: number;
  kicker?: string;
  disclaimer?: string;
}

export interface LegacyMediaRenderManifestV1 {
  schemaVersion: typeof LEGACY_MEDIA_RENDER_MANIFEST_SCHEMA_VERSION;
  slug: string;
  title: string;
  subtitle: string;
  disclaimer?: string;
  scenes: LegacyMediaRenderSceneV1[];
}

export interface LegacyMediaRenderManifestAdapterOptions {
  framesPerSecond?: 24 | 25 | 30 | 50 | 60;
  sourceReference?: string;
}

function requireBoundedText(value: unknown, field: string, maxChars: number): string {
  if (typeof value !== 'string') throw new Error(`${field} must be a string.`);
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) throw new Error(`${field} must not be empty.`);
  if (normalized.length > maxChars) throw new Error(`${field} exceeds ${maxChars} characters.`);
  return normalized;
}

function requireSafeReference(value: string, field: string): string {
  const normalized = value.trim().replace(/\\/g, '/');
  if (!normalized || URI_SCHEME.test(normalized) || normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error(`${field} must be an opaque or repository-relative reference without a URI scheme, absolute path or traversal path.`);
  }
  return normalized;
}

function validateLegacyManifest(input: unknown): LegacyMediaRenderManifestV1 {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw new Error('Legacy media render manifest must be an object.');
  const raw = input as Record<string, unknown>;
  if (raw.schemaVersion !== LEGACY_MEDIA_RENDER_MANIFEST_SCHEMA_VERSION) throw new Error(`Legacy schemaVersion must be ${LEGACY_MEDIA_RENDER_MANIFEST_SCHEMA_VERSION}.`);

  const slug = requireBoundedText(raw.slug, 'slug', 80);
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) throw new Error('slug must be lowercase kebab-case.');
  const title = requireBoundedText(raw.title, 'title', 100);
  const subtitle = requireBoundedText(raw.subtitle, 'subtitle', 240);
  const disclaimer = raw.disclaimer === undefined ? undefined : requireBoundedText(raw.disclaimer, 'disclaimer', 220);

  if (!Array.isArray(raw.scenes) || raw.scenes.length < 1 || raw.scenes.length > LEGACY_MAX_SCENES) {
    throw new Error(`scenes must contain between 1 and ${LEGACY_MAX_SCENES} entries.`);
  }

  let totalSeconds = 0;
  const scenes = raw.scenes.map((candidate, index): LegacyMediaRenderSceneV1 => {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) throw new Error(`scene ${index + 1} must be an object.`);
    const scene = candidate as Record<string, unknown>;
    const durationSeconds = Number(scene.durationSeconds);
    if (!Number.isFinite(durationSeconds) || durationSeconds < LEGACY_MIN_SCENE_SECONDS || durationSeconds > LEGACY_MAX_SCENE_SECONDS) {
      throw new Error(`scene ${index + 1} durationSeconds must be between ${LEGACY_MIN_SCENE_SECONDS} and ${LEGACY_MAX_SCENE_SECONDS}.`);
    }
    totalSeconds += durationSeconds;
    return {
      title: requireBoundedText(scene.title, `scene ${index + 1} title`, 90),
      body: requireBoundedText(scene.body, `scene ${index + 1} body`, 4_000),
      durationSeconds,
      kicker: scene.kicker === undefined ? undefined : requireBoundedText(scene.kicker, `scene ${index + 1} kicker`, 60),
      disclaimer: scene.disclaimer === undefined ? undefined : requireBoundedText(scene.disclaimer, `scene ${index + 1} disclaimer`, 220),
    };
  });

  if (totalSeconds < LEGACY_MIN_TOTAL_SECONDS || totalSeconds > LEGACY_MAX_TOTAL_SECONDS) {
    throw new Error(`total scene duration must be between ${LEGACY_MIN_TOTAL_SECONDS} and ${LEGACY_MAX_TOTAL_SECONDS} seconds.`);
  }

  return { schemaVersion: LEGACY_MEDIA_RENDER_MANIFEST_SCHEMA_VERSION, slug, title, subtitle, disclaimer, scenes };
}

/**
 * Deterministically migrates the bounded ADR-0094 manifest-v1 shape into the
 * editable MediaProject v2 contract. The adapter performs no I/O or network access.
 */
export function adaptLegacyMediaRenderManifestV1(
  input: unknown,
  options: LegacyMediaRenderManifestAdapterOptions = {},
): MediaProjectV2 {
  const legacy = validateLegacyManifest(input);
  const framesPerSecond = options.framesPerSecond ?? LEGACY_MEDIA_DEFAULT_FPS;
  const sourceReference = requireSafeReference(
    options.sourceReference ?? `${legacy.slug}/MEDIA_RENDER_MANIFEST.json`,
    'sourceReference',
  );

  let startFrame = 0;
  const layers: MediaSceneLayer[] = legacy.scenes.map((scene, index) => {
    const durationFrames = Math.round(scene.durationSeconds * framesPerSecond);
    if (Math.abs(durationFrames / framesPerSecond - scene.durationSeconds) > 1e-9) {
      throw new Error(`scene ${index + 1} durationSeconds cannot be represented exactly at ${framesPerSecond} fps.`);
    }
    const layer: MediaSceneLayer = {
      id: `legacy-scene-${index + 1}`,
      kind: 'scene',
      name: scene.title,
      range: { startFrame, durationFrames },
      enabled: true,
      title: scene.title,
      body: scene.body,
      kicker: scene.kicker ?? 'CAPITAL-AI',
      disclaimer: scene.disclaimer,
      sourceSceneRef: `legacy-scene:${index + 1}`,
    };
    startFrame += durationFrames;
    return layer;
  });

  const firstDisclaimer = legacy.scenes[0]?.disclaimer;
  const lastDisclaimer = legacy.scenes[legacy.scenes.length - 1]?.disclaimer;
  const project: MediaProjectV2 = {
    schemaVersion: MEDIA_PROJECT_SCHEMA_VERSION,
    projectId: `media-project:${legacy.slug}`,
    slug: legacy.slug,
    title: legacy.title,
    description: legacy.subtitle,
    timebase: { numerator: framesPerSecond, denominator: 1 },
    canvas: { width: 1080, height: 1920, aspectRatio: '9:16' },
    durationFrames: startFrame,
    tracks: [
      {
        id: 'legacy-scenes',
        kind: 'graphics',
        name: 'Legacy scenes',
        enabled: true,
        layers,
      },
    ],
    assets: [],
    transitions: [],
    renderRecipe: {
      templateId: 'capital-ai-legacy-card',
      templateVersion: '1.0.0',
      rendererProfile: 'pillow-ffmpeg-v1',
      brandTokenSource: MEDIA_PROJECT_BRAND_TOKEN_SOURCE,
      brandTextMode: 'deterministic',
      networkPolicy: 'offline',
      publishReady: false,
    },
    source: {
      type: 'legacy-render-manifest',
      reference: sourceReference,
    },
    disclosure: {
      defaultDisclaimer: legacy.disclaimer,
      requireAtProjectEdges: Boolean(firstDisclaimer && lastDisclaimer),
    },
  };

  assertMediaProjectV2(project);
  return project;
}
