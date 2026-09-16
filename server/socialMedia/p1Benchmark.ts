import { createHash } from 'node:crypto';
import {
  DEFAULT_TTS_LANGUAGE_REGISTRY,
  buildTtsSynthesisRequest,
  validateTtsSynthesisResult,
  type TtsSynthesisRequest,
  type TtsSynthesisResult,
  type VoiceProfile,
  type VoiceRole,
} from './voiceContract';

export const SOCIAL_P1_BENCHMARK_CANDIDATES = [
  'qwen3-tts',
  'chatterbox-multilingual-v3',
] as const;

export type SocialP1BenchmarkCandidateId = (typeof SOCIAL_P1_BENCHMARK_CANDIDATES)[number];
export type SocialP1EvidenceVerdict = 'PASS' | 'FAIL';

export interface SocialP1BenchmarkFixture {
  sample_id: string;
  language: string;
  role: VoiceRole;
  text: string;
  required_terms: string[];
  text_sha256: string;
}

export interface SocialP1PersonaIntent {
  voice_profile_id: string;
  role: VoiceRole;
  mode: 'designed';
  languages: string[];
  style_intent: string;
}

export interface SocialP1CandidateSource {
  candidate_id: string;
  source: string;
  license_surface: string;
  artifact_license_recheck_required: boolean;
}

export interface SocialP1BenchmarkManifest {
  schema_version: string;
  manifest_id: string;
  project: string;
  roadmap_item: string;
  samples: SocialP1BenchmarkFixture[];
  persona_intents: SocialP1PersonaIntent[];
  candidate_sources: SocialP1CandidateSource[];
  generated_audio_status: string;
  runtime_boundary: string;
}

export interface SocialP1BenchmarkCase {
  benchmark_case_id: string;
  candidate_id: SocialP1BenchmarkCandidateId;
  candidate_source: string;
  candidate_license_surface: string;
  sample_id: string;
  required_terms: string[];
  request: TtsSynthesisRequest;
}

export interface SocialP1BenchmarkPlan {
  manifest_id: string;
  cases: SocialP1BenchmarkCase[];
}

export interface SocialP1RuntimeIdentityEvidence {
  runtime_id: string;
  runtime_version: string;
  hardware_identity: string;
  dependency_identity: string;
  dependency_sha256: string;
  model_artifact_sha256: string;
}

export interface SocialP1TimingEvidence {
  first_audio_latency_ms: number;
  total_latency_ms: number;
  realtime_factor: number;
}

export interface SocialP1RequiredTermEvidence {
  term: string;
  verdict: SocialP1EvidenceVerdict;
  evidence_reference: string;
}

export interface SocialP1TranscriptEvidence {
  transcript: string;
  transcript_sha256: string;
  engine_identity: string;
  required_terms: SocialP1RequiredTermEvidence[];
}

export interface SocialP1ListeningReview {
  verdict: SocialP1EvidenceVerdict;
  reviewed_at: string;
  reviewer_reference: string;
  evidence_reference: string;
  notes: string;
}

export interface SocialP1BenchmarkRunEvidence {
  benchmark_case_id: string;
  candidate_id: SocialP1BenchmarkCandidateId;
  sample_id: string;
  request_hash: string;
  result: TtsSynthesisResult;
  runtime: SocialP1RuntimeIdentityEvidence;
  timing: SocialP1TimingEvidence;
  transcript: SocialP1TranscriptEvidence;
  listening_review: SocialP1ListeningReview;
}

export interface SocialP1BenchmarkValidationSummary {
  expected_cases: 8;
  validated_cases: 8;
  candidates: 2;
  fixtures: 4;
  status: 'PASS';
}

const SHA256_RE = /^[a-f0-9]{64}$/;
const EXPECTED_FIXTURE_COUNT = 4;
const EXPECTED_CASE_COUNT = 8;
const DEFAULT_OUTPUT = { format: 'wav' as const, sample_rate_hz: 24_000, channels: 1 as const };
const DEFAULT_SEED = 42;

