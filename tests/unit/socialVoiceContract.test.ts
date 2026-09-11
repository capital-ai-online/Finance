import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TTS_LANGUAGE_REGISTRY,
  buildTtsSynthesisRequest,
  validateTtsSynthesisResult,
  type TtsSynthesisRequestInput,
} from '../../server/socialMedia/voiceContract';

const CONTENT_HASH = 'a'.repeat(64);

function baseRequest(): TtsSynthesisRequestInput {
  return {
    content_package_id: 'scp_social_p1_fixture',
    candidate_content_hash: CONTENT_HASH,
    language_registry: DEFAULT_TTS_LANGUAGE_REGISTRY,
    voice_profiles: [
      {
        voice_profile_id: 'vp_marketing_designed_v1',
        role: 'marketing_host',
        display_name: 'Marketing Host',
        mode: 'designed',
        supported_languages: ['de-DE', 'en-US'],
        style_intent: 'creative, brisk and friendly without imitating a real person',
      },
      {
        voice_profile_id: 'vp_architect_designed_v1',
        role: 'it_architect',
        display_name: 'IT Architect',
        mode: 'designed',
        supported_languages: ['de-DE', 'en-US', 'en-GB'],
        style_intent: 'calm, realistic and precise without imitating a real person',
      },
    ],
    speakers: [
      { speaker_id: 'host', voice_profile_id: 'vp_marketing_designed_v1' },
      { speaker_id: 'architect', voice_profile_id: 'vp_architect_designed_v1' },
    ],
    segments: [
      {
        segment_id: 'seg-1',
        speaker_id: 'host',
        language: 'de-DE',
        text: 'CAPITAL-AI erklärt reproduzierbare Prozesse ohne Anlageberatung.',
      },
      {
        segment_id: 'seg-2',
        speaker_id: 'architect',
        language: 'en-GB',
        text: 'Deterministic inputs and immutable hashes preserve traceability.',
      },
    ],
    output: { format: 'wav', sample_rate_hz: 24_000, channels: 1 },
    deterministic_seed: 42,
  };
}

describe('SOCIAL-P1 provider-neutral TTS voice contract', () => {
  it('builds a deterministic request identity for the same semantic request', () => {
    const first = buildTtsSynthesisRequest(baseRequest());
    const second = buildTtsSynthesisRequest(baseRequest());

    expect(first.request_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(second.request_hash).toBe(first.request_hash);
  });

  it('preserves German/English multi-speaker assignments', () => {
    const request = buildTtsSynthesisRequest(baseRequest());

    expect(request.speakers).toEqual([
      { speaker_id: 'host', voice_profile_id: 'vp_marketing_designed_v1' },
      { speaker_id: 'architect', voice_profile_id: 'vp_architect_designed_v1' },
    ]);
    expect(request.segments.map((segment) => segment.language)).toEqual(['de-DE', 'en-GB']);
  });

  it('allows an explicit language-registry extension without changing the required DE/EN floor', () => {
    const input = baseRequest();
    input.language_registry = [
      ...input.language_registry,
      { code: 'fr-FR', label: 'French (France)', required_for_social_p1: false },
    ];
    input.voice_profiles[0] = {
      ...input.voice_profiles[0],
      supported_languages: ['de-DE', 'en-US', 'fr-FR'],
    };
    input.segments[0] = {
      ...input.segments[0],
      language: 'fr-FR',
      text: 'Ceci est un test de registre linguistique extensible.',
    };

    expect(buildTtsSynthesisRequest(input).segments[0].language).toBe('fr-FR');
  });

  it('fails closed for an unregistered segment language', () => {
    const input = baseRequest();
    input.segments[0] = { ...input.segments[0], language: 'fr-FR' };

    expect(() => buildTtsSynthesisRequest(input)).toThrow(/unregistered language fr-FR/);
  });

  it('fails closed for duplicate speaker identities', () => {
    const input = baseRequest();
    input.speakers.push({
      speaker_id: 'host',
      voice_profile_id: 'vp_architect_designed_v1',
    });

    expect(() => buildTtsSynthesisRequest(input)).toThrow(/duplicate speaker_id: host/);
  });

  it('requires license and consent evidence before a cloned/reference voice can be used', () => {
    const input = baseRequest();
    input.voice_profiles[0] = {
      ...input.voice_profiles[0],
      mode: 'cloned',
      reference: undefined,
    };

    expect(() => buildTtsSynthesisRequest(input)).toThrow(/reference is required for cloned voices/);
  });

  it('accepts a cloned voice only when immutable reference, license and consent evidence are present', () => {
    const input = baseRequest();
    input.voice_profiles[0] = {
      ...input.voice_profiles[0],
      mode: 'cloned',
      reference: {
        reference_id: 'voice-ref-owner-001',
        audio_sha256: 'b'.repeat(64),
        license_reference: 'evidence://voice-license/owner-001',
        consent_reference: 'evidence://voice-consent/owner-001',
        source_kind: 'owner_recording',
      },
    };

    expect(buildTtsSynthesisRequest(input).voice_profiles[0].reference?.audio_sha256).toBe(
      'b'.repeat(64),
    );
  });

  it('rejects credential-shaped fields at the provider-neutral boundary', () => {
    const input = baseRequest() as TtsSynthesisRequestInput & { apiKey?: string };
    input.apiKey = 'must-not-cross-contract';

    expect(() => buildTtsSynthesisRequest(input)).toThrow(/must not carry credentials or secrets/);
  });

  it('validates immutable successful audio evidence against the request hash', () => {
    const request = buildTtsSynthesisRequest(baseRequest());
    const result = validateTtsSynthesisResult(
      {
        request_hash: request.request_hash,
        provider_id: 'provider-under-test',
        model_id: 'model-under-test',
        status: 'SUCCEEDED',
        generated_at: '2026-09-11T00:00:00.000Z',
        license_reference: 'evidence://model-license',
        evidence_reference: 'evidence://tts-run/001',
        audio: {
          asset_reference: 'artifact://social-p1/sample.wav',
          sha256: 'c'.repeat(64),
          format: 'wav',
          sample_rate_hz: 24_000,
          channels: 1,
          duration_ms: 18_000,
          watermark: { type: 'provider_native', detector_reference: 'evidence://watermark/001' },
        },
      },
      request.request_hash,
    );

    expect(result.status).toBe('SUCCEEDED');
    expect(result.audio?.sha256).toBe('c'.repeat(64));
  });

  it('fails closed when a success result has no immutable audio hash', () => {
    const request = buildTtsSynthesisRequest(baseRequest());

    expect(() =>
      validateTtsSynthesisResult(
        {
          request_hash: request.request_hash,
          provider_id: 'provider-under-test',
          model_id: 'model-under-test',
          status: 'SUCCEEDED',
          generated_at: '2026-09-11T00:00:00.000Z',
          license_reference: 'evidence://model-license',
          evidence_reference: 'evidence://tts-run/002',
          audio: {
            asset_reference: 'artifact://social-p1/sample.wav',
            sha256: '',
            format: 'wav',
            sample_rate_hz: 24_000,
            channels: 1,
            duration_ms: 18_000,
            watermark: { type: 'none' },
          },
        },
        request.request_hash,
      ),
    ).toThrow(/audio.sha256/);
  });
});
