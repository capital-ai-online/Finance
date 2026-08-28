import fs from 'node:fs';

const OWNER = 'SvenKulessa';
const REPO = 'Finance';
const EXPECTED_PATH = '.github/policies/main-production-protection.expected.json';
const mode = process.argv[2]; // 'plan' | 'apply'
const token = process.env.GH_TOKEN;

// Bind Required Checks to the GitHub Apps that actually produce them. This prevents another
// actor/integration with write access from spoofing a required context by name alone.
const CHECK_INTEGRATION_IDS = new Map([
  ['build-and-test', 15368],
  ['PR Governance (Kosten / Workflow / Vorlage)', 15368],
  ['Hardened image / HIGH+CRITICAL CVE gate', 15368],
  ['GitGuardian Security Checks', 46505],
]);

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
    signal: init.signal || AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

function statusCheck(context) {
  const integrationId = CHECK_INTEGRATION_IDS.get(context);
  if (!integrationId) {
    throw new Error(`No trusted integration_id is registered for required check: ${context}`);
  }
  return { context, integration_id: integrationId };
}

// Uebersetzt das abstrakte expected.json-Format in die konkrete GitHub-Ruleset-API-Struktur.
// Die Parameter bilden den beabsichtigten vollständigen Zustand ab; ein PUT darf keine bereits
// aktive Schutzwirkung versehentlich durch Weglassen eines Feldes zurücksetzen.
function buildDesiredRuleset(expected) {
  const req = expected.required;
  return {
    name: expected.ruleset_name,
    target: 'branch',
    enforcement: 'active',
    conditions: { ref_name: { exclude: [], include: ['~DEFAULT_BRANCH'] } },
    bypass_actors: req.bypass_actors ?? [],
    rules: [
      ...(req.non_fast_forward_protection ? [{ type: 'non_fast_forward' }] : []),
      ...(req.deletion_protection ? [{ type: 'deletion' }] : []),
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: expected.single_owner_topology?.required_approving_review_count ?? 0,
          dismiss_stale_reviews_on_push: false,
          required_reviewers: [],
          require_code_owner_review: req.require_code_owner_review,
          require_last_push_approval: false,
          required_review_thread_resolution: req.required_review_thread_resolution === true,
          require_extra_approval_for_unattributed_changes: req.require_extra_approval_for_unattributed_changes === true,
          allowed_merge_methods: ['merge', 'squash', 'rebase'],
        },
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: req.strict_required_status_checks_policy,
          do_not_enforce_on_create: false,
          required_status_checks: req.required_status_checks.map(statusCheck),
        },
      },
    ],
  };
}

function normalizedRule(rule) {
  if (rule.type === 'non_fast_forward' || rule.type === 'deletion') return { type: rule.type };
  if (rule.type === 'pull_request') {
    const p = rule.parameters ?? {};
    return {
      type: rule.type,
      parameters: {
        required_approving_review_count: Number(p.required_approving_review_count ?? 0),
        dismiss_stale_reviews_on_push: p.dismiss_stale_reviews_on_push === true,
        required_reviewers: Array.isArray(p.required_reviewers) ? p.required_reviewers : [],
        require_code_owner_review: p.require_code_owner_review === true,
        require_last_push_approval: p.require_last_push_approval === true,
        required_review_thread_resolution: p.required_review_thread_resolution === true,
        require_extra_approval_for_unattributed_changes: p.require_extra_approval_for_unattributed_changes === true,
        allowed_merge_methods: [...(p.allowed_merge_methods ?? [])].sort(),
      },
    };
  }
  if (rule.type === 'required_status_checks') {
    const p = rule.parameters ?? {};
    return {
      type: rule.type,
      parameters: {
        strict_required_status_checks_policy: p.strict_required_status_checks_policy === true,
        do_not_enforce_on_create: p.do_not_enforce_on_create === true,
        required_status_checks: (p.required_status_checks ?? [])
          .map((check) => ({
            context: String(check.context || ''),
            integration_id: Number(check.integration_id || 0),
          }))
          .sort((a, b) => a.context.localeCompare(b.context)),
      },
    };
  }
  return { type: rule.type, parameters: rule.parameters ?? null };
}

