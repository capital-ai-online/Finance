// ADR-0074: generalized Systemadmin work-package host runner. Executes exactly one catalog entry
// (scripts/systemadmin/workPackages/registry.mjs) per invocation, selected only by the validated
// workPackageId from the triggering Issue. Mirrors the exact security properties proven by
// runSa4Pilot.mjs (ADR-0068) — durable audit-bound authorization strictly before every repository
// side effect, trusted-code-only content generation, fail-closed cleanup on any error — but reads
// its target path, content generator, branch namespace and mandate from the catalog entry instead
// of hardcoding them, so a new work package needs a new catalog module + a new Owner-approved REM,
// not a new workflow file or broker route. This file itself does not touch runSa4Pilot.mjs — the
// already-verified SA4 pilot stays byte-for-byte unchanged.

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lookupWorkPackage } from './workPackages/registry.mjs';

const OWNER = 'SvenKulessa';
const AGENT_ID = 'capital-ai-systemadmin-roadmap-executor';
const APP_ID = 'chatgpt-github-connector';
const MANDATE_PREFIX = 'REM-WORKPACKAGE-';
const AUDIT_REFERENCE = /^supabase:agent_audit_events:[A-Za-z0-9_-]+$/;
const SHA = /^[a-f0-9]{40}$/;

function fail(message) {
  throw new Error(`[WORKPACKAGE-HOST][SECURITY] ${message}`);
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} fehlt.`);
  return value;
}

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    fail(`${label} konnte nicht als JSON gelesen werden.`);
  }
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

async function fetchJson(url, init = {}, allowedStatuses = []) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok && !allowedStatuses.includes(response.status)) {
    const detail = typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body)?.slice(0, 500);
    throw new Error(`[WORKPACKAGE-HOST] HTTP ${response.status} for ${url}: ${detail || 'no response body'}`);
  }
  return { status: response.status, body };
}

function githubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${requiredEnv('GITHUB_TOKEN')}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function githubApi(path, options = {}, allowedStatuses = []) {
  const repository = requiredEnv('GITHUB_REPOSITORY');
  const url = `https://api.github.com/repos/${repository}${path}`;
  return fetchJson(url, {
    ...options,
    headers: { ...githubHeaders(), ...(options.headers ?? {}) },
  }, allowedStatuses);
}

async function requestOidcToken() {
  const rawUrl = requiredEnv('ACTIONS_ID_TOKEN_REQUEST_URL');
  const requestToken = requiredEnv('ACTIONS_ID_TOKEN_REQUEST_TOKEN');
  const url = new URL(rawUrl);
  url.searchParams.set('audience', 'capital-ai-systemadmin-execution');
  const { body } = await fetchJson(url.toString(), {
    headers: { Authorization: `bearer ${requestToken}` },
  });
  if (!body || typeof body !== 'object' || typeof body.value !== 'string' || !body.value) {
    fail('GitHub OIDC response enthält kein Token.');
  }
  return body.value;
}

async function broker(path, oidcToken, payload) {
  const base = (process.env.SYSTEMADMIN_BROKER_BASE_URL || 'https://capital-ai.online').replace(/\/$/, '');
  const { body } = await fetchJson(`${base}/api/internal/systemadmin-execution/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${oidcToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!body || typeof body !== 'object') fail(`Broker ${path} lieferte keine JSON-Antwort.`);
  return body;
}

function assertAuditReference(value, label) {
  if (typeof value !== 'string' || !AUDIT_REFERENCE.test(value)) {
    fail(`${label} ist keine gültige M5 Audit-Reference.`);
  }
  return value;
}

async function collectOpenPrState(branchPrefix, targetPath) {
  const { body: pulls } = await githubApi('/pulls?state=open&per_page=100');
  if (!Array.isArray(pulls)) fail('Open-PR-Inventar ist ungültig.');

  const openSystemadminPullRequests = pulls.filter(pull =>
    typeof pull?.head?.ref === 'string' && pull.head.ref.startsWith(branchPrefix),
  ).length;
  const changed = new Set();

  for (const pull of pulls) {
    if (!Number.isInteger(pull?.number)) continue;
    for (let page = 1; page <= 10; page += 1) {
      const { body: files } = await githubApi(`/pulls/${pull.number}/files?per_page=100&page=${page}`);
      if (!Array.isArray(files)) fail(`Changed-file-Inventar für PR #${pull.number} ist ungültig.`);
      for (const file of files) {
        if (typeof file?.filename === 'string') changed.add(file.filename);
      }
      if (files.length < 100) break;
      if (page === 10) fail(`PR #${pull.number} überschreitet das Work-Package-Inventarlimit.`);
    }
  }

  return {
    openSystemadminPullRequests,
    openPullRequestChangedPaths: [...changed].sort(),
    conflict: changed.has(targetPath),
  };
}

