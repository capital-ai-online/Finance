#!/usr/bin/env node
import fs from 'node:fs/promises';

const api = process.env.GITHUB_API_URL || 'https://api.github.com';
const repo = process.env.REPOSITORY;
const token = process.env.GH_TOKEN;
const baseSha = process.env.BASE_SHA;
const alertNumber = Number(process.env.ALERT_NUMBER || 0);
const out = process.env.GITHUB_OUTPUT;

const output = async (key, value) => fs.appendFile(out, `${key}=${value}\n`);

if (!repo || !token || !/^[0-9a-f]{40}$/i.test(baseSha || '') || !Number.isInteger(alertNumber) || alertNumber < 1) {
  await output('codeql_status', 'NOT_PROVEN');
  await output('codeql_reason', 'invalid-provider-evidence-input');
  process.exit(0);
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
};

const request = async (path) => {
  const res = await fetch(`${api}/repos/${repo}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${path}`);
  return res.json();
};

try {
  const alert = await request(`/code-scanning/alerts/${alertNumber}`);
  const instance = alert.most_recent_instance || {};
  const tool = String(alert.tool?.name || '').toLowerCase();
  const state = String(alert.state || '').toLowerCase();
  const ref = String(instance.ref || '');
  const commitSha = String(instance.commit_sha || '');

  if (tool !== 'codeql') {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'selected-alert-not-codeql');
  } else if (ref !== 'refs/heads/main') {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'provider-alert-not-on-main');
  } else if (commitSha !== baseSha) {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'provider-evidence-not-exact-base-sha');
  } else if (state !== 'open') {
    await output('codeql_status', 'PASS');
    await output('codeql_reason', 'provider-alert-no-longer-open-on-exact-base');
  } else {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'provider-alert-still-open-on-exact-base');
  }
} catch (error) {
  await output('codeql_status', 'NOT_PROVEN');
  await output('codeql_reason', 'provider-read-failed');
  console.error(error instanceof Error ? error.message : error);
}
