import { createHash } from 'node:crypto';

export type TtsLanguageCode = string;
export type VoiceRole = 'marketing_host' | 'it_architect' | 'cohost' | 'guest' | 'narrator';
export type VoiceProfileMode = 'preset' | 'designed' | 'cloned' | 'reference';
export type TtsAudioFormat = 'wav' | 'mp3' | 'flac';
export type TtsSynthesisStatus = 'SUCCEEDED' | 'FAILED';

export interface TtsLanguageRegistration {
  code: TtsLanguageCode;
  label: string;
  required_for_social_p1: boolean;
}

export interface VoiceReferenceEvidence {
  reference_id: string;
  audio_sha256: string;
  license_reference: string;
  consent_reference: string;
  source_kind: 'owner_recording' | 'licensed_asset' | 'generated_design';
}

export interface VoiceProfile {
  voice_profile_id: string;
  role: VoiceRole;
  display_name: string;
  mode: VoiceProfileMode;
  supported_languages: TtsLanguageCode[];
  style_intent: string;
  reference?: VoiceReferenceEvidence;
}

export interface TtsSpeakerAssignment {
  speaker_id: string;
  voice_profile_id: string;
}

export interface TtsSegment {
  segment_id: string;
  speaker_id: string;
  language: TtsLanguageCode;
  text: string;
}

export interface TtsOutputSpec {
  format: TtsAudioFormat;
  sample_rate_hz: number;
  channels: 1 | 2;
}

export interface TtsSynthesisRequestInput {
  content_package_id: string;
  candidate_content_hash: string;
  language_registry: TtsLanguageRegistration[];
  voice_profiles: VoiceProfile[];
  speakers: TtsSpeakerAssignment[];
  segments: TtsSegment[];
  output: TtsOutputSpec;
  deterministic_seed?: number;
}

export interface TtsSynthesisRequest extends TtsSynthesisRequestInput {
  request_hash: string;
}

export interface TtsWatermarkEvidence {
  type: 'provider_native' | 'external' | 'none';
  detector_reference?: string;
}

export interface TtsAudioEvidence {
  asset_reference: string;
  sha256: string;
  format: TtsAudioFormat;
  sample_rate_hz: number;
  channels: 1 | 2;
  duration_ms: number;
  watermark: TtsWatermarkEvidence;
}

export interface TtsSynthesisFailure {
  code: string;
  message: string;
}

export interface TtsSynthesisResult {
  request_hash: string;
  provider_id: string;
  model_id: string;
  status: TtsSynthesisStatus;
  generated_at: string;
  license_reference: string;
  evidence_reference: string;
  audio?: TtsAudioEvidence;
  failure?: TtsSynthesisFailure;
}

const SHA256_RE = /^[a-f0-9]{64}$/;
const LANGUAGE_RE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
const SENSITIVE_KEY_RE = /(?:api[_-]?key|authorization|access[_-]?token|refresh[_-]?token|oauth|password|secret)/i;
const VOICE_ROLES = new Set<VoiceRole>(['marketing_host', 'it_architect', 'cohost', 'guest', 'narrator']);
const VOICE_MODES = new Set<VoiceProfileMode>(['preset', 'designed', 'cloned', 'reference']);
const REFERENCE_SOURCE_KINDS = new Set<VoiceReferenceEvidence['source_kind']>([
  'owner_recording',
  'licensed_asset',
  'generated_design',
]);
const AUDIO_FORMATS = new Set<TtsAudioFormat>(['wav', 'mp3', 'flac']);

export const SOCIAL_P1_REQUIRED_LANGUAGES = ['de-DE', 'en-US', 'en-GB'] as const;

export const DEFAULT_TTS_LANGUAGE_REGISTRY: TtsLanguageRegistration[] = [
  { code: 'de-DE', label: 'German (Germany)', required_for_social_p1: true },
  { code: 'en-US', label: 'English (United States)', required_for_social_p1: true },
  { code: 'en-GB', label: 'English (United Kingdom)', required_for_social_p1: true },
];

