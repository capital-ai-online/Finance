// ESS-0018 Phase 2 / ADR-0051: Compliance's policy-verdict surface for governed agent actions.
// Additive only - does NOT modify store.ts/scanners.ts/router.ts (those remain the whole-app
// security/compliance auditor described in router.ts's own disclaimer: "darf keine
// Berechtigungen vergeben, keine IAM-Regeln verändern, keine Sicherheitsmechanismen umgehen").
// This module does not grant anything either - it only evaluates whether a proposed capability
// use is on the allowlist CAPITAL-AI has actually approved (ESS-0018 §4.2). A capability/grant
// approval elsewhere is necessary but not sufficient: this gate is the second, independent check
// executeApprovedSupervisedAction() requires before any Apply.

import { CAPABILITIES, type Capability, isKnownCapability } from '../Security/capabilities';

export interface PolicyVerdict {
  verdict: 'ALLOW' | 'DENY';
  reason: string;
}

/**
 * Write capabilities explicitly permitted to reach Apply. Everything else - including any
 * capability not in CAPABILITIES at all, and explicitly `supabase.sql.execute`-shaped names -
 * is DENY. There is no default-allow path.
 */
const WRITE_CAPABILITY_ALLOWLIST: ReadonlySet<Capability> = new Set([
  CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE,
  CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_RESEND_CONFIRMATION,
]);

const READ_CAPABILITY_ALLOWLIST: ReadonlySet<Capability> = new Set([
  CAPABILITIES.ADMIN_DIAGNOSTICS_READ,
  CAPABILITIES.ADMIN_SUBSCRIPTION_STATUS_READ,
]);

export function evaluateReadPolicy(capability: string): PolicyVerdict {
  if (!isKnownCapability(capability) || !READ_CAPABILITY_ALLOWLIST.has(capability)) {
    return { verdict: 'DENY', reason: `Capability "${capability}" ist keine freigegebene Lese-Capability.` };
  }
  return { verdict: 'ALLOW', reason: 'Capability ist in der Lese-Allowlist.' };
}

export function evaluateWritePolicy(capability: string): PolicyVerdict {
  if (!isKnownCapability(capability) || !WRITE_CAPABILITY_ALLOWLIST.has(capability)) {
    return { verdict: 'DENY', reason: `Capability "${capability}" ist keine freigegebene Schreib-Capability.` };
  }
  return { verdict: 'ALLOW', reason: 'Capability ist in der Schreib-Allowlist.' };
}
