// ADR-0074: hardcoded catalog of pre-approved Systemadmin work packages. This is the *only* place
// that maps an issue-supplied workPackageId to trusted, already-merged execution logic. Adding a
// new work package means adding a new module here plus a new Owner-approved REM — never a runtime
// lookup of arbitrary code, and never anything derived from the triggering Issue body itself.

import { workPackage as generalizationProof } from './generalizationProof.mjs';

const CATALOG = new Map([
  [generalizationProof.workPackageId, generalizationProof],
]);

export function lookupWorkPackage(workPackageId) {
  return CATALOG.get(workPackageId) ?? null;
}

export function knownWorkPackageIds() {
  return [...CATALOG.keys()].sort();
}
