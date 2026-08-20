import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MEDIA_PROJECT_SCHEMA_VERSION,
  type MediaProjectV2,
} from '../../src/platform/SocialMediaEngine/Contracts/MediaProject';
import { validateMediaProjectV2 } from '../../src/platform/SocialMediaEngine/Contracts/MediaProjectValidation';
import { adaptLegacyMediaRenderManifestV1 } from '../../src/platform/SocialMediaEngine/Rendering/LegacyMediaRenderManifestAdapter';

const root = process.cwd();
const graham = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/content-creator/packages/graham-fair-value-check/MEDIA_RENDER_MANIFEST.json'),
    'utf8',
  ),
);

function cloneProject(project: MediaProjectV2): MediaProjectV2 {
  return structuredClone(project);
}

describe('ADR-0098 MediaProject v2 contract', () => {
  it('adapts the Graham manifest deterministically without changing business content', () => {
    const first = adaptLegacyMediaRenderManifestV1(graham, {
      sourceReference: 'docs/content-creator/packages/graham-fair-value-check/MEDIA_RENDER_MANIFEST.json',
    });
    const second = adaptLegacyMediaRenderManifestV1(graham, {
      sourceReference: 'docs/content-creator/packages/graham-fair-value-check/MEDIA_RENDER_MANIFEST.json',
    });

    expect(second).toEqual(first);
    expect(first.schemaVersion).toBe(MEDIA_PROJECT_SCHEMA_VERSION);
    expect(first.canvas).toEqual({ width: 1080, height: 1920, aspectRatio: '9:16' });
    expect(first.timebase).toEqual({ numerator: 30, denominator: 1 });
    expect(first.durationFrames).toBe(46 * 30);
    expect(first.renderRecipe).toMatchObject({
      brandTokenSource: 'docs/frontend/design-tokens.json',
      brandTextMode: 'deterministic',
      networkPolicy: 'offline',
      publishReady: false,
    });

    const layers = first.tracks[0]?.layers ?? [];
    expect(layers).toHaveLength(6);
    expect(layers.map((layer) => layer.range.startFrame)).toEqual([0, 120, 360, 630, 900, 1170]);
    expect(layers.map((layer) => layer.range.durationFrames)).toEqual([120, 240, 270, 270, 270, 210]);
    expect(layers[0]).toMatchObject({
      kind: 'scene',
      title: graham.scenes[0].title,
      body: graham.scenes[0].body,
      disclaimer: graham.scenes[0].disclaimer,
    });
    expect(layers.at(-1)).toMatchObject({ disclaimer: graham.scenes.at(-1).disclaimer });
    expect(first.disclosure.requireAtProjectEdges).toBe(true);
    expect(validateMediaProjectV2(first)).toEqual({ ok: true, errors: [] });
    expect(JSON.stringify(first)).not.toMatch(/https?:\/\//i);
  });

  it('fails closed on duplicate layer ids and overlapping layers on one track', () => {
    const project = cloneProject(adaptLegacyMediaRenderManifestV1(graham));
    const layers = project.tracks[0]!.layers;
    layers[1]!.id = layers[0]!.id;
    layers[1]!.range.startFrame = 1;

    const result = validateMediaProjectV2(project);
    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('layer_id_duplicate');
    expect(result.errors.map((error) => error.code)).toContain('track_layer_overlap');
  });

  it('rejects remote asset references before a renderer or publisher can consume them', () => {
    const project = cloneProject(adaptLegacyMediaRenderManifestV1(graham));
    project.assets.push({
      id: 'remote-image',
      kind: 'image',
      sourceType: 'local-file',
      reference: 'https://example.invalid/render.png',
    });
    project.tracks.push({
      id: 'image-track',
      kind: 'video',
      enabled: true,
      layers: [
        {
          id: 'remote-image-layer',
          kind: 'image',
          enabled: true,
          range: { startFrame: 0, durationFrames: project.durationFrames },
          assetRefId: 'remote-image',
          fit: 'cover',
        },
      ],
    });

    const result = validateMediaProjectV2(project);
    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('asset_reference_invalid');
  });

  it('keeps publish authority outside the MediaProject contract', () => {
    const project = cloneProject(adaptLegacyMediaRenderManifestV1(graham));
    (project.renderRecipe as { publishReady: boolean }).publishReady = true;

    const result = validateMediaProjectV2(project);
    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('publish_ready_forbidden');
  });

  it('rejects transitions that point outside the timeline graph', () => {
    const project = cloneProject(adaptLegacyMediaRenderManifestV1(graham));
    project.transitions.push({
      id: 'bad-transition',
      type: 'fade',
      fromLayerId: project.tracks[0]!.layers[0]!.id,
      toLayerId: 'missing-layer',
      durationFrames: 10,
    });

    const result = validateMediaProjectV2(project);
    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('transition_to_missing');
  });

  it('publishes a Draft 2020-12 structural schema for serialized MediaProjects', () => {
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(root, 'src/platform/SocialMediaEngine/Contracts/media-project-v2.schema.json'),
        'utf8',
      ),
    );

    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toBe('https://capital-ai.online/schemas/media-project-v2.schema.json');
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.schemaVersion.const).toBe(MEDIA_PROJECT_SCHEMA_VERSION);
    expect(schema.$defs.renderRecipe.properties.publishReady.const).toBe(false);
    expect(schema.$defs.renderRecipe.properties.brandTextMode.const).toBe('deterministic');
  });
});
