// ADR-0003.5 / ADR-0008 / ADR-0046 — zentrale Rollen-Definition.
// Grobe Rollen definieren Zonen-Zugriff; feingranulare produktive Aktionen werden zusätzlich
// über Capability-Grants + Approval + Step-up (ADR-0051) autorisiert.

export type Role =
  | 'owner'
  | 'admin'
  | 'supervisor'
  | 'diagnostic_operator'
  | 'operations_operator'
  | 'security_auditor'
  | 'user';

export const ALL_ROLES: Role[] = [
  'owner',
  'admin',
  'supervisor',
  'diagnostic_operator',
  'operations_operator',
  'security_auditor',
  'user',
];

// Vollständiger Systemadmin-Bereich. Keine neuen Operator-Rollen erhalten dadurch automatisch
// privilegierte Mutation-Rechte.
export const ADMIN_ZONE_ROLES: Role[] = ['owner', 'admin'];

// Master-Supervisor / Orchestrator-Bereich.
export const SUPERVISOR_ZONE_ROLES: Role[] = ['owner', 'admin', 'supervisor'];

// Read-only Diagnosezonen. Security Auditor darf technische Security-Evidence lesen, aber keine
// Betriebs-/IAM-Mutationen ausführen.
export const DIAGNOSTIC_ZONE_ROLES: Role[] = [
  'owner',
  'admin',
  'supervisor',
  'diagnostic_operator',
  'operations_operator',
  'security_auditor',
];

// Begrenzte Betriebsaktionen benötigen zusätzlich eine konkrete Capability und ggf. Approval.
export const OPERATIONS_ZONE_ROLES: Role[] = ['owner', 'admin', 'operations_operator'];

// Rollen, die ausschließlich der Owner-Ebene vorbehalten sind (Break-Glass, Rollenverwaltung).
// Break-Glass ist absichtlich KEINE persistente Rolle: es bleibt ein kurzlebiger Step-up-Zustand.
export const OWNER_ONLY_ROLES: Role[] = ['owner'];
