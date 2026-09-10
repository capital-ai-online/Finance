import type { VocabularyCategory, VocabularyConcept } from '../Domain/VocabularyConcept';

export type PvcStageId =
  | 'PVC-01' | 'PVC-02' | 'PVC-03' | 'PVC-04' | 'PVC-05' | 'PVC-06'
  | 'PVC-07' | 'PVC-08' | 'PVC-09' | 'PVC-10' | 'PVC-11' | 'PVC-12'
  | 'PVC-13' | 'PVC-14' | 'PVC-15' | 'PVC-16' | 'PVC-17' | 'PVC-18';

export interface PvcThesaurusEntry {
  pvc: PvcStageId;
  preferredTermDE: string;
  preferredTermEN: string;
  broaderTermDE: string;
  broaderTermEN: string;
  synonyms: string[];
  relatedTerms: string[];
  relatedVocabularyConceptIds: string[];
}

const authorityRefs = ['ESS-0017', 'ESS-0017-CONTRACTS'];
const pvcTraceability = ['docs/projects/PROJECT_VALUE_CHAIN.md'];

function pvcConcept(
  id: string,
  canonicalCodeTerm: string,
  displayNameDE: string,
  displayNameEN: string,
  definitionDE: string,
  definitionEN: string,
  category: VocabularyCategory,
  pvc: PvcStageId,
): VocabularyConcept {
  return {
    id,
    canonicalCodeTerm,
    displayNameDE,
    displayNameEN,
    definitionDE,
    definitionEN,
    aliases: [pvc],
    forbiddenTerms: [],
    category,
    status: 'approved',
    version: '1.0.0',
    essReferences: authorityRefs,
    adrReferences: [],
    traceabilityReferences: pvcTraceability,
  };
}

/**
 * Canonical terminology for the organizational Project Value Chain (PVC-*).
 * This is a read-only wording projection of docs/projects/PROJECT_VALUE_CHAIN.md;
 * it does not redefine project ownership, runtime stages or financial VC-* authority.
 */
