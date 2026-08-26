import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requiredPaths = [
  'src/app/README.md',
  'src/app/App.tsx',
  'src/app/AppShell.tsx',
  'src/app/index.ts',
  'src/app/auth/SessionComposition.tsx',
  'src/app/routing/AppRoutes.tsx',
  'src/app/types/UserSession.ts',
  'src/features/README.md',
  'src/features/index.ts',
  'src/features/registry/registryRoutes.ts',
  'src/features/registry/verifiedCatalogScoring.ts',
  'src/shared/README.md',
  'src/shared/ui/Button.tsx',
  'src/shared/ui/Card.tsx',
  'src/shared/ui/EmptyState.tsx',
  'src/shared/ui/Input.tsx',
  'src/shared/ui/Modal.tsx',
  'src/shared/ui/Skeleton.tsx',
  'src/shared/ui/StatusBadge.tsx',
  'src/shared/ui/Tooltip.tsx',
  'src/shared/branding/CapitalAiLogo.tsx',
  'src/shared/visuals/NeuralBackground.tsx',
  'src/features/public/ui/index.ts',
  'src/features/users/ui/index.ts',
  'src/features/settings/ui/index.ts',
  'src/features/screening/ui/index.ts',
  'src/features/crypto/ui/index.ts',
  'src/features/commodities/ui/index.ts',
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

for (const [legacyPath, canonicalImport] of [
  ['src/components/StatusBadge.tsx', '../shared/ui/StatusBadge'],
  ['src/components/CapitalAiLogo.tsx', '../shared/branding/CapitalAiLogo'],
] as const) {
  const absolute = path.join(ROOT, legacyPath);
  if (!fs.existsSync(absolute)) {
    findings.push(`missing compatibility export: ${legacyPath}`);
    continue;
  }
  const content = fs.readFileSync(absolute, 'utf8');
  if (!content.includes(canonicalImport)) findings.push(`${legacyPath} is not a compatibility export to ${canonicalImport}.`);
}

const rootAppPath = path.join(ROOT, 'src/App.tsx');
if (!fs.existsSync(rootAppPath)) {
  findings.push('missing root App compatibility facade: src/App.tsx');
} else {
  const rootApp = fs.readFileSync(rootAppPath, 'utf8');
  if (!rootApp.includes("export { default } from './app/App'")) {
    findings.push('src/App.tsx must remain a thin compatibility facade to src/app/App.tsx during BB-1+ migration.');
  }
  if (!rootApp.includes("from './app/types/UserSession'")) {
    findings.push('src/App.tsx must preserve the UserSession compatibility type export during migration.');
  }
  if (/useState|useEffect|supabase|LandingPage|Dashboard/.test(rootApp)) {
    findings.push('src/App.tsx contains composition/auth implementation instead of remaining a compatibility facade.');
  }
}

const canonicalAppPath = path.join(ROOT, 'src/app/App.tsx');
if (fs.existsSync(canonicalAppPath)) {
  const canonicalApp = fs.readFileSync(canonicalAppPath, 'utf8');
  if (!canonicalApp.includes('SessionComposition') || !canonicalApp.includes('AppRoutes')) {
    findings.push('src/app/App.tsx must compose SessionComposition and AppRoutes.');
  }
}

try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  if (pkg.scripts?.['frontend:architecture:check'] !== 'tsx scripts/automation/validateFrontendArchitecture.ts') {
    findings.push('package.json frontend:architecture:check does not target the canonical validator.');
  }
  if (!String(pkg.scripts?.['test:raw'] ?? '').includes('npm run frontend:architecture:check')) {
    findings.push('package.json test:raw does not include frontend:architecture:check.');
  }
} catch (error) {
  findings.push(`package.json cannot be validated: ${error instanceof Error ? error.message : String(error)}`);
}

if (findings.length > 0) {
  console.error(`[frontend-architecture] ${findings.length} violation(s)`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`[frontend-architecture] PASS: ${requiredPaths.length} canonical paths verified; BB-1 app composition, dependency and compatibility boundaries intact.`);
