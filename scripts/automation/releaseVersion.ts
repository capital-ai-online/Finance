import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  DETERMINISTIC_VERSION_MATERIALIZATION_VERSION,
  resolveDeterministicVersionMaterialization,
  type DeterministicReleaseMetadata,
  type DeterministicVersionDecisionEvidence,
} from '../../src/platform/Release/Services/deterministicVersionMaterialization';
import {
  RELEASE_VERSION_GATE_VERSION,
  applyReleaseVersionPlan,
  assertAppliedVersionConsistency,
  buildReleaseVersionPlan,
  restoreReleaseVersionFiles,
  type ReleaseClassification,
  type ReleaseVersionPlan,
  type ReleaseVersionRequest,
} from '../../src/platform/Release/Services/releaseVersionGate';

const repoRoot = process.cwd();

function values(flag: string): string[] {
  const raw = process.argv.find(arg => arg.startsWith(`--${flag}=`))?.slice(flag.length + 3) ?? '';
  return raw.split(',').map(item => item.trim()).filter(Boolean);
}

function value(flag: string): string {
  return process.argv.find(arg => arg.startsWith(`--${flag}=`))?.slice(flag.length + 3).trim() ?? '';
}

function has(flag: string): boolean {
  return process.argv.includes(`--${flag}`);
}

function requireValue(flag: string): string {
  const result = value(flag);
  if (!result) throw new Error(`Pflichtargument fehlt: --${flag}=...`);
  return result;
}

function runGate(command: string, args: string[]): void {
  console.log(`\n[release:version] Gate: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error(`Release Gate fehlgeschlagen: ${command} ${args.join(' ')}`);
}

function gitValue(args: string[], label: string): string {
  const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${label} konnte nicht bestimmt werden.`);
  const output = String(result.stdout).trim();
  if (!output) throw new Error(`${label} ist leer.`);
  return output;
}

function gitHead(): string {
  return gitValue(['rev-parse', 'HEAD'], 'Git HEAD');
}

function gitBranch(): string {
  return gitValue(['branch', '--show-current'], 'Git Branch');
}

function gitMainMergeBase(): string {
  for (const candidate of ['origin/main', 'main']) {
    const result = spawnSync('git', ['merge-base', 'HEAD', candidate], { cwd: repoRoot, encoding: 'utf8' });
    const output = result.status === 0 ? String(result.stdout).trim() : '';
    if (output) return output;
  }
  throw new Error('Merge-Base gegen main konnte nicht bestimmt werden; deterministic materialization stoppt fail-closed.');
}

function decisionEvidencePath(): string {
  const requested = requireValue('decision-evidence');
  const absolute = path.resolve(repoRoot, requested);
  const relative = path.relative(repoRoot, absolute);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('--decision-evidence muss auf eine Datei innerhalb des Repository zeigen.');
  }
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error(`Decision Evidence fehlt: ${relative}`);
  return absolute;
}

function candidateEvidencePath(targetVersion: string): string {
  return path.join(repoRoot, 'docs', 'releases', 'candidates', `RELEASE_CANDIDATE_${targetVersion}.md`);
}