function requiredText(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function assertSha256(value: unknown, field: string): string {
  const normalized = requiredText(value, field).toLowerCase();
  if (!SHA256_RE.test(normalized)) throw new Error(`${field} must be a lowercase SHA-256 hex digest`);
  return normalized;
}

function assertNoSensitiveKeys(value: unknown, path = 'request'): void {
  if (!value || typeof value !== 'object') return;

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      throw new Error(`${path}.${key} is forbidden: TTS contracts must not carry credentials or secrets`);
    }
    assertNoSensitiveKeys(entry, `${path}.${key}`);
  }
}

function normalizeLanguageRegistry(value: TtsLanguageRegistration[]): TtsLanguageRegistration[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('language_registry must not be empty');

  const seen = new Set<string>();
  return value.map((entry, index) => {
    const code = requiredText(entry?.code, `language_registry[${index}].code`);
    if (!LANGUAGE_RE.test(code)) {
      throw new Error(`language_registry[${index}].code must use a bounded BCP-47 language tag`);
    }
    if (seen.has(code)) throw new Error(`duplicate language registration: ${code}`);
    seen.add(code);

    return {
      code,
      label: requiredText(entry?.label, `language_registry[${index}].label`),
      required_for_social_p1: entry?.required_for_social_p1 === true,
    };
  });
}

function normalizeReference(reference: VoiceReferenceEvidence | undefined, field: string): VoiceReferenceEvidence | undefined {
  if (!reference) return undefined;
  if (!REFERENCE_SOURCE_KINDS.has(reference.source_kind)) {
    throw new Error(`${field}.source_kind is invalid`);
  }
  return {
    reference_id: requiredText(reference.reference_id, `${field}.reference_id`),
    audio_sha256: assertSha256(reference.audio_sha256, `${field}.audio_sha256`),
    license_reference: requiredText(reference.license_reference, `${field}.license_reference`),
    consent_reference: requiredText(reference.consent_reference, `${field}.consent_reference`),
    source_kind: reference.source_kind,
  };
}

function normalizeVoiceProfiles(
  value: VoiceProfile[],
  allowedLanguages: Set<string>,
): VoiceProfile[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('voice_profiles must not be empty');

  const seen = new Set<string>();
  return value.map((profile, index) => {
    const field = `voice_profiles[${index}]`;
    const voiceProfileId = requiredText(profile?.voice_profile_id, `${field}.voice_profile_id`);
    if (seen.has(voiceProfileId)) throw new Error(`duplicate voice_profile_id: ${voiceProfileId}`);
    seen.add(voiceProfileId);

    if (!Array.isArray(profile?.supported_languages) || profile.supported_languages.length === 0) {
      throw new Error(`${field}.supported_languages must not be empty`);
    }
    const supportedLanguages = profile.supported_languages.map((language) => {
      const normalized = requiredText(language, `${field}.supported_languages`);
      if (!allowedLanguages.has(normalized)) {
        throw new Error(`${field} references unregistered language ${normalized}`);
      }
      return normalized;
    });

    if (!VOICE_ROLES.has(profile.role)) throw new Error(`${field}.role is invalid`);
    if (!VOICE_MODES.has(profile.mode)) throw new Error(`${field}.mode is invalid`);

    const reference = normalizeReference(profile.reference, `${field}.reference`);
    if ((profile.mode === 'cloned' || profile.mode === 'reference') && !reference) {
      throw new Error(`${field}.reference is required for ${profile.mode} voices`);
    }

    return {
      voice_profile_id: voiceProfileId,
      role: profile.role,
      display_name: requiredText(profile.display_name, `${field}.display_name`),
      mode: profile.mode,
      supported_languages: [...new Set(supportedLanguages)].sort(),
      style_intent: requiredText(profile.style_intent, `${field}.style_intent`),
      reference,
    };
  });
}

