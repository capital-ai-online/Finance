import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  RELEASE_VERSION_GATE_VERSION,
  applyReleaseVersionPlan,
  assertAppliedVersionConsistency,
  buildReleaseVersionPlan,
  restoreReleaseVersionFiles,
  type ReleaseClassification,
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

function gitHead(): string {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  return result.status === 0 ? String(result.stdout).trim() : 'UNAVAILABLE';
}

function candidateEvidencePath(targetVersion: string): string {
  return path.join(repoRoot, 'docs', 'releases', 'candidates', `RELEASE_CANDIDATE_${targetVersion}.md`);
}

function writeCandidateEvidence(plan: ReturnType<typeof buildReleaseVersionPlan>): string {
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
    `## Work Packages\n\n${request.workPackages.map(item => `- ${item}`).join('\n')}\n\n` +
    `## ADRs\n\n${(request.adrs.length ? request.adrs : ['none']).map(item => `- ${item}`).join('\n')}\n\n` +
    `## Migrations\n\n${(request.migrations.length ? request.migrations : ['none']).map(item => `- ${item}`).join('\n')}\n\n` +
    `## Known Risks\n\n${request.risks.map(item => `- ${item}`).join('\n')}\n\n` +
    `## Rollback Boundary\n\n${request.rollbackBoundary}\n\n` +
    `## Production Acceptance Requirements\n\n${request.acceptanceRequirements.map(item => `- ${item}`).join('\n')}\n\n` +
    `## Version Gate Evidence\n\n` +
    `The controlled release command completed all mandatory local gates after synchronizing the governed version declarations:\n\n` +
    `- \`npm run readme:sync\`\n` +
    `- \`npm run lint\`\n` +
    `- \`npx vitest run tests/unit/platformVersionConsistency.test.ts\`\n` +
    `- \`npm run readme:check\`\n` +
    `- \`npm run docs:hygiene:check\`\n` +
    `- \`npm run build\`\n` +
    `- \`npm run predeploy:check\`\n\n` +
    `This record is **not** production acceptance. The final immutable tag \`v${plan.targetVersion}\` remains prohibited until the exact deployed commit has an accepted production record. The exact candidate SHA is supplied by GitHub CI / the production acceptance record because a file cannot contain the SHA of the commit that contains itself without creating a self-reference.\n`;
  fs.writeFileSync(outputPath, body);
  return path.relative(repoRoot, outputPath);
}

function main(): void {
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

  const plan = buildReleaseVersionPlan(repoRoot, request);
  console.log(`[release:version] ${plan.currentVersion} -> ${plan.targetVersion} (${plan.classification})`);
  console.log(`[release:version] Governed files: ${plan.updatedFiles.join(', ')}`);

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
    runGate('npx', ['vitest', 'run', 'tests/unit/platformVersionConsistency.test.ts']);
    runGate('npm', ['run', 'readme:check']);
    runGate('npm', ['run', 'docs:hygiene:check']);
    runGate('npm', ['run', 'build']);
    runGate('npm', ['run', 'predeploy:check']);
    evidencePath = writeCandidateEvidence(plan);
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
