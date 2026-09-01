import { createHash, randomUUID } from 'node:crypto';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { getServerSupabase } from '../db';
import {
  ADR_0104_AUTHORITY_ID,
  ADR_0104_DURATION,
  ADR_0104_VERSION,
  assertAdr0104SlotAvailable,
  assertInitialProjectMember,
  digestAdr0104ProjectSet,
  resolveAdr0104ProjectSet,
  type Adr0104SlotId,
} from './adr0104ProjectSet';
import { assertCurrentMainSha } from './currentMain';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface Adr0104ActivationRequest {
  slotId: Adr0104SlotId;
  chatBindingHash: string;
  projectIds: string[];
  initialActiveProjectId: string;
  currentMainSha: string;
}

function config() {
  const rpID = process.env.OWNER_WEBAUTHN_RP_ID?.trim();
  const origin = process.env.OWNER_WEBAUTHN_ORIGIN?.trim();
  if (!rpID || !origin || !origin.startsWith('https://')) throw new Error('OWNER_WEBAUTHN_NOT_CONFIGURED');
  return { rpID, origin };
}

function digestContext(context: unknown): string {
  return createHash('sha256').update(JSON.stringify(context), 'utf8').digest('hex');
}

export async function createAdr0104AuthenticationChallenge(ownerUserId: string, request: Adr0104ActivationRequest) {
  const { rpID } = config();
  assertAdr0104SlotAvailable(request.slotId);
  await assertCurrentMainSha(request.currentMainSha);
  const projects = resolveAdr0104ProjectSet(request.projectIds);
  const initialProject = assertInitialProjectMember(projects, request.initialActiveProjectId);
  const projectSetDigest = digestAdr0104ProjectSet(projects);
  const now = new Date();
  const sessionEnd = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const context = {
    ownerActorId: ownerUserId,
    authorityId: ADR_0104_AUTHORITY_ID,
    adrVersion: ADR_0104_VERSION,
    slotId: request.slotId,
    slotPreState: 'AVAILABLE',
    chatBindingHash: request.chatBindingHash,
    authorizedProjectSet: projects,
    projectSetDigest,
    initialActiveProjectId: initialProject.projectId,
    initialActiveProjectFolder: initialProject.projectFolder,
    currentMainSha: request.currentMainSha,
    sessionDuration: ADR_0104_DURATION,
    sessionStart: now.toISOString(),
    sessionEnd: sessionEnd.toISOString(),
    nonce: randomUUID(),
  };

  const supabase = getServerSupabase();
  const { data: activeSlot } = await supabase.from('adr0104_owner_sessions').select('id').eq('slot_id', request.slotId).maybeSingle();
  if (activeSlot) throw new Error('ADR0104_SLOT_UNAVAILABLE');

  const { data: credentials, error: credentialError } = await supabase
    .from('owner_device_credentials').select('credential_id,transports').eq('owner_user_id', ownerUserId)
    .is('revoked_at', null).eq('device_type', 'singleDevice').eq('backup_eligible', false).eq('backed_up', false);
  if (credentialError || !credentials?.length) throw new Error('OWNER_DEVICE_CREDENTIAL_UNAVAILABLE');

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: credentials.map((credential: any) => ({ id: credential.credential_id, transports: credential.transports ?? [] })),
  });

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS);
  const contextDigest = digestContext(context);
  const { data: challenge, error } = await supabase.from('owner_authorization_challenges').insert({
    owner_user_id: ownerUserId,
    action: 'ACTIVATE_ADR_0104_SESSION',
    challenge: options.challenge,
    context_digest: contextDigest,
    context,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  }).select('id').single();
  if (error || !challenge) throw new Error('OWNER_AUTH_CHALLENGE_PERSIST_FAILED');
  return { challengeId: challenge.id, contextDigest, projectSetDigest, options };
}

