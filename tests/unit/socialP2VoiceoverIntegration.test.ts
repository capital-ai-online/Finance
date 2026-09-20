import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const core = fs.readFileSync(path.join(root, 'scripts/media/capital_ai_media.py'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'scripts/media/render_content_assets.py'), 'utf8');

describe('SOCIAL-P2 voice-over integration boundary', () => {
  it('requires explicit Human/Owner listening acceptance before audio can enter the renderer', () => {
    expect(core).toContain('voiceover requires explicit Human/Owner listening acceptance PASS');
    expect(core).toContain('raw.get("acceptanceStatus") != "PASS"');
    expect(renderer).toContain('validate_voiceover_binding(raw.get("voiceover")');
    expect(renderer).toContain('voiceover requires --video so audio evidence cannot be attached to image-only output');
  });

  it('binds the voice-over to immutable TTS and content identities', () => {
    for (const field of [
      'voiceover.audioSha256',
      'voiceover.requestHash',
      'voiceover.contentPackageId',
      'voiceover.candidateContentHash',
      'voiceover.runtimeEvidenceReference',
      'voiceover.licenseEvidenceReference',
      'voiceover.listeningReviewReference',
    ]) {
      expect(core).toContain(field);
    }
    expect(core).toContain('voiceover audio SHA-256 mismatch');
    expect(core).toContain('audio_path.is_relative_to(root)');
  });

  it('keeps remote audio and path traversal outside the deterministic renderer', () => {
    expect(core).toContain('voiceover.audioPath must be a local relative path');
    expect(core).toContain('voiceover.audioPath escapes the render manifest directory');
  });

  it('muxes exactly one accepted audio stream while preserving the existing silent path', () => {
    expect(core).toContain('"-map", "0:v:0"');
    expect(core).toContain('"-map", "1:a:0"');
    expect(core).toContain('"-c:a", "aac"');
    expect(core).toContain('"-b:a", "192k"');
    expect(core).toContain('voiceover render must contain exactly one audio stream');
    expect(core).toContain('silent render unexpectedly contains an audio stream');
  });

  it('propagates the immutable voice evidence into the output manifest and never grants publish authority', () => {
    expect(renderer).toContain('"audioSha256": voiceover.audio_sha256');
    expect(renderer).toContain('"requestHash": voiceover.request_hash');
    expect(renderer).toContain('"candidateContentHash": voiceover.candidate_content_hash');
    expect(renderer).toContain('"acceptanceStatus": "PASS"');
    expect(core).toContain('"publishReady": False');
  });
});
