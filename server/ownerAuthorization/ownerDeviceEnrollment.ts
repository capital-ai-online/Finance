import { createHash } from 'node:crypto';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { getServerSupabase } from '../db';

const ENROLLMENT_TTL_MS = 5 * 60 * 1000;

function config() {
  const rpID = process.env.OWNER_WEBAUTHN_RP_ID?.trim();
  const rpName = process.env.OWNER_WEBAUTHN_RP_NAME?.trim() || 'CAPITAL-AI Owner';
  const origin = process.env.OWNER_WEBAUTHN_ORIGIN?.trim();
  if (!rpID || !origin || !origin.startsWith('https://')) throw new Error('OWNER_WEBAUTHN_NOT_CONFIGURED');
  return { rpID, rpName, origin };
}

function deviceRef(credentialId: string): string {
  return `owner_device_${createHash('sha256').update(credentialId).digest('hex').slice(0, 24)}`;
}

export async function createOwnerDeviceRegistration(ownerUserId: string, ownerLabel: string) {
  const { rpID, rpName } = config();
  const supabase = getServerSupabase();
  const { data: existing, error } = await supabase
    .from('owner_device_credentials')
    .select('credential_id,transports')
    .eq('owner_user_id', ownerUserId)
    .is('revoked_at', null);
  if (error) throw new Error('OWNER_DEVICE_LOOKUP_FAILED');

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: ownerLabel,
    userID: new TextEncoder().encode(ownerUserId),
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
    excludeCredentials: (existing ?? []).map((credential: any) => ({
      id: credential.credential_id,
      transports: credential.transports ?? [],
    })),
  });

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + ENROLLMENT_TTL_MS);
  const context = { ownerUserId, purpose: 'OWNER_DEVICE_ENROLLMENT' };
  const contextDigest = createHash('sha256').update(JSON.stringify(context)).digest('hex');
  const { data: challenge, error: insertError } = await supabase
    .from('owner_authorization_challenges')
    .insert({
      owner_user_id: ownerUserId,
      action: 'OWNER_DEVICE_ENROLLMENT',
      challenge: options.challenge,
      context_digest: contextDigest,
      context,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();
  if (insertError || !challenge) throw new Error('OWNER_DEVICE_ENROLLMENT_CHALLENGE_FAILED');
  return { challengeId: challenge.id, options };
}

export async function verifyOwnerDeviceRegistration(
  ownerUserId: string,
  challengeId: string,
  response: RegistrationResponseJSON,
) {
  const { rpID, origin } = config();
  const supabase = getServerSupabase();
  const now = new Date();
  const { data: challenge, error } = await supabase
    .from('owner_authorization_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('owner_user_id', ownerUserId)
    .eq('action', 'OWNER_DEVICE_ENROLLMENT')
    .is('consumed_at', null)
    .single();
  if (error || !challenge) throw new Error('OWNER_DEVICE_ENROLLMENT_CHALLENGE_INVALID');
  if (new Date(challenge.expires_at).getTime() <= now.getTime()) throw new Error('OWNER_DEVICE_ENROLLMENT_CHALLENGE_EXPIRED');

  const { data: consumed, error: consumeError } = await supabase
    .from('owner_authorization_challenges')
    .update({ consumed_at: now.toISOString() })
    .eq('id', challengeId)
    .is('consumed_at', null)
    .select('id')
    .single();
  if (consumeError || !consumed) throw new Error('OWNER_DEVICE_ENROLLMENT_REPLAY');

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });
  const info = verification.registrationInfo;
  if (!verification.verified || !info) throw new Error('OWNER_DEVICE_ENROLLMENT_DENIED');
  if (info.credentialDeviceType !== 'singleDevice' || info.credentialBackedUp) {
    throw new Error('OWNER_DEVICE_MUST_BE_SINGLE_DEVICE');
  }

  const credentialId = info.credential.id;
  const { data: stored, error: storeError } = await supabase
    .from('owner_device_credentials')
    .insert({
      owner_user_id: ownerUserId,
      credential_id: credentialId,
      public_key: Buffer.from(info.credential.publicKey).toString('base64url'),
      counter: info.credential.counter,
      transports: response.response.transports ?? [],
      device_type: 'singleDevice',
      backup_eligible: false,
      backed_up: false,
      aaguid: info.aaguid ?? null,
      device_ref: deviceRef(credentialId),
    })
    .select('id,device_ref,created_at')
    .single();
  if (storeError || !stored) throw new Error('OWNER_DEVICE_ENROLLMENT_PERSIST_FAILED');
  return stored;
}

export async function revokeOwnerDevice(ownerUserId: string, credentialRecordId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('owner_device_credentials')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', credentialRecordId)
    .eq('owner_user_id', ownerUserId)
    .is('revoked_at', null)
    .select('id,device_ref,revoked_at')
    .single();
  if (error || !data) throw new Error('OWNER_DEVICE_REVOKE_FAILED');
  return data;
}
