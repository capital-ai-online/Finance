import fs from 'node:fs';
import path from 'node:path';
import {
  buildExpectedReadme,
  type PackageVersionAuthority,
} from '../../src/platform/Release/Services/readmeVersionProjection';

const repoRoot = process.cwd();
const readmePath = path.join(repoRoot, 'README.md');
const packagePath = path.join(repoRoot, 'package.json');
const nvmrcPath = path.join(repoRoot, '.nvmrc');

function main(): void {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageVersionAuthority;
  const nodeRuntime = fs.readFileSync(nvmrcPath, 'utf8').trim();
  const readme = fs.readFileSync(readmePath, 'utf8');
  const expected = buildExpectedReadme(readme, pkg, nodeRuntime);
  const checkOnly = process.argv.includes('--check');

  if (expected === readme) {
    console.log('[readme-sync] README canonical declarations and version matrix are current.');
    return;
  }

  if (checkOnly) {
    console.error('[readme-sync] README version declarations are stale. Run: npm run readme:sync');
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(readmePath, expected, 'utf8');
  console.log('[readme-sync] README synchronized from repository authorities.');
}

try {
  main();
} catch (error) {
  console.error(`[readme-sync] FAIL-CLOSED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
