#!/usr/bin/env node

import fs from 'node:fs';
import { fail, git, normalizeRepoPath } from '../pr/lib.mjs';

const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';

const statusRaw = git(['diff', '--name-status', `${baseRef}...${headRef}`, '--', '.github/workflows']);
const statusLines = statusRaw ? statusRaw.split(/\r?\n/).filter(Boolean) : [];

const failures = [];
const workflowFiles = [];

for (const line of statusLines) {
  const [status, ...rest] = line.split('\t');
  const name = normalizeRepoPath(rest[rest.length - 1] || '');
  if (!/\.ya?ml$/i.test(name)) continue;

  if (status === 'D') {
    failures.push(`${name}: workflow file deletion requires explicit Human/Owner security review; deletions are not exempt from workflow security policy.`);
    continue;
  }

  if (fs.existsSync(name)) workflowFiles.push(name);
}

for (const file of workflowFiles) {
  const content = fs.readFileSync(file, 'utf8');

  if (/\bpull_request_target\s*:/m.test(content)) {
    failures.push(`${file}: pull_request_target is forbidden for PR-controlled code; use pull_request with read-only permissions or a trusted default-branch workflow.`);
  }

  if (!/^permissions\s*:/m.test(content) && !/^\s+permissions\s*:/m.test(content)) {
    failures.push(`${file}: explicit minimum permissions are required.`);
  }

  if (/permissions\s*:\s*write-all/m.test(content)) {
    failures.push(`${file}: permissions: write-all is forbidden.`);
  }

  if (/persist-credentials\s*:\s*true/m.test(content)) {
    failures.push(`${file}: checkout persist-credentials:true is forbidden unless separately reviewed; default governance requires false.`);
  }

  const usesLines = [...content.matchAll(/^\s*-?\s*uses\s*:\s*([^\s#]+).*$/gm)].map((match) => match[1]);
  for (const value of usesLines) {
    if (value.startsWith('./')) continue;
    if (value.startsWith('docker://')) {
      if (!/@sha256:[0-9a-f]{64}$/i.test(value)) {
        failures.push(`${file}: container action ${value} is not pinned by sha256 digest.`);
      }
      continue;
    }

    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+@[0-9a-f]{40}$/i.test(value) &&
        !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[0-9a-f]{40}$/i.test(value)) {
      failures.push(`${file}: action ${value} must be pinned to an immutable full 40-character commit SHA.`);
    }
  }

  const isConcurrentEventWorkflow = /^\s{0,2}(push|pull_request|merge_group)\s*:/m.test(content);
  if (isConcurrentEventWorkflow && !/^concurrency\s*:/m.test(content)) {
    failures.push(`${file}: push/PR/merge-group workflow must define concurrency to prevent duplicate/racing runs.`);
  }
}

if (failures.length > 0) {
  fail(`Changed GitHub workflow security policy failed:\n- ${failures.join('\n- ')}`);
}

console.log(`[WORKFLOW-SECURITY] ${workflowFiles.length} changed workflow file(s) satisfy immutable-action, least-privilege and race-control baseline.`);
