import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canonicalUnsignedPayload,
  computeAttestationId,
  stableStringify,
  validateShadowAttestation,
} from './shadowAttestation.mjs';

const BASE = '1'.repeat(40);
const HEAD = '2'.repeat(40);
const NOW = Date.parse('2026-08-21T09:30:00Z');

function fixture() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const registry = {
    schemaVersion: '1.0.0',
    state: 'SHADOW_ONLY',
    repository: 'SvenKulessa/Finance',
    maxAgeSeconds: 3600,
    requiredToolchain: {
      node: '24.18.0',
      platform: 'linux',
      arch: 'x64',
    },
    signers: [
      {
        id: 'shadow-test-signer',
        status: 'active',
        algorithm: 'ed25519',
        publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
      },
    ],
  };
  const scope = {
    class: 'C',
    integrity: true,
    lint: true,
    unit: true,
    build: false,
    audit: false,
    predeploy: false,
    docker: false,
    docker_image: false,
  };
  const attestation = {
    schemaVersion: '1.0.0',
    mode: 'SHADOW_ONLY',
    generatedAt: '2026-08-21T09:15:00Z',
    expiresAt: '2026-08-21T10:00:00Z',
    nonce: '80f6d4d7-1f16-4c1c-9c8d-ae4f344a7935',
    subject: {
      repository: 'SvenKulessa/Finance',
      prNumber: 470,
      baseSha: BASE,
      headSha: HEAD,
      scopeClass: 'C',
    },
    scope,
    producer: {
      signerId: 'shadow-test-signer',
      surface: 'independent-shadow-runner',
      runId: 'shadow-run-001',
      candidateControlled: false,
    },
    toolchain: {
      node: '24.18.0',
      platform: 'linux',
      arch: 'x64',
    },
    checks: [
      { id: 'repository_integrity', status: 'pass', evidenceDigest: `sha256:${'a'.repeat(64)}` },
      { id: 'typescript', status: 'pass', evidenceDigest: `sha256:${'b'.repeat(64)}` },
      { id: 'unit_tests', status: 'pass', evidenceDigest: `sha256:${'c'.repeat(64)}` },
    ],
  };
  attestation.attestationId = computeAttestationId(attestation);
  attestation.signature = {
    algorithm: 'ed25519',
    signerId: 'shadow-test-signer',
    value: sign(
      null,
      Buffer.from(stableStringify(canonicalUnsignedPayload(attestation)), 'utf8'),
      privateKey,
    ).toString('base64'),
  };
  return { registry, scope, attestation };
}

function verify(attestation, registry, scope, expected = {}) {
  return validateShadowAttestation(attestation, {
    trustRegistry: registry,
    expected: {
      repository: 'SvenKulessa/Finance',
      prNumber: 470,
      baseSha: BASE,
      headSha: HEAD,
      scopeClass: 'C',
      scope,
      ...expected,
    },
    now: NOW,
  });
}

test('accepts a correctly signed exact PR/base/head shadow attestation', () => {
  const { registry, scope, attestation } = fixture();
  const result = verify(attestation, registry, scope);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.requiredChecks, ['repository_integrity', 'typescript', 'unit_tests']);
});

test('rejects replay onto a different PR, head or base', () => {
  const { registry, scope, attestation } = fixture();
  for (const expected of [
    { prNumber: 471 },
    { headSha: '3'.repeat(40) },
    { baseSha: '4'.repeat(40) },
    { repository: 'SvenKulessa/Other' },
  ]) {
    const result = verify(attestation, registry, scope, expected);
    assert.equal(result.ok, false);
    assert.match(result.errors.join('; '), /mismatch|outside trusted registry scope/);
  }
});

test('allows exact-subject evidence reuse within TTL but never cross-subject replay', () => {
  const { registry, scope, attestation } = fixture();
  assert.equal(verify(attestation, registry, scope).ok, true);
  assert.equal(verify(attestation, registry, scope).ok, true);
  assert.equal(verify(attestation, registry, scope, { headSha: '5'.repeat(40) }).ok, false);
});

test('rejects expired and materially future-dated evidence', () => {
  const expired = fixture();
  expired.attestation.expiresAt = '2026-08-21T09:00:00Z';
  expired.attestation.attestationId = computeAttestationId(expired.attestation);
  const expiredResult = verify(expired.attestation, expired.registry, expired.scope);
  assert.equal(expiredResult.ok, false);
  assert.match(expiredResult.errors.join('; '), /expired/);

  const future = fixture();
  future.attestation.generatedAt = '2026-08-21T10:30:00Z';
  future.attestation.expiresAt = '2026-08-21T11:00:00Z';
  future.attestation.attestationId = computeAttestationId(future.attestation);
  const futureResult = verify(future.attestation, future.registry, future.scope);
  assert.equal(futureResult.ok, false);
  assert.match(futureResult.errors.join('; '), /future/);
});

test('rejects candidate-controlled, unsigned and unknown-signer evidence', () => {
  const candidate = fixture();
  candidate.attestation.producer.candidateControlled = true;
  candidate.attestation.attestationId = computeAttestationId(candidate.attestation);
  assert.match(verify(candidate.attestation, candidate.registry, candidate.scope).errors.join('; '), /candidateControlled/);

  const unsigned = fixture();
  delete unsigned.attestation.signature;
  assert.match(verify(unsigned.attestation, unsigned.registry, unsigned.scope).errors.join('; '), /signature/);

  const unknown = fixture();
  unknown.registry.signers = [];
  assert.match(verify(unknown.attestation, unknown.registry, unknown.scope).errors.join('; '), /not trusted/);
});

test('rejects tampering and missing scope-required checks', () => {
  const tampered = fixture();
  tampered.attestation.checks[0].evidenceDigest = `sha256:${'d'.repeat(64)}`;
  const tamperedResult = verify(tampered.attestation, tampered.registry, tampered.scope);
  assert.equal(tamperedResult.ok, false);
  assert.match(tamperedResult.errors.join('; '), /attestationId mismatch|signature verification failed/);

  const missing = fixture();
  missing.attestation.checks = missing.attestation.checks.filter((check) => check.id !== 'unit_tests');
  missing.attestation.attestationId = computeAttestationId(missing.attestation);
  const missingResult = verify(missing.attestation, missing.registry, missing.scope);
  assert.equal(missingResult.ok, false);
  assert.match(missingResult.errors.join('; '), /required check missing: unit_tests/);
});

test('repository trust registry is fail-closed with no active signer during shadow phase', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const registryPath = path.join(root, '.github/policies/pre-pr-attestation-trust.shadow.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  assert.equal(registry.state, 'SHADOW_ONLY');
  assert.deepEqual(registry.signers, []);
  assert.equal(registry.authorizesRequiredCheck, false);
});