function canonicalRequestPayload(input: Omit<TtsSynthesisRequest, 'request_hash'>): string {
  return JSON.stringify({
    content_package_id: input.content_package_id,
    candidate_content_hash: input.candidate_content_hash,
    language_registry: [...input.language_registry].sort((a, b) => a.code.localeCompare(b.code)),
    voice_profiles: [...input.voice_profiles].sort((a, b) =>
      a.voice_profile_id.localeCompare(b.voice_profile_id),
    ),
    speakers: [...input.speakers].sort((a, b) => a.speaker_id.localeCompare(b.speaker_id)),
    segments: input.segments,
    output: input.output,
    deterministic_seed: input.deterministic_seed ?? null,
  });
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function buildTtsSynthesisRequest(input: TtsSynthesisRequestInput): TtsSynthesisRequest {
  assertNoSensitiveKeys(input);

  const contentPackageId = requiredText(input.content_package_id, 'content_package_id');
  const candidateContentHash = assertSha256(input.candidate_content_hash, 'candidate_content_hash');
  const languageRegistry = normalizeLanguageRegistry(input.language_registry);
  const allowedLanguages = new Set(languageRegistry.map((entry) => entry.code));

  for (const requiredLanguage of SOCIAL_P1_REQUIRED_LANGUAGES) {
    if (!allowedLanguages.has(requiredLanguage)) {
      throw new Error(`language_registry must include SOCIAL-P1 required language ${requiredLanguage}`);
    }
  }

  const voiceProfiles = normalizeVoiceProfiles(input.voice_profiles, allowedLanguages);
  const voiceProfilesById = new Map(voiceProfiles.map((profile) => [profile.voice_profile_id, profile]));

  if (!Array.isArray(input.speakers) || input.speakers.length === 0) {
    throw new Error('speakers must not be empty');
  }
  const speakerIds = new Set<string>();
  const speakers = input.speakers.map((speaker, index) => {
    const speakerId = requiredText(speaker?.speaker_id, `speakers[${index}].speaker_id`);
    const voiceProfileId = requiredText(
      speaker?.voice_profile_id,
      `speakers[${index}].voice_profile_id`,
    );
    if (speakerIds.has(speakerId)) throw new Error(`duplicate speaker_id: ${speakerId}`);
    if (!voiceProfilesById.has(voiceProfileId)) {
      throw new Error(`speakers[${index}] references unknown voice_profile_id ${voiceProfileId}`);
    }
    speakerIds.add(speakerId);
    return { speaker_id: speakerId, voice_profile_id: voiceProfileId };
  });

  if (!Array.isArray(input.segments) || input.segments.length === 0) {
    throw new Error('segments must not be empty');
  }
  const segmentIds = new Set<string>();
  const speakerProfileId = new Map(speakers.map((speaker) => [speaker.speaker_id, speaker.voice_profile_id]));
  const segments = input.segments.map((segment, index) => {
    const field = `segments[${index}]`;
    const segmentId = requiredText(segment?.segment_id, `${field}.segment_id`);
    const speakerId = requiredText(segment?.speaker_id, `${field}.speaker_id`);
    const language = requiredText(segment?.language, `${field}.language`);
    const text = requiredText(segment?.text, `${field}.text`);

    if (segmentIds.has(segmentId)) throw new Error(`duplicate segment_id: ${segmentId}`);
    if (!speakerIds.has(speakerId)) throw new Error(`${field} references unknown speaker_id ${speakerId}`);
    if (!allowedLanguages.has(language)) throw new Error(`${field} references unregistered language ${language}`);

    const profileId = speakerProfileId.get(speakerId);
    const profile = profileId ? voiceProfilesById.get(profileId) : undefined;
    if (!profile?.supported_languages.includes(language)) {
      throw new Error(`${field} language ${language} is not supported by speaker profile ${profileId}`);
    }

    segmentIds.add(segmentId);
    return { segment_id: segmentId, speaker_id: speakerId, language, text };
  });

  if (!input.output || !AUDIO_FORMATS.has(input.output.format)) {
    throw new Error('output.format must be wav, mp3 or flac');
  }
  if (!Number.isInteger(input.output.sample_rate_hz) || input.output.sample_rate_hz < 8_000) {
    throw new Error('output.sample_rate_hz must be an integer >= 8000');
  }
  if (input.output.channels !== 1 && input.output.channels !== 2) {
    throw new Error('output.channels must be 1 or 2');
  }
  if (
    input.deterministic_seed !== undefined &&
    (!Number.isSafeInteger(input.deterministic_seed) || input.deterministic_seed < 0)
  ) {
    throw new Error('deterministic_seed must be a non-negative safe integer when supplied');
  }

  const normalized: Omit<TtsSynthesisRequest, 'request_hash'> = {
    content_package_id: contentPackageId,
    candidate_content_hash: candidateContentHash,
    language_registry: languageRegistry,
    voice_profiles: voiceProfiles,
    speakers,
    segments,
    output: {
      format: input.output.format,
      sample_rate_hz: input.output.sample_rate_hz,
      channels: input.output.channels,
    },
    deterministic_seed: input.deterministic_seed,
  };

  return {
    ...normalized,
    request_hash: sha256(canonicalRequestPayload(normalized)),
  };
}

export function validateTtsSynthesisResult(
  result: TtsSynthesisResult,
  expectedRequestHash: string,
): TtsSynthesisResult {
  assertNoSensitiveKeys(result, 'result');

  const requestHash = assertSha256(result.request_hash, 'result.request_hash');
  const expected = assertSha256(expectedRequestHash, 'expectedRequestHash');
  if (requestHash !== expected) throw new Error('result.request_hash does not match the TTS request');

  requiredText(result.provider_id, 'result.provider_id');
  requiredText(result.model_id, 'result.model_id');
  requiredText(result.license_reference, 'result.license_reference');
  requiredText(result.evidence_reference, 'result.evidence_reference');

  if (Number.isNaN(Date.parse(result.generated_at))) {
    throw new Error('result.generated_at must be an ISO-8601 timestamp');
  }

  if (result.status === 'SUCCEEDED') {
    if (!result.audio) throw new Error('result.audio is required when status=SUCCEEDED');
    requiredText(result.audio.asset_reference, 'result.audio.asset_reference');
    if (!AUDIO_FORMATS.has(result.audio.format)) throw new Error('result.audio.format is invalid');
    assertSha256(result.audio.sha256, 'result.audio.sha256');
    if (!Number.isInteger(result.audio.sample_rate_hz) || result.audio.sample_rate_hz < 8_000) {
      throw new Error('result.audio.sample_rate_hz must be an integer >= 8000');
    }
    if (result.audio.channels !== 1 && result.audio.channels !== 2) {
      throw new Error('result.audio.channels must be 1 or 2');
    }
    if (
      !result.audio.watermark ||
      !['provider_native', 'external', 'none'].includes(result.audio.watermark.type)
    ) {
      throw new Error('result.audio.watermark.type is invalid');
    }
    if (!Number.isFinite(result.audio.duration_ms) || result.audio.duration_ms <= 0) {
      throw new Error('result.audio.duration_ms must be > 0');
    }
    if (result.failure) throw new Error('result.failure must be absent when status=SUCCEEDED');
  } else if (result.status === 'FAILED') {
    if (result.audio) throw new Error('result.audio must be absent when status=FAILED');
    if (!result.failure) throw new Error('result.failure is required when status=FAILED');
    requiredText(result.failure.code, 'result.failure.code');
    requiredText(result.failure.message, 'result.failure.message');
  } else {
    throw new Error('result.status must be SUCCEEDED or FAILED');
  }

  return result;
}
