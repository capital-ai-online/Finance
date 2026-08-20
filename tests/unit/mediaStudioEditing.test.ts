import { describe, expect, it } from 'vitest';
import {
  moveMediaLayerByFrames,
  resizeMediaLayerByFrames,
  setMediaLayerText,
  setMediaProjectCanvasPreset,
} from '../../src/platform/SocialMediaEngine/Editing/MediaProjectEditing';
import { createCapitalAiMediaStudioProject } from '../../src/platform/SocialMediaEngine/Editing/MediaStudioTemplates';
import { validateMediaProjectV2 } from '../../src/platform/SocialMediaEngine/Contracts/MediaProjectValidation';

describe('MC-2 Media Studio editing core', () => {
  it('creates a deterministic valid draft that cannot grant publish authority', () => {
    const first = createCapitalAiMediaStudioProject();
    const second = createCapitalAiMediaStudioProject();

    expect(second).toEqual(first);
    expect(validateMediaProjectV2(first)).toEqual({ ok: true, errors: [] });
    expect(first.renderRecipe.publishReady).toBe(false);
    expect(first.renderRecipe.networkPolicy).toBe('offline');
    expect(first.metadata).toMatchObject({ draftOnly: true });
  });

  it('switches supported canvas presets without mutating the source project', () => {
    const project = createCapitalAiMediaStudioProject();
    const result = setMediaProjectCanvasPreset(project, '9:16');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(project.canvas).toEqual({ width: 1920, height: 1080, aspectRatio: '16:9' });
    expect(result.project.canvas).toEqual({ width: 1080, height: 1920, aspectRatio: '9:16' });
  });

  it('updates deterministic scene text through validated editing commands', () => {
    const project = createCapitalAiMediaStudioProject();
    const result = setMediaLayerText(project, 'scene-01', 'title', 'DATA → EVIDENCE');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const layer = result.project.tracks[0]!.layers[0]!;
    expect(layer.kind).toBe('scene');
    if (layer.kind === 'scene') expect(layer.title).toBe('DATA → EVIDENCE');
    expect(validateMediaProjectV2(result.project).ok).toBe(true);
  });

  it('fails closed when a resize would move a layer outside the project duration', () => {
    const project = createCapitalAiMediaStudioProject();
    const result = resizeMediaLayerByFrames(project, 'scene-01', 30);

    expect(result.ok).toBe(false);
    if (!('errors' in result)) return;
    expect(result.errors.map((error) => error.code)).toContain('layer_out_of_project_bounds');
    expect(project.tracks[0]!.layers[0]!.range.durationFrames).toBe(project.durationFrames);
  });

  it('fails closed when movement would create an invalid negative start frame', () => {
    const project = createCapitalAiMediaStudioProject();
    const result = moveMediaLayerByFrames(project, 'scene-01', -1);

    expect(result.ok).toBe(false);
    if (!('errors' in result)) return;
    expect(result.errors.map((error) => error.code)).toContain('edit_start_frame_invalid');
  });
});