function normalizedRuleset(value) {
  const ref = value?.conditions?.ref_name ?? {};
  return {
    name: String(value?.name || ''),
    target: String(value?.target || ''),
    enforcement: String(value?.enforcement || ''),
    conditions: {
      ref_name: {
        exclude: [...(ref.exclude ?? [])].sort(),
        include: [...(ref.include ?? [])].sort(),
      },
    },
    bypass_actors: value?.bypass_actors ?? [],
    rules: (value?.rules ?? []).map(normalizedRule).sort((a, b) => a.type.localeCompare(b.type)),
  };
}

// Hard-Floor: unabhaengig davon, was in expected.json steht oder wer die PR gemerged hat -
// diese Kernschutzregeln duerfen NIE unterschritten werden. Bricht vor jedem API-Schreibzugriff ab.
function enforceFloor(desired) {
  const failures = [];
  const normalized = normalizedRuleset(desired);
  const statusRule = normalized.rules.find((r) => r.type === 'required_status_checks');
  const prRule = normalized.rules.find((r) => r.type === 'pull_request');
  const checks = new Map((statusRule?.parameters.required_status_checks ?? []).map((c) => [c.context, c.integration_id]));

  for (const [context, integrationId] of CHECK_INTEGRATION_IDS) {
    if (checks.get(context) !== integrationId) {
      failures.push(`required check "${context}" muss an integration_id ${integrationId} gebunden sein`);
    }
  }
  if (checks.size !== CHECK_INTEGRATION_IDS.size) failures.push('Required-Check-Menge darf keine unbekannten oder fehlenden Kontexte enthalten');
  if (statusRule?.parameters.strict_required_status_checks_policy !== true) failures.push('strict required status checks muss aktiviert sein');
  if (statusRule?.parameters.do_not_enforce_on_create !== false) failures.push('Required Checks muessen auch bei Ref-Erstellung gelten');
  if (!normalized.rules.some((r) => r.type === 'non_fast_forward')) failures.push('non_fast_forward-Schutz fehlt');
  if (!prRule) failures.push('pull_request-Pflicht fehlt');
  if (prRule?.parameters.require_code_owner_review !== true) failures.push('CODEOWNER-Review-Pflicht fehlt');
  if (prRule?.parameters.required_review_thread_resolution !== true) failures.push('Review-Thread-Aufloesung muss erforderlich sein');
  if (prRule?.parameters.require_extra_approval_for_unattributed_changes !== true) failures.push('Extra-Approval fuer unattributed changes muss erforderlich sein');
  if ((normalized.bypass_actors ?? []).length > 0) failures.push('bypass_actors muss leer sein');
  if (normalized.enforcement !== 'active') failures.push('Ruleset muss active sein');
  if (normalized.target !== 'branch') failures.push('Ruleset target muss branch sein');
  if (!normalized.conditions.ref_name.include.includes('~DEFAULT_BRANCH')) failures.push('Ruleset muss den Default-Branch erfassen');

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

const currentNormalized = current ? normalizedRuleset(current) : null;
const desiredNormalized = normalizedRuleset(desired);
const changed = JSON.stringify(currentNormalized) !== JSON.stringify(desiredNormalized);

console.log('## Ruleset-Diff');
console.log('```json');
console.log(JSON.stringify({ current: currentNormalized ?? '(existiert noch nicht)', desired: desiredNormalized }, null, 2));
console.log('```');
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

  const afterRulesets = await gh(`/repos/${OWNER}/${REPO}/rulesets`);
  const afterSummary = afterRulesets.find((r) => r.name === expected.ruleset_name);
  if (!afterSummary) throw new Error('Ruleset fehlt nach Apply');
  const after = await gh(`/repos/${OWNER}/${REPO}/rulesets/${afterSummary.id}`);
  const afterNormalized = normalizedRuleset(after);
  if (JSON.stringify(afterNormalized) !== JSON.stringify(desiredNormalized)) {
    throw new Error(`Post-Apply-Verifikation fehlgeschlagen:\n${JSON.stringify({ after: afterNormalized, expected: desiredNormalized }, null, 2)}`);
  }
  enforceFloor(after);
  console.log('Ruleset angewendet und post-write fail-closed verifiziert.');
} else if (mode === 'apply') {
  enforceFloor(current ?? desired);
  console.log('Ruleset entspricht bereits dem gehaerteten Sollzustand; keine Mutation erforderlich.');
}
