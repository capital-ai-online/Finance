// M10 (ADR-0066, ESS-0022) Phase 3 live-wiring — Supabase-backed implementations of the
// M10RegistrationChallengeStore/M10CredentialStore interfaces defined in credentialEnrollment.ts.
// Kept in a separate file so credentialEnrollment.ts itself stays free of any I/O import and
// remains testable with the in-memory reference stores alone, exactly mirroring how
// breakGlassRouter.ts (I/O) is kept separate from breakGlass.ts (pure logic).
//
// Schema: supabase/migrations/20260817020000_m10_passkey_owner_enrollment.sql. Both tables are
// Service-Role-only (RLS, no client policy) - only this server-side module ever reads/writes them.
import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../db';
import type {
  M10CredentialStore,
  M10RegistrationChallengeStore,
  M10StoredCredential,
  StoredM10RegistrationChallenge,
} from './credentialEnrollment';

interface RegistrationChallengeRow {
  challenge_id: string;
  challenge: string;
  owner_actor_id: string;
  issued_at: string;
  expires_at: string;
  consumed_at: string | null;
}

function rowToChallengeRecord(row: RegistrationChallengeRow): StoredM10RegistrationChallenge {
  return {
    challenge: {
      challengeId: row.challenge_id,
      challenge: row.challenge,
      ownerId: row.owner_actor_id,
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
    },
    state: row.consumed_at ? 'CONSUMED' : 'UNUSED',
  };
}

export function createSupabaseM10RegistrationChallengeStore(): M10RegistrationChallengeStore {
  return {
    async save(record) {
      if (!isPrivilegedSupabaseConfigured()) {
        throw new Error('Supabase ist nicht konfiguriert - Registrierungs-Challenge kann nicht persistiert werden.');
      }
      const supabase = getPrivilegedServerSupabase();
      const { error } = await supabase.from('m10_registration_challenges').insert({
        challenge_id: record.challenge.challengeId,
        challenge: record.challenge.challenge,
        owner_actor_id: record.challenge.ownerId,
        issued_at: record.challenge.issuedAt,
        expires_at: record.challenge.expiresAt,
        consumed_at: record.state === 'CONSUMED' ? new Date().toISOString() : null,
      });
      if (error) throw new Error(`m10_registration_challenges insert fehlgeschlagen: ${error.message}`);
    },

    async get(challengeId) {
      if (!isPrivilegedSupabaseConfigured()) return null;
      const supabase = getPrivilegedServerSupabase();
      const { data, error } = await supabase
        .from('m10_registration_challenges')
        .select('challenge_id, challenge, owner_actor_id, issued_at, expires_at, consumed_at')
        .eq('challenge_id', challengeId)
        .maybeSingle();
      if (error || !data) return null;
      return rowToChallengeRecord(data as RegistrationChallengeRow);
    },

    async markConsumed(challengeId) {
      if (!isPrivilegedSupabaseConfigured()) return false;
      const supabase = getPrivilegedServerSupabase();
      // Atomic single-use consumption - identical UPDATE ... WHERE ... IS NULL pattern as
      // requireStepUp() (src/platform/Security/authMiddleware.ts) and consumeApproval()
      // (src/platform/Security/approvals.ts), so a race between two concurrent requests can only
      // ever produce one winner.
      const { data, error } = await supabase
        .from('m10_registration_challenges')
        .update({ consumed_at: new Date().toISOString() })
        .eq('challenge_id', challengeId)
        .is('consumed_at', null)
        .select('challenge_id')
        .maybeSingle();
      return !error && !!data;
    },
  };
}

interface OwnerCredentialRow {
  credential_id: string;
  owner_actor_id: string;
  public_key: string;
  counter: number;
  transports: string[];
  device_type: string;
  backed_up: boolean;
  aaguid: string;
  created_at: string;
  revoked_at: string | null;
}

function rowToCredentialRecord(row: OwnerCredentialRow): M10StoredCredential {
  return {
    credentialId: row.credential_id,
    ownerId: row.owner_actor_id,
    publicKey: row.public_key,
    counter: row.counter,
    transports: row.transports,
    deviceType: row.device_type as M10StoredCredential['deviceType'],
    backedUp: row.backed_up,
    aaguid: row.aaguid,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export function createSupabaseM10CredentialStore(): M10CredentialStore {
  return {
    async save(credential) {
      if (!isPrivilegedSupabaseConfigured()) {
        throw new Error('Supabase ist nicht konfiguriert - Credential kann nicht persistiert werden.');
      }
      const supabase = getPrivilegedServerSupabase();
      const { error } = await supabase.from('m10_owner_credentials').insert({
        credential_id: credential.credentialId,
        owner_actor_id: credential.ownerId,
        public_key: credential.publicKey,
        counter: credential.counter,
        transports: [...credential.transports],
        device_type: credential.deviceType,
        backed_up: credential.backedUp,
        aaguid: credential.aaguid,
        created_at: credential.createdAt,
        revoked_at: credential.revokedAt,
      });
      if (error) throw new Error(`m10_owner_credentials insert fehlgeschlagen: ${error.message}`);
    },

    async listActiveForOwner(ownerId) {
      if (!isPrivilegedSupabaseConfigured()) return [];
      const supabase = getPrivilegedServerSupabase();
      const { data, error } = await supabase
        .from('m10_owner_credentials')
        .select('credential_id, owner_actor_id, public_key, counter, transports, device_type, backed_up, aaguid, created_at, revoked_at')
        .eq('owner_actor_id', ownerId)
        .is('revoked_at', null);
      if (error || !data) return [];
      return (data as OwnerCredentialRow[]).map(rowToCredentialRecord);
    },

    async revoke(credentialId) {
      if (!isPrivilegedSupabaseConfigured()) return false;
      const supabase = getPrivilegedServerSupabase();
      const { data, error } = await supabase
        .from('m10_owner_credentials')
        .update({ revoked_at: new Date().toISOString() })
        .eq('credential_id', credentialId)
        .is('revoked_at', null)
        .select('credential_id')
        .maybeSingle();
      return !error && !!data;
    },
  };
}
