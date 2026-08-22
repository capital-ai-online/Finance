export const AI_CONTENT_TRANSPARENCY_SCHEMA = 'ai-content-transparency/1.0.0' as const;
export const AI_CONTENT_TRANSPARENCY_CONTRACT = 'CONTRACT-AI-CONTENT-TRANSPARENCY-0001' as const;
export const AI_CONTENT_TRANSPARENCY_PARENT_AUTHORITY = 'AUTH-ESS-AI-AGENT-CAPABILITY-PLANE' as const;

export type AiContentOrigin = 'human-authored' | 'ai-assisted' | 'ai-generated';
export type RetrievalStatus = 'evidence-retrieved' | 'no-evidence';
export type VerificationStatus = 'not-verified' | 'verified';
export type HumanReviewStatus = 'not-reviewed' | 'reviewed';

export interface AiContentTransparencyEnvelopeInput {
  origin?: AiContentOrigin;
  provider: string;
  model: string;
  promptId: string;
  promptVersion: string;
  requestId?: string;
  retrievalId?: string;
  evidenceIds?: readonly string[];
  humanReview?: HumanReviewStatus;
  grounding?: VerificationStatus;
  citationCompleteness?: VerificationStatus;
}

export interface AiContentTransparencyEnvelope {
  schemaVersion: typeof AI_CONTENT_TRANSPARENCY_SCHEMA;
  contract: typeof AI_CONTENT_TRANSPARENCY_CONTRACT;
  parentAuthority: typeof AI_CONTENT_TRANSPARENCY_PARENT_AUTHORITY;
  origin: AiContentOrigin;
  provider: string;
  model: string;
  prompt: { id: string; version: string };
  requestId?: string;
  retrieval: {
    status: RetrievalStatus;
    retrievalId?: string;
    evidenceIds: readonly string[];
  };
  grounding: {
    status: VerificationStatus;
    note: string;
  };
  citations: {
    completeness: VerificationStatus;
    note: string;
  };
  humanReview: HumanReviewStatus;
  legalComplianceAssertion: 'not-asserted';
  financialDecisionAuthority: false;
  userDisclosure: string;
}

export function createAiContentTransparencyEnvelope(input: AiContentTransparencyEnvelopeInput): AiContentTransparencyEnvelope {
  const evidenceIds = [...new Set(input.evidenceIds ?? [])].sort();
  const retrievalStatus: RetrievalStatus = evidenceIds.length > 0 ? 'evidence-retrieved' : 'no-evidence';
  const grounding = input.grounding ?? 'not-verified';
  const citations = input.citationCompleteness ?? 'not-verified';

  return Object.freeze({
    schemaVersion: AI_CONTENT_TRANSPARENCY_SCHEMA,
    contract: AI_CONTENT_TRANSPARENCY_CONTRACT,
    parentAuthority: AI_CONTENT_TRANSPARENCY_PARENT_AUTHORITY,
    origin: input.origin ?? 'ai-generated',
    provider: input.provider,
    model: input.model,
    prompt: Object.freeze({ id: input.promptId, version: input.promptVersion }),
    requestId: input.requestId,
    retrieval: Object.freeze({
      status: retrievalStatus,
      retrievalId: input.retrievalId,
      evidenceIds: Object.freeze(evidenceIds),
    }),
    grounding: Object.freeze({
      status: grounding,
      note: grounding === 'verified'
        ? 'Claim-level grounding was independently verified.'
        : 'Retrieved context does not by itself prove claim-level grounding.',
    }),
    citations: Object.freeze({
      completeness: citations,
      note: citations === 'verified'
        ? 'Citation completeness was independently verified.'
        : 'Citation completeness has not been independently verified.',
    }),
    humanReview: input.humanReview ?? 'not-reviewed',
    legalComplianceAssertion: 'not-asserted',
    financialDecisionAuthority: false,
    userDisclosure: 'AI-generierte Antwort. Retrieval-Evidence kann als Kontext verwendet worden sein; Grounding und Zitationsvollständigkeit werden separat ausgewiesen.',
  });
}