function requiredText(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function assertSha256(value: unknown, field: string): string {
  const normalized = requiredText(value, field).toLowerCase();
  if (!SHA256_RE.test(normalized)) throw new Error(`${field} must be a lowercase SHA-256 hex digest`);
  return normalized;
}

function assertPositiveFinite(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a finite number > 0`);
  }
  return value;
}

function assertIsoTimestamp(value: unknown, field: string): string {
  const normalized = requiredText(value, field);
  if (Number.isNaN(Date.parse(normalized))) throw new Error(`${field} must be an ISO-8601 timestamp`);
  return normalized;
}

function normalizeRequiredTerms(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${field} must not be empty`);
  const terms = value.map((term, index) => requiredText(term, `${field}[${index}]`));
  if (new Set(terms).size !== terms.length) throw new Error(`${field} contains duplicate terms`);
  return terms;
}

function buildVoiceProfile(persona: SocialP1PersonaIntent, fixture: SocialP1BenchmarkFixture): VoiceProfile {
  if (persona.mode !== 'designed') {
    throw new Error(`persona ${persona.voice_profile_id} must use designed mode for SOCIAL-P1 benchmark fixtures`);
  }
  if (!persona.languages.includes(fixture.language)) {
    throw new Error(`persona ${persona.voice_profile_id} does not support ${fixture.language}`);
  }

  return {
    voice_profile_id: requiredText(persona.voice_profile_id, 'persona.voice_profile_id'),
    role: persona.role,
    display_name: persona.role === 'marketing_host' ? 'Marketing Host' : 'IT Architect',
    mode: 'designed',
    supported_languages: [...persona.languages],
    style_intent: requiredText(persona.style_intent, 'persona.style_intent'),
  };
}

export function buildSocialP1BenchmarkPlan(manifest: SocialP1BenchmarkManifest): SocialP1BenchmarkPlan {
  if (manifest.project !== 'CAPITAL-AI-SOCIAL') throw new Error('manifest.project must be CAPITAL-AI-SOCIAL');
  if (manifest.roadmap_item !== 'SOCIAL-P1') throw new Error('manifest.roadmap_item must be SOCIAL-P1');
  if (manifest.generated_audio_status !== 'NOT_RUN') {
    throw new Error('benchmark plan must be built from the pre-runtime NOT_RUN manifest');
  }

  if (!Array.isArray(manifest.samples) || manifest.samples.length !== EXPECTED_FIXTURE_COUNT) {
    throw new Error(`SOCIAL-P1 requires exactly ${EXPECTED_FIXTURE_COUNT} canonical fixtures`);
  }

  const sampleIds = new Set<string>();
  for (const fixture of manifest.samples) {
    const sampleId = requiredText(fixture.sample_id, 'sample.sample_id');
    if (sampleIds.has(sampleId)) throw new Error(`duplicate SOCIAL-P1 sample_id: ${sampleId}`);
    sampleIds.add(sampleId);

    const text = requiredText(fixture.text, `sample ${sampleId}.text`);
    const expectedTextHash = assertSha256(fixture.text_sha256, `sample ${sampleId}.text_sha256`);
    if (sha256(text) !== expectedTextHash) {
      throw new Error(`sample ${sampleId}.text_sha256 does not match fixture text`);
    }
    normalizeRequiredTerms(fixture.required_terms, `sample ${sampleId}.required_terms`);
  }

  const candidates = new Map(
    manifest.candidate_sources.map((candidate) => [candidate.candidate_id, candidate] as const),
  );
  for (const candidateId of SOCIAL_P1_BENCHMARK_CANDIDATES) {
    const candidate = candidates.get(candidateId);
    if (!candidate) throw new Error(`missing required SOCIAL-P1 candidate source ${candidateId}`);
    requiredText(candidate.source, `candidate ${candidateId}.source`);
    requiredText(candidate.license_surface, `candidate ${candidateId}.license_surface`);
    if (candidate.artifact_license_recheck_required !== true) {
      throw new Error(`candidate ${candidateId} must require exact artifact-license recheck before runtime`);
    }
  }

  const personas = new Map(manifest.persona_intents.map((persona) => [persona.role, persona] as const));
  const cases: SocialP1BenchmarkCase[] = [];

  for (const candidateId of SOCIAL_P1_BENCHMARK_CANDIDATES) {
    const candidate = candidates.get(candidateId)!;
    for (const fixture of manifest.samples) {
      const persona = personas.get(fixture.role);
      if (!persona) throw new Error(`missing persona intent for fixture role ${fixture.role}`);
      const voiceProfile = buildVoiceProfile(persona, fixture);
      const speakerId = `${fixture.role}-speaker`;
      const request = buildTtsSynthesisRequest({
        content_package_id: `social-p1-benchmark:${fixture.sample_id}`,
        candidate_content_hash: fixture.text_sha256,
        language_registry: DEFAULT_TTS_LANGUAGE_REGISTRY,
        voice_profiles: [voiceProfile],
        speakers: [{ speaker_id: speakerId, voice_profile_id: voiceProfile.voice_profile_id }],
        segments: [
          {
            segment_id: fixture.sample_id,
            speaker_id: speakerId,
            language: fixture.language,
            text: fixture.text,
          },
        ],
        output: DEFAULT_OUTPUT,
        deterministic_seed: DEFAULT_SEED,
      });

      cases.push({
        benchmark_case_id: `${candidateId}::${fixture.sample_id}`,
        candidate_id: candidateId,
        candidate_source: candidate.source,
        candidate_license_surface: candidate.license_surface,
        sample_id: fixture.sample_id,
        required_terms: [...fixture.required_terms],
        request,
      });
    }
  }

  if (cases.length !== EXPECTED_CASE_COUNT) {
    throw new Error(`SOCIAL-P1 benchmark plan must materialize exactly ${EXPECTED_CASE_COUNT} cases`);
  }

  return { manifest_id: requiredText(manifest.manifest_id, 'manifest.manifest_id'), cases };
}

