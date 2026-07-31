// Ausgangsbestand des Event-Katalogs gemaess ESS-0013, Abschnitt "Standard Event
// Catalog". Datengetrieben statt einer Klasse je Event, da die weit ueberwiegende
// Mehrheit der uber 80 in ESS-0001-CONTRACTS Chapter 8-19 definierten Events
// strukturell identisch ist (Name + Kategorie + Producer/Consumer + Referenzen).
//
// Dies ist die EINZIGE Stelle, an der der Ausgangsbestand hartkodiert ist. Nach
// Discovery (siehe Discovery/ManifestDiscovery.ts) werden Producer/Consumer
// zusaetzlich aus den manifest.json-Dateien ergaenzt, nicht ersetzt.

export interface StandardEventDefinition {
  name: string;
  category: string;
  essReferences: string[];
  adrReferences: string[];
}

export const STANDARD_EVENT_CATALOG: StandardEventDefinition[] = [
  // --- 15 Standardereignisse aus der auslösenden Anforderung, 3 auf kanonische
  //     Namen abgebildet (siehe ESS-0013, Standard Event Catalog) -------------
  { name: 'RepositoryScannedEvent', category: 'Repository Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'DocumentationGeneratedEvent', category: 'Documentation Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0010'], adrReferences: ['ADR-0018'] },
  { name: 'DocumentationValidatedEvent', category: 'Documentation Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0012-CONTRACTS'], adrReferences: ['ADR-0014', 'ADR-0018'] },
  { name: 'TraceabilityBuildCompletedEvent', category: 'Traceability Events', essReferences: ['ESS-0011'], adrReferences: ['ADR-0015', 'ADR-0018'] },
  { name: 'KnowledgeUpdatedEvent', category: 'Knowledge Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0009'], adrReferences: ['ADR-0018'] },
  { name: 'ComplianceValidatedEvent', category: 'Compliance Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'ArchitectureValidatedEvent', category: 'Compliance Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'VersionCalculatedEvent', category: 'Versioning Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0004'], adrReferences: ['ADR-0016', 'ADR-0018'] },
  { name: 'ReleasePreparedEvent', category: 'Release Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0007'], adrReferences: ['ADR-0016', 'ADR-0018'] },
  { name: 'ReleasePublishedEvent', category: 'Release Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0007'], adrReferences: ['ADR-0016', 'ADR-0018'] },
  { name: 'SupervisorAlertEvent', category: 'Supervisor Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0002'], adrReferences: ['ADR-0018'] },
  { name: 'PlatformDecisionEvent', category: 'Platform Director Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0003'], adrReferences: ['ADR-0018'] },
  { name: 'SecurityViolationDetectedEvent', category: 'Security Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'GovernanceViolationDetectedEvent', category: 'Documentation Events', essReferences: ['ESS-0012-CONTRACTS'], adrReferences: ['ADR-0014', 'ADR-0018'] },
  { name: 'TwinSynchronizedEvent', category: 'System Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },

  // --- weitere bereits kanonische Events, benoetigt fuer die Producer-Zuordnung ---
  { name: 'LayerViolationEvent', category: 'Compliance Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'ContractViolationEvent', category: 'Compliance Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'ArchitectureScannedEvent', category: 'Compliance Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'DependencyViolationEvent', category: 'Compliance Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'VersionChangedEvent', category: 'Versioning Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'ComponentRegisteredEvent', category: 'System Events', essReferences: ['ESS-0001-CONTRACTS', 'ESS-0011'], adrReferences: ['ADR-0018'] },
  { name: 'ExceptionRegisteredEvent', category: 'System Events', essReferences: ['ESS-0001-CONTRACTS'], adrReferences: ['ADR-0018'] },

  // --- 7 im Rahmen von ADR-0018 Folgeentscheidung 4 neu registrierte Events -------
  { name: 'VersionApprovedEvent', category: 'Versioning Events', essReferences: ['ESS-0004'], adrReferences: ['ADR-0018'] },
  { name: 'RoadmapUpdatedEvent', category: 'Platform Director Events', essReferences: ['ESS-0003'], adrReferences: ['ADR-0018'] },
  { name: 'ArchitectureDecisionApprovedEvent', category: 'Platform Director Events', essReferences: ['ESS-0003'], adrReferences: ['ADR-0018'] },
  { name: 'CriticalArchitectureViolationEvent', category: 'Supervisor Events', essReferences: ['ESS-0002'], adrReferences: ['ADR-0018'] },
  { name: 'DependencyMappedEvent', category: 'Traceability Events', essReferences: ['ESS-0011'], adrReferences: ['ADR-0018'] },
  { name: 'KnowledgeRelationCreatedEvent', category: 'Knowledge Events', essReferences: ['ESS-0009'], adrReferences: ['ADR-0018'] },
  { name: 'KnowledgeValidationCompletedEvent', category: 'Knowledge Events', essReferences: ['ESS-0009'], adrReferences: ['ADR-0018'] },

  // --- EventMesh-eigene operative Meta-Events (manifest.json, events.produces) ---
  { name: 'EventRegisteredEvent', category: 'System Events', essReferences: ['ESS-0013'], adrReferences: ['ADR-0018'] },
  { name: 'EventRoutingFailedEvent', category: 'System Events', essReferences: ['ESS-0013-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'EventValidationFailedEvent', category: 'System Events', essReferences: ['ESS-0013-CONTRACTS'], adrReferences: ['ADR-0018'] },
  { name: 'ConsumerSubscribedEvent', category: 'System Events', essReferences: ['ESS-0013'], adrReferences: ['ADR-0018'] },
  { name: 'ConsumerUnsubscribedEvent', category: 'System Events', essReferences: ['ESS-0013'], adrReferences: ['ADR-0018'] },
  { name: 'EventSchemaIncompatibleEvent', category: 'System Events', essReferences: ['ESS-0013-CONTRACTS'], adrReferences: ['ADR-0018'] },

  // --- Bruecken-Event fuer den bestehenden Audit-Log-Mechanismus (ADR-0018,
  //     Folgeentscheidung 3) - additiv, ersetzt server/systemEvents.ts nicht. ------
  { name: 'SystemAuditEvent', category: 'System Events', essReferences: ['ESS-0013'], adrReferences: ['ADR-0018'] },
];
