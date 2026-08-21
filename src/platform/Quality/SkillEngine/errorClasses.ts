import type { ErrorClassDefinition } from './types';

export const errorClasses: ErrorClassDefinition[] = [
  { id: 'EC-01', name: 'COMPONENT_REGISTRATION', defaultSeverity: 'high', description: 'Fehlende, doppelte oder widersprüchliche Komponentenregistrierung.', evidenceSignals: ['manifest.json', 'component.yaml', 'registry entry'] },
  { id: 'EC-02', name: 'AUTHORITY_CONFLICT', defaultSeverity: 'critical', description: 'Mehrere konkurrierende Sources of Truth für denselben normativen Scope.', evidenceSignals: ['AGENTS.md', 'ADR/ESS', 'authority registry'] },
  { id: 'EC-03', name: 'DEPENDENCY_VIOLATION', defaultSeverity: 'high', description: 'Unerlaubte, rückwärts gerichtete oder zyklische Abhängigkeit.', evidenceSignals: ['imports', 'manifest dependencies', 'architecture tests'] },
  { id: 'EC-04', name: 'BOUNDARY_VIOLATION', defaultSeverity: 'high', description: 'Verantwortung oder Mutation liegt außerhalb der definierten Component Boundary.', evidenceSignals: ['runtime call path', 'public interfaces', 'forbidden dependencies'] },
  { id: 'EC-05', name: 'CONTRACT_DRIFT', defaultSeverity: 'critical', description: 'Code, Interface, Schema oder Runtime widerspricht einem aktiven Contract.', evidenceSignals: ['contracts', 'schemas', 'implementation'] },
  { id: 'EC-06', name: 'EVENT_DRIFT', defaultSeverity: 'high', description: 'Eventname, Producer, Consumer, Payload oder Version ist inkonsistent.', evidenceSignals: ['EventMesh catalog', 'producer/consumer declarations', 'event tests'] },
  { id: 'EC-07', name: 'VERSION_DRIFT', defaultSeverity: 'medium', description: 'Version, Lifecycle, Status oder Release-Metadaten sind nicht synchron.', evidenceSignals: ['manifest version', 'package version', 'release metadata'] },
  { id: 'EC-08', name: 'DOCUMENTATION_DRIFT', defaultSeverity: 'medium', description: 'Dokumentation beschreibt nicht den nachweisbaren Istzustand.', evidenceSignals: ['README', 'architecture docs', 'runtime evidence'] },
  { id: 'EC-09', name: 'VOCABULARY_DRIFT', defaultSeverity: 'medium', description: 'Synonyme, Aliase, verbotene Begriffe oder konkurrierende Bezeichnungen verletzen Vocabulary Governance.', evidenceSignals: ['Vocabulary Registry', 'UI wording', 'code identifiers'] },
  { id: 'EC-10', name: 'TRACEABILITY_GAP', defaultSeverity: 'high', description: 'Requirement, Authority, Contract, Code, Test und Evidence sind nicht lückenlos verbunden.', evidenceSignals: ['traceability registry', 'evidence', 'tests'] },
  { id: 'EC-11', name: 'SECURITY_GAP', defaultSeverity: 'critical', description: 'Trust Boundary, Secret, AuthN/AuthZ oder Mutation ist unzureichend abgesichert.', evidenceSignals: ['IAM', 'security controls', 'mutation paths'] },
  { id: 'EC-12', name: 'COMPLIANCE_GAP', defaultSeverity: 'critical', description: 'Policy, Datenschutz, Auditability oder regulatorische Evidenz fehlt oder widerspricht der Runtime.', evidenceSignals: ['compliance controls', 'privacy evidence', 'audit records'] },
  { id: 'EC-13', name: 'TEST_GAP', defaultSeverity: 'high', description: 'Ein verbindlicher Contract oder kritisches Verhalten besitzt keine ausreichende Verifikation.', evidenceSignals: ['unit tests', 'contract tests', 'architecture tests'] },
  { id: 'EC-14', name: 'OBSERVABILITY_GAP', defaultSeverity: 'medium', description: 'Health-, Fehler-, Performance- oder Audit-Signale fehlen oder sind nicht belastbar.', evidenceSignals: ['metrics', 'logs', 'traces', 'SLO evidence'] },
  { id: 'EC-15', name: 'DATA_INTEGRITY', defaultSeverity: 'critical', description: 'Interpolation, Demo-Daten, stille Fallbacks, fehlende Provenance oder inkonsistente Daten gefährden Real-Data-Integrität.', evidenceSignals: ['provider evidence', 'fallback logic', 'provenance'] },
  { id: 'EC-16', name: 'RUNTIME_WIRING', defaultSeverity: 'high', description: 'Komponente existiert, ist aber nicht korrekt in die produktive Wertschöpfungskette eingebunden.', evidenceSignals: ['routes', 'orchestrators', 'runtime entrypoints'] },
  { id: 'EC-17', name: 'DUPLICATE_ARCHITECTURE', defaultSeverity: 'high', description: 'Mehrere aktive Komponenten implementieren dieselbe Verantwortung oder Authority.', evidenceSignals: ['component graph', 'registries', 'duplicate services'] },
  { id: 'EC-18', name: 'ORPHAN', defaultSeverity: 'medium', description: 'Code, Dokument, Contract, Event, API oder Registry Entry besitzt keine aktive Nutzung oder Authority.', evidenceSignals: ['reference graph', 'imports', 'registry usage'] },
  { id: 'EC-19', name: 'SUPERSESSION_DRIFT', defaultSeverity: 'high', description: 'Alte und neue Architektur oder Governance bleiben gleichzeitig aktiv.', evidenceSignals: ['supersedes links', 'archive state', 'active references'] },
  { id: 'EC-20', name: 'PERFORMANCE_COST', defaultSeverity: 'medium', description: 'Unnötige Requests, Compute-, Storage-, CI- oder Provider-Kosten entstehen ohne nachweisbaren Nutzen.', evidenceSignals: ['usage metrics', 'provider calls', 'CI workflows'] },
  { id: 'EC-21', name: 'FAILURE_HANDLING', defaultSeverity: 'high', description: 'Timeouts, Retries, Circuit Breaker, Idempotenz oder Degradation sind unklar oder unsicher.', evidenceSignals: ['error paths', 'retry policy', 'fallback contracts'] },
  { id: 'EC-22', name: 'CONCURRENCY_STATE', defaultSeverity: 'high', description: 'Race Conditions, nichtdeterministische Zustände, Replay- oder State-Synchronisationsprobleme sind möglich.', evidenceSignals: ['state transitions', 'event replay', 'concurrent writes'] },
];

export const errorClassById = new Map(errorClasses.map((entry) => [entry.id, entry]));
