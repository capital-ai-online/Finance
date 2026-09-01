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

const routing = '| `CAPITAL-AI-OPS` | `PVC-02/04/06/07/08/18` Primary Owner | `docs/projects/operations/` | `operations` | `CAPITAL-AI-OPS` | present |\n| `CAPITAL-AI-GOV` | `PVC-05` Primary Owner | `docs/projects/governance/` | `governance` | `CAPITAL-AI-GOV` | present |';
const ownership = ['PVC-02','PVC-04','PVC-06','PVC-07','PVC-08','PVC-18'].map((s) => `| \`${s}\` | Stage | \`CAPITAL-AI-OPS\` |`).concat('| `PVC-05` | Platform Director | `CAPITAL-AI-GOV` |').join('\n');
const projects = [
  { projectId:'CAPITAL-AI-GOV', projectFolder:'docs/projects/governance/', projectStages:['PVC-05'], primaryOwner:'CAPITAL-AI-GOV' },
  { projectId:'CAPITAL-AI-OPS', projectFolder:'docs/projects/operations/', projectStages:['PVC-02','PVC-04','PVC-06','PVC-07','PVC-08','PVC-18'], primaryOwner:'CAPITAL-AI-OPS' },
];
const mainSha = 'a'.repeat(40);

function chain(result:any) { const q:any={}; for (const m of ['select','eq','is','update']) q[m]=vi.fn(()=>q); q.single=vi.fn(async()=>result); q.maybeSingle=vi.fn(async()=>result); return q; }
async function subject(){ return import('../../server/ownerAuthorization/ownerDeviceAuthorization'); }
async function challenge(){
  const { digestAdr0104ProjectSet } = await import('../../server/ownerAuthorization/adr0104ProjectSet');
  const context:any={ ownerActorId:'owner',authorityId:'AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01',adrVersion:'1.4.0',slotId:'ADR-0104-S3',slotPreState:'AVAILABLE',chatBindingHash:'b'.repeat(64),authorizedProjectSet:projects,projectSetDigest:digestAdr0104ProjectSet(projects),initialActiveProjectId:'CAPITAL-AI-OPS',initialActiveProjectFolder:'docs/projects/operations/',currentMainSha:mainSha,sessionDuration:'PT8H',sessionStart:new Date(Date.now()-1000).toISOString(),sessionEnd:new Date(Date.now()+8*3600_000).toISOString(),nonce:'nonce'};
  const { createHash }=await import('node:crypto');
  return {id:'challenge',challenge:'proof',context,context_digest:createHash('sha256').update(JSON.stringify(context)).digest('hex'),expires_at:new Date(Date.now()+60_000).toISOString(),consumed_at:null};
}
async function configure(c?:any, slot:any=null, credential:any={id:'cred-row',credential_id:'credential',public_key:'AQ',counter:1,transports:[],device_type:'singleDevice',backup_eligible:false,backed_up:false,revoked_at:null}){
  const ch=c??await challenge();
  from.mockImplementation((table:string)=> table==='owner_authorization_challenges'?chain({data:ch,error:null}):table==='adr0104_owner_sessions'?chain({data:slot,error:null}):chain(credential?{data:credential,error:null}:{data:null,error:{message:'denied'}}));
  verifyAuthenticationResponse.mockResolvedValue({verified:true,authenticationInfo:{newCounter:2}});
  rpc.mockResolvedValue({data:[{evidence_id:'evidence',session_id:'session'}],error:null});
}
beforeEach(()=>{ vi.resetModules();vi.clearAllMocks();process.env.OWNER_WEBAUTHN_RP_ID='capital-ai.online';process.env.OWNER_WEBAUTHN_ORIGIN='https://capital-ai.online';assertCurrentMainSha.mockResolvedValue(undefined);fetchCurrentMainTextFile.mockImplementation(async(path:string)=>path.endsWith('PROJECT_VALUE_CHAIN.md')?ownership:routing); });

