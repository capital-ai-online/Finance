import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSocialP1BenchmarkPlan,
  validateSocialP1BenchmarkEvidence,
  type SocialP1BenchmarkManifest,
  type SocialP1BenchmarkRunEvidence,
  type SocialP1RequiredTermEvidence,
  type SocialP1ListeningReview,
} from '../../server/socialMedia/p1Benchmark';
import type { TtsAudioEvidence } from '../../server/socialMedia/voiceContract';

export interface SocialP1RuntimeRecord {
  benchmark_case_id: string;
  candidate_id: 'qwen3-tts' | 'chatterbox-multilingual-v3';
  sample_id: string;
  benchmark_eligible: boolean;
  provider_id: string;
  model_id: string;
  generated_at: string;
  license_reference: string;
  candidate_source: string;
  candidate_license_surface: string;
  evidence_reference: string;
  audio: TtsAudioEvidence;
  runtime: {
    runtime_id: string;
    runtime_version: string;
    hardware_identity: string;
    dependency_identity: string;
    dependency_sha256: string;
    model_artifact_sha256: string;
  };
  timing: {
    first_audio_latency_ms: number;
    total_latency_ms: number;
    realtime_factor: number;
  };
  adapter_semantics: Record<string, unknown>;
}

export interface SocialP1RuntimeBundle {
  schema_version: string;
  manifest_id: string;
  source_manifest_sha256: string;
  protected_runtime: boolean;
  benchmark_eligible: boolean;
  expected_complete_run_count: number;
  actual_run_count: number;
  complete_matrix: boolean;
  runtime_records: SocialP1RuntimeRecord[];
  truth_boundary: string;
}

export interface SocialP1ReviewRecord {
  benchmark_case_id: string;
  transcript: string;
  engine_identity: string;
  required_terms: SocialP1RequiredTermEvidence[];
  listening_review: SocialP1ListeningReview;
}

export interface SocialP1ReviewBundle {
  schema_version: string;
  manifest_id: string;
  reviews: SocialP1ReviewRecord[];
}

export interface SocialP1FinalEvidenceBundle {
  schema_version: '1.0.0';
  manifest_id: string;
  source_manifest_sha256: string;
  validation: ReturnType<typeof validateSocialP1BenchmarkEvidence>;
  evidence: SocialP1BenchmarkRunEvidence[];
  runtime_adapter_semantics: Array<{
    benchmark_case_id: string;
    adapter_semantics: Record<string, unknown>;
  }>;
}

