import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyAuthenticationResponse = vi.fn();
const assertCurrentMainSha = vi.fn();
const fetchCurrentMainTextFile = vi.fn();
const rpc = vi.fn();
const from = vi.fn();

vi.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: vi.fn(),
  verifyAuthenticationResponse,
}));
vi.mock('../../server/ownerAuthorization/currentMain', () => ({ assertCurrentMainSha, fetchCurrentMainTextFile }));
vi.mock('../../server/db', () => ({ getServerSupabase: () => ({ from, rpc }) }));

const routing = '| `CAPITAL-AI-OPS` | `PVC-02/04/06/07/08/18` Primary Owner | `docs/projects/operations/` | `operations` | `CAPITAL-AI-OPS` | present |';
const ownership = ['PVC-02','PVC-04','PVC-06','PVC-07','PVC-08','PVC-18'].map((stage) => `| \`${stage}\` | Stage | \`CAPITAL-AI-OPS\` |`).join('\n');
const projects = [{ projectId:'CAPITAL-AI-OPS', projectFolder:'docs/projects/operations/', projectStages:['PVC-02','PVC-04','PVC-06','PVC-07','PVC-08','PVC-18'], primaryOwner:'CAPITAL-AI-OPS' }];
const mainSha = 'a'.repeat(40);

function chain(result:any) {
  const query:any = {};
  for (const method of ['select','eq','is']) query[method] = vi.fn(() => query);
  query.single = vi.fn(async () => result);
  query.maybeSingle = vi.fn(async () => result);
  return query;
}

async function buildChallenge() {
  const { createHash } = await import('node:crypto');
  const { digestAdr0104ProjectSet } = await import('../../server/ownerAuthorization/adr0104ProjectSet');
  const context:any = {
    ownerActorId:'owner', authorityId:'AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01', adrVersion:'1.4.0',
    slotId:'ADR-0104-S3', slotPreState:'AVAILABLE', chatBindingHash:'b'.repeat(64), authorizedProjectSet:projects,
    projectSetDigest:digestAdr0104ProjectSet(projects), initialActiveProjectId:'CAPITAL-AI-OPS', initialActiveProjectFolder:'docs/projects/operations/',
    currentMainSha:mainSha, sessionDuration:'PT8H', sessionStart:new Date(Date.now()-1000).toISOString(),
    sessionEnd:new Date(Date.now()+8*3600_000).toISOString(), nonce:'nonce',
  };
  return {
    id:'challenge', challenge:'proof', context,
    context_digest:createHash('sha256').update(JSON.stringify(context)).digest('hex'),
    expires_at:new Date(Date.now()+60_000).toISOString(), consumed_at:null,
  };
}

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.OWNER_WEBAUTHN_RP_ID='capital-ai.online';
  process.env.OWNER_WEBAUTHN_ORIGIN='https://capital-ai.online';
  assertCurrentMainSha.mockResolvedValue(undefined);
  fetchCurrentMainTextFile.mockImplementation(async(path:string) => path.endsWith('PROJECT_VALUE_CHAIN.md') ? ownership : routing);
  const challenge = await buildChallenge();
  const credential = { id:'cred-row', credential_id:'credential', public_key:'AQ', counter:1, transports:[], device_type:'singleDevice', backup_eligible:false, backed_up:false, revoked_at:null };
  from.mockImplementation((table:string) => table === 'owner_authorization_challenges'
    ? chain({data:challenge,error:null})
    : table === 'adr0104_owner_sessions'
      ? chain({data:null,error:null})
      : chain({data:credential,error:null}));
});

describe('production-path WebAuthn failure mapping', () => {
  it.each([
    ['wrong RP ID', 'Unexpected RP ID'],
    ['wrong HTTPS origin', 'Unexpected authentication response origin'],
    ['UP=false', 'User was not present'],
    ['UV=false', 'User could not be verified'],
    ['assertion replay/counter', 'Response counter value did not increase'],
  ])('%s -> fail closed before atomic consumption', async (_case, verifierFailure) => {
    verifyAuthenticationResponse.mockRejectedValue(new Error(verifierFailure));
    const { verifyAdr0104Authentication } = await import('../../server/ownerAuthorization/ownerDeviceAuthorization');
    await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any))
      .rejects.toThrow('OWNER_AUTH_WEBAUTHN_VERIFICATION_FAILED');
    expect(verifyAuthenticationResponse).toHaveBeenCalledWith(expect.objectContaining({
      expectedChallenge:'proof',
      expectedOrigin:'https://capital-ai.online',
      expectedRPID:'capital-ai.online',
      requireUserVerification:true,
    }));
    expect(rpc).not.toHaveBeenCalled();
  });
});
