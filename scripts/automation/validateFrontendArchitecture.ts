import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requiredPaths = [
  'src/app/README.md',
  'src/features/README.md',
  'src/features/index.ts',
  'src/shared/README.md',
  'src/shared/ui/StatusBadge.tsx',
  'src/shared/branding/CapitalAiLogo.tsx',
  'src/shared/visuals/NeuralBackground.tsx',
  'src/features/public/ui/index.ts',
  'src/features/users/ui/index.ts',
  'src/features/settings/ui/index.ts',
  'src/features/screening/ui/index.ts',
  'src/features/crypto/ui/index.ts',
  'src/features/stocks/ui/index.ts',
  'src/features/analytics/ui/index.ts',
  'src/features/news/ui/index.ts',
  'src/features/portfolio/ui/index.ts',
  'src/features/billing/ui/index.ts',
  'src/features/reporting/ui/index.ts',
  'src/features/social/ui/index.ts',
  'src/features/governance/ui/index.ts',
];

const forbiddenParallelRoots = ['src/frontend', 'src/ui'];
const sharedForbiddenDependencyPattern = /from\s+['"][^'"]*(?:\/features\/|\/components\/|\.\.\/\.\.\/features|\.\.\/\.\.\/components)/;

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(absolute));
    else out.push(absolute);
  }
  return out;
}

const findings: string[] = [];

for (const relative of requiredPaths) {
  if (!fs.existsSync(path.join(ROOT, relative))) findings.push(`missing required frontend architecture path: ${relative}`);
}

for (const relative of forbiddenParallelRoots) {
  if (fs.existsSync(path.join(ROOT, relative))) findings.push(`parallel frontend root is forbidden: ${relative}`);
}

for (const file of walk(path.join(ROOT, 'src/shared')).filter((name) => /\.(ts|tsx)$/.test(name))) {
  const content = fs.readFileSync(file, 'utf8');
  if (sharedForbiddenDependencyPattern.test(content)) {
    findings.push(`shared layer depends on feature/legacy component: ${path.relative(ROOT, file).replace(/\\/g, '/')}`);
  }
}

const statusCompat = fs.readFileSync(path.join(ROOT, 'src/components/StatusBadge.tsx'), 'utf8');
if (!statusCompat.includes("../shared/ui/StatusBadge")) findings.push('StatusBadge legacy path is not a compatibility export to src/shared/ui.');

const logoCompat = fs.readFileSync(path.join(ROOT, 'src/components/CapitalAiLogo.tsx'), 'utf8');
if (!logoCompat.includes("../shared/branding/CapitalAiLogo")) findings.push('CapitalAiLogo legacy path is not a compatibility export to src/shared/branding.');

if (findings.length > 0) {
  console.error(`[frontend-architecture] ${findings.length} violation(s)`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`[frontend-architecture] PASS: ${requiredPaths.length} canonical paths verified; no parallel frontend root detected.`);
