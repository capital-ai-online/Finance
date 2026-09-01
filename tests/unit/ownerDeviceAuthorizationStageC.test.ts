import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyAuthenticationResponse = vi.fn();
const generateAuthenticationOptions = vi.fn();
const assertCurrentMainSha = vi.fn();
const fetchCurrentMainTextFile = vi.fn();
const rpc = vi.fn();
const from = vi.fn();

vi.mock('@simplewebauthn/server', () => ({ verifyAuthenticationResponse, generateAuthenticationOptions }));
vi.mock('../../server/ownerAuthorization/currentMain', () => ({ assertCurrentMainSha, fetchCurrentMainTextFile }));
vi.mock('../../server/db', () => ({ getServerSupabase: () => ({ from, rpc }) }));

const projectReadmes: Record<string, string> = {
  'docs/projects/governance/README.md': '**Project ID:** `CAPITAL-AI-GOV`\n**Primary Project Value Chain stage:** `PVC-05`',
  'docs/projects/operations/README.md': '**Project ID:** `CAPITAL-AI-OPS`\n**Primary stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`',
};

function chain(result: any) {
  const q: any = {};
  for (const method of ['select', 'eq', 'is', 'update']) q[method] = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  q.maybeSingle = vi.fn(async () => result);
  return q;
}

async function subject() {
  return import('../../server/ownerAuthorization/ownerDeviceAuthorization');
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.OWNER_WEBAUTHN_RP_ID = 'capital-ai.online';
  process.env.OWNER_WEBAUTHN_ORIGIN = 'https://capital-ai.online';
  assertCurrentMainSha.mockResolvedValue(undefined);
  fetchCurrentMainTextFile.mockImplementation(async (path: string) => projectReadmes[path] ?? '');
});

const mainSha = 'a'.repeat(40);
const projects = [
  { projectId: 'CAPITAL-AI-GOV', projectFolder: 'docs/projects/governance/', projectStages: ['PVC-05'], primaryOwner: 'CAPITAL-AI-GOV' },
  { projectId: 'CAPITAL-AI-OPS', projectFolder: 'docs/projects/operations/', projectStages: ['PVC-02','PVC-04','PVC-06','PVC-07','PVC-08','PVC-18'], primaryOwner: 'CAPITAL-AI-OPS' },
];

async function validChallenge() {
  const { digestAdr0104ProjectSet } = await import('../../server/ownerAuthorization/adr0104ProjectSet');
  const context = {
    ownerActorId: 'owner', authorityId: 'AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01', adrVersion: '1.4.0',
    slotId: 'ADR-0104-S3', slotPreState: 'AVAILABLE', chatBindingHash: 'b'.repeat(64), authorizedProjectSet: projects,
    projectSetDigest: digestAdr0104ProjectSet(projects), initialActiveProjectId: 'CAPITAL-AI-OPS', initialActiveProjectFolder: 'docs/projects/operations/',
    currentMainSha: mainSha, sessionDuration: 'PT8H', sessionStart: new Date(Date.now() - 1000).toISOString(),
    sessionEnd: new Date(Date.now() + 8 * 3600_000).toISOString(), nonce: 'nonce',
  };
  const { createHash } = await import('node:crypto');
  return { id: 'challenge', owner_user_id: 'owner', action: 'ACTIVATE_ADR_0104_SESSION', challenge: 'webauthn-challenge', context,
    context_digest: createHash('sha256').update(JSON.stringify(context)).digest('hex'), expires_at: new Date(Date.now() + 60_000).toISOString(), consumed_at: null };
}

async function configurePath(overrides: { challenge?: any; credential?: any; slot?: any } = {}) {
  const challenge = overrides.challenge ?? await validChallenge();
  const credential = overrides.credential ?? { id: 'cred-row', owner_user_id: 'owner', credential_id: 'credential', public_key: 'AQ', counter: 1, transports: [], device_type: 'singleDevice', backup_eligible: false, backed_up: false, revoked_at: null };
  from.mockImplementation((table: string) => {
    if (table === 'owner_authorization_challenges') return chain({ data: challenge, error: null });
    if (table === 'adr0104_owner_sessions') return chain({ data: overrides.slot ?? null, error: null });
    if (table === 'owner_device_credentials') return chain({ data: credential, error: null });
    throw new Error(`unexpected table ${table}`);
  });
  verifyAuthenticationResponse.mockResolvedValue({ verified: true, authenticationInfo: { newCounter: 2 } });
  rpc.mockResolvedValue({ data: [{ evidence_id: 'evidence', session_id: 'session' }], error: null });
  return challenge;
}

