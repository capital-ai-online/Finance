// ADR-0003.5 / ADR-0008 — zentrale Rollen-Definition.
// Frontend (src/types.ts sollte denselben Rollensatz importieren/spiegeln) und Backend
// nutzen ausschließlich diese Enum, damit keine abweichenden Rollen-Strings entstehen.

export type Role = 'owner' | 'admin' | 'supervisor' | 'user';

export const ALL_ROLES: Role[] = ['owner', 'admin', 'supervisor', 'user'];

// Rollen, die Zugriff auf den CAPITAL-AI Systemadmin-Bereich haben.
export const ADMIN_ZONE_ROLES: Role[] = ['owner', 'admin'];

// Rollen, die Zugriff auf den Master-Supervisor / Orchestrator-Bereich haben.
export const SUPERVISOR_ZONE_ROLES: Role[] = ['owner', 'admin', 'supervisor'];

// Rollen, die ausschließlich der Owner-Ebene vorbehalten sind (Break-Glass, Rollenverwaltung).
export const OWNER_ONLY_ROLES: Role[] = ['owner'];
