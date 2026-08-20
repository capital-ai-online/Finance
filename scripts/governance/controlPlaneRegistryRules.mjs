const NON_AUTHORIZING_LIFECYCLES = new Set(['suspended', 'historical', 'superseded', 'rejected', 'archived']);
const RESERVATION_STATES = new Set(['active', 'released', 'stale']);
const FINANCIAL_RUNTIME_SCOPES = new Set([
  'financial-runtime',
  'market-data',
  'scoring',
  'ranking',
  'financial-eligibility',
  'runtime-evidence',
]);
const REQUIRED_FRONTEND_SCOPES = new Set([
  'frontend-source-tree',
  'frontend-dependencies',
  'presentation-architecture',
]);

function duplicates(values) {
  const seen = new Set();
  const duplicate = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate].sort();
}

function lifecycleOf(authority) {
  return String(authority?.lifecycle ?? '').toLowerCase();
}

function hasFinancialRuntimeScope(document) {
  return (document?.normativeScope ?? []).some((scope) => FINANCIAL_RUNTIME_SCOPES.has(scope));
}

export function validateGovernanceRegistryRelations({ authorityRegistry, adrRegistry, documentRegistry }) {
  const findings = [];
  const deny = (code, message) => findings.push({ code, message });

  const authorities = authorityRegistry?.entries ?? [];
  const authorityById = new Map(authorities.map((entry) => [entry.authorityId, entry]));
  const authorityIds = new Set(authorityById.keys());
  const adrs = adrRegistry?.migratedRecords ?? [];
  const documents = documentRegistry?.entries ?? [];
  const documentByPath = new Map(documents.map((entry) => [entry.path, entry]));

  for (const id of duplicates(documents.map((entry) => entry.documentId).filter(Boolean))) {
    deny('DUPLICATE_DOCUMENT_ID', id);
  }

  const activeAdrLifecycles = new Set(['proposed', 'accepted', 'accepted-for-implementation', 'resolved']);
  const activeAdrs = adrs.filter((entry) => activeAdrLifecycles.has(String(entry.lifecycle ?? '').toLowerCase()));
  const activeAdrDisplayIds = new Set(activeAdrs.map((entry) => entry.displayId));

  const reservations = adrRegistry?.parallelNamespaceReservations ?? [];
  const activeReservations = reservations.filter((entry) => entry.state === 'active' || !entry.state);

  for (const id of duplicates(activeReservations.map((entry) => entry.displayId).filter(Boolean))) {
    deny('DUPLICATE_PARALLEL_ADR_RESERVATION', id);
  }

  for (const reservation of reservations) {
    const displayId = String(reservation.displayId ?? '');
    const state = String(reservation.state ?? '');
    const required = ['displayId', 'branch', 'source', 'path', 'observedHead', 'state', 'reservedAt'];
    const missing = required.filter((field) => !String(reservation[field] ?? '').trim());
    if (missing.length > 0) {
      deny('PARALLEL_ADR_RESERVATION_METADATA_MISSING', `${displayId || '<missing displayId>'}: ${missing.join(', ')}`);
    }
    if (displayId && !/^ADR-\d{4}$/.test(displayId)) {
      deny('PARALLEL_ADR_RESERVATION_ID_INVALID', displayId);
    }
    if (state && !RESERVATION_STATES.has(state)) {
      deny('PARALLEL_ADR_RESERVATION_STATE_INVALID', `${displayId || '<missing displayId>'}: ${state}`);
    }
    if (reservation.observedHead && !/^[0-9a-f]{40}$/.test(String(reservation.observedHead))) {
      deny('PARALLEL_ADR_RESERVATION_HEAD_INVALID', `${displayId}: ${reservation.observedHead}`);
    }
    if (reservation.reservedAt && Number.isNaN(Date.parse(String(reservation.reservedAt)))) {
      deny('PARALLEL_ADR_RESERVATION_DATE_INVALID', `${displayId}: ${reservation.reservedAt}`);
    }
    if (state === 'stale' || reservation.stale === true) {
      deny('STALE_ADR_RESERVATION', `${displayId || '<missing displayId>'}: ${reservation.staleReason ?? 'reservation marked stale'}`);
    }
  }

  for (const reservation of activeReservations) {
    if (activeAdrDisplayIds.has(reservation.displayId)) {
      deny('PARALLEL_ADR_NAMESPACE_COLLISION', `${reservation.displayId} is both allocated to an active ADR and actively reserved.`);
    }
  }

  for (const document of documents) {
    if (!document.documentRole) continue;

    for (const authorityRef of document.authorityRefs ?? []) {
      if (!authorityIds.has(authorityRef)) {
        deny('DOCUMENT_AUTHORITY_REF_UNKNOWN', `${document.documentId}: ${authorityRef}`);
      }
    }

    for (const parentRef of document.projectionOf ?? []) {
      const parent = authorityById.get(parentRef);
      if (!parent) {
        deny('PROJECTION_AUTHORITY_UNKNOWN', `${document.documentId}: ${parentRef}`);
        continue;
      }
      const documentLifecycle = String(document.lifecycle ?? '').toLowerCase();
      if (!NON_AUTHORIZING_LIFECYCLES.has(documentLifecycle) && NON_AUTHORIZING_LIFECYCLES.has(lifecycleOf(parent))) {
        deny('PROJECTION_PARENT_NON_AUTHORIZING', `${document.documentId}: ${parentRef} is ${parent.lifecycle}`);
      }
    }

    if (document.documentRole === 'inventory' && document.normative !== false) {
      deny('INVENTORY_NORMATIVE_AUTHORITY_CLAIM', document.documentId);
    }
    if (document.documentRole === 'roadmap' && document.normative !== false) {
      deny('ROADMAP_NORMATIVE_AUTHORITY_CLAIM', document.documentId);
    }
    if (document.documentRole === 'roadmap' && hasFinancialRuntimeScope(document)) {
      deny('ROADMAP_FINANCIAL_RUNTIME_AUTHORITY_CLAIM', document.documentId);
    }
  }

  const exclusiveScopeOwners = new Map();
  for (const document of documents.filter((entry) => entry.documentRole === 'authority' && entry.normative === true && entry.exclusiveNormativeScope !== false)) {
    for (const scope of document.normativeScope ?? []) {
      const previous = exclusiveScopeOwners.get(scope);
      if (previous && previous !== document.documentId) {
        deny('DUPLICATE_EXCLUSIVE_NORMATIVE_SCOPE', `${scope}: ${previous}, ${document.documentId}`);
      } else {
        exclusiveScopeOwners.set(scope, document.documentId);
      }
    }
  }

  const frontendArch = documentByPath.get('docs/frontend/FRONTEND_ARCH.md');
  const inventory = documentByPath.get('docs/frontend/COMPONENT_INVENTORY.md');
  const roadmap = documentByPath.get('docs/frontend/FRONTEND_ROADMAP.md');

  for (const [label, document] of [
    ['FRONTEND_ARCH', frontendArch],
    ['COMPONENT_INVENTORY', inventory],
    ['FRONTEND_ROADMAP', roadmap],
  ]) {
    if (!document) deny('FRONTEND_DOCUMENT_REGISTRATION_MISSING', label);
  }

  if (frontendArch) {
    if (frontendArch.documentRole !== 'authority' || frontendArch.normative !== true) {
      deny('FRONTEND_ARCH_ROLE_INVALID', 'FRONTEND_ARCH must be a normative authority document.');
    }
    for (const scope of REQUIRED_FRONTEND_SCOPES) {
      if (!(frontendArch.normativeScope ?? []).includes(scope)) {
        deny('FRONTEND_ARCH_REQUIRED_SCOPE_MISSING', scope);
      }
    }
    if (hasFinancialRuntimeScope(frontendArch)) {
      deny('FRONTEND_ARCH_FINANCIAL_RUNTIME_AUTHORITY_CLAIM', 'FRONTEND_ARCH must not claim financial runtime authority.');
    }
  }

  if (inventory) {
    if (inventory.documentRole !== 'inventory' || inventory.normative !== false) {
      deny('COMPONENT_INVENTORY_ROLE_INVALID', 'COMPONENT_INVENTORY must be non-normative inventory.');
    }
    if (!(inventory.projectionOf ?? []).includes('AUTH-FRONTEND-PRESENTATION-ARCHITECTURE')) {
      deny('COMPONENT_INVENTORY_PROJECTION_MISSING', 'COMPONENT_INVENTORY must project AUTH-FRONTEND-PRESENTATION-ARCHITECTURE.');
    }
  }

  if (roadmap) {
    if (roadmap.documentRole !== 'roadmap' || roadmap.normative !== false) {
      deny('FRONTEND_ROADMAP_ROLE_INVALID', 'FRONTEND_ROADMAP must be a non-normative roadmap.');
    }
    if (!(roadmap.authorityRefs ?? []).includes('AUTH-FRONTEND-PRESENTATION-ARCHITECTURE')) {
      deny('FRONTEND_ROADMAP_AUTHORITY_REF_MISSING', 'FRONTEND_ROADMAP must reference AUTH-FRONTEND-PRESENTATION-ARCHITECTURE.');
    }
  }

  const adr0005 = adrs.find((entry) => entry.displayId === 'ADR-0005');
  const adr0005Authority = authorityById.get('AUTH-ADR-FRONTEND-MODULE-INTEGRATION-0005');
  const adr0005Document = documentByPath.get('docs/adr/ADR-0005-frontend-module-integration.md');
  if (!adr0005 || String(adr0005.lifecycle).toLowerCase() !== 'historical') {
    deny('ADR_0005_LIFECYCLE_INVALID', 'ADR-0005 must be historical.');
  }
  if (!adr0005Authority || lifecycleOf(adr0005Authority) !== 'historical') {
    deny('ADR_0005_AUTHORITY_LIFECYCLE_INVALID', 'ADR-0005 authority must be historical.');
  }
  if (!adr0005Document || adr0005Document.lifecycle !== 'historical' || adr0005Document.normative !== false) {
    deny('ADR_0005_DOCUMENT_ROLE_INVALID', 'ADR-0005 document registry entry must be historical and non-normative.');
  }

  return findings;
}