function validateRequiredTermEvidence(
  expectedTerms: string[],
  evidence: SocialP1RequiredTermEvidence[],
  field: string,
): void {
  if (!Array.isArray(evidence) || evidence.length !== expectedTerms.length) {
    throw new Error(`${field} must contain exactly one entry for every required term`);
  }

  const evidenceByTerm = new Map<string, SocialP1RequiredTermEvidence>();
  for (const entry of evidence) {
    const term = requiredText(entry.term, `${field}.term`);
    if (evidenceByTerm.has(term)) throw new Error(`${field} contains duplicate term ${term}`);
    if (entry.verdict !== 'PASS') throw new Error(`${field} term ${term} is not PASS`);
    requiredText(entry.evidence_reference, `${field}.${term}.evidence_reference`);
    evidenceByTerm.set(term, entry);
  }

  for (const expectedTerm of expectedTerms) {
    if (!evidenceByTerm.has(expectedTerm)) throw new Error(`${field} is missing required term ${expectedTerm}`);
  }
}

export function validateSocialP1BenchmarkEvidence(
  plan: SocialP1BenchmarkPlan,
  evidence: SocialP1BenchmarkRunEvidence[],
): SocialP1BenchmarkValidationSummary {
  if (plan.cases.length !== EXPECTED_CASE_COUNT) {
    throw new Error(`SOCIAL-P1 validation requires exactly ${EXPECTED_CASE_COUNT} planned cases`);
  }
  if (!Array.isArray(evidence) || evidence.length !== EXPECTED_CASE_COUNT) {
    throw new Error(`SOCIAL-P1 requires 8/8 runtime evidence records before PASS`);
  }

  const evidenceByCase = new Map<string, SocialP1BenchmarkRunEvidence>();
  for (const run of evidence) {
    const caseId = requiredText(run.benchmark_case_id, 'evidence.benchmark_case_id');
    if (evidenceByCase.has(caseId)) throw new Error(`duplicate SOCIAL-P1 evidence for ${caseId}`);
    evidenceByCase.set(caseId, run);
  }

  for (const benchmarkCase of plan.cases) {
    const run = evidenceByCase.get(benchmarkCase.benchmark_case_id);
    if (!run) throw new Error(`missing SOCIAL-P1 evidence for ${benchmarkCase.benchmark_case_id}`);
    if (run.candidate_id !== benchmarkCase.candidate_id) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.candidate_id does not match the plan`);
    }
    if (run.sample_id !== benchmarkCase.sample_id) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.sample_id does not match the plan`);
    }
    if (run.request_hash !== benchmarkCase.request.request_hash) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.request_hash does not match the plan`);
    }

    const result = validateTtsSynthesisResult(run.result, benchmarkCase.request.request_hash);
    if (result.status !== 'SUCCEEDED' || !result.audio) {
      throw new Error(`${benchmarkCase.benchmark_case_id} has no successful immutable audio result`);
    }

    requiredText(run.runtime.runtime_id, `${benchmarkCase.benchmark_case_id}.runtime.runtime_id`);
    requiredText(run.runtime.runtime_version, `${benchmarkCase.benchmark_case_id}.runtime.runtime_version`);
    requiredText(run.runtime.hardware_identity, `${benchmarkCase.benchmark_case_id}.runtime.hardware_identity`);
    requiredText(run.runtime.dependency_identity, `${benchmarkCase.benchmark_case_id}.runtime.dependency_identity`);
    assertSha256(
      run.runtime.dependency_sha256,
      `${benchmarkCase.benchmark_case_id}.runtime.dependency_sha256`,
    );
    assertSha256(
      run.runtime.model_artifact_sha256,
      `${benchmarkCase.benchmark_case_id}.runtime.model_artifact_sha256`,
    );

    const firstAudioLatency = assertPositiveFinite(
      run.timing.first_audio_latency_ms,
      `${benchmarkCase.benchmark_case_id}.timing.first_audio_latency_ms`,
    );
    const totalLatency = assertPositiveFinite(
      run.timing.total_latency_ms,
      `${benchmarkCase.benchmark_case_id}.timing.total_latency_ms`,
    );
    if (firstAudioLatency > totalLatency) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.timing.first_audio_latency_ms exceeds total_latency_ms`);
    }
    const realtimeFactor = assertPositiveFinite(
      run.timing.realtime_factor,
      `${benchmarkCase.benchmark_case_id}.timing.realtime_factor`,
    );
    const derivedRealtimeFactor = totalLatency / result.audio.duration_ms;
    if (Math.abs(realtimeFactor - derivedRealtimeFactor) > 0.001) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.timing.realtime_factor does not match total latency / audio duration`);
    }

    const transcript = requiredText(
      run.transcript.transcript,
      `${benchmarkCase.benchmark_case_id}.transcript.transcript`,
    );
    const transcriptHash = assertSha256(
      run.transcript.transcript_sha256,
      `${benchmarkCase.benchmark_case_id}.transcript.transcript_sha256`,
    );
    if (sha256(transcript) !== transcriptHash) {
      throw new Error(`${benchmarkCase.benchmark_case_id}.transcript.transcript_sha256 does not match transcript`);
    }
    requiredText(
      run.transcript.engine_identity,
      `${benchmarkCase.benchmark_case_id}.transcript.engine_identity`,
    );
    validateRequiredTermEvidence(
      benchmarkCase.required_terms,
      run.transcript.required_terms,
      `${benchmarkCase.benchmark_case_id}.transcript.required_terms`,
    );

    if (run.listening_review.verdict !== 'PASS') {
      throw new Error(`${benchmarkCase.benchmark_case_id}.listening_review is not PASS`);
    }
    assertIsoTimestamp(
      run.listening_review.reviewed_at,
      `${benchmarkCase.benchmark_case_id}.listening_review.reviewed_at`,
    );
    requiredText(
      run.listening_review.reviewer_reference,
      `${benchmarkCase.benchmark_case_id}.listening_review.reviewer_reference`,
    );
    requiredText(
      run.listening_review.evidence_reference,
      `${benchmarkCase.benchmark_case_id}.listening_review.evidence_reference`,
    );
    requiredText(run.listening_review.notes, `${benchmarkCase.benchmark_case_id}.listening_review.notes`);
  }

  return {
    expected_cases: 8,
    validated_cases: 8,
    candidates: 2,
    fixtures: 4,
    status: 'PASS',
  };
}
