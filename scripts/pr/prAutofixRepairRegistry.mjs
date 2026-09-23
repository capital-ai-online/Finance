export const PR_AUTOFIX_REPAIR_REGISTRY = Object.freeze([
  Object.freeze({
    id: 'MERGE_CADENCE_PATCH_V1',
    owner: 'CAPITAL-AI-OPS',
    sourceWorkflow: '.github/workflows/ci.yml',
    exactSignatures: Object.freeze(['MERGE_CADENCE_PATCH_V1']),
    repairerPath: 'scripts/pr/repairers/mergeCadencePatchV1.mjs',
    allowedPaths: Object.freeze([
      'package.json',
      'package-lock.json',
      'metadata.json',
      'docs/code-quality/CODE_QUALITY_STANDARDS.md',
      'docs/ceo/EXECUTIVE_SUMMARY.md',
      'docs/API.md',
      'index.html',
      'README.md',
    ]),
    evidenceBinding: Object.freeze({
      kind: 'EXACT_LOG_TOKENS_V1',
      requiredTokens: Object.freeze([
        'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: MERGE_CADENCE_PATCH_V1',
        'mergeOrdinal=',
        'expectedNextPatch=',
        'package.json/package-lock.json',
      ]),
    }),
  }),
  Object.freeze({
    id: 'SELF_HEALING_NEXT_SLICE_INVARIANT_V1',
    owner: 'CAPITAL-AI-OPS',
    sourceWorkflow: '.github/workflows/ci.yml',
    exactSignatures: Object.freeze(['SELF_HEALING_NEXT_SLICE_INVARIANT_V1']),
    repairerPath: 'scripts/pr/repairers/selfHealingNextSliceInvariantV1.mjs',
    allowedPaths: Object.freeze(['tests/unit/selfHealingSupersession.test.ts']),
    evidenceBinding: Object.freeze({
      kind: 'EXACT_LOG_TOKENS_V1',
      requiredTokens: Object.freeze([
        'tests/unit/selfHealingSupersession.test.ts',
        'releases merged SH-02 claims and advances the canonical work graph',
        '**Next functional slice:**',
      ]),
    }),
  }),
]);

const SAFE_ID = /^[A-Z0-9][A-Z0-9_.:-]{0,127}$/;
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*[\r\n])[A-Za-z0-9._/@+\-]+(?:\/[A-Za-z0-9._/@+\-]+)*$/;
const REPAIRER_PATH = /^scripts\/pr\/repairers\/[A-Za-z0-9._-]+\.mjs$/;
const EVIDENCE_KIND = 'EXACT_LOG_TOKENS_V1';

function validateEvidenceBinding(entry) {
  const binding = entry?.evidenceBinding;
  if (!binding || typeof binding !== 'object' || Array.isArray(binding)) {
    throw new Error(`Repairer ${entry.id} requires an evidenceBinding object.`);
  }
  if (binding.kind !== EVIDENCE_KIND) {
    throw new Error(`Repairer ${entry.id} evidenceBinding.kind must be ${EVIDENCE_KIND}.`);
  }
  if (!Array.isArray(binding.requiredTokens) || binding.requiredTokens.length === 0) {
    throw new Error(`Repairer ${entry.id} requires at least one exact evidence token.`);
  }
  const seen = new Set();
  for (const token of binding.requiredTokens) {
    const normalized = String(token || '');
    if (!normalized || normalized.length > 512 || /[\r\n]/.test(normalized)) {
      throw new Error(`Repairer ${entry.id} has an invalid exact evidence token.`);
    }
    if (seen.has(normalized)) {
      throw new Error(`Repairer ${entry.id} has a duplicate exact evidence token.`);
    }
    seen.add(normalized);
  }
  return binding;
}

export function validatePrAutofixRepairRegistry(registry = PR_AUTOFIX_REPAIR_REGISTRY) {
  if (!Array.isArray(registry)) throw new Error('PR autofix repair registry must be an array.');

  const ids = new Set();
  const signatures = new Set();

  for (const entry of registry) {
    if (!entry || typeof entry !== 'object') throw new Error('PR autofix repair registry entry must be an object.');
    if (!SAFE_ID.test(String(entry.id || ''))) throw new Error('Invalid PR autofix repairer id.');
    if (ids.has(entry.id)) throw new Error(`Duplicate PR autofix repairer id: ${entry.id}`);
    ids.add(entry.id);

    if (entry.owner !== 'CAPITAL-AI-OPS') {
      throw new Error(`Repairer ${entry.id} must remain owned by CAPITAL-AI-OPS.`);
    }
    if (entry.sourceWorkflow !== '.github/workflows/ci.yml') {
      throw new Error(`Repairer ${entry.id} may only consume CI failures.`);
    }
    if (!Array.isArray(entry.exactSignatures) || entry.exactSignatures.length === 0) {
      throw new Error(`Repairer ${entry.id} requires at least one exact failure signature.`);
    }
    if (!REPAIRER_PATH.test(String(entry.repairerPath || ''))) {
      throw new Error(`Repairer ${entry.id} must live under scripts/pr/repairers/.`);
    }
    if (!Array.isArray(entry.allowedPaths) || entry.allowedPaths.length === 0) {
      throw new Error(`Repairer ${entry.id} requires a non-empty exact path allowlist.`);
    }
    validateEvidenceBinding(entry);

    for (const signature of entry.exactSignatures) {
      if (!SAFE_ID.test(String(signature || ''))) {
        throw new Error(`Repairer ${entry.id} has an invalid exact signature.`);
      }
      if (signatures.has(signature)) {
        throw new Error(`Duplicate PR autofix exact signature: ${signature}`);
      }
      signatures.add(signature);
    }

    for (const file of entry.allowedPaths) {
      if (!SAFE_PATH.test(String(file || ''))) {
        throw new Error(`Repairer ${entry.id} has an invalid allowed path.`);
      }
    }
  }

  return registry;
}

export function resolveRegisteredPrAutofixRepair(
  { sourceWorkflow, signature, evidenceText = '' },
  registry = PR_AUTOFIX_REPAIR_REGISTRY,
) {
  validatePrAutofixRepairRegistry(registry);
  const normalizedSignature = String(signature || '').trim();
  const match = registry.find((entry) =>
    entry.sourceWorkflow === sourceWorkflow &&
    entry.exactSignatures.includes(normalizedSignature));

  if (!match) {
    return {
      registered: false,
      reason: 'no-registered-repairer',
      repairerId: '',
      repairerPath: '',
      allowedPaths: [],
      evidenceTokens: [],
    };
  }

  const evidence = String(evidenceText || '');
  const requiredTokens = match.evidenceBinding.requiredTokens.map(String);
  const missingTokens = requiredTokens.filter((token) => !evidence.includes(token));
  if (missingTokens.length > 0) {
    return {
      registered: false,
      reason: 'registered-repairer-evidence-not-proven',
      repairerId: match.id,
      repairerPath: match.repairerPath,
      allowedPaths: [...match.allowedPaths],
      evidenceTokens: requiredTokens,
      missingEvidenceTokens: missingTokens,
    };
  }

  return {
    registered: true,
    reason: 'exact-registered-evidence-bound-repairer',
    repairerId: match.id,
    repairerPath: match.repairerPath,
    allowedPaths: [...match.allowedPaths],
    evidenceTokens: requiredTokens,
  };
}

validatePrAutofixRepairRegistry();
