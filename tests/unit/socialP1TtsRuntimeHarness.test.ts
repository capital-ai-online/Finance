import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildReviewTemplate,
  buildFinalEvidence,
  type SocialP1ReviewBundle,
  type SocialP1RuntimeBundle,
} from '../../scripts/operations/socialP1TtsEvidence';
import {
  buildSocialP1BenchmarkPlan,
  type SocialP1BenchmarkManifest,
} from '../../server/socialMedia/p1Benchmark';

const MANIFEST_PATH = 'docs/social-media/CAPITAL-AI-SOCIAL/reports/SOCIAL_P1_TTS_SAMPLE_MANIFEST_2026-09-11.json';
const manifestBytes = readFileSync(MANIFEST_PATH);
const manifest = JSON.parse(manifestBytes.toString('utf8')) as SocialP1BenchmarkManifest;
const plan = buildSocialP1BenchmarkPlan(manifest);

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function completeRuntime(): SocialP1RuntimeBundle {
  return {
    schema_version: '1.0.0',
    manifest_id: plan.manifest_id,
    source_manifest_sha256: sha256(manifestBytes),
    protected_runtime: true,
    benchmark_eligible: true,
    expected_complete_run_count: 8,
    actual_run_count: 8,
    complete_matrix: true,
    runtime_records: plan.cases.map((benchmarkCase, index) => ({
      benchmark_case_id: benchmarkCase.benchmark_case_id,
      candidate_id: benchmarkCase.candidate_id,
      sample_id: benchmarkCase.sample_id,
      benchmark_eligible: true,
      provider_id: benchmarkCase.candidate_id === 'qwen3-tts' ? 'qwen-local-runtime' : 'resemble-local-runtime',
      model_id:
        benchmarkCase.candidate_id === 'qwen3-tts'
          ? 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign'
          : 'ResembleAI/chatterbox:t3_mtl23ls_v3.safetensors',
      generated_at: `2026-09-17T00:${String(index).padStart(2, '0')}:00.000Z`,
      license_reference: `artifact://${benchmarkCase.candidate_id}/${'a'.repeat(64)}`,
      candidate_source: benchmarkCase.candidate_source,
      candidate_license_surface: benchmarkCase.candidate_license_surface,
      evidence_reference: `evidence://social-p1/runtime/${benchmarkCase.benchmark_case_id}`,
      audio: {
        asset_reference: `artifact://social-p1/audio/${benchmarkCase.benchmark_case_id}.wav`,
        sha256: 'b'.repeat(64),
        format: 'wav' as const,
        sample_rate_hz: 24_000,
        channels: 1 as const,
        duration_ms: 1_000,
        watermark:
          benchmarkCase.candidate_id === 'chatterbox-multilingual-v3'
            ? { type: 'provider_native' as const, detector_reference: 'https://github.com/resemble-ai/perth' }
            : { type: 'none' as const },
      },
      runtime: {
        runtime_id: 'capital-ai-social-p1-local-model-harness',
        runtime_version: '1.0.0',
        hardware_identity: 'cuda:0;name=test-gpu',
        dependency_identity: '{"python":"3.12.0","torch":"2.x"}',
        dependency_sha256: 'c'.repeat(64),
        model_artifact_sha256: 'd'.repeat(64),
      },
      timing: {
        first_audio_latency_ms: 500,
        total_latency_ms: 500,
        realtime_factor: 0.5,
      },
      adapter_semantics:
        benchmarkCase.candidate_id === 'qwen3-tts'
          ? { persona_binding: 'native_voice_design_instruction', style_intent_enforced: true }
          : {
              persona_binding: 'provider_builtin_conditioning_without_reference_audio',
              style_intent_enforced: false,
              style_gap: 'requires human listening assessment',
            },
    })),
    truth_boundary: 'PARTIAL_RUNTIME_EVIDENCE_ONLY',
  };
}

function completeReviews(): SocialP1ReviewBundle {
  return {
    schema_version: '1.0.0',
    manifest_id: plan.manifest_id,
    reviews: plan.cases.map((benchmarkCase, index) => ({
      benchmark_case_id: benchmarkCase.benchmark_case_id,
      transcript: benchmarkCase.request.segments[0].text,
      engine_identity: 'test-transcript-engine@1',
      required_terms: benchmarkCase.required_terms.map((term) => ({
        term,
        verdict: 'PASS' as const,
        evidence_reference: `evidence://social-p1/term/${benchmarkCase.benchmark_case_id}/${encodeURIComponent(term)}`,
      })),
      listening_review: {
        verdict: 'PASS' as const,
        reviewed_at: `2026-09-17T01:${String(index).padStart(2, '0')}:00.000Z`,
        reviewer_reference: 'reviewer://owner-listening-session',
        evidence_reference: `evidence://social-p1/listening/${benchmarkCase.benchmark_case_id}`,
        notes: 'Fixture pronunciation, stability and intended role reviewed for test evidence.',
      },
    })),
  };
}

describe('SOCIAL-P1 protected runtime harness evidence boundary', () => {
  it('finalizes only the complete 8/8 GPU evidence matrix through the Social-owned validator', () => {
    const result = buildFinalEvidence(manifest, manifestBytes, completeRuntime(), completeReviews());

    expect(result.validation).toEqual({
      expected_cases: 8,
      validated_cases: 8,
      candidates: 2,
      fixtures: 4,
      status: 'PASS',
    });
    expect(result.evidence).toHaveLength(8);
    expect(result.runtime_adapter_semantics).toHaveLength(8);
  });

  it('emits a fail-closed review template rather than fabricating transcript or listening PASS evidence', () => {
    const template = buildReviewTemplate(manifest, completeRuntime());

    expect(template.reviews).toHaveLength(8);
    for (const review of template.reviews) {
      expect(review.transcript).toBe('');
      expect(review.engine_identity).toBe('');
      expect(review.listening_review.verdict).toBe('FAIL');
      expect(review.required_terms.every((term) => term.verdict === 'FAIL')).toBe(true);
    }
  });

  it('rejects non-GPU smoke evidence from the acceptance path', () => {
    const runtime = completeRuntime();
    runtime.benchmark_eligible = false;
    runtime.runtime_records = runtime.runtime_records.map((record) => ({ ...record, benchmark_eligible: false }));

    expect(() => buildFinalEvidence(manifest, manifestBytes, runtime, completeReviews())).toThrow(
      'non-GPU smoke evidence is not eligible for SOCIAL-P1 acceptance',
    );
  });

  it('rejects runtime evidence bound to different canonical manifest bytes', () => {
    const runtime = completeRuntime();
    runtime.source_manifest_sha256 = 'e'.repeat(64);

    expect(() => buildFinalEvidence(manifest, manifestBytes, runtime, completeReviews())).toThrow(
      'runtime.source_manifest_sha256 does not match the canonical manifest bytes',
    );
  });
});