function principal(issueNumber, runId) {
  return {
    humanActorId: OWNER,
    appId: APP_ID,
    agentId: AGENT_ID,
    sessionId: `github-issue-${issueNumber}`,
    requestId: `issue-${issueNumber}-run-${runId}`,
    credentialHolderId: 'github-actions-oidc',
    provider: 'openai',
    model: 'non-authoritative-host-metadata',
  };
}

function commonCheckpoint(request) {
  return {
    sa1VerifiedPass: true,
    mainResolved: true,
    roadmapResolved: true,
    securityPreflightPassed: true,
    overlapCheckPassed: true,
    checkClassResolved: true,
    rollbackDefined: true,
    testsDefined: true,
    branchName: request.branchName,
    credentialExposureDetected: false,
    untrustedScopeElevationDetected: false,
    productionMutationRequired: false,
    finalOwnerReviewStarted: false,
  };
}

async function authorize({
  capability,
  request,
  mandate,
  issueNumber,
  runId,
  oidcToken,
  currentHeadSha,
  requestedPaths,
  checkpoint,
  prState,
}) {
  const payload = {
    issueNumber,
    authorization: {
      principal: principal(issueNumber, runId),
      capability,
      riskClass: 'MEDIUM',
      environment: 'development',
      targetResource: `github:${requiredEnv('GITHUB_REPOSITORY')}`,
      mandate,
      execution: {
        roadmapItem: request.roadmapItem,
        repository: requiredEnv('GITHUB_REPOSITORY'),
        baseBranch: 'main',
        requestedPaths,
        mutationClass: 'REPOSITORY',
        openSystemadminPullRequests: prState.openSystemadminPullRequests,
        openPullRequestChangedPaths: prState.openPullRequestChangedPaths,
        ...(capability === 'PR' ? { pullRequestOperation: 'CREATE' } : {}),
        now: new Date().toISOString(),
      },
    },
    checkpoint: {
      ...commonCheckpoint(request),
      ...checkpoint,
      currentHeadSha,
    },
  };

  const response = await broker('authorize', oidcToken, payload);
  if (response?.decision?.verdict !== 'ALLOW') fail(`${capability} Broker-Entscheid ist nicht ALLOW.`);
  const auditReference = assertAuditReference(response.auditReference, `${capability} Authorization Evidence`);
  const permit = response.executionPermit;
  if (!permit?.auditBoundExecutionPermitted || permit.capability !== capability) {
    fail(`${capability} besitzt keinen audit-bound Permit.`);
  }
  if (permit.mandateId !== request.mandateId || permit.branchName !== request.branchName) {
    fail(`${capability} Permit ist nicht an Mandat/Branch gebunden.`);
  }
  if (permit.currentHeadSha !== currentHeadSha) fail(`${capability} Permit ist nicht an den aktuellen Head gebunden.`);
  if (JSON.stringify([...(permit.requestedPaths ?? [])].sort()) !== JSON.stringify([...requestedPaths].sort())) {
    fail(`${capability} Permit requestedPaths mismatch.`);
  }
  return { response, auditReference };
}