export const pvcProjectConcepts: VocabularyConcept[] = [
  pvcConcept('VOC-PVC-0001', 'PvcAgentClient', 'Agent Client', 'Agent Client', 'PVC-01: Client- und Interaktionsgrenze für agentische Arbeit, Anfrageübergabe und nutzerseitige Steuerung.', 'PVC-01: Client and interaction boundary for agentic work, request handoff and user-facing control.', 'product', 'PVC-01'),
  pvcConcept('VOC-PVC-0002', 'PvcControlledImplementation', 'Kontrollierte Implementierung', 'Controlled Implementation', 'PVC-02: Scope-begrenzte Umsetzung von Änderungen unter Branch-, Validierungs-, Authority- und Gate-Regeln.', 'PVC-02: Bounded implementation of changes under branch, validation, authority and gate rules.', 'ai-development-chat-execution', 'PVC-02'),
  pvcConcept('VOC-PVC-0003', 'PvcDocumentaryEngine', 'Dokumentations-Engine', 'Documentary Engine', 'PVC-03: Stufe für kontrollierte Dokumenterzeugung, Projektion und dokumentarische Nachweisführung.', 'PVC-03: Stage for controlled document generation, projection and documentary evidence handling.', 'documentation', 'PVC-03'),
  pvcConcept('VOC-PVC-0004', 'PvcSupervisor', 'PVC-04 Supervisor', 'PVC-04 Supervisor', 'PVC-04: Überwachende und koordinierende Projektstufe für zulässige Lifecycle- und Zustandsübergänge.', 'PVC-04: Supervisory and coordinating project stage for permitted lifecycle and state transitions.', 'architecture', 'PVC-04'),
  pvcConcept('VOC-PVC-0005', 'PvcPlatformDirector', 'Plattformdirektor', 'Platform Director', 'PVC-05: Governance- und Plattformsteuerungsstufe für projektübergreifende Richtungs-, Authority- und Konsistenzfragen.', 'PVC-05: Governance and platform-direction stage for cross-project direction, authority and consistency concerns.', 'platform', 'PVC-05'),
  pvcConcept('VOC-PVC-0006', 'PvcVersionManagement', 'Versionsmanagement', 'Version Management', 'PVC-06: Stufe zur kontrollierten Verwaltung von Versionen, Identitäten und versionierten Zuständen.', 'PVC-06: Stage for controlled management of versions, identities and versioned states.', 'release', 'PVC-06'),
  pvcConcept('VOC-PVC-0007', 'PvcReleaseManagement', 'Release-Management', 'Release Management', 'PVC-07: Stufe zur kontrollierten Vorbereitung, Freigabe und Nachweisführung von Release-Kandidaten und Releases.', 'PVC-07: Stage for controlled preparation, admission and evidence of release candidates and releases.', 'release', 'PVC-07'),
  pvcConcept('VOC-PVC-0008', 'PvcProductionOperations', 'Produktionsbetrieb', 'Production Operations', 'PVC-08: Stufe für kontrollierten produktiven Betrieb, Betriebsbereitschaft und zustandsverändernde Produktionsaktionen.', 'PVC-08: Stage for controlled production operation, operational readiness and state-changing production actions.', 'platform', 'PVC-08'),
  pvcConcept('VOC-PVC-0009', 'PvcUaiDataIngestion', 'UAI / Datenaufnahme', 'UAI / Data Ingestion', 'PVC-09: Stufe für universelle Asset-Identität und kontrollierte Aufnahme autorisierter Daten.', 'PVC-09: Stage for universal asset identity and controlled ingestion of authorized data.', 'asset', 'PVC-09'),
  pvcConcept('VOC-PVC-0010', 'PvcEvidenceManagement', 'Evidence-Management', 'Evidence Management', 'PVC-10: Stufe zur Erfassung, Bindung, Aufbewahrung und nachvollziehbaren Bereitstellung von Evidence.', 'PVC-10: Stage for capturing, binding, retaining and traceably providing evidence.', 'documentation', 'PVC-10'),
  pvcConcept('VOC-PVC-0011', 'PvcDataQuality', 'Datenqualität', 'Data Quality', 'PVC-11: Stufe zur Prüfung, Bewertung und Absicherung der Qualität eingehender und verarbeiteter Daten.', 'PVC-11: Stage for validating, assessing and assuring the quality of ingested and processed data.', 'analytics', 'PVC-11'),
  pvcConcept('VOC-PVC-0012', 'PvcFeatureEngineering', 'Feature Engineering', 'Feature Engineering', 'PVC-12: Stufe zur kontrollierten Ableitung, Transformation und Klassifikation fachlicher Analysemerkmale.', 'PVC-12: Stage for controlled derivation, transformation and classification of analytical features.', 'analytics', 'PVC-12'),
  pvcConcept('VOC-PVC-0013', 'PvcScoringModels', 'Scoring-Modelle', 'Scoring Models', 'PVC-13: Stufe für registrierte, versionierte und zulässige Modelle zur Erzeugung fachlicher Scores.', 'PVC-13: Stage for registered, versioned and permitted models that produce domain scores.', 'analytics', 'PVC-13'),
  pvcConcept('VOC-PVC-0014', 'PvcScoringOrchestration', 'Scoring-Orchestrierung', 'Scoring Orchestration', 'PVC-14: Stufe zur Auswahl und Koordination des zulässigen Scoring-Ausführungspfads.', 'PVC-14: Stage for selecting and coordinating the permitted scoring execution path.', 'architecture', 'PVC-14'),
  pvcConcept('VOC-PVC-0015', 'PvcDomainAnalysisExecutor', 'Domainanalyse / Executor', 'Domain Analysis / Executor', 'PVC-15: Stufe für domänenspezifische Analyseausführung hinter der kanonischen Orchestrierungsgrenze.', 'PVC-15: Stage for domain-specific analysis execution behind the canonical orchestration boundary.', 'analytics', 'PVC-15'),
  pvcConcept('VOC-PVC-0016', 'PvcCanonicalScoring', 'Kanonisches Scoring', 'Canonical Scoring', 'PVC-16: Stufe zur Erzeugung eines kanonischen, nachvollziehbaren und vergleichsfähigen Scoring-Ergebnisses.', 'PVC-16: Stage for producing a canonical, traceable and comparable scoring result.', 'analytics', 'PVC-16'),
  pvcConcept('VOC-PVC-0017', 'PvcRankingDecisionSupport', 'Ranking / Entscheidungsunterstützung', 'Ranking / Decision Support', 'PVC-17: Stufe zur fail-closed Prüfung der Ranking-Fähigkeit und zur nachgelagerten Entscheidungsunterstützung.', 'PVC-17: Stage for fail-closed ranking eligibility checks and downstream decision support.', 'analytics', 'PVC-17'),
  pvcConcept('VOC-PVC-0018', 'PvcEventMeshTraceability', 'EventMesh / Traceability', 'EventMesh / Traceability', 'PVC-18: Stufe für entkoppelten Ereignistransport und nachvollziehbare Verknüpfung von Zuständen, Evidence und Ergebnissen.', 'PVC-18: Stage for decoupled event transport and traceable linkage of states, evidence and outcomes.', 'architecture', 'PVC-18'),
];