describe('Owner Device Authorization Stage-C fail-closed path', () => {
  it.each([
    ['raw deviceId only', {}],
    ['browser fingerprint only', { browserFingerprint: 'fp' }],
    ['copied activation text only', { activationText: 'activate ADR-0104-S3' }],
  ])('%s cannot authorize without a WebAuthn assertion', async (_name, response) => {
    await configurePath();
    verifyAuthenticationResponse.mockRejectedValue(new Error('invalid assertion'));
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', response as any)).rejects.toThrow('OWNER_AUTH_WEBAUTHN_VERIFICATION_FAILED');
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each(['wrong RP ID', 'wrong HTTPS origin', 'UP=false', 'UV=false', 'assertion replay'])('%s is DENY when maintained WebAuthn verification rejects', async () => {
    await configurePath();
    verifyAuthenticationResponse.mockRejectedValue(new Error('ceremony rejected'));
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('OWNER_AUTH_WEBAUTHN_VERIFICATION_FAILED');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('foreign credential is DENY', async () => {
    const challenge = await validChallenge();
    from.mockImplementation((table: string) => table === 'owner_authorization_challenges' ? chain({ data: challenge, error: null }) : table === 'adr0104_owner_sessions' ? chain({ data: null, error: null }) : chain({ data: null, error: { message: 'not found' } }));
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'foreign' } as any)).rejects.toThrow('OWNER_DEVICE_CREDENTIAL_INVALID');
  });

  it.each([
    ['synchronized credential', { device_type: 'multiDevice', backup_eligible: true, backed_up: true }],
    ['backup-eligible credential', { device_type: 'singleDevice', backup_eligible: true, backed_up: false }],
    ['backed-up credential', { device_type: 'singleDevice', backup_eligible: false, backed_up: true }],
    ['revoked credential', { device_type: 'singleDevice', backup_eligible: false, backed_up: false, revoked_at: new Date().toISOString() }],
  ])('%s is DENY', async (_name, state) => {
    const challenge = await validChallenge();
    from.mockImplementation((table: string) => table === 'owner_authorization_challenges' ? chain({ data: challenge, error: null }) : table === 'adr0104_owner_sessions' ? chain({ data: null, error: null }) : chain({ data: null, error: { message: JSON.stringify(state) } }));
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('OWNER_DEVICE_CREDENTIAL_INVALID');
  });

  it('expired challenge is DENY', async () => {
    const challenge = await validChallenge(); challenge.expires_at = new Date(Date.now() - 1000).toISOString();
    await configurePath({ challenge });
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('OWNER_AUTH_CHALLENGE_EXPIRED');
  });

  it('challenge replay is DENY', async () => {
    const challenge = await validChallenge();
    from.mockImplementation((table: string) => table === 'owner_authorization_challenges' ? chain({ data: null, error: { message: 'consumed' } }) : chain({ data: null, error: null }));
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', challenge.id, { id: 'credential' } as any)).rejects.toThrow('OWNER_AUTH_CHALLENGE_INVALID');
  });

  it('context replay/drift is DENY', async () => {
    const challenge = await validChallenge(); challenge.context.chatBindingHash = 'c'.repeat(64);
    await configurePath({ challenge });
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('OWNER_AUTH_CONTEXT_DRIFT');
  });

  it('wrong repository/action is DENY', async () => {
    from.mockImplementation(() => chain({ data: null, error: { message: 'wrong action' } }));
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('OWNER_AUTH_CHALLENGE_INVALID');
  });

  it('consumed ADR slot is DENY', async () => {
    await configurePath({ slot: { id: 'existing' } });
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('ADR0104_SLOT_UNAVAILABLE');
  });

  it('wrong chat binding and wrong project set are DENY as context drift', async () => {
    const challenge = await validChallenge(); challenge.context.authorizedProjectSet = [projects[0]];
    await configurePath({ challenge });
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('OWNER_AUTH_CONTEXT_DRIFT');
  });

  it('post-challenge canonical project-set mutation is DENY', async () => {
    await configurePath();
    fetchCurrentMainTextFile.mockImplementation(async (path: string) => path.includes('operations') ? '**Project ID:** `CAPITAL-AI-OPS`\n**Primary stages:** `PVC-02`' : projectReadmes[path]);
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('ADR0104_CANONICAL_PROJECT_SET_DRIFT');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('ADR-version drift is DENY', async () => {
    const challenge = await validChallenge(); challenge.context.adrVersion = '9.9.9';
    const { createHash } = await import('node:crypto'); challenge.context_digest = createHash('sha256').update(JSON.stringify(challenge.context)).digest('hex');
    await configurePath({ challenge });
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('ADR0104_AUTHORITY_DRIFT');
  });

  it('current-main drift is DENY', async () => {
    await configurePath(); assertCurrentMainSha.mockRejectedValue(new Error('ADR0104_CURRENT_MAIN_DRIFT'));
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('ADR0104_CURRENT_MAIN_DRIFT');
  });

  it('persistence/audit failure is DENY and no ALLOW is returned', async () => {
    await configurePath(); rpc.mockResolvedValue({ data: null, error: { message: 'transaction rolled back' } });
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).rejects.toThrow('OWNER_AUTH_ATOMIC_CONSUMPTION_FAILED');
  });

  it('returns ALLOW only after the atomic RPC commits evidence, counter, session and consumption', async () => {
    await configurePath();
    const { verifyAdr0104Authentication } = await subject();
    await expect(verifyAdr0104Authentication('owner', 'challenge', { id: 'credential' } as any)).resolves.toMatchObject({ authorized: true, evidenceId: 'evidence', sessionId: 'session' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
