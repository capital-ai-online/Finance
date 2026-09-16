import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SOCIAL_P1_BENCHMARK_CANDIDATES,
  buildSocialP1BenchmarkPlan,
  validateSocialP1BenchmarkEvidence,
  type SocialP1BenchmarkCase,
  type SocialP1BenchmarkManifest,
  type SocialP1BenchmarkRunEvidence,
} from '../../server/socialMedia/p1Benchmark';

const MANIFEST_PATH = 'docs/social-media/CAPITAL-AI-SOCIAL/reports/SOCIAL_P1_TTS_SAMPLE_MANIFEST_2026-09-11.json';

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function loadManifest(): SocialP1BenchmarkManifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as SocialP1BenchmarkManifest;
}

function validRunEvidence(benchmarkCase: SocialP1BenchmarkCase, index: number): SocialP1BenchmarkRunEvidence {
  const transcript = benchmarkCase.request.segments[0].text;
  const audioDurationMs = 18_000 + index * 100;
  const totalLatencyMs = 900 + index * 10;

  return {
    benchmark_case_id: benchmarkCase.benchmark_case_id,
    candidate_id: benchmarkCase.candidate_id,
    sample_id: benchmarkCase.sample_id,
    request_hash: benchmarkCase.request.request_hash,
    result: {
      request_hash: benchmarkCase.request.request_hash,
      provider_id: benchmarkCase.candidate_id === 'qwen3-tts' ? 'qwen-runtime' : 'resemble-runtime',
      model_id:
        benchmarkCase.candidate_id === 'qwen3-tts'
          ? 'Qwen3-TTS-12Hz-1.7B-VoiceDesign'
          : 'Chatterbox-Multilingual-V3',
      status: 'SUCCEEDED',
      generated_at: `2026-09-16T11:${String(index).padStart(2, '0')}:00.000Z`,
      license_reference: `evidence://social-p1/${benchmarkCase.candidate_id}/license`,
      evidence_reference: `evidence://social-p1/${benchmarkCase.benchmark_case_id}/run`,
      audio: {
        asset_reference: `artifact://social-p1/${benchmarkCase.benchmark_case_id}.wav`,
        sha256: sha256(`${benchmarkCase.benchmark_case_id}:audio`),
        format: 'wav',
        sample_rate_hz: 24_000,
        channels: 1,
        duration_ms: audioDurationMs,
        watermark: {
          type: benchmarkCase.candidate_id === 'chatterbox-multilingual-v3' ? 'provider_native' : 'none',
          detector_reference:
            benchmarkCase.candidate_id === 'chatterbox-multilingual-v3'
              ? `evidence://social-p1/${benchmarkCase.benchmark_case_id}/watermark`
              : undefined,
        },
      },
    },
    runtime: {
      runtime_id: `runtime-${benchmarkCase.candidate_id}`,
      runtime_version: '2026-09-16.1',
      hardware_identity: 'gpu-fixture-identity',
      dependency_identity: `lock-${benchmarkCase.candidate_id}`,
      dependency_sha256: sha256(`${benchmarkCase.candidate_id}:dependencies`),
      model_artifact_sha256: sha256(`${benchmarkCase.candidate_id}:model-artifact`),
    },
    timing: {
      first_audio_latency_ms: 250 + index,
      total_latency_ms: totalLatencyMs,
      realtime_factor: totalLatencyMs / audioDurationMs,
    },
    transcript: {
      transcript,
      transcript_sha256: sha256(transcript),
      engine_identity: 'transcript-engine-fixture-v1',
      required_terms: benchmarkCase.required_terms.map((term) => ({
        term,
        verdict: 'PASS',
        evidence_reference: `evidence://social-p1/${benchmarkCase.benchmark_case_id}/term/${encodeURIComponent(term)}`,
      })),
    },
    listening_review: {
      verdict: 'PASS',
      reviewed_at: `2026-09-16T12:${String(index).padStart(2, '0')}:00.000Z`,
      reviewer_reference: 'reviewer://social-p1/listening-review',
      evidence_reference: `evidence://social-p1/${benchmarkCase.benchmark_case_id}/listening`,
      notes: 'Fixture evidence record for validator coverage.',
    },
  };
}

describe('SOCIAL-P1 4x2 acoustic benchmark evidence gate', () => {
  it('materializes exactly four canonical fixtures across exactly two selected candidates', () => {
    const plan = buildSocialP1BenchmarkPlan(loadManifest());

    expect(plan.cases).toHaveLength(8);
    expect(new Set(plan.cases.map((entry) => entry.sample_id)).size).toBe(4);
    expect(new Set(plan.cases.map((entry) => entry.candidate_id))).toEqual(
      new Set(SOCIAL_P1_BENCHMARK_CANDIDATES),
    );

    for (const sampleId of new Set(plan.cases.map((entry) => entry.sample_id))) {
      const sampleCases = plan.cases.filter((entry) => entry.sample_id === sampleId);
      expect(sampleCases).toHaveLength(2);
      expect(sampleCases[0].request.request_hash).toBe(sampleCases[1].request.request_hash);
    }
  });

  it('fails closed if canonical fixture text no longer matches its immutable input hash', () => {
    const manifest = loadManifest();
    manifest.samples[0] = { ...manifest.samples[0], text: `${manifest.samples[0].text} drift` };

    expect(() => buildSocialP1BenchmarkPlan(manifest)).toThrow(/text_sha256 does not match fixture text/);
  });

  it('accepts only complete 8/8 real-runtime-shaped evidence with hashes, timing, transcript terms and listening review', () => {
    const plan = buildSocialP1BenchmarkPlan(loadManifest());
    const evidence = plan.cases.map(validRunEvidence);

    expect(validateSocialP1BenchmarkEvidence(plan, evidence)).toEqual({
      expected_cases: 8,
      validated_cases: 8,
      candidates: 2,
      fixtures: 4,
      status: 'PASS',
    });
  });

  it('never promotes partial runtime evidence to PASS', () => {
    const plan = buildSocialP1BenchmarkPlan(loadManifest());
    const evidence = plan.cases.map(validRunEvidence).slice(0, 7);

    expect(() => validateSocialP1BenchmarkEvidence(plan, evidence)).toThrow(/requires 8\/8 runtime evidence/);
  });

  it('fails closed when required-term evidence is not PASS', () => {
    const plan = buildSocialP1BenchmarkPlan(loadManifest());
    const evidence = plan.cases.map(validRunEvidence);
    evidence[0].transcript.required_terms[0] = {
      ...evidence[0].transcript.required_terms[0],
      verdict: 'FAIL',
    };

    expect(() => validateSocialP1BenchmarkEvidence(plan, evidence)).toThrow(/required_terms term .* is not PASS/);
  });

  it('fails closed when reported real-time factor is inconsistent with latency and audio duration', () => {
    const plan = buildSocialP1BenchmarkPlan(loadManifest());
    const evidence = plan.cases.map(validRunEvidence);
    evidence[0].timing.realtime_factor = 99;

    expect(() => validateSocialP1BenchmarkEvidence(plan, evidence)).toThrow(/realtime_factor does not match/);
  });

  it('fails closed when listening review is missing a PASS verdict', () => {
    const plan = buildSocialP1BenchmarkPlan(loadManifest());
    const evidence = plan.cases.map(validRunEvidence);
    evidence[0].listening_review.verdict = 'FAIL';

    expect(() => validateSocialP1BenchmarkEvidence(plan, evidence)).toThrow(/listening_review is not PASS/);
  });
});
