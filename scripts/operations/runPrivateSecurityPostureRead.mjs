import fs from 'node:fs';

function requiredPath(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`[PRIVATE-SECURITY-POSTURE] missing ${name}`);
  return value;
}

function readJson(name) {
  const path = requiredPath(name);
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function readText(path) {
  return fs.readFileSync(path, 'utf8');
}

function finding(id, severity, state, summary, recommendation, evidence = null) {
  return Object.freeze({ id, severity, state, summary, recommendation, evidence });
}

const githubSettings = readJson('CAPITAL_AI_GITHUB_SETTINGS_EVIDENCE_PATH');
const githubSecurity = readJson('CAPITAL_AI_GITHUB_SECURITY_EVIDENCE_PATH');
const render = readJson('CAPITAL_AI_RENDER_EVIDENCE_PATH');
const supabase = readJson('CAPITAL_AI_SUPABASE_POSTURE_PATH');
const headers = readJson('CAPITAL_AI_PRODUCTION_HEADERS_PATH');

const ci = readText('.github/workflows/ci.yml');
const blueprint = readText('render.yaml');
const server = readText('server.application.ts');

const findings = [];

for (const item of githubSettings?.effectivePolicy?.improvementFindings || []) {
  findings.push(finding(
    `GITHUB-${item.id}`,
    item.severity || 'MEDIUM',
    item.state || 'OBSERVED',
    item.summary || item.id,
    item.recommendation || 'Review the observable GitHub policy delta.',
  ));
}

const installations = githubSecurity?.entries?.organizationAppInstallations;
if (installations?.status === 'PASS') {
  for (const app of installations.installations || []) {
    if (String(app.appSlug || '').toLowerCase().includes('google') || String(app.appSlug || '').toLowerCase().includes('gemini')) {
      findings.push(finding(
        'GITHUB-APP-RETIRED-PROVIDER',
        'HIGH',
        'OBSERVED',
        `GitHub App ${app.appSlug} is installed with repositorySelection=${app.repositorySelection || 'unknown'}.`,
        'Correlate the installation with the Enterprise audit log and keep Google AI Studio/Gemini outside the CAPITAL-AI privileged provider chain unless a new Owner decision explicitly changes the RETIRED/DENY state.',
        { appSlug: app.appSlug, repositorySelection: app.repositorySelection, permissions: app.permissions },
      ));
    }
    if (app.repositorySelection === 'all') {
      findings.push(finding(
        'GITHUB-APP-ALL-REPOSITORIES',
        'HIGH',
        'OBSERVED',
        `GitHub App ${app.appSlug || 'unknown'} can access all repositories.`,
        'Reduce the installation to selected repositories unless all-repository access is explicitly required and owner-approved.',
        { appSlug: app.appSlug, permissions: app.permissions },
      ));
    }
  }
} else {
  findings.push(finding(
    'GITHUB-APP-INVENTORY-NOT-OBSERVABLE',
    'MEDIUM',
    'NOT_OBSERVABLE',
    'Organization GitHub App inventory is not readable with the current bounded credential.',
    'Grant only the minimum read permission needed for organization installation inventory, or review the Enterprise/Organization installation page manually.',
    installations || null,
  ));
}

for (const [scope, entry] of Object.entries({
  organization: githubSecurity?.entries?.organizationActionsSecrets,
  repository: githubSecurity?.entries?.repositoryActionsSecrets,
})) {
  if (entry?.status !== 'PASS') {
    findings.push(finding(
      `GITHUB-${scope.toUpperCase()}-SECRET-METADATA-NOT-OBSERVABLE`,
      'MEDIUM',
      'NOT_OBSERVABLE',
      `${scope} Actions secret metadata is not observable with the current read credential.`,
      'Keep secret values inaccessible; add only metadata-read capability if change attribution is required.',
      entry || null,
    ));
  }
}

const enterpriseAudit = githubSecurity?.entries?.enterpriseAudit;
if (enterpriseAudit?.status !== 'PASS') {
  findings.push(finding(
    'GITHUB-ENTERPRISE-AUDIT-NOT-OBSERVABLE',
    'HIGH',
    'NOT_OBSERVABLE',
    'Enterprise audit log is not observable with the current read credential.',
    'The existing Enterprise Read credential needs read:audit_log or equivalent Enterprise administration read capability for incident attribution.',
    enterpriseAudit || null,
  ));
}

const renderServices = render?.settingsInventory?.services || [];
const finance = renderServices.find((service) => service?.id === 'srv-d91o1o9o3t8c73edi55g') || null;
if (!finance) {
  findings.push(finding(
    'RENDER-FINANCE-NOT-OBSERVABLE',
    'HIGH',
    'NOT_OBSERVABLE',
    'Canonical Finance service was not found in the Render inventory.',
    'Verify the Render workspace and service identity before any production action.',
  ));
} else {
  if (finance.autoDeployTrigger !== 'off') {
    findings.push(finding(
      'RENDER-AUTODEPLOY-DRIFT',
      'HIGH',
      'OBSERVED',
      `Finance autoDeployTrigger is ${finance.autoDeployTrigger || 'unknown'} instead of off.`,
      'Keep Render native auto-deploy off so verified GitHub CI remains the single deployment authority.',
    ));
  }
  if (finance.pullRequestPreviewsEnabled !== 'no' || finance.previewGeneration !== 'off') {
    findings.push(finding(
      'RENDER-PR-PREVIEWS-ENABLED',
      'MEDIUM',
      'OBSERVED',
      `Finance PR previews are enabled/generating (${finance.pullRequestPreviewsEnabled}/${finance.previewGeneration}).`,
      'Disable production-service PR previews unless an explicit isolated preview-secret policy exists.',
    ));
  }
  if (finance.instances !== 1) {
    findings.push(finding(
      'RENDER-INSTANCE-COUNT-DRIFT',
      'HIGH',
      'OBSERVED',
      `Finance instance count is ${String(finance.instances)} instead of the current single-instance contract.`,
      'Correlate scale-out with shared rate limiting/session assumptions before changing instance count.',
    ));
  }
}

if (ci.includes('RENDER_DEPLOY_HOOK_URL')) {
  findings.push(finding(
    'DEPLOY-CHAIN-DELETED-HOOK-REFERENCE',
    'HIGH',
    'OBSERVED',
    'Active CI still depends on the deleted Render deploy-hook secret.',
    'Use the existing bounded Render API credential in the canonical deploy-production job and deploy the exact verified commitId.',
  ));
}
if (!ci.includes('CAPITAL_AI_RENDER_API_KEY') || !ci.includes('triggerRenderExactCommit.mjs')) {
  findings.push(finding(
    'DEPLOY-CHAIN-API-IDENTITY-MISSING',
    'HIGH',
    'OBSERVED',
    'Canonical CI does not yet prove an exact-commit Render API trigger.',
    'Bind Render API deployment to the verified main SHA and retain post-deploy health/identity verification.',
  ));
}
if (!blueprint.includes('autoDeployTrigger: off')) {
  findings.push(finding(
    'DEPLOY-CHAIN-NATIVE-AUTODEPLOY',
    'HIGH',
    'OBSERVED',
    'render.yaml does not explicitly keep native auto-deploy off.',
    'Keep autoDeployTrigger: off.',
  ));
}

for (const [header, sourceNeedle] of [
  ['permissions-policy', 'Permissions-Policy'],
  ['cross-origin-opener-policy', 'Cross-Origin-Opener-Policy'],
  ['cross-origin-resource-policy', 'Cross-Origin-Resource-Policy'],
]) {
  const observed = String(headers?.headers?.[header] || '').trim();
  if (!observed) {
    findings.push(finding(
      `WEB-HEADER-${header.toUpperCase()}`,
      'MEDIUM',
      'OBSERVED',
      `${sourceNeedle} is missing from current production readback.`,
      'Promote the tested header contract through the normal Human/CODEOWNER merge and production cadence, then rerun external readback.',
    ));
  }
  if (!server.includes(sourceNeedle)) {
    findings.push(finding(
      `WEB-SOURCE-${header.toUpperCase()}`,
      'MEDIUM',
      'OBSERVED',
      `${sourceNeedle} is missing from the active server composition source.`,
      'Add the header to the active server.application.ts response path with compatibility tests.',
    ));
  }
}

if (String(headers?.headers?.server || '').toLowerCase().includes('cloudflare')) {
  findings.push(finding(
    'WEB-EDGE-SERVER-DISCLOSURE',
    'LOW',
    'PROVIDER_EDGE',
    'The public edge exposes server: cloudflare.',
    'Treat this as edge/provider metadata. Do not claim an application-code fix unless the edge provider exposes a supported suppression control.',
  ));
}

if (supabase?.status !== 'PASS') {
  findings.push(finding(
    'SUPABASE-POSTURE-PARTIAL',
    'HIGH',
    'NOT_OBSERVABLE',
    'Supabase database posture read is incomplete.',
    'Restore only the existing read-only SUPABASE_DB_URL evidence path; do not broaden service-role or management-token exposure.',
    supabase,
  ));
} else {
  if (Number(supabase.publicTablesWithoutRls || 0) > 0) {
    findings.push(finding(
      'SUPABASE-PUBLIC-TABLES-WITHOUT-RLS',
      'HIGH',
      'OBSERVED',
      `${supabase.publicTablesWithoutRls} public table(s) are observed without RLS.`,
      'Classify each table by intended exposure and enable RLS where public API access is not explicitly intended.',
    ));
  }
  if (Number(supabase.securityDefinerFunctions || 0) > 0) {
    findings.push(finding(
      'SUPABASE-SECURITY-DEFINER-REVIEW',
      'MEDIUM',
      'OBSERVED',
      `${supabase.securityDefinerFunctions} SECURITY DEFINER function(s) exist in application schemas.`,
      'Review search_path, ownership, execute grants and caller authorization for every SECURITY DEFINER function.',
    ));
  }
}

const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const blocking = findings.filter((item) => severityRank[item.severity] >= 3);
const partial = findings.some((item) => item.state === 'NOT_OBSERVABLE');
const output = Object.freeze({
  schemaVersion: '1.0.0',
  exportKind: 'CAPITAL_AI_PRIVATE_SECURITY_POSTURE',
  status: blocking.length > 0 ? 'FINDINGS' : partial ? 'PARTIAL_COVERAGE' : 'PASS',
  generatedAt: new Date().toISOString(),
  repository: process.env.GITHUB_REPOSITORY || 'capital-ai-online/Finance',
  sourceSha: process.env.GITHUB_SHA || null,
  evidence: Object.freeze({
    githubSettingsStatus: githubSettings?.status || 'NOT_OBSERVABLE',
    githubSecurityStatus: githubSecurity?.status || 'NOT_OBSERVABLE',
    renderStatus: render?.status || render?.settingsInventory?.status || 'NOT_OBSERVABLE',
    supabaseStatus: supabase?.status || 'NOT_OBSERVABLE',
    productionHeadersStatus: headers?.status || 'NOT_OBSERVABLE',
  }),
  findings: Object.freeze(findings),
  mutationPerformed: false,
  secretValuesProjected: false,
});

const markdown = [
  '# CAPITAL-AI Private Security Posture',
  '',
  `- Status: **${output.status}**`,
  `- Source SHA: \`${output.sourceSha || 'NOT_OBSERVABLE'}\``,
  `- Findings: ${findings.length}`,
  '',
  '## Findings',
  '',
  ...(findings.length
    ? findings.map((item) => `- **${item.id}** [${item.severity}/${item.state}] — ${item.summary} Recommendation: ${item.recommendation}`)
    : ['- No evidence-backed findings in the currently observable posture.']),
  '',
  '## Evidence boundary',
  '',
  '- Read-only provider inspection only.',
  '- Secret/token/private-key values are never projected.',
  '- NOT_OBSERVABLE remains explicit and is never converted to PASS.',
  '- Recommendations are advisory; provider/repository mutations remain separately governed.',
  '',
].join('\n');

const outputPath = requiredPath('CAPITAL_AI_SECURITY_POSTURE_EVIDENCE_PATH');
const markdownPath = requiredPath('CAPITAL_AI_SECURITY_POSTURE_MARKDOWN_PATH');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, { mode: 0o600 });
fs.writeFileSync(markdownPath, `${markdown}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify({ status: output.status, findingCount: findings.length }, null, 2)}\n`);
