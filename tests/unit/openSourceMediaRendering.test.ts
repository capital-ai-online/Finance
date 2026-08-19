import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const core = read('scripts/media/capital_ai_media.py');
const renderer = read('scripts/media/render_content_assets.py');
const cinematicRenderer = read('scripts/media/render_cinematic_brand_film.py');
const pdfCompanion = read('scripts/docs/export_pdf_media_bundle.py');
const requirements = read('scripts/media/requirements-content-media.txt');
const example = JSON.parse(read('scripts/media/examples/capital_ai_media_manifest.json'));
const graham = JSON.parse(read('docs/content-creator/packages/graham-fair-value-check/MEDIA_RENDER_MANIFEST.json'));
const grahamFilm = JSON.parse(read('docs/content-creator/packages/graham-fair-value-check/PREMIUM_BRAND_FILM_MANIFEST.json'));

function totalDuration(manifest: { scenes: Array<{ durationSeconds: number }> }): number {
  return manifest.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
}

describe('ADR-0094 open-source media rendering contract', () => {
  it('pins the security-sensitive Pillow decoder dependency', () => {
    expect(requirements).toContain('Pillow==12.3.0');
    expect(requirements).not.toMatch(/Pillow[><~^]/);
  });

  it('uses canonical design tokens instead of a parallel brand palette', () => {
    expect(core).toContain('docs" / "frontend" / "design-tokens.json');
    expect(core).toContain('load_brand_palette');
    expect(core).not.toContain('requests.');
    expect(core).not.toContain('httpx.');
    expect(cinematicRenderer).toContain('load_brand_palette');
  });

  it('keeps subprocess execution shell-free and bounded', () => {
    expect(core).toContain('shell=False');
    expect(core).toContain('timeout=timeout');
    expect(core).not.toContain('shell=True');
    expect(cinematicRenderer).not.toContain('shell=True');
  });

  it('fails closed on FFmpeg nonfree and defaults GPL builds to DENY', () => {
    expect(core).toContain('--enable-nonfree');
    expect(core).toContain('--enable-gpl');
    expect(core).toContain('allow_gpl_ffmpeg');
    expect(core).toContain('lgpl-compatible-build-candidate');
    expect(core).toContain('"-c:v", "mpeg4"');
    expect(cinematicRenderer).toContain('inspect_ffmpeg');
    expect(cinematicRenderer).toContain('enforce_ffmpeg_license_profile');
    expect(cinematicRenderer).toContain("'-c:v','mpeg4'");
  });

  it('does not accept remote media URLs in deterministic manifests', () => {
    expect(renderer).toContain('remote media URLs are not accepted');
    expect(renderer).toContain('mediaUrl');
    expect(renderer).toContain('imageUrl');
    expect(renderer).toContain('sourceUrl');
    expect(cinematicRenderer).toContain('remote media URLs are not accepted');
  });

  it('keeps generated assets outside publish authority', () => {
    expect(core).toContain('"publishReady": False');
    expect(core).toContain('hash-bound human approval');
    expect(cinematicRenderer).toContain("'publishReady':False");
    expect(cinematicRenderer).toContain('hash-bound human approval');
  });

  it('bounds PDF companion extraction and preserves PDF conformance boundaries', () => {
    expect(pdfCompanion).toContain('MAX_PDF_PAGES_FOR_MEDIA = 5');
    expect(pdfCompanion).toContain('pdfinfo');
    expect(pdfCompanion).toContain('pdftoppm');
    expect(pdfCompanion).toContain('"sourcePdfModified": False');
    expect(pdfCompanion).toContain('"formalPdfUaValidation": False');
  });

  it('keeps example and Graham shorts inside the 60 second boundary', () => {
    for (const manifest of [example, graham]) {
      expect(manifest.schemaVersion).toBe('1.0.0');
      expect(manifest.scenes.length).toBeGreaterThan(0);
      expect(manifest.scenes.length).toBeLessThanOrEqual(8);
      expect(totalDuration(manifest)).toBeGreaterThanOrEqual(5);
      expect(totalDuration(manifest)).toBeLessThanOrEqual(60);
      expect(JSON.stringify(manifest)).not.toMatch(/https?:\/\//i);
    }
  });

  it('shows the financial disclaimer at both edges of the Graham short', () => {
    const finalScene = graham.scenes[graham.scenes.length - 1];
    expect(graham.scenes[0].disclaimer).toMatch(/Keine Anlageberatung/);
    expect(finalScene?.disclaimer).toMatch(/Keine Anlageberatung/);
    expect(JSON.stringify(graham)).not.toMatch(/BUY|SELL|Kaufempfehlung|Verkaufsempfehlung/i);
  });

  it('defines a bounded 45 second Graham/Buffett 16:9 premium film contract', () => {
    expect(grahamFilm.schemaVersion).toBe('1.0.0');
    expect(grahamFilm.width).toBe(1920);
    expect(grahamFilm.height).toBe(1080);
    expect(grahamFilm.fps).toBe(24);
    expect(grahamFilm.renderFps).toBeGreaterThan(0);
    expect(grahamFilm.renderFps).toBeLessThanOrEqual(grahamFilm.fps);
    expect(grahamFilm.durationSeconds).toBe(45);
    expect(grahamFilm.scenes).toHaveLength(8);
    expect(grahamFilm.headlineSequence).toEqual(['DATA', 'EVIDENCE', 'MODELS', 'RISK', 'INTELLIGENCE']);
    expect(grahamFilm.valueChecks).toHaveLength(9);
    expect(grahamFilm.finalStatement).toBe('QUANTITATIVE INTELLIGENCE FOR COMPLEX MARKETS');
    expect(grahamFilm.publishReady).toBe(false);
    expect(grahamFilm.disclaimer).toMatch(/Keine Anlageberatung/);
    expect(JSON.stringify(grahamFilm)).not.toMatch(/https?:\/\//i);
    expect(JSON.stringify(grahamFilm)).not.toMatch(/BUY|SELL|Kaufempfehlung|Verkaufsempfehlung/i);
  });

  it('keeps the premium film silent, deterministic and outside external runtime dependencies', () => {
    expect(cinematicRenderer).toContain("'-an'");
    expect(cinematicRenderer).toContain('Pillow');
    expect(cinematicRenderer).not.toMatch(/remotion|moviepy|blender/i);
    expect(cinematicRenderer).not.toMatch(/requests|httpx|urllib\.request/i);
  });
});
