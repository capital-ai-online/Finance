import fs from 'node:fs';

const OWNER = 'SvenKulessa';
const REPO = 'Finance';
const EXPECTED_PATH = '.github/policies/main-production-protection.expected.json';
const mode = process.argv[2]; // 'plan' | 'apply'
const token = process.env.GH_TOKEN;

if (!['plan', 'apply'].includes(mode)) {
  console.error('Usage: rulesetSync.mjs <plan|apply>');
  process.exit(1);
}
if (!token) {
  console.error('GH_TOKEN is required');
  process.exit(1);
}

async function gh(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

// Uebersetzt das abstrakte expected.json-Format in die konkrete GitHub-Ruleset-API-Struktur.
function buildDesiredRuleset(expected) {
  const req = expected.required;
  return {
    name: expected.ruleset_name,
    target: 'branch',
    enforcement: 'active',
    conditions: { ref_name: { include: ['refs/heads/main'], exclude: [] } },
    bypass_actors: req.bypass_actors ?? [],
    rules: [
      {
        type: 'pull_request',
        parameters: {
          require_code_owner_review: req.require_code_owner_review,
          required_approving_review_count: expected.single_owner_topology?.required_approving_review_count ?? 0,
          dismiss_stale_reviews_on_push: false,
          require_last_push_approval: false,
          required_review_thread_resolution: false,
        },
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: req.strict_required_status_checks_policy,
          required_status_checks: req.required_status_checks.map((c) => ({ context: c })),
        },
      },
      ...(req.non_fast_forward_protection ? [{ type: 'non_fast_forward' }] : []),
      ...(req.deletion_protection ? [{ type: 'deletion' }] : []),
    ],
  };
}

// Hard-Floor: unabhaengig davon, was in expected.json steht oder wer die PR gemerged hat -
// diese Kernschutzregeln duerfen NIE unterschritten werden. Bricht den Lauf sofort ab.
function enforceFloor(desired) {
  const failures = [];
  const statusRule = desired.rules.find((r) => r.type === 'required_status_checks');
  const checks = statusRule?.parameters.required_status_checks.map((c) => c.context) ?? [];
  if (!checks.includes('build-and-test')) failures.push('required check "build-and-test" fehlt');
  if (!desired.rules.some((r) => r.type === 'non_fast_forward')) failures.push('non_fast_forward-Schutz fehlt');
  if (!desired.rules.some((r) => r.type === 'pull_request')) failures.push('pull_request-Pflicht fehlt');
  if ((desired.bypass_actors ?? []).length > 0) failures.push('bypass_actors muss leer sein');
  if (failures.length) {
    console.error('FLOOR VERLETZT - Abbruch, keine Aenderung angewendet:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
}

const expected = JSON.parse(fs.readFileSync(EXPECTED_PATH, 'utf8'));
const desired = buildDesiredRuleset(expected);
enforceFloor(desired);

const rulesets = await gh(`/repos/${OWNER}/${REPO}/rulesets`);
const existing = rulesets.find((r) => r.name === expected.ruleset_name);
const current = existing ? await gh(`/repos/${OWNER}/${REPO}/rulesets/${existing.id}`) : null;

const diffText = JSON.stringify(
  { current: current ?? '(existiert noch nicht)', desired },
  null,
  2,
);
console.log('## Ruleset-Diff\n```json\n' + diffText + '\n```');

const changed =
  JSON.stringify(current?.rules ?? null) !== JSON.stringify(desired.rules) ||
  JSON.stringify(current?.bypass_actors ?? []) !== JSON.stringify(desired.bypass_actors);
console.log(`changed=${changed}`);
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
}

if (mode === 'apply' && changed) {
  if (existing) {
    await gh(`/repos/${OWNER}/${REPO}/rulesets/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(desired),
    });
  } else {
    await gh(`/repos/${OWNER}/${REPO}/rulesets`, {
      method: 'POST',
      body: JSON.stringify(desired),
    });
  }
  console.log('Ruleset angewendet.');
}