function deterministicEvidenceSection(decision?: DeterministicVersionDecisionEvidence): string {
  if (!decision) return '';
  return `## Deterministic ADR-0105 Decision Identity\n\n` +
    `- **Materialization Contract:** \`${DETERMINISTIC_VERSION_MATERIALIZATION_VERSION}\`\n` +
    `- **Decision Hash:** \`${decision.decisionHash}\`\n` +
    `- **Rule Engine Version:** \`${decision.ruleEngineVersion}\`\n` +
    `- **Base SHA:** \`${decision.baseSha}\`\n` +
    `- **Branch Head Before Versioning:** \`${decision.branchHeadShaBeforeVersioning}\`\n` +
    `- **Calculated Version:** \`${decision.calculatedVersion}\`\n` +
    `- **Bump Type:** \`${decision.bumpType}\`\n` +
    `- **Materialization Eligible:** \`${decision.materialization.eligible}\`\n` +
    `- **Affected Project:** \`${decision.affectedProject}\`\n` +
    `- **Affected Component:** \`${decision.affectedComponent}\`\n` +
    `- **Triggered Rules:** ${decision.triggeredRules.map(item => `\`${item}\``).join(', ')}\n` +
    `- **ADR Refs:** ${decision.applicableAdrRefs.map(item => `\`${item}\``).join(', ')}\n` +
    `- **ESS Refs:** ${decision.applicableEssRefs.map(item => `\`${item}\``).join(', ')}\n` +
    `- **Control Refs:** ${decision.applicableControlRefs.map(item => `\`${item}\``).join(', ')}\n\n`;
}

function writeCandidateEvidence(plan: ReleaseVersionPlan, decision?: DeterministicVersionDecisionEvidence): string {
  const outputPath = candidateEvidencePath(plan.targetVersion);
  if (fs.existsSync(outputPath)) throw new Error(`Release-Candidate-Evidence existiert bereits: ${path.relative(repoRoot, outputPath)}`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const request = plan.request;
  const generatedAt = new Date().toISOString();
  const body = `# CAPITAL-AI Release Candidate ${plan.targetVersion}\n\n` +
    `- **Record Type:** Versioned Release Candidate Evidence\n` +
    `- **Gate Contract:** \`${RELEASE_VERSION_GATE_VERSION}\`\n` +
    `- **Generated At:** ${generatedAt}\n` +
    `- **Current Version:** \`${plan.currentVersion}\`\n` +
    `- **Target Version:** \`${plan.targetVersion}\`\n` +
    `- **Classification:** \`${plan.classification}\`\n` +
    `- **Status:** \`VERSIONED_RC_PENDING_PRODUCTION_ACCEPTANCE\`\n` +
    `- **Base Commit Before Version Gate:** \`${gitHead()}\`\n` +
    `- **Release Candidate Commit SHA:** \`RESOLVED_BY_GITHUB_CI_OR_PRODUCTION_ACCEPTANCE\`\n` +
    `- **Final Git Tag:** \`NOT_CREATED\`\n\n` +
    deterministicEvidenceSection(decision) +
    `## Work Packages\n\n${request.workPackages.map(item => `- ${item}`).join('\n')}\n\n` +
    `## ADRs\n\n${(request.adrs.length ? request.adrs : ['none']).map(item => `- ${item}`).join('\n')}\n\n` +
    `## Migrations\n\n${(request.migrations.length ? request.migrations : ['none']).map(item => `- ${item}`).join('\n')}\n\n` +
    `## Known Risks\n\n${request.risks.map(item => `- ${item}`).join('\n')}\n\n` +
    `## Rollback Boundary\n\n${request.rollbackBoundary}\n\n` +
    `## Production Acceptance Requirements\n\n${request.acceptanceRequirements.map(item => `- ${item}`).join('\n')}\n\n` +
    `## Version Gate Evidence\n\n` +
    `The controlled release command completed all mandatory local gates after changing the single platform-version authority and rebuilding derived projections:\n\n` +
    `- \`npm run readme:sync\`\n` +
    `- \`npm run lint\`\n` +
    `- \`npx vitest run tests/unit/platformVersionConsistency.test.ts tests/unit/readmeVersionProjection.test.ts\`\n` +
    `- \`npm run readme:check\`\n` +
    `- \`npm run docs:hygiene:check\`\n` +
    `- \`npm run governance:control-plane\`\n` +
    `- \`npm run build\`\n` +
    `- \`npm run predeploy:check\`\n\n` +
    `This record is not production acceptance. The final immutable tag \`v${plan.targetVersion}\` remains prohibited until the exact deployed commit has an accepted production record.\n`;
  fs.writeFileSync(outputPath, body);
  return path.relative(repoRoot, outputPath);
}

function deterministicMetadata(): DeterministicReleaseMetadata {
  return {
    workPackages: values('work-packages'),
    migrations: values('migrations'),
    risks: values('risks'),
    rollbackBoundary: value('rollback-boundary'),
    acceptanceRequirements: values('acceptance'),
    gaAdr: value('ga-adr') || undefined,
  };
}

