export type VerificationPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type ExecutionProfile = 'fast' | 'standard' | 'deep';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ErrorClassDefinition {
  id: string;
  name: string;
  defaultSeverity: FindingSeverity;
  description: string;
  evidenceSignals: string[];
}

export interface QuickWinDefinition {
  id: string;
  title: string;
  outcome: string;
  effort: 'low' | 'medium';
}

export interface DevelopmentRecommendation {
  id: string;
  title: string;
  benefit: string;
  horizon: 'next' | 'later';
}

export interface VerificationSkill {
  id: string;
  label: string;
  component: string;
  componentPaths: string[];
  scope: string;
  authorities: string[];
  focus: string[];
  errorClassIds: string[];
  vocabularyTerms: string[];
  quickWins: QuickWinDefinition[];
  developments: DevelopmentRecommendation[];
  priority: VerificationPriority;
  executionProfile: ExecutionProfile;
}

export interface SkillRuntimeContext {
  mainRef?: string;
  headRef?: string;
  commitSha?: string;
  task?: string;
}

export interface CompiledSkillPrompt {
  skillId: string;
  cacheKey: string;
  systemPrompt: string;
  contextPrompt: string;
  outputSchema: Record<string, unknown>;
}

export type VocabularyInventoryStatus =
  | 'CANONICAL'
  | 'ALIAS'
  | 'FORBIDDEN'
  | 'NEW_CANDIDATE';

export interface VocabularyInventoryEntry {
  term: string;
  normalizedTerm: string;
  status: VocabularyInventoryStatus;
  conceptId: string | null;
  canonicalTerm: string | null;
  displayNameDE: string | null;
  displayNameEN: string | null;
  usedBySkillIds: string[];
}

export interface CatalogValidationFinding {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  skillId?: string;
}