const SHA256_RE = /^[a-f0-9]{64}$/;
const EXPECTED_CASES = 8;

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function requiredText(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function assertSha256(value: unknown, field: string): string {
  const normalized = requiredText(value, field).toLowerCase();
  if (!SHA256_RE.test(normalized)) throw new Error(`${field} must be a lowercase SHA-256 digest`);
  return normalized;
}

function uniqueByCase<T extends { benchmark_case_id: string }>(records: T[], field: string): Map<string, T> {
  const byCase = new Map<string, T>();
  for (const record of records) {
    const caseId = requiredText(record.benchmark_case_id, `${field}.benchmark_case_id`);
    if (byCase.has(caseId)) throw new Error(`${field} contains duplicate case ${caseId}`);
    byCase.set(caseId, record);
  }
  return byCase;
}

export function buildReviewTemplate(
  manifest: SocialP1BenchmarkManifest,
  runtime: SocialP1RuntimeBundle,
): SocialP1ReviewBundle {
  const plan = buildSocialP1BenchmarkPlan(manifest);
  const runtimeByCase = uniqueByCase(runtime.runtime_records, 'runtime_records');

  return {
    schema_version: '1.0.0',
    manifest_id: plan.manifest_id,
    reviews: plan.cases.map((benchmarkCase) => {
      if (!runtimeByCase.has(benchmarkCase.benchmark_case_id)) {
        throw new Error(`runtime evidence missing ${benchmarkCase.benchmark_case_id}`);
      }
      return {
        benchmark_case_id: benchmarkCase.benchmark_case_id,
        transcript: '',
        engine_identity: '',
        required_terms: benchmarkCase.required_terms.map((term) => ({
          term,
          verdict: 'FAIL' as const,
          evidence_reference: '',
        })),
        listening_review: {
          verdict: 'FAIL' as const,
          reviewed_at: '',
          reviewer_reference: '',
          evidence_reference: '',
          notes: '',
        },
      };
    }),
  };
}

export function buildFinalEvidence(
  manifest: SocialP1BenchmarkManifest,
  manifestBytes: Buffer,
  runtime: SocialP1RuntimeBundle,
  reviews: SocialP1ReviewBundle,
): SocialP1FinalEvidenceBundle {
  const plan = buildSocialP1BenchmarkPlan(manifest);
  if (runtime.manifest_id !== plan.manifest_id) throw new Error('runtime.manifest_id does not match the plan');
  if (reviews.manifest_id !== plan.manifest_id) throw new Error('reviews.manifest_id does not match the plan');
  if (runtime.protected_runtime !== true) throw new Error('runtime must be classified as protected_runtime=true');
  if (runtime.benchmark_eligible !== true) throw new Error('non-GPU smoke evidence is not eligible for SOCIAL-P1 acceptance');
  if (runtime.complete_matrix !== true) throw new Error('runtime evidence must represent the complete 4×2 matrix');
  if (runtime.expected_complete_run_count !== EXPECTED_CASES || runtime.actual_run_count !== EXPECTED_CASES) {
    throw new Error('runtime evidence must contain exactly 8/8 cases');
  }
  if (!Array.isArray(runtime.runtime_records) || runtime.runtime_records.length !== EXPECTED_CASES) {
    throw new Error('runtime.runtime_records must contain exactly 8 entries');
  }
  if (!Array.isArray(reviews.reviews) || reviews.reviews.length !== EXPECTED_CASES) {
    throw new Error('reviews.reviews must contain exactly 8 entries');
  }

  const manifestHash = sha256(manifestBytes);
  if (assertSha256(runtime.source_manifest_sha256, 'runtime.source_manifest_sha256') !== manifestHash) {
    throw new Error('runtime.source_manifest_sha256 does not match the canonical manifest bytes');
  }

  const runtimeByCase = uniqueByCase(runtime.runtime_records, 'runtime_records');
  const reviewByCase = uniqueByCase(reviews.reviews, 'reviews');

  const evidence: SocialP1BenchmarkRunEvidence[] = plan.cases.map((benchmarkCase) => {
    const run = runtimeByCase.get(benchmarkCase.benchmark_case_id);
    const review = reviewByCase.get(benchmarkCase.benchmark_case_id);
    if (!run) throw new Error(`missing runtime record ${benchmarkCase.benchmark_case_id}`);
    if (!review) throw new Error(`missing review record ${benchmarkCase.benchmark_case_id}`);
    if (run.benchmark_eligible !== true) throw new Error(`${benchmarkCase.benchmark_case_id} is not benchmark eligible`);
    if (run.candidate_id !== benchmarkCase.candidate_id) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.candidate_id does not match plan`);
    }
    if (run.sample_id !== benchmarkCase.sample_id) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.sample_id does not match plan`);
    }
    if (run.candidate_source !== benchmarkCase.candidate_source) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.candidate_source does not match plan`);
    }
    if (run.candidate_license_surface !== benchmarkCase.candidate_license_surface) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.candidate_license_surface does not match plan`);
    }

    const transcript = requiredText(review.transcript, `${benchmarkCase.benchmark_case_id}.transcript`);
    const result = {
      request_hash: benchmarkCase.request.request_hash,
      provider_id: requiredText(run.provider_id, `${benchmarkCase.benchmark_case_id}.provider_id`),
      model_id: requiredText(run.model_id, `${benchmarkCase.benchmark_case_id}.model_id`),
      status: 'SUCCEEDED' as const,
      generated_at: requiredText(run.generated_at, `${benchmarkCase.benchmark_case_id}.generated_at`),
      license_reference: requiredText(
        run.license_reference,
        `${benchmarkCase.benchmark_case_id}.license_reference`,
      ),
      evidence_reference: requiredText(
        run.evidence_reference,
        `${benchmarkCase.benchmark_case_id}.evidence_reference`,
      ),
      audio: run.audio,
    };

    return {
      benchmark_case_id: benchmarkCase.benchmark_case_id,
      candidate_id: benchmarkCase.candidate_id,
      sample_id: benchmarkCase.sample_id,
      request_hash: benchmarkCase.request.request_hash,
      result,
      runtime: {
        ...run.runtime,
        dependency_sha256: assertSha256(
          run.runtime.dependency_sha256,
          `${benchmarkCase.benchmark_case_id}.runtime.dependency_sha256`,
        ),
        model_artifact_sha256: assertSha256(
          run.runtime.model_artifact_sha256,
          `${benchmarkCase.benchmark_case_id}.runtime.model_artifact_sha256`,
        ),
      },
      timing: run.timing,
      transcript: {
        transcript,
        transcript_sha256: sha256(transcript),
        engine_identity: requiredText(
          review.engine_identity,
          `${benchmarkCase.benchmark_case_id}.engine_identity`,
        ),
        required_terms: review.required_terms,
      },
      listening_review: review.listening_review,
    };
  });

  const validation = validateSocialP1BenchmarkEvidence(plan, evidence);
  return {
    schema_version: '1.0.0',
    manifest_id: plan.manifest_id,
    source_manifest_sha256: manifestHash,
    validation,
    evidence,
    runtime_adapter_semantics: runtime.runtime_records.map((record) => ({
      benchmark_case_id: record.benchmark_case_id,
      adapter_semantics: record.adapter_semantics,
    })),
  };
}

