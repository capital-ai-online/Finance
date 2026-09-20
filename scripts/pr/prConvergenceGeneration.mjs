#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import { appendGithubOutput, fail } from './lib.mjs';

export const PR_CONVERGENCE_GENERATION_SCHEMA = 'capital-ai-pr-convergence-generation/1.0.0';

const SHA = /^[0-9a-f]{40}$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const CONTROL_PLANE_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9._-]+)?$/;

function normalizeSha(value, label) {
  const sha = String(value || '').trim().toLowerCase();
  if (!SHA.test(sha)) throw new Error(`${label} must be a lowercase 40-character Git SHA.`);
  return sha;
}

export function readControlPlaneVersion(agentsText) {
  const match = String(agentsText || '').match(/^\*\*Control Plane Version:\*\*\s+`([^`]+)`\s*$/m);
  if (!match) throw new Error('AGENTS.md does not expose one Control Plane Version.');
  const version = match[1].trim();
  if (!CONTROL_PLANE_VERSION.test(version)) {
    throw new Error(`Invalid Control Plane Version: ${version}`);
  }
  return version;
}

export function buildPrConvergenceGeneration(input) {
  const repository = String(input.repository || '').trim().toLowerCase();
  const prNumber = Number(input.prNumber);
  const controlPlaneVersion = String(input.controlPlaneVersion || '').trim();
  const headSha = normalizeSha(input.headSha, 'headSha');
  const baseSha = normalizeSha(input.baseSha, 'baseSha');
  const currentMainSha = normalizeSha(input.currentMainSha, 'currentMainSha');

  if (!REPOSITORY.test(repository)) throw new Error('repository must use owner/name format.');
  if (!Number.isInteger(prNumber) || prNumber <= 0) throw new Error('prNumber must be a positive integer.');
  if (!CONTROL_PLANE_VERSION.test(controlPlaneVersion)) {
    throw new Error('controlPlaneVersion must be a semantic version.');
  }
  if (baseSha !== currentMainSha) {
    throw new Error(`PR base/current-main drift: base=${baseSha} currentMain=${currentMainSha}`);
  }

  const canonical = [
    `schema=${PR_CONVERGENCE_GENERATION_SCHEMA}`,
    `repository=${repository}`,
    `pr=${prNumber}`,
    `head=${headSha}`,
    `base=${baseSha}`,
    `current_main=${currentMainSha}`,
    `control_plane=${controlPlaneVersion}`,
  ].join('\n') + '\n';

  const digest = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');

  return Object.freeze({
    schemaVersion: PR_CONVERGENCE_GENERATION_SCHEMA,
    repository,
    prNumber,
    headSha,
    baseSha,
    currentMainSha,
    controlPlaneVersion,
    generationId: `sha256:${digest}`,
    writerLeaseKey: `capital-ai-pr-writer-${prNumber}`,
    canonical,
  });
}

function main() {
  const agentsPath = String(process.env.AGENTS_PATH || 'AGENTS.md').trim();
  if (!agentsPath || !fs.existsSync(agentsPath)) fail(`AGENTS_PATH does not exist: ${agentsPath}`);

  let generation;
  try {
    generation = buildPrConvergenceGeneration({
      repository: process.env.REPOSITORY,
      prNumber: process.env.PR_NUMBER,
      headSha: process.env.HEAD_SHA,
      baseSha: process.env.BASE_SHA,
      currentMainSha: process.env.CURRENT_MAIN_SHA,
      controlPlaneVersion: readControlPlaneVersion(fs.readFileSync(agentsPath, 'utf8')),
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  appendGithubOutput({
    generation_id: generation.generationId,
    writer_lease_key: generation.writerLeaseKey,
    control_plane_version: generation.controlPlaneVersion,
    generation_schema: generation.schemaVersion,
  });

  console.log(JSON.stringify({
    schemaVersion: generation.schemaVersion,
    repository: generation.repository,
    prNumber: generation.prNumber,
    headSha: generation.headSha,
    baseSha: generation.baseSha,
    currentMainSha: generation.currentMainSha,
    controlPlaneVersion: generation.controlPlaneVersion,
    generationId: generation.generationId,
    writerLeaseKey: generation.writerLeaseKey,
  }, null, 2));
}

if (process.argv[1]?.endsWith('prConvergenceGeneration.mjs')) main();