function buildManualPlan(): { plan: ReleaseVersionPlan; decision?: undefined; noMutationReason?: undefined } {
  const classification = requireValue('classification').toUpperCase() as ReleaseClassification;
  if (!['PATCH', 'MINOR', 'MAJOR'].includes(classification)) throw new Error('classification muss PATCH, MINOR oder MAJOR sein.');
  const request: ReleaseVersionRequest = {
    targetVersion: requireValue('target'),
    classification,
    workPackages: values('work-packages'),
    adrs: values('adrs'),
    migrations: values('migrations'),
    risks: values('risks'),
    rollbackBoundary: requireValue('rollback-boundary'),
    acceptanceRequirements: values('acceptance'),
    gaAdr: value('ga-adr') || undefined,
  };
  return { plan: buildReleaseVersionPlan(repoRoot, request) };
}

function buildDeterministicPlan(): { plan: ReleaseVersionPlan | null; decision: DeterministicVersionDecisionEvidence; noMutationReason?: string } {
  if (value('target') || value('classification')) {
    throw new Error('--decision-evidence darf nicht mit --target oder --classification kombiniert werden.');
  }
  const decision = JSON.parse(fs.readFileSync(decisionEvidencePath(), 'utf8')) as DeterministicVersionDecisionEvidence;
  const resolution = resolveDeterministicVersionMaterialization(repoRoot, decision, {
    branchName: gitBranch(),
    branchHeadSha: gitHead(),
    baseSha: gitMainMergeBase(),
  }, deterministicMetadata());
  if (resolution.action === 'NO_MUTATION') return { plan: null, decision, noMutationReason: resolution.reason };
  return { plan: resolution.plan, decision };
}

function main(): void {
  const deterministicMode = Boolean(value('decision-evidence'));
  const result = deterministicMode ? buildDeterministicPlan() : buildManualPlan();
  if (!result.plan) {
    console.log(`[release:version] NO-OP: ${result.noMutationReason}. Keine Plattform-Version wurde verändert.`);
    return;
  }

  const { plan, decision } = result;
  console.log(`[release:version] ${plan.currentVersion} -> ${plan.targetVersion} (${plan.classification})`);
  if (decision) console.log(`[release:version] Deterministic Decision: ${decision.decisionHash}`);
  console.log(`[release:version] Authority/projection rollback set: ${plan.updatedFiles.join(', ')}`);

  if (!has('apply')) {
    console.log('[release:version] DRY RUN erfolgreich. Keine Datei wurde verändert. Für die bewusste Anwendung --apply ergänzen.');
    return;
  }

  let originals: Map<string, string> | null = null;
  let evidencePath: string | null = null;
  try {
    originals = applyReleaseVersionPlan(repoRoot, plan);
    runGate('npm', ['run', 'readme:sync']);
    assertAppliedVersionConsistency(repoRoot, plan.targetVersion);
    runGate('npm', ['run', 'lint']);
    runGate('npx', ['vitest', 'run', 'tests/unit/platformVersionConsistency.test.ts', 'tests/unit/readmeVersionProjection.test.ts']);
    runGate('npm', ['run', 'readme:check']);
    runGate('npm', ['run', 'docs:hygiene:check']);
    runGate('npm', ['run', 'governance:control-plane']);
    runGate('npm', ['run', 'build']);
    runGate('npm', ['run', 'predeploy:check']);
    evidencePath = writeCandidateEvidence(plan, decision);
    console.log(`\n[release:version] READY: ${evidencePath}`);
    console.log('[release:version] Kein Git-Tag wurde erzeugt. Production Acceptance bleibt verpflichtend.');
  } catch (error) {
    if (originals) restoreReleaseVersionFiles(repoRoot, originals);
    if (evidencePath) fs.rmSync(path.join(repoRoot, evidencePath), { force: true });
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error(`[release:version] FAIL-CLOSED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
