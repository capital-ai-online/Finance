export const PR_AUTOFIX_REPAIR_REGISTRY = Object.freeze([
  // Intentionally empty by default.
  // A repairer may be added only through a reviewed repository change that declares:
  // - an exact deterministic failure signature,
  // - a trusted-main repairer module,
  // - exact allowed paths,
  // - CAPITAL-AI-OPS ownership.
]);

const SAFE_ID = /^[A-Z0-9][A-Z0-9_.:-]{0,127}$/;
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*[\r\n])[A-Za-z0-9._/@+\-]+(?:\/[A-Za-z0-9._/@+\-]+)*$/;
const REPAIRER_PATH = /^scripts\/pr\/repairers\/[A-Za-z0-9._-]+\.mjs$/;

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
  { sourceWorkflow, signature },
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
    };
  }

  return {
    registered: true,
    reason: 'exact-registered-repairer',
    repairerId: match.id,
    repairerPath: match.repairerPath,
    allowedPaths: [...match.allowedPaths],
  };
}

validatePrAutofixRepairRegistry();
