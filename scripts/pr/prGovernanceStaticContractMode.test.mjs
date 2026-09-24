import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

test('Required PR Governance uses stable-contract validation without dynamic Evidence coupling', () => {
  const validator = fs.readFileSync('scripts/pr/validatePrBody.mjs', 'utf8');
  const workflow = fs.readFileSync('.github/workflows/pr-governance.yml', 'utf8');

  assert.match(
    validator,
    /const validationMode = String\(process\.env\.PR_BODY_VALIDATION_MODE \|\| 'full'\)/,
  );
  assert.match(validator, /const validateDynamicEvidence = validationMode === 'full'/);
  assert.match(
    validator,
    /if \(validateDynamicEvidence && !fs\.existsSync\(baselinePath\)\)/,
  );
  assert.match(
    validator,
    /const baseline = validateDynamicEvidence \? readJsonFile\(baselinePath\) : null/,
  );

  const dynamicGuards = validator.match(/if \(validateDynamicEvidence\) \{/g) || [];
  assert.ok(dynamicGuards.length >= 3, 'decision/dashboard, baseline IDs and baseline correlation must be full-mode only');

  assert.match(workflow, /PR_BODY_VALIDATION_MODE: static-contract/);
  assert.doesNotMatch(workflow, /types: \[[^\]]*edited/);
  assert.doesNotMatch(workflow, /run: node \.\.\/policy\/scripts\/pr\/productionPreflight\.mjs/);
  assert.match(
    workflow,
    /format\('pr-governance-pr-\{0\}-\{1\}-\{2\}', github\.event\.pull_request\.number, github\.event\.pull_request\.head\.sha, github\.event\.pull_request\.base\.sha\)/,
  );
});
