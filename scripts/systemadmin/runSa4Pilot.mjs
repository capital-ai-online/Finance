import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const OWNER = 'SvenKulessa';
const AGENT_ID = 'capital-ai-systemadmin-roadmap-executor';
const APP_ID = 'chatgpt-github-connector';
const TARGET_PATH = 'docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md';
const SA3B_PROBE_BRANCH = 'agent/sa3b-host-probe-20260812b';
const AUDIT_REFERENCE = /^supabase:agent_audit_events:[A-Za-z0-9_-]+$/;
const SHA = /^[a-f0-9]{40}$/;

function fail(message) {
  throw new Error(`[SA4-HOST][SECURITY] ${message}`);
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
    throw new Error(`[SA4-HOST] HTTP ${response.status} for ${url}: ${detail || 'no response body'}`);
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

async function collectOpenPrState() {
  const { body: pulls } = await githubApi('/pulls?state=open&per_page=100');
  if (!Array.isArray(pulls)) fail('Open-PR-Inventar ist ungültig.');

  const openSystemadminPullRequests = pulls.filter(pull =>
    typeof pull?.head?.ref === 'string' && pull.head.ref.startsWith('agent/sa4-pilot-'),
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
      if (page === 10) fail(`PR #${pull.number} überschreitet das SA4-Inventarlimit.`);
    }
  }

  return {
    openSystemadminPullRequests,
    openPullRequestChangedPaths: [...changed].sort(),
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

async function deleteBranch(branchName) {
  if (branchName === 'main' || !branchName.startsWith('agent/sa4-pilot-')) return;
  await githubApi(`/git/refs/heads/${branchName}`, { method: 'DELETE' }, [404]);
}

async function closeDraftPr(prNumber) {
  if (!Number.isInteger(prNumber)) return;
  await githubApi(`/pulls/${prNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed' }),
  }, [404]);
}

function deterministicEvidence({ request, issueNumber, runId, branchAuth, branchOutcome, commitAuth }) {
  return `# SA4 First Autonomous Work Package Evidence\n\nStatus: GENERATED BY AUDIT-BOUND SA4 HOST / HUMAN MERGE REQUIRED\n\nThis file is the deliberately bounded output of the first CAPITAL-AI autonomous Systemadmin work package. It was generated by trusted GitHub Actions host code; the triggering Issue cannot supply this Markdown body.\n\n## Bound execution\n\n- Mandate: \`${request.mandateId}\`\n- Roadmap item: \`${request.roadmapItem}\`\n- Issue: \`#${issueNumber}\`\n- Workflow run: \`${runId}\`\n- Base SHA: \`${request.baseSha}\`\n- Branch: \`${request.branchName}\`\n- Path: \`${TARGET_PATH}\`\n\n## Pre-side-effect audit evidence\n\n- BRANCH authorization: \`${branchAuth}\`\n- BRANCH outcome: \`${branchOutcome}\`\n- COMMIT authorization: \`${commitAuth}\`\n\n## Security boundary\n\nThe pilot is documentation-only. It does not request CI, deploy, mutate production, change IAM, expose secrets, alter repository protection or merge a pull request. Final review and merge remain Human/Owner-only.\n`;
}

async function main() {
  const request = readJson(requiredEnv('SYSTEMADMIN_REQUEST_FILE'), 'SA4 Request');
  const mandate = readJson(requiredEnv('SYSTEMADMIN_MANDATE_FILE'), 'SA4 REM');
  const event = readJson(requiredEnv('GITHUB_EVENT_PATH'), 'GitHub Event');
  const runId = requiredEnv('GITHUB_RUN_ID');
  const repository = requiredEnv('GITHUB_REPOSITORY');
  const issueNumber = event?.issue?.number;

  if (repository !== 'SvenKulessa/Finance') fail('Workflow läuft nicht im kanonischen Finance-Repository.');
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) fail('Issue-Nummer fehlt.');
  if (event?.issue?.user?.login !== OWNER) fail('Issue-Autor ist nicht der kanonische Owner.');
  if (typeof event?.issue?.title !== 'string' || !event.issue.title.startsWith('[SA4-PILOT]')) {
    fail('Issue-Titel ist kein SA4-Pilot-Request.');
  }
  if (request.mandateId !== 'REM-SA4-PILOT-001' || mandate?.mandateId !== request.mandateId) {
    fail('SA4 Mandat-Bindung stimmt nicht.');
  }
  if (mandate?.status !== 'OWNER_APPROVED') fail('SA4 REM ist nicht Owner-approved.');
  if (!Array.isArray(mandate.allowedPaths) || mandate.allowedPaths.length !== 1 || mandate.allowedPaths[0] !== TARGET_PATH) {
    fail('SA4 REM besitzt nicht die exakte Ein-Pfad-Allowlist.');
  }
  if (JSON.stringify(mandate.allowedCapabilities) !== JSON.stringify(['BRANCH', 'COMMIT', 'PR'])) {
    fail('SA4 REM Capability-Set ist nicht exakt BRANCH/COMMIT/PR.');
  }

  const mainSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (!SHA.test(mainSha) || mainSha !== request.baseSha) fail('baseSha ist nicht der ausgecheckte aktuelle main-Commit.');

  const cleanupCheck = await githubApi(`/git/ref/heads/${SA3B_PROBE_BRANCH}`, {}, [404]);
  if (cleanupCheck.status !== 404) {
    fail(`SA3B Cleanup ist nicht abgeschlossen; Probe-Branch ${SA3B_PROBE_BRANCH} existiert noch.`);
  }

  const targetOnMain = await githubApi(`/contents/${TARGET_PATH}?ref=${encodeURIComponent('main')}`, {}, [404]);
  if (targetOnMain.status !== 404) fail('Das einmalige SA4-Pilot-Artefakt existiert bereits auf main.');

  const initialPrState = await collectOpenPrState();
  if (initialPrState.openPullRequestChangedPaths.includes(TARGET_PATH)) {
    fail('Concurrent-writer Konflikt auf dem SA4-Pilot-Pfad.');
  }

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
    await deleteBranch(request.branchName).catch(() => {});
    throw error;
  }

  const commitPrState = await collectOpenPrState();
  if (commitPrState.openPullRequestChangedPaths.includes(TARGET_PATH)) {
    await deleteBranch(request.branchName).catch(() => {});
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
    requestedPaths: [TARGET_PATH],
    checkpoint: {
      freshBranchCreated: true,
      targetedValidationPassed: true,
    },
    prState: commitPrState,
  });

  const evidence = deterministicEvidence({
    request,
    issueNumber,
    runId,
    branchAuth: branchAuthorization.auditReference,
    branchOutcome,
    commitAuth: commitAuthorization.auditReference,
  });
  const expectedDigest = sha256(evidence);

  try {
    const { body: created } = await githubApi(`/contents/${TARGET_PATH}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'docs(sa4): first autonomous work package evidence',
        content: Buffer.from(evidence, 'utf8').toString('base64'),
        branch: request.branchName,
      }),
    });
    commitSha = created?.commit?.sha;
    if (typeof commitSha !== 'string' || !SHA.test(commitSha)) fail('GitHub lieferte keinen gültigen Commit-SHA.');

    const { body: committedFile } = await githubApi(
      `/contents/${TARGET_PATH}?ref=${encodeURIComponent(request.branchName)}`,
    );
    if (typeof committedFile?.content !== 'string' || committedFile.encoding !== 'base64') {
      fail('Committed Pilot-Datei konnte nicht verifiziert werden.');
    }
    const actual = Buffer.from(committedFile.content.replace(/\n/g, ''), 'base64').toString('utf8');
    if (sha256(actual) !== expectedDigest || actual !== evidence) {
      fail('Committed Pilot-Datei stimmt nicht mit dem trusted deterministic payload überein.');
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
    if (branchCreated) await deleteBranch(request.branchName).catch(() => {});
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
    await deleteBranch(request.branchName).catch(() => {});
    throw error;
  }

  const prState = await collectOpenPrState();
  if (prState.openPullRequestChangedPaths.includes(TARGET_PATH)) {
    await deleteBranch(request.branchName).catch(() => {});
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
    requestedPaths: [TARGET_PATH],
    checkpoint: {
      freshBranchCreated: true,
      implementationComplete: true,
      targetedValidationPassed: true,
      pullRequestOpen: false,
    },
    prState,
  });

  const prBody = `## SA4 bounded autonomous pilot\n\nThis draft PR was created by the audit-bound CAPITAL-AI Systemadmin execution host.\n\n- Mandate: \`${request.mandateId}\`\n- Roadmap item: \`${request.roadmapItem}\`\n- Workflow run: \`${runId}\`\n- Branch authorization: \`${branchAuthorization.auditReference}\`\n- Branch outcome: \`${branchOutcome}\`\n- Commit authorization: \`${commitAuthorization.auditReference}\`\n- Commit outcome: \`${commitOutcome}\`\n- PR authorization: \`${prAuthorization.auditReference}\`\n- Commit: \`${commitSha}\`\n- Exact path: \`${TARGET_PATH}\`\n\nNo production mutation, deployment, CI request or merge is delegated. Final file review, final CI authorization and merge remain Human/Owner-only.\n`;

  try {
    const { body: pr } = await githubApi('/pulls', {
      method: 'POST',
      body: JSON.stringify({
        title: 'docs(sa4): ersten autonomen Work-Package-Pilot nachweisen',
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
    await deleteBranch(request.branchName).catch(() => {});
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
    await deleteBranch(request.branchName).catch(() => {});
    throw error;
  }

  const comment = [
    'SA4 bounded autonomous pilot: **HOST EXECUTION PASS**',
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