/**
 * Thesaurus projection. Synonyms are descriptive only and are deliberately not
 * registered as Vocabulary aliases unless they are semantically identical.
 */
export const pvcStageThesaurus: PvcThesaurusEntry[] = [
  { pvc: 'PVC-01', preferredTermDE: 'Agent Client', preferredTermEN: 'Agent Client', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Agent-Client'], relatedTerms: ['Request Intake', 'Handoff', 'Delivery Surface'], relatedVocabularyConceptIds: ['VOC-PRODUCT-0101', 'VOC-AIDEV-0015', 'VOC-PRODUCT-0103'] },
  { pvc: 'PVC-02', preferredTermDE: 'Kontrollierte Implementierung', preferredTermEN: 'Controlled Implementation', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Governed Implementation'], relatedTerms: ['Scoped Branch', 'Atomic Change', 'Validation Evidence', 'Fail-Closed'], relatedVocabularyConceptIds: ['VOC-AIDEV-0006', 'VOC-AIDEV-0008', 'VOC-AIDEV-0023', 'VOC-AIDEV-0021'] },
  { pvc: 'PVC-03', preferredTermDE: 'Dokumentations-Engine', preferredTermEN: 'Documentary Engine', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Documentary'], relatedTerms: ['Data Provenance', 'Verified Research Display', 'Traceability'], relatedVocabularyConceptIds: ['VOC-ANALYTICS-0105', 'VOC-PRODUCT-0102', 'VOC-AIDEV-0033'] },
  { pvc: 'PVC-04', preferredTermDE: 'Supervisor', preferredTermEN: 'Supervisor', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Lifecycle Supervisor'], relatedTerms: ['Supervisor', 'Gate', 'Control Plane'], relatedVocabularyConceptIds: ['VOC-AIDEV-0031', 'VOC-AIDEV-0022', 'VOC-AIDEV-0034'] },
  { pvc: 'PVC-05', preferredTermDE: 'Plattformdirektor', preferredTermEN: 'Platform Director', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Platform Governance Director'], relatedTerms: ['Authority', 'Primary Owner', 'Control Plane', 'Vocabulary Governance'], relatedVocabularyConceptIds: ['VOC-AIDEV-0012', 'VOC-AIDEV-0013', 'VOC-AIDEV-0034', 'VOC-PLATFORM-0001'] },
  { pvc: 'PVC-06', preferredTermDE: 'Versionsmanagement', preferredTermEN: 'Version Management', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Version Lifecycle Management'], relatedTerms: ['Exact Snapshot', 'Head SHA', 'Drift'], relatedVocabularyConceptIds: ['VOC-AIDEV-0024', 'VOC-AIDEV-0025', 'VOC-AIDEV-0020'] },
  { pvc: 'PVC-07', preferredTermDE: 'Release-Management', preferredTermEN: 'Release Management', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Release Control'], relatedTerms: ['Release Gate', 'Hosted CI', 'Human Merge'], relatedVocabularyConceptIds: ['VOC-AIDEV-0029', 'VOC-AIDEV-0027', 'VOC-AIDEV-0028'] },
  { pvc: 'PVC-08', preferredTermDE: 'Produktionsbetrieb', preferredTermEN: 'Production Operations', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Production Ops'], relatedTerms: ['Production Mutation', 'Production Base URL', 'Liveness Endpoint', 'Readiness Endpoint'], relatedVocabularyConceptIds: ['VOC-AIDEV-0030', 'VOC-AIDEV-0038', 'VOC-AIDEV-0039', 'VOC-AIDEV-0040'] },
  { pvc: 'PVC-09', preferredTermDE: 'UAI / Datenaufnahme', preferredTermEN: 'UAI / Data Ingestion', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Asset Data Ingestion'], relatedTerms: ['Universal Asset Identity', 'Market-data and Evidence Acquisition', 'Data Provenance'], relatedVocabularyConceptIds: ['VOC-ASSET-0101', 'VOC-ANALYTICS-0104', 'VOC-ANALYTICS-0105'] },
  { pvc: 'PVC-10', preferredTermDE: 'Evidence-Management', preferredTermEN: 'Evidence Management', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Evidence Lifecycle Management'], relatedTerms: ['Validation Evidence', 'Data Provenance', 'Traceability'], relatedVocabularyConceptIds: ['VOC-AIDEV-0023', 'VOC-ANALYTICS-0105', 'VOC-AIDEV-0033'] },
  { pvc: 'PVC-11', preferredTermDE: 'Datenqualität', preferredTermEN: 'Data Quality', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['DQ'], relatedTerms: ['Data Provenance', 'Score Confidence', 'Fail-Closed'], relatedVocabularyConceptIds: ['VOC-ANALYTICS-0105', 'VOC-ANALYTICS-0109', 'VOC-AIDEV-0021'] },
  { pvc: 'PVC-12', preferredTermDE: 'Feature Engineering', preferredTermEN: 'Feature Engineering', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Feature Preparation'], relatedTerms: ['Feature Classification', 'Data Provenance'], relatedVocabularyConceptIds: ['VOC-ANALYTICS-0106', 'VOC-ANALYTICS-0105'] },
  { pvc: 'PVC-13', preferredTermDE: 'Scoring-Modelle', preferredTermEN: 'Scoring Models', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Score Models'], relatedTerms: ['Scoring Model Registry', 'Score Confidence'], relatedVocabularyConceptIds: ['VOC-ANALYTICS-0107', 'VOC-ANALYTICS-0109'] },
  { pvc: 'PVC-14', preferredTermDE: 'Scoring-Orchestrierung', preferredTermEN: 'Scoring Orchestration', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Scoring Coordination'], relatedTerms: ['Scoring Dispatcher', 'Runtime Guard', 'Domain Executor Adapter'], relatedVocabularyConceptIds: ['VOC-ARCHITECTURE-0102', 'VOC-ARCHITECTURE-0101', 'VOC-ARCHITECTURE-0103'] },
  { pvc: 'PVC-15', preferredTermDE: 'Domainanalyse / Executor', preferredTermEN: 'Domain Analysis / Executor', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Domain Execution'], relatedTerms: ['Domain Executor Adapter', 'Scoring Dispatcher'], relatedVocabularyConceptIds: ['VOC-ARCHITECTURE-0103', 'VOC-ARCHITECTURE-0102'] },
  { pvc: 'PVC-16', preferredTermDE: 'Kanonisches Scoring', preferredTermEN: 'Canonical Scoring', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Canonical Score Production'], relatedTerms: ['Canonical Score Result', 'Score Confidence', 'Data Provenance'], relatedVocabularyConceptIds: ['VOC-ANALYTICS-0108', 'VOC-ANALYTICS-0109', 'VOC-ANALYTICS-0105'] },
  { pvc: 'PVC-17', preferredTermDE: 'Ranking / Entscheidungsunterstützung', preferredTermEN: 'Ranking / Decision Support', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Ranking Decision Support'], relatedTerms: ['Ranking Comparability', 'Ranking Eligibility', 'Score Confidence'], relatedVocabularyConceptIds: ['VOC-ANALYTICS-0110', 'VOC-ANALYTICS-0111', 'VOC-ANALYTICS-0109'] },
  { pvc: 'PVC-18', preferredTermDE: 'EventMesh / Traceability', preferredTermEN: 'EventMesh / Traceability', broaderTermDE: 'Projekt-Wertschöpfungskettenstufe', broaderTermEN: 'Project Value Chain stage', synonyms: ['Event and Traceability Plane'], relatedTerms: ['EventMesh', 'Traceability', 'Traceability Supervisor'], relatedVocabularyConceptIds: ['VOC-AIDEV-0032', 'VOC-AIDEV-0033', 'VOC-PLATFORM-0101'] },
];
