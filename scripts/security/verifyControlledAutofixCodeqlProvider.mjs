#!/usr/bin/env node
import fs from 'node:fs/promises';

const candidateRef = String(process.env.CANDIDATE_REF || '');
const candidateSha = process.env.CANDIDATE_SHA;
const baseSha = process.env.BASE_SHA;
const alertNumber = Number(process.env.ALERT_NUMBER || 0);
const alertPath = process.env.CODEQL_ALERT_JSON;
const instancesPath = process.env.CODEQL_INSTANCES_JSON;
const out = process.env.GITHUB_OUTPUT;

const output = async (key, value) => fs.appendFile(out, `${key}=${value}\n`);
const validSha = (value) => /^[0-9a-f]{40}$/i.test(String(value || ''));
const validCandidateRef = (value) => /^refs\/heads\/[A-Za-z0-9._\/-]+$/.test(value) && !value.includes('..');

if (!out || !alertPath || !instancesPath || !validCandidateRef(candidateRef) || !validSha(candidateSha)
  || (baseSha && !validSha(baseSha)) || !Number.isInteger(alertNumber) || alertNumber < 1) {
  await output('codeql_status', 'NOT_PROVEN');
  await output('codeql_reason', 'invalid-provider-evidence-input');
  process.exit(0);
}

try {
  const alert = JSON.parse(await fs.readFile(alertPath, 'utf8'));
  const instances = JSON.parse(await fs.readFile(instancesPath, 'utf8'));

  if (String(alert?.tool?.name || '').toLowerCase() !== 'codeql') {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'selected-alert-not-codeql');
    process.exit(0);
  }
  if (Number(alert?.number || 0) !== alertNumber || !Array.isArray(instances)) {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'provider-evidence-identity-mismatch');
    process.exit(0);
  }

  const exact = instances.filter((instance) =>
    String(instance?.ref || '') === candidateRef
    && String(instance?.commit_sha || '').toLowerCase() === String(candidateSha).toLowerCase());

  if (!exact.length) {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'provider-analysis-missing-for-exact-candidate');
    process.exit(0);
  }

  const states = exact.map((instance) => String(instance?.state || '').toLowerCase());
  if (states.some((state) => state === 'open')) {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'provider-alert-still-open-on-exact-candidate');
  } else if (states.every((state) => state === 'fixed')) {
    await output('codeql_status', 'PASS');
    await output('codeql_reason', 'provider-alert-fixed-on-exact-candidate');
  } else {
    await output('codeql_status', 'NOT_PROVEN');
    await output('codeql_reason', 'provider-candidate-analysis-not-fixed');
  }
} catch (error) {
  await output('codeql_status', 'NOT_PROVEN');
  await output('codeql_reason', 'provider-read-failed');
  console.error(error instanceof Error ? error.message : error);
}