function parseJsonFile<T>(path: string): { parsed: T; bytes: Buffer } {
  const bytes = readFileSync(path);
  return { parsed: JSON.parse(bytes.toString('utf8')) as T, bytes };
}

function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || !value) throw new Error(`invalid argument near ${key ?? '<end>'}`);
    args.set(key, value);
  }
  return args;
}

function main(argv: string[]): void {
  const args = parseArgs(argv);
  const manifestPath = args.get('--manifest') ?? 'docs/social-media/CAPITAL-AI-SOCIAL/reports/SOCIAL_P1_TTS_SAMPLE_MANIFEST_2026-09-11.json';
  const runtimePath = requiredText(args.get('--runtime'), '--runtime');
  const runtime = parseJsonFile<SocialP1RuntimeBundle>(runtimePath).parsed;
  const { parsed: manifest, bytes: manifestBytes } = parseJsonFile<SocialP1BenchmarkManifest>(manifestPath);

  const templatePath = args.get('--emit-review-template');
  if (templatePath) {
    const template = buildReviewTemplate(manifest, runtime);
    writeFileSync(templatePath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
    console.log(`SOCIAL-P1 review template: ${templatePath}`);
    return;
  }

  const reviewsPath = requiredText(args.get('--reviews'), '--reviews');
  const outputPath = requiredText(args.get('--output'), '--output');
  const reviews = parseJsonFile<SocialP1ReviewBundle>(reviewsPath).parsed;
  const finalEvidence = buildFinalEvidence(manifest, manifestBytes, runtime, reviews);
  writeFileSync(outputPath, `${JSON.stringify(finalEvidence, null, 2)}\n`, 'utf8');
  console.log(`SOCIAL-P1 evidence validation: ${finalEvidence.validation.status} (${finalEvidence.validation.validated_cases}/8)`);
  console.log(`SOCIAL-P1 final evidence: ${outputPath}`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`SOCIAL-P1 evidence finalization blocked: ${message}`);
    process.exitCode = 2;
  }
}