export async function verifyAdr0104Authentication(ownerUserId: string, challengeId: string, response: AuthenticationResponseJSON) {
  const { rpID, origin } = config();
  const supabase = getServerSupabase();
  const now = new Date();
  const { data: challenge, error: challengeError } = await supabase.from('owner_authorization_challenges').select('*')
    .eq('id', challengeId).eq('owner_user_id', ownerUserId).eq('action', 'ACTIVATE_ADR_0104_SESSION').is('consumed_at', null).single();
  if (challengeError || !challenge) throw new Error('OWNER_AUTH_CHALLENGE_INVALID');
  if (new Date(challenge.expires_at).getTime() <= now.getTime()) throw new Error('OWNER_AUTH_CHALLENGE_EXPIRED');
  if (digestContext(challenge.context) !== challenge.context_digest) throw new Error('OWNER_AUTH_CONTEXT_DRIFT');
  if (challenge.context?.adrVersion !== ADR_0104_VERSION || challenge.context?.authorityId !== ADR_0104_AUTHORITY_ID) throw new Error('ADR0104_AUTHORITY_DRIFT');
  assertAdr0104SlotAvailable(challenge.context.slotId as Adr0104SlotId);
  await assertCurrentMainSha(challenge.context.currentMainSha);

  const { data: existingSlot } = await supabase.from('adr0104_owner_sessions').select('id').eq('slot_id', challenge.context.slotId).maybeSingle();
  if (existingSlot) throw new Error('ADR0104_SLOT_UNAVAILABLE');

  const { data: credential, error: credentialError } = await supabase.from('owner_device_credentials').select('*')
    .eq('owner_user_id', ownerUserId).eq('credential_id', response.id).is('revoked_at', null)
    .eq('device_type', 'singleDevice').eq('backup_eligible', false).eq('backed_up', false).single();
  if (credentialError || !credential) throw new Error('OWNER_DEVICE_CREDENTIAL_INVALID');

  const { data: consumed, error: consumeError } = await supabase.from('owner_authorization_challenges')
    .update({ consumed_at: now.toISOString() }).eq('id', challengeId).is('consumed_at', null).select('id').single();
  if (consumeError || !consumed) throw new Error('OWNER_AUTH_CHALLENGE_REPLAY');

  let verified = false;
  let newCounter = Number(credential.counter);
  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: credential.credential_id,
        publicKey: Buffer.from(credential.public_key, 'base64url'),
        counter: Number(credential.counter),
        transports: credential.transports ?? [],
      },
    });
    verified = verification.verified;
    newCounter = verification.authenticationInfo?.newCounter ?? newCounter;
  } catch {
    verified = false;
  }

  const deviceBound = credential.device_type === 'singleDevice' && credential.backup_eligible === false && credential.backed_up === false;
  const outcome = verified && deviceBound ? 'ALLOW' : 'DENY';
  const reasonClass = outcome === 'ALLOW' ? 'WEBAUTHN_DEVICE_BOUND_VERIFIED' : 'WEBAUTHN_VERIFICATION_FAILED';
  const { data: evidence, error: evidenceError } = await supabase.from('owner_authorization_evidence').insert({
    challenge_id: challengeId,
    owner_user_id: ownerUserId,
    credential_id: credential.id,
    action: 'ACTIVATE_ADR_0104_SESSION',
    context_digest: challenge.context_digest,
    rp_verified: verified,
    origin_verified: verified,
    user_presence_verified: verified,
    user_verification_verified: verified,
    device_bound_verified: deviceBound,
    outcome,
    reason_class: reasonClass,
  }).select('id').single();
  if (evidenceError || !evidence) throw new Error('OWNER_AUTH_EVIDENCE_PERSIST_FAILED');
  if (outcome !== 'ALLOW') throw new Error('OWNER_AUTH_DENIED');

  const { error: counterError } = await supabase.from('owner_device_credentials').update({ counter: newCounter })
    .eq('id', credential.id).eq('counter', credential.counter);
  if (counterError) throw new Error('OWNER_AUTH_COUNTER_UPDATE_FAILED');

  const { data: session, error: sessionError } = await supabase.from('adr0104_owner_sessions').insert({
    slot_id: challenge.context.slotId,
    owner_user_id: ownerUserId,
    chat_binding_hash: challenge.context.chatBindingHash,
    project_set_digest: challenge.context.projectSetDigest,
    authorized_project_set: challenge.context.authorizedProjectSet,
    active_project_id: challenge.context.initialActiveProjectId,
    current_main_sha: challenge.context.currentMainSha,
    evidence_id: evidence.id,
    session_start: challenge.context.sessionStart,
    session_end: challenge.context.sessionEnd,
    state: 'ACTIVE',
  }).select('id').single();
  if (sessionError || !session) throw new Error('ADR0104_SESSION_ACTIVATION_FAILED');

  const { error: consumptionError } = await supabase.from('owner_authorization_consumptions').insert({
    evidence_id: evidence.id,
    action: 'ACTIVATE_ADR_0104_SESSION',
    target_digest: challenge.context_digest,
    result: 'CONSUMED',
  });
  if (consumptionError) throw new Error('OWNER_AUTH_CONSUMPTION_PERSIST_FAILED');

  return { authorized: true as const, evidenceId: evidence.id, sessionId: session.id, contextDigest: challenge.context_digest, activation: challenge.context };
}
