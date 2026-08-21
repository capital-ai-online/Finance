#!/usr/bin/env node

import fs from 'node:fs';
import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';

export const SHADOW_ATTESTATION_SCHEMA_VERSION = '1.0.0';
export const SHADOW_ATTESTATION_MODE = 'SHADOW_ONLY';
export const DEFAULT_TRUST_REGISTRY = '.github/policies/pre-pr-attestation-trust.shadow.json';

const SHA_RE = /^[0-9a-f]{40}$/i;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function canonicalUnsignedPayload(attestation) {
  if (!attestation || typeof attestation !== 'object' || Array.isArray(attestation)) return {};
  const { signature: _signature, attestationId: _attestationId, ...payload } = attestation;
  return payload;
}

export function computeAttestationId(attestation) {
  const canonical = stableStringify(canonicalUnsignedPayload(attestation));
  return `sha256:${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
}

export function requiredCheckIds(scope = {}) {
  const required = new Set();
  if (scope.integrity === true) required.add('repository_integrity');
  if (scope.lint === true) required.add('typescript');
  if (scope.unit === true) required.add('unit_tests');
  if (scope.build === true) {
    required.add('production_build');
    required.add('production_csp');
  }
  if (scope.audit === true) required.add('dependency_audit');
  if (scope.predeploy === true) required.add('predeploy');
  if (scope.docker === true) required.add('docker_hardening');
  if (scope.docker_image === true) required.add('docker_image');
  return [...required].sort();
}

function parseTime(value, label, errors) {
  const parsed = Date.parse(String(value || ''));
  if (Number.isNaN(parsed)) {
    errors.push(`${label} must be an ISO-8601 timestamp`);
    return null;
  }
  return parsed;
}

function normalizeSha(value) {
  return String(value || '').toLowerCase();
}

function expectEqual(errors, label, actual, expected) {
  if (expected === undefined || expected === null || expected === '') return;
  if (String(actual) !== String(expected)) {
    errors.push(`${label} mismatch; expected ${expected}, got ${actual}`);
  }
}

export function validateShadowAttestation(
  attestation,
  {
    trustRegistry,
    expected = {},
    now = Date.now(),
    clockSkewSeconds = 300,
  } = {},
) {
  const errors = [];

  if (!attestation || typeof attestation !== 'object' || Array.isArray(attestation)) {
    return { ok: false, errors: ['attestation must be a JSON object'] };
  }
  if (!trustRegistry || typeof trustRegistry !== 'object' || Array.isArray(trustRegistry)) {
    return { ok: false, errors: ['trust registry is required'] };
  }

  if (attestation.schemaVersion !== SHADOW_ATTESTATION_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${SHADOW_ATTESTATION_SCHEMA_VERSION}`);
  }
  if (attestation.mode !== SHADOW_ATTESTATION_MODE) {
    errors.push(`mode must remain ${SHADOW_ATTESTATION_MODE}; shadow evidence cannot authorize CI`);
  }
  if (trustRegistry.schemaVersion !== '1.0.0') errors.push('trust registry schemaVersion must be 1.0.0');
  if (trustRegistry.state !== SHADOW_ATTESTATION_MODE) {
    errors.push(`trust registry state must remain ${SHADOW_ATTESTATION_MODE} until a separate Owner cutover`);
  }

  const subject = attestation.subject || {};
  if (!subject.repository) errors.push('subject.repository is required');
  if (!Number.isInteger(subject.prNumber) || subject.prNumber <= 0) errors.push('subject.prNumber must be a positive integer');
  if (!SHA_RE.test(String(subject.baseSha || ''))) errors.push('subject.baseSha must be a full 40-character Git SHA');
  if (!SHA_RE.test(String(subject.headSha || ''))) errors.push('subject.headSha must be a full 40-character Git SHA');
  if (!['D', 'C', 'R'].includes(subject.scopeClass)) errors.push('subject.scopeClass must be D, C or R');

  if (trustRegistry.repository && subject.repository !== trustRegistry.repository) {
    errors.push(`subject.repository is outside trusted registry scope: ${subject.repository}`);
  }
  expectEqual(errors, 'repository', subject.repository, expected.repository);
  expectEqual(errors, 'prNumber', subject.prNumber, expected.prNumber);
  if (expected.baseSha) expectEqual(errors, 'baseSha', normalizeSha(subject.baseSha), normalizeSha(expected.baseSha));
  if (expected.headSha) expectEqual(errors, 'headSha', normalizeSha(subject.headSha), normalizeSha(expected.headSha));
  expectEqual(errors, 'scopeClass', subject.scopeClass, expected.scopeClass);

  const generatedAt = parseTime(attestation.generatedAt, 'generatedAt', errors);
  const expiresAt = parseTime(attestation.expiresAt, 'expiresAt', errors);
  const maxAgeSeconds = Number(trustRegistry.maxAgeSeconds ?? 3600);
  const skewMs = Number(clockSkewSeconds) * 1000;
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) errors.push('trust registry maxAgeSeconds must be positive');
  if (generatedAt !== null && generatedAt > now + skewMs) errors.push('generatedAt is materially in the future');
  if (generatedAt !== null && now - generatedAt > maxAgeSeconds * 1000) errors.push('attestation is stale beyond trust registry maxAgeSeconds');
  if (generatedAt !== null && expiresAt !== null && expiresAt <= generatedAt) errors.push('expiresAt must be later than generatedAt');
  if (expiresAt !== null && now > expiresAt + skewMs) errors.push('attestation is expired');

  if (!attestation.nonce || typeof attestation.nonce !== 'string' || attestation.nonce.length < 16) {
    errors.push('nonce must be a non-empty high-entropy identifier');
  }

  const producer = attestation.producer || {};
  if (!producer.signerId) errors.push('producer.signerId is required');
  if (!producer.surface) errors.push('producer.surface is required');
  if (!producer.runId) errors.push('producer.runId is required');
  if (producer.candidateControlled !== false) {
    errors.push('producer.candidateControlled must be false; candidate self-attestation is non-authorizing');
  }

  const requiredToolchain = trustRegistry.requiredToolchain || {};
  const toolchain = attestation.toolchain || {};
  for (const [key, value] of Object.entries(requiredToolchain)) {
    expectEqual(errors, `toolchain.${key}`, toolchain[key], value);
  }

  const checks = Array.isArray(attestation.checks) ? attestation.checks : [];
  const checkMap = new Map();
  for (const check of checks) {
    const id = String(check?.id || '');
    if (!id) {
      errors.push('every check requires an id');
      continue;
    }
    if (checkMap.has(id)) errors.push(`duplicate check id: ${id}`);
    checkMap.set(id, check);
    if (check.status !== 'pass') errors.push(`check ${id} must have status=pass`);
    if (!DIGEST_RE.test(String(check.evidenceDigest || ''))) {
      errors.push(`check ${id} requires a sha256 evidenceDigest`);
    }
  }

  const expectedScope = expected.scope || attestation.scope || {};
  for (const id of requiredCheckIds(expectedScope)) {
    if (!checkMap.has(id)) errors.push(`required check missing: ${id}`);
  }

  const expectedId = computeAttestationId(attestation);
  if (attestation.attestationId !== expectedId) {
    errors.push(`attestationId mismatch; expected ${expectedId}`);
  }

  const signature = attestation.signature || {};
  if (signature.algorithm !== 'ed25519') errors.push('signature.algorithm must be ed25519');
  if (!signature.signerId) errors.push('signature.signerId is required');
  if (signature.signerId && producer.signerId && signature.signerId !== producer.signerId) {
    errors.push('signature.signerId must match producer.signerId');
  }
  if (!signature.value) errors.push('signature.value is required');

  const signers = Array.isArray(trustRegistry.signers) ? trustRegistry.signers : [];
  const signer = signers.find((candidate) => candidate?.id === signature.signerId);
  if (!signer) {
    errors.push(`signer is not trusted: ${signature.signerId || '<missing>'}`);
  } else {
    if (signer.status !== 'active') errors.push(`signer ${signer.id} is not active`);
    if (signer.algorithm !== 'ed25519') errors.push(`signer ${signer.id} must use ed25519`);
    if (!signer.publicKeyPem) {
      errors.push(`signer ${signer.id} has no publicKeyPem`);
    } else if (signature.value) {
      try {
        const verified = verifySignature(
          null,
          Buffer.from(stableStringify(canonicalUnsignedPayload(attestation)), 'utf8'),
          createPublicKey(signer.publicKeyPem),
          Buffer.from(signature.value, 'base64'),
        );
        if (!verified) errors.push('signature verification failed');
      } catch (error) {
        errors.push(`signature verification error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    attestationId: expectedId,
    requiredChecks: requiredCheckIds(expectedScope),
  };
}

function envExpected() {
  const prNumber = process.env.EXPECTED_PR_NUMBER ? Number(process.env.EXPECTED_PR_NUMBER) : undefined;
  return {
    repository: process.env.EXPECTED_REPOSITORY || process.env.GITHUB_REPOSITORY || undefined,
    prNumber: Number.isInteger(prNumber) ? prNumber : undefined,
    baseSha: process.env.EXPECTED_BASE_SHA || undefined,
    headSha: process.env.EXPECTED_HEAD_SHA || undefined,
    scopeClass: process.env.EXPECTED_SCOPE_CLASS || undefined,
  };
}

function main() {
  const verifyAt = process.argv.indexOf('--verify');
  if (verifyAt === -1 || !process.argv[verifyAt + 1]) {
    console.error('Usage: node scripts/pr/shadowAttestation.mjs --verify <attestation.json>');
    process.exitCode = 2;
    return;
  }

  const evidencePath = process.argv[verifyAt + 1];
  const registryPath = process.env.SHADOW_ATTESTATION_TRUST_REGISTRY || DEFAULT_TRUST_REGISTRY;
  const attestation = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const trustRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const result = validateShadowAttestation(attestation, {
    trustRegistry,
    expected: envExpected(),
  });

  if (!result.ok) {
    console.error(`[SHADOW-ATTESTATION] REJECT ${result.errors.join('; ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[SHADOW-ATTESTATION] PASS ${result.attestationId}`);
  console.log('Shadow evidence is non-authorizing and cannot satisfy build-and-test or merge authority.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('/shadowAttestation.mjs')) {
  main();
}