async function expectWebAuthnDeny(response:any={id:'credential'}){ await configure();verifyAuthenticationResponse.mockRejectedValue(new Error('rejected'));const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',response)).rejects.toThrow('OWNER_AUTH_WEBAUTHN_VERIFICATION_FAILED');expect(rpc).not.toHaveBeenCalled(); }

describe('Owner Device Authorization Stage-C negative catalogue',()=>{
  it.each([['raw deviceId only',{deviceId:'raw'}],['browser fingerprint only',{browserFingerprint:'fp'}],['copied activation text',{activationText:'ADR-0104-S3'}]])('%s -> DENY',async(_n,r)=>expectWebAuthnDeny(r));
  it.each(['wrong RP ID','wrong HTTPS origin','UP=false','UV=false','assertion replay'])('%s -> DENY through maintained WebAuthn verifier',async()=>expectWebAuthnDeny());
  it('foreign credential -> DENY',async()=>{await configure(undefined,null,null);const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'foreign'} as any)).rejects.toThrow('OWNER_DEVICE_CREDENTIAL_INVALID');});
  it.each(['synchronized credential','backup-eligible credential','backed-up credential','revoked credential'])('%s -> DENY by credential query/profile',async()=>{await configure(undefined,null,null);const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('OWNER_DEVICE_CREDENTIAL_INVALID');});
  it('expired challenge -> DENY',async()=>{const c=await challenge();c.expires_at=new Date(Date.now()-1000).toISOString();await configure(c);const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('OWNER_AUTH_CHALLENGE_EXPIRED');});
  it('challenge replay/wrong repository-action -> DENY',async()=>{from.mockImplementation(()=>chain({data:null,error:{message:'invalid'}}));const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('OWNER_AUTH_CHALLENGE_INVALID');});
  it('context replay, wrong chat binding or wrong project set -> DENY',async()=>{const c=await challenge();c.context.chatBindingHash='c'.repeat(64);await configure(c);const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('OWNER_AUTH_CONTEXT_DRIFT');});
  it('consumed ADR slot -> DENY',async()=>{await configure(undefined,{id:'existing'});const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('ADR0104_SLOT_UNAVAILABLE');});
  it('post-challenge canonical project mutation -> DENY',async()=>{await configure();fetchCurrentMainTextFile.mockImplementation(async(path:string)=>path.endsWith('PROJECT_VALUE_CHAIN.md')?ownership.replace('| `PVC-18` | Stage | `CAPITAL-AI-OPS` |',''):routing);const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('ADR0104_CANONICAL_PROJECT_SET_DRIFT');expect(rpc).not.toHaveBeenCalled();});
  it('ADR-version drift -> DENY',async()=>{const c=await challenge();c.context.adrVersion='9.9.9';const {createHash}=await import('node:crypto');c.context_digest=createHash('sha256').update(JSON.stringify(c.context)).digest('hex');await configure(c);const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('ADR0104_AUTHORITY_DRIFT');});
  it('current-main drift -> DENY',async()=>{await configure();assertCurrentMainSha.mockRejectedValue(new Error('ADR0104_CURRENT_MAIN_DRIFT'));const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('ADR0104_CURRENT_MAIN_DRIFT');});
  it('persistence/audit failure -> DENY',async()=>{await configure();rpc.mockResolvedValue({data:null,error:{message:'rollback'}});const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).rejects.toThrow('OWNER_AUTH_ATOMIC_CONSUMPTION_FAILED');});
  it('ALLOW only after atomic commit',async()=>{await configure();const {verifyAdr0104Authentication}=await subject();await expect(verifyAdr0104Authentication('owner','challenge',{id:'credential'} as any)).resolves.toMatchObject({authorized:true,evidenceId:'evidence',sessionId:'session'});expect(rpc).toHaveBeenCalledTimes(1);});
});
