import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const PR_TEMPLATE_VERSION = '2.0.0';
export const PR_TEMPLATE_MARKER = `CAPITAL_AI_PR_TEMPLATE_VERSION: ${PR_TEMPLATE_VERSION}`;
export const DEFAULT_PRODUCTION_HEALTH_URL = 'https://capital-ai.online/healthz';
export const MAX_PR_START_DELAY_MS = 15 * 60 * 1000;

export function fail(message) { throw new Error(message); }
export function git(args, options = {}) { return execFileSync('git', args, { encoding:'utf8', stdio:['ignore','pipe','pipe'], ...options }).trim(); }
export function tryGit(args) { try { return git(args); } catch { return null; } }
export function gitSucceeds(args, options = {}) { try { git(args, options); return true; } catch { return false; } }
export function normalizeRepoPath(value) { return String(value || '').replace(/\\/g,'/').replace(/^\.\//,'').replace(/\/+/g,'/').trim(); }
export function globToRegExp(pattern) {
  const normalized=normalizeRepoPath(pattern); let out='^';
  for (let i=0;i<normalized.length;i+=1) { const char=normalized[i]; if (char==='*') { if (normalized[i+1]==='*') { out+='.*'; i+=1; } else out+='[^/]*'; } else if (char==='?') out+='[^/]'; else if ('\\.^$+{}()|[]'.includes(char)) out+=`\\${char}`; else out+=char; }
  return new RegExp(`${out}$`);
}
export function pathMatchesClaim(filePath, claimedPaths) { const normalizedPath=normalizeRepoPath(filePath); return claimedPaths.some((claim)=>globToRegExp(claim).test(normalizedPath)); }
export function staticGlobPrefix(pattern) { const normalized=normalizeRepoPath(pattern); const wildcardAt=normalized.search(/[?*]/); const prefix=wildcardAt===-1?normalized:normalized.slice(0,wildcardAt); return prefix.replace(/\/+$/,''); }
export function isClaimMetadataPath(filePath) { return normalizeRepoPath(filePath).startsWith('.ai/work-claims/'); }
export function claimScopesOverlap(a,b) {
  const left=normalizeRepoPath(a), right=normalizeRepoPath(b); if (isClaimMetadataPath(left)||isClaimMetadataPath(right)) return false;
  const leftHasWildcard=/[?*]/.test(left), rightHasWildcard=/[?*]/.test(right);
  if (!leftHasWildcard&&!rightHasWildcard) return left===right; if (!leftHasWildcard) return globToRegExp(right).test(left); if (!rightHasWildcard) return globToRegExp(left).test(right);
  const leftPrefix=staticGlobPrefix(left), rightPrefix=staticGlobPrefix(right); if (!leftPrefix||!rightPrefix) return true;
  return leftPrefix===rightPrefix||leftPrefix.startsWith(`${rightPrefix}/`)||rightPrefix.startsWith(`${leftPrefix}/`);
}
export function findClaimConflicts(currentClaims, otherClaims) { const conflicts=[]; for (const current of currentClaims) for (const other of otherClaims) if (claimScopesOverlap(current,other)) conflicts.push({current,other}); return conflicts; }
export function readJsonFile(filePath) { return JSON.parse(fs.readFileSync(filePath,'utf8')); }
export function writeJsonFile(filePath,value) { fs.mkdirSync(path.dirname(filePath),{recursive:true}); fs.writeFileSync(filePath,`${JSON.stringify(value,null,2)}\n`,'utf8'); }
export function validateClaimShape(claim, claimPath) {
  const errors=[]; if (!claim||typeof claim!=='object'||Array.isArray(claim)) return ['claim must be a JSON object'];
  if (claim.schemaVersion!=='1.0.0') errors.push('schemaVersion must be 1.0.0'); if (!claim.claimId||typeof claim.claimId!=='string') errors.push('claimId is required'); if (claim.status!=='active') errors.push('status must be active while PR is open'); if (claim.exclusive!==true) errors.push('exclusive must be true'); if (!claim.workItem||typeof claim.workItem!=='string') errors.push('workItem is required'); if (!claim.startedAt||Number.isNaN(Date.parse(claim.startedAt))) errors.push('startedAt must be an ISO-8601 timestamp'); if (claim.baseBranch!=='main') errors.push('baseBranch must be main'); if (!/^[0-9a-f]{40}$/i.test(String(claim.baseSha||''))) errors.push('baseSha must be a full 40-character Git SHA');
  if (!claim.agent||typeof claim.agent!=='object') errors.push('agent object is required'); else { if (!claim.agent.provider) errors.push('agent.provider is required'); if (!claim.agent.model) errors.push('agent.model is required'); if (!claim.agent.executionSurface) errors.push('agent.executionSurface is required'); }
  if (!Array.isArray(claim.claimedPaths)||claim.claimedPaths.length===0) errors.push('claimedPaths must be a non-empty array'); else for (const item of claim.claimedPaths) { if (typeof item!=='string'||!normalizeRepoPath(item)) { errors.push('every claimedPaths entry must be a non-empty string'); break; } if (normalizeRepoPath(item)==='**'||normalizeRepoPath(item)==='*') { errors.push('repository-wide wildcard claims are forbidden; split the work into bounded scopes'); break; } }
  if (!normalizeRepoPath(claimPath).startsWith('.ai/work-claims/')) errors.push('claim file must live below .ai/work-claims/');
  if (claim.executionProfile&&!['P1','P2','P3','P4','P0 HUMAN REQUIRED'].includes(claim.executionProfile)) errors.push('executionProfile must be P1, P2, P3, P4 or P0 HUMAN REQUIRED');
  if (claim.externalMutation&&!['NONE','PLANNED','HUMAN APPROVED','MUTATED','VERIFIED PASS','FAILED-ROLLED-BACK'].includes(claim.externalMutation)) errors.push('externalMutation contains an unsupported mutation state');
  return errors;
}
export function listAddedClaimFiles(baseRef='origin/main',headRef='HEAD') { const diff=git(['diff','--name-only','--diff-filter=A',`${baseRef}...${headRef}`,'--','.ai/work-claims']); if (!diff) return []; return diff.split(/\r?\n/).map(normalizeRepoPath).filter((entry)=>entry.endsWith('.json')); }
export function listChangedFiles(baseRef='origin/main',headRef='HEAD') { const diff=git(['diff','--name-only',`${baseRef}...${headRef}`]); if (!diff) return []; return diff.split(/\r?\n/).map(normalizeRepoPath).filter(Boolean); }

const RUNTIME_PATHS=[/^Dockerfile$/,/^\.dockerignore$/,/^package(?:-lock)?\.json$/,/^server\.ts$/,/^server\//,/^render\.ya?ml$/,/^\.github\/workflows\//,/^scripts\/security\/.*(?:Docker|docker|Runtime|runtime)/];
function isDocumentationPath(filePath) { return filePath.startsWith('docs/')||filePath.startsWith('.ai/')||filePath.endsWith('.md'); }
function isRuntimePath(filePath) { return RUNTIME_PATHS.some((pattern)=>pattern.test(filePath)); }
function featureAreasForPath(filePath) {
  const areas=[];
  if (filePath==='.github/pull_request_template.md'||filePath.startsWith('scripts/pr/')||filePath.startsWith('docs/governance/PR_')) areas.push('Pull-Request-Governance');
  if (filePath.startsWith('.github/workflows/')) areas.push('CI/CD und GitHub-Automation');
  if (filePath.includes('MONETIZATION')||filePath.includes('BUDGET')||filePath.includes('COST_BENEFIT')||filePath.includes('GITHUB_PRO')||filePath.includes('VISIBILITY')) areas.push('Monetarisierung und Kosten');
  if (filePath.startsWith('docs/roadmaps/')||filePath==='docs/architecture/ROADMAP.md'||filePath.startsWith('docs/traceability/')||filePath.startsWith('docs/evidence/')) areas.push('Roadmap und Nachweisführung');
  if (filePath.startsWith('server/')) areas.push('Backend und API'); if (filePath.startsWith('src/components/')) areas.push('Benutzeroberfläche'); if (filePath.startsWith('src/platform/')) areas.push('Plattformarchitektur'); if (filePath.startsWith('supabase/')) areas.push('Datenbank und Supabase'); if (filePath==='Dockerfile'||filePath==='.dockerignore') areas.push('Container und Runtime'); if (/^package(?:-lock)?\.json$/.test(filePath)) areas.push('Abhängigkeiten'); if (areas.length===0&&!isClaimMetadataPath(filePath)) areas.push('Repository-Konfiguration'); return areas;
}
export function classifyPullRequestScope(filePaths, options={}) {
  const files=[...new Set((filePaths||[]).map(normalizeRepoPath).filter(Boolean))]; const scopeFiles=files.filter((filePath)=>!isClaimMetadataPath(filePath)); const externalMutation=String(options.externalMutation||'NONE').trim().toUpperCase(); const mutationPlanned=externalMutation!=='NONE';
  let repositoryClass='D'; if (scopeFiles.some(isRuntimePath)) repositoryClass='R'; else if (scopeFiles.some((filePath)=>!isDocumentationPath(filePath))) repositoryClass='C';
  const checkClass=mutationPlanned?'M':repositoryClass; const explicitProfile=String(options.executionProfile||'').trim(); let executionProfile=explicitProfile||(repositoryClass==='D'?'P1':'P2'); if (mutationPlanned&&!['P3','P4'].includes(executionProfile)) executionProfile='P0 HUMAN REQUIRED';
  const featureAreas=[]; for (const filePath of scopeFiles) for (const area of featureAreasForPath(filePath)) if (!featureAreas.includes(area)) featureAreas.push(area); if (featureAreas.length===0) featureAreas.push('Dokumentation und Governance');
  const requiredChecks=['Human-/Owner-Vorprüfung','Governance-/Security-Prüfungen','build-and-test']; const notRequiredChecks=[];
  if (repositoryClass==='D') { requiredChecks.splice(2,0,'Dokumentations-Fast-Path'); notRequiredChecks.push('npm ci/audit','TypeScript/Lint','Unit Tests','Production Build','Docker Image Build'); }
  else { requiredChecks.splice(2,0,'Git-/Repository-Integrität','npm ci','Production Dependency Audit','Production Config Invariants','TypeScript/Lint','Unit Tests','Production Build','CSP-/Predeploy-Prüfung'); if (repositoryClass==='R') { requiredChecks.splice(requiredChecks.length-1,0,'Docker-/Runtime-Prüfung'); if (scopeFiles.some((filePath)=>filePath.startsWith('.github/workflows/'))) requiredChecks.splice(requiredChecks.length-1,0,'Workflow-Security'); } else notRequiredChecks.push('Docker Image Build, sofern kein Runtime-Scope hinzukommt'); }
  if (mutationPlanned) requiredChecks.push('separate Human/Owner-Mutationsfreigabe','Pre-Mutation Baseline','Post-Mutation Verification und Evidence'); else notRequiredChecks.push('externe Produktionsmutation / Mutation Approval');
  const risk=checkClass==='M'?'Kritisch':repositoryClass==='R'?'Hoch':repositoryClass==='C'?'Mittel':'Niedrig';
  const reason=mutationPlanned?`Repository-Scope ${repositoryClass}; zusätzlich ist eine externe Produktionsmutation als ${externalMutation} deklariert, daher gilt M.`:repositoryClass==='R'?'Mindestens eine Workflow-, Runtime-, Dependency-, Docker- oder Deployment-relevante Datei ist betroffen.':repositoryClass==='C'?'Mindestens eine ausführbare Anwendung-/Test-/Konfigurationsdatei ist betroffen, aber kein Runtime-/Deployment-Pfad.':'Alle geänderten Nutzdateien sind Dokumentation/Evidence/AI-Metadaten; kein ausführbarer Runtime-Pfad ist betroffen.';
  const securityNote=mutationPlanned?'Externe Side Effects bleiben fail-closed und benötigen eine separate scope-bound Human/Owner-Autorisierung. MERGE bleibt Human/Owner-only.':repositoryClass==='R'?'Runtime-/Workflow-Änderungen verändern die Delivery- oder Trust-Chain und werden deshalb strenger geprüft. MERGE bleibt Human/Owner-only.':'Keine zusätzliche Produktionsberechtigung entsteht aus der Checkklasse. MERGE bleibt Human/Owner-only.';
  const rollback=mutationPlanned?'Repository-Änderungen per git revert; externe Mutation nur nach dem im PR referenzierten Rollback-Runbook.':'git revert des Human-Merge-Commits; keine externe Produktionsmutation zurückzusetzen.';
  const learningNote=`Dieser PR berührt ${featureAreas.join(', ')}. Die Klasse ${checkClass} erklärt, warum ${requiredChecks.join(', ')} erforderlich sind. Die Klassifikation ist eine Prüfregel und keine Rechtevergabe; das Execution Profile ${executionProfile} begrenzt die zulässige Ausführung.`;
  return { files:scopeFiles,repositoryClass,checkClass,executionProfile,externalMutation,mutationApprovalRequired:mutationPlanned,featureAreas,requiredChecks,notRequiredChecks,risk,reason,securityNote,rollback,learningNote };
}
export async function githubJson(url,token,init={}) { const response=await fetch(url,{...init,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:`Bearer ${token}`}:{ }),...(init.headers||{})},signal:init.signal||AbortSignal.timeout(15_000)}); const text=await response.text(); let data=null; if (text) { try { data=JSON.parse(text); } catch { data=text; } } if (!response.ok) { const detail=typeof data==='object'&&data?.message?data.message:String(data||response.statusText); fail(`GitHub API ${response.status} for ${url}: ${detail}`); } return data; }
export async function githubPaginated(pathname,token) { const results=[]; for (let page=1;page<=20;page+=1) { const joiner=pathname.includes('?')?'&':'?'; const pageData=await githubJson(`https://api.github.com${pathname}${joiner}per_page=100&page=${page}`,token); if (!Array.isArray(pageData)) fail(`Expected array from GitHub pagination endpoint: ${pathname}`); results.push(...pageData); if (pageData.length<100) break; } return results; }
export function appendGithubOutput(values) { const outputPath=process.env.GITHUB_OUTPUT; if (!outputPath) return; const lines=Object.entries(values).map(([key,value])=>`${key}=${String(value??'')}`); fs.appendFileSync(outputPath,`${lines.join('\n')}\n`,'utf8'); }
export function semverTuple(version) { const match=String(version||'').trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/); if (!match) return null; return match.slice(1).map(Number); }
export function compareSemver(a,b) { const left=semverTuple(a),right=semverTuple(b); if (!left||!right) return null; for (let i=0;i<3;i+=1) { if (left[i]>right[i]) return 1; if (left[i]<right[i]) return -1; } return 0; }
