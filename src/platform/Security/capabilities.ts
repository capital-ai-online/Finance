// ESS-0018 Phase 2 / ADR-0051: Capability/Grant-IAM foundation. Additive extension of the coarse
// role model in authMiddleware.ts (owner/admin/supervisor/user) with named, explicit, revocable
// capability grants. There is no wildcard capability and no capability that maps to raw SQL,
// schema mutation, or project/account administration (ESS-0018 §4.2 non-goals) - CAPABILITIES
// below is the only place new ones may be added, and every addition must be documented there
// before being referenced anywhere else.

import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../../../server/db';

/**
 * Allowlisted capability names (ESS-0018 §4.2). Never a raw string elsewhere in the codebase -
 * always import from here so the full set stays enumerable and reviewable in one place.
 */
export const CAPABILITIES = {
  ADMIN_DIAGNOSTICS_READ: 'supabase.admin.diagnostics.read',
  ADMIN_SUBSCRIPTION_STATUS_READ: 'supabase.admin.subscription_status.read',
  ADMIN_ALERT_SUBSCRIPTION_DISABLE: 'supabase.admin.alert_subscription.disable',
} as const;

export type Capability = typeof CAPABILITIES[keyof typeof CAPABILITIES];

const ALL_CAPABILITIES: readonly string[] = Object.values(CAPABILITIES);

export function isKnownCapability(value: string): value is Capability {
  return ALL_CAPABILITIES.includes(value);
}

/**
 * Fail-closed capability check: any DB/connection error resolves to `false`, never `true`.
 * A grant only counts while not revoked and (if set) not yet expired.
 */
export async function checkCapability(userId: string, capability: Capability): Promise<boolean> {
  if (!userId || !isKnownCapability(capability)) return false;
  if (!isPrivilegedSupabaseConfigured()) return false;

  try {
    const supabase = getPrivilegedServerSupabase();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('capability_grants')
      .select('id, expires_at')
      .eq('grantee_user_id', userId)
      .eq('capability', capability)
      .is('revoked_at', null)
      .limit(50);

    if (error || !data) return false;
    return data.some((row: { expires_at: string | null }) => !row.expires_at || row.expires_at > nowIso);
  } catch (err: any) {
    console.error(`[Capabilities][ERROR] checkCapability fehlgeschlagen: ${err?.message || err}`);
    return false;
  }
}

export interface GrantCapabilityInput {
  capability: Capability;
  granteeUserId: string;
  grantedByUserId: string;
  expiresAt?: string;
  reason?: string;
}

/**
 * Issues a new capability grant. Callers MUST already have verified OWNER role + fresh TOTP
 * step-up before calling this - this function itself does not check authorization, it only
 * persists an already-authorized decision (mirrors the separation used by
 * server/stepUp.ts's totp/verify-setup: the route enforces the gate, the function just writes).
 */
export async function grantCapability(input: GrantCapabilityInput): Promise<{ id: string } | null> {
  if (!isKnownCapability(input.capability)) {
    throw new Error(`[Capabilities] Unbekannte Capability: "${input.capability}"`);
  }
  if (!isPrivilegedSupabaseConfigured()) return null;

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('capability_grants')
    .insert({
      capability: input.capability,
      grantee_user_id: input.granteeUserId,
      granted_by_user_id: input.grantedByUserId,
      expires_at: input.expiresAt ?? null,
      reason: input.reason ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error(`[Capabilities][ERROR] grantCapability fehlgeschlagen: ${error?.message}`);
    return null;
  }
  return { id: data.id };
}

export async function revokeCapability(grantId: string, revokedByUserId: string): Promise<boolean> {
  if (!isPrivilegedSupabaseConfigured()) return false;

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('capability_grants')
    .update({ revoked_at: new Date().toISOString(), revoked_by_user_id: revokedByUserId })
    .eq('id', grantId)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error(`[Capabilities][ERROR] revokeCapability fehlgeschlagen: ${error.message}`);
    return false;
  }
  return !!data;
}