async function outcome({ authorization, result, branchName, commitSha, pullRequestNumber, oidcToken, issueNumber }) {
  const response = await broker('outcome', oidcToken, {
    issueNumber,
    authorization,
    result,
    branchName,
    ...(commitSha ? { commitSha } : {}),
    ...(Number.isInteger(pullRequestNumber) ? { pullRequestNumber } : {}),
  });
  return assertAuditReference(response.auditReference, `${authorization.executionPermit?.capability ?? 'UNKNOWN'} Outcome Evidence`);
}

async function deleteBranch(branchName, branchPrefix) {
  if (branchName === 'main' || !branchName.startsWith(branchPrefix)) return;
  await githubApi(`/git/refs/heads/${branchName}`, { method: 'DELETE' }, [404]);
}

async function closeDraftPr(prNumber) {
  if (!Number.isInteger(prNumber)) return;
  await githubApi(`/pulls/${prNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed' }),
  }, [404]);
}

async function main() {
  const request = readJson(requiredEnv('SYSTEMADMIN_REQUEST_FILE'), 'Work-Package Request');
  const event = readJson(requiredEnv('GITHUB_EVENT_PATH'), 'GitHub Event');
  const runId = requiredEnv('GITHUB_RUN_ID');
  const repository = requiredEnv('GITHUB_REPOSITORY');
  const issueNumber = event?.issue?.number;

  if (repository !== 'SvenKulessa/Finance') fail('Workflow läuft nicht im kanonischen Finance-Repository.');
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) fail('Issue-Nummer fehlt.');
  if (event?.issue?.user?.login !== OWNER) fail('Issue-Autor ist nicht der kanonische Owner.');
  if (typeof event?.issue?.title !== 'string' || !event.issue.title.startsWith('[SYSTEMADMIN-WORK-PACKAGE]')) {
    fail('Issue-Titel ist kein Work-Package-Request.');
  }

  const workPackage = lookupWorkPackage(request.workPackageId);
  if (!workPackage) fail(`workPackageId ist nicht im Katalog registriert: ${request.workPackageId}.`);
  if (!workPackage.mandateId.startsWith(MANDATE_PREFIX)) fail('Katalogeintrag verletzt das Mandat-Präfix.');
  if (request.mandateId !== workPackage.mandateId) fail('Request-Mandat stimmt nicht mit dem Katalogeintrag überein.');
  if (request.roadmapItem !== workPackage.roadmapItem) fail('Request-Roadmap-Item stimmt nicht mit dem Katalogeintrag überein.');

  const mandate = readJson(workPackage.mandateFile, 'Work-Package REM');
  if (mandate?.mandateId !== workPackage.mandateId) fail('Mandat-Datei stimmt nicht mit dem Katalogeintrag überein.');
  if (mandate?.status !== 'OWNER_APPROVED') fail('Work-Package REM ist nicht Owner-approved.');
  if (!Array.isArray(mandate.allowedPaths) || mandate.allowedPaths.length !== 1 || mandate.allowedPaths[0] !== workPackage.targetPath) {
    fail('Work-Package REM besitzt nicht die exakte Ein-Pfad-Allowlist des Katalogeintrags.');
  }
  if (JSON.stringify(mandate.allowedCapabilities) !== JSON.stringify(['BRANCH', 'COMMIT', 'PR'])) {
    fail('Work-Package REM Capability-Set ist nicht exakt BRANCH/COMMIT/PR.');
  }

  const mainSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (!SHA.test(mainSha) || mainSha !== request.baseSha) fail('baseSha ist nicht der ausgecheckte aktuelle main-Commit.');

  const targetOnMain = await githubApi(`/contents/${workPackage.targetPath}?ref=${encodeURIComponent('main')}`, {}, [404]);
  if (targetOnMain.status !== 404) fail('Der Zielpfad dieses Arbeitspakets existiert bereits auf main.');

  const initialPrState = await collectOpenPrState(workPackage.branchPrefix, workPackage.targetPath);
  if (initialPrState.conflict) fail('Concurrent-writer Konflikt auf dem Work-Package-Zielpfad.');

  const oidcToken = await requestOidcToken();

  const branchAuthorization = await authorize({
    capability: 'BRANCH',
    request,
    mandate,
    issueNumber,
    runId,
    oidcToken,
    currentHeadSha: request.baseSha,
    requestedPaths: [],
    checkpoint: { freshBranchCreated: false },
    prState: initialPrState,
  });

  let branchCreated = false;
  let commitSha = '';
  let pullRequestNumber = null;

  try {
    await githubApi('/git/refs', {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${request.branchName}`, sha: request.baseSha }),
    });
    branchCreated = true;
  } catch (error) {
    await outcome({
      authorization: branchAuthorization.response,
      result: 'ERROR',
      branchName: request.branchName,
      oidcToken,
      issueNumber,
    }).catch(() => {});
    throw error;
  }

  let branchOutcome;
  try {
    branchOutcome = await outcome({
      authorization: branchAuthorization.response,
      result: 'SUCCESS',
      branchName: request.branchName,
      oidcToken,
      issueNumber,
    });
  } catch (error) {
    await deleteBranch(request.branchName, workPackage.branchPrefix).catch(() => {});
    throw error;
  }

  const commitPrState = await collectOpenPrState(workPackage.branchPrefix, workPackage.targetPath);
  if (commitPrState.conflict) {
    await deleteBranch(request.branchName, workPackage.branchPrefix).catch(() => {});
    fail('Concurrent-writer Konflikt entstand vor COMMIT.');
  }

  const commitAuthorization = await authorize({
    capability: 'COMMIT',
    request,
    mandate,
    issueNumber,
    runId,
    oidcToken,
    currentHeadSha: request.baseSha,
    requestedPaths: [workPackage.targetPath],
    checkpoint: {
      freshBranchCreated: true,
      targetedValidationPassed: true,
    },
    prState: commitPrState,
  });

  const evidence = workPackage.generate({
    request,
    issueNumber,
    runId,
    branchAuth: branchAuthorization.auditReference,
    branchOutcome,
    commitAuth: commitAuthorization.auditReference,
  });
  const expectedDigest = sha256(evidence);

  try {
    const { body: created } = await githubApi(`/contents/${workPackage.targetPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: workPackage.commitMessage,
        content: Buffer.from(evidence, 'utf8').toString('base64'),
        branch: request.branchName,
      }),
    });
    commitSha = created?.commit?.sha;
    if (typeof commitSha !== 'string' || !SHA.test(commitSha)) fail('GitHub lieferte keinen gültigen Commit-SHA.');

    const { body: committedFile } = await githubApi(
      `/contents/${workPackage.targetPath}?ref=${encodeURIComponent(request.branchName)}`,
    );
    if (typeof committedFile?.content !== 'string' || committedFile.encoding !== 'base64') {
      fail('Committed Work-Package-Datei konnte nicht verifiziert werden.');
    }
    const actual = Buffer.from(committedFile.content.replace(/\n/g, ''), 'base64').toString('utf8');
    if (sha256(actual) !== expectedDigest || actual !== evidence) {
      fail('Committed Work-Package-Datei stimmt nicht mit dem trusted deterministic payload überein.');
    }
  } catch (error) {
    await outcome({
      authorization: commitAuthorization.response,
      result: 'ERROR',
      branchName: request.branchName,
      ...(commitSha ? { commitSha } : {}),
      oidcToken,
      issueNumber,
    }).catch(() => {});
    if (branchCreated) await deleteBranch(request.branchName, workPackage.branchPrefix).catch(() => {});
    throw error;
  }

  let commitOutcome;
  try {
    commitOutcome = await outcome({
      authorization: commitAuthorization.response,
      result: 'SUCCESS',
      branchName: request.branchName,
      commitSha,
      oidcToken,
      issueNumber,
    });
  } catch (error) {
    await deleteBranch(request.branchName, workPackage.branchPrefix).catch(() => {});
    throw error;
  }

  const prState = await collectOpenPrState(workPackage.branchPrefix, workPackage.targetPath);
  if (prState.conflict) {
    await deleteBranch(request.branchName, workPackage.branchPrefix).catch(() => {});
    fail('Concurrent-writer Konflikt entstand vor PR-Erstellung.');
  }

  const prAuthorization = await authorize({
    capability: 'PR',
    request,
    mandate,
    issueNumber,
    runId,
    oidcToken,
    currentHeadSha: commitSha,
    requestedPaths: [workPackage.targetPath],
    checkpoint: {
      freshBranchCreated: true,
      implementationComplete: true,
      targetedValidationPassed: true,
      pullRequestOpen: false,
    },
    prState,
  });

  const prBody = `## Systemadmin Work-Package Catalog (ADR-0074)\n\nThis draft PR was created by the audit-bound CAPITAL-AI Systemadmin work-package host.\n\n- Work package: \`${workPackage.workPackageId}\`\n- Mandate: \`${request.mandateId}\`\n- Roadmap item: \`${request.roadmapItem}\`\n- Workflow run: \`${runId}\`\n- Branch authorization: \`${branchAuthorization.auditReference}\`\n- Branch outcome: \`${branchOutcome}\`\n- Commit authorization: \`${commitAuthorization.auditReference}\`\n- Commit outcome: \`${commitOutcome}\`\n- PR authorization: \`${prAuthorization.auditReference}\`\n- Commit: \`${commitSha}\`\n- Exact path: \`${workPackage.targetPath}\`\n\nNo production mutation, deployment, CI request or merge is delegated. Final file review, final CI authorization and merge remain Human/Owner-only.\n`;

  try {
    const { body: pr } = await githubApi('/pulls', {
      method: 'POST',
      body: JSON.stringify({
        title: workPackage.prTitle,
        head: request.branchName,
        base: 'main',
        body: prBody,
        draft: true,
      }),
    });
    pullRequestNumber = pr?.number;
    if (!Number.isInteger(pullRequestNumber) || pullRequestNumber <= 0) fail('GitHub lieferte keine gültige PR-Nummer.');
  } catch (error) {
    await outcome({
      authorization: prAuthorization.response,
      result: 'ERROR',
      branchName: request.branchName,
      commitSha,
      oidcToken,
      issueNumber,
    }).catch(() => {});
    await deleteBranch(request.branchName, workPackage.branchPrefix).catch(() => {});
    throw error;
  }

  let prOutcome;
  try {
    prOutcome = await outcome({
      authorization: prAuthorization.response,
      result: 'SUCCESS',
      branchName: request.branchName,
      commitSha,
      pullRequestNumber,
      oidcToken,
      issueNumber,
    });
  } catch (error) {
    await closeDraftPr(pullRequestNumber).catch(() => {});
    await deleteBranch(request.branchName, workPackage.branchPrefix).catch(() => {});
    throw error;
  }

  const comment = [
    `Systemadmin work package \`${workPackage.workPackageId}\`: **HOST EXECUTION PASS**`,
    '',
    `- Branch: \`${request.branchName}\``,
    `- Commit: \`${commitSha}\``,
    `- Draft PR: \`#${pullRequestNumber}\``,
    `- BRANCH Authorization: \`${branchAuthorization.auditReference}\``,
    `- BRANCH Outcome: \`${branchOutcome}\``,
    `- COMMIT Authorization: \`${commitAuthorization.auditReference}\``,
    `- COMMIT Outcome: \`${commitOutcome}\``,
    `- PR Authorization: \`${prAuthorization.auditReference}\``,
    `- PR Outcome: \`${prOutcome}\``,
    '',
    'Human file review, final CI authorization and merge remain mandatory.',
  ].join('\n');

  await githubApi(`/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: comment }),
  });
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
