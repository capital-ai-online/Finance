#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CONFIG_PATH = '.github/frontend-upstream-sync.json';

function fail(message) {
  console.error(`[FRONTEND-UPSTREAM-SYNC] ${message}`);
  process.exit(1);
}

function readConfig() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (config?.schemaVersion !== '1.2.0') fail('unsupported config schema');
  if (!config?.source?.repository || !config?.destination) fail('source/destination missing');
  if (String(config.destination).startsWith('src/')) fail('destination must remain outside runtime src/');
  if (config?.runtimePromotion?.automatic !== false) fail('automatic runtime promotion must stay disabled');

  const responsive = config?.responsiveRuntimeAdapter;
  if (responsive?.required !== true) fail('desktop responsive runtime adapter must be required');
  if (responsive?.strategy !== 'DESKTOP_VIEWPORT_ADAPTER') fail('responsive runtime adapter must be desktop-only');
  if (responsive?.preserveMobileSourceLayout !== true) fail('mobile source layout must remain unchanged');
  if (responsive?.preserveTabletSourceLayout !== true) fail('tablet source layout must remain unchanged');
  if (responsive?.upstreamPreviewChromeRuntimeOnDesktop !== false) fail('upstream preview chrome must stay disabled on desktop');
  if (responsive?.userAgentBranching !== false) fail('responsive adaptation must not branch on user-agent detection');
  if (!Number.isInteger(responsive?.desktopMinPx) || responsive.desktopMinPx < 1024) {
    fail('desktop runtime breakpoint must be at least 1024px');
  }

  const adapterPath = safeRelativePath(responsive?.path ?? '');
  if (!adapterPath.startsWith('src/features/public/ui/frontend-port/')) {
    fail('desktop runtime adapter must stay inside the bounded frontend-port runtime');
  }
  if (!fs.existsSync(adapterPath)) fail('desktop runtime adapter missing: ' + adapterPath);
  if (!responsive?.validationTest || !fs.existsSync(safeRelativePath(responsive.validationTest))) {
    fail('desktop runtime adapter validation test missing');
  }

  return config;
}

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
}

function safeRelativePath(value) {
  const normalized = String(value).replaceAll('\\', '/');
  if (!normalized || normalized.startsWith('/') || normalized.includes('../') || normalized.includes('/..')) {
    fail(`unsafe upstream path: ${value}`);
  }
  return normalized;
}

function matchesAny(value, patterns = []) {
  return patterns.some((pattern) => new RegExp(pattern).test(value));
}

function isAllowedPath(file, config) {
  return config.allowedExactPaths.includes(file) || matchesAny(file, config.allowedPathPatterns);
}

function isVisualFixture(file, config) {
  return config.visualFixtureExactPaths.includes(file);
}

function destinationFor(file, config) {
  const ext = path.extname(file).toLowerCase();
  const base = path.join(config.destination, file);
  return config.textExtensions.includes(ext) ? `${base}.source` : base;
}

function contentPromotionBlocks(buffer, file, config) {
  const ext = path.extname(file).toLowerCase();
  if (!config.textExtensions.includes(ext)) return [];
  const text = buffer.toString('utf8');
  return config.promotionBlockContentPatterns.filter((pattern) => new RegExp(pattern, 'm').test(text));
}

function sourceRole(file, config) {
  if (isVisualFixture(file, config)) return 'VISUAL_FIXTURE_ONLY';
  if (file === 'src/App.tsx' || file === 'src/main.tsx') return 'PRESENTATION_ARCHITECTURE';
  if (file === 'src/index.css') return 'VISUAL_STYLE';
  if (file === 'src/types.ts') return 'PRESENTATION_TYPE_SHAPE';
  if (file.startsWith('src/components/')) return 'GRAPHICAL_COMPONENT';
  if (file.includes('/ui/')) return 'UI_SLICE';
  return 'VISUAL_ASSET';
}

const config = readConfig();
const sourceDir = process.env.FRONTEND_UPSTREAM_DIR;
const expectedSha = process.env.FRONTEND_UPSTREAM_SHA;

if (!sourceDir) fail('FRONTEND_UPSTREAM_DIR is required');
if (!expectedSha || !/^[0-9a-f]{40}$/i.test(expectedSha)) fail('FRONTEND_UPSTREAM_SHA must be a full commit SHA');

const observedSha = git(sourceDir, ['rev-parse', 'HEAD']);
if (observedSha !== expectedSha) fail(`upstream SHA mismatch: expected=${expectedSha} observed=${observedSha}`);

const tracked = git(sourceDir, ['ls-files', '-z']).split('\0').filter(Boolean).map(safeRelativePath);

for (const required of config.architectureRoots) {
  if (!tracked.includes(required)) fail(`required presentation architecture root missing upstream: ${required}`);
}

const upstreamApp = fs.readFileSync(path.join(sourceDir, 'src/App.tsx'), 'utf8');
const desktopLayoutMarkers = config?.responsiveRuntimeAdapter?.sourceLayoutMarkers ?? [];
if (!Array.isArray(desktopLayoutMarkers) || desktopLayoutMarkers.length === 0) {
  fail('desktop adapter source layout markers are required');
}
for (const marker of desktopLayoutMarkers) {
  if (!upstreamApp.includes(marker)) {
    fail(`desktop adapter correlation required: upstream src/App.tsx no longer contains "${marker}"`);
  }
}

const selected = tracked.filter((file) => isAllowedPath(file, config));
if (selected.length === 0) fail('allowlist selected no upstream presentation files');

for (const file of selected) {
  if (matchesAny(file, config.neverCopyPathPatterns)) fail(`allowlist/denylist conflict for ${file}`);
}

fs.rmSync(config.destination, { recursive: true, force: true });
fs.mkdirSync(config.destination, { recursive: true });

let totalBytes = 0;
const manifestFiles = [];

for (const file of selected.sort()) {
  const sourcePath = path.join(sourceDir, file);
  const stat = fs.lstatSync(sourcePath);
  if (stat.isSymbolicLink()) fail(`symlink rejected: ${file}`);
  if (!stat.isFile()) continue;
  if (stat.size > config.maxFileBytes) fail(`file too large: ${file} (${stat.size} bytes)`);
  totalBytes += stat.size;
  if (totalBytes > config.maxTotalBytes) fail(`selected source exceeds ${config.maxTotalBytes} bytes`);

  const buffer = fs.readFileSync(sourcePath);
  const targetPath = destinationFor(file, config);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, buffer);

  const promotionBlockPatterns = contentPromotionBlocks(buffer, file, config);
  const fixtureOnly = isVisualFixture(file, config);
  manifestFiles.push({
    sourcePath: file,
    mirroredPath: targetPath.replaceAll('\\', '/'),
    role: sourceRole(file, config),
    bytes: stat.size,
    runtimePromotionEligible: !fixtureOnly && promotionBlockPatterns.length === 0,
    promotionBlockPatterns: fixtureOnly
      ? ['VISUAL_FIXTURE_ONLY', ...promotionBlockPatterns]
      : promotionBlockPatterns,
  });
}

const selectedPaths = new Set(manifestFiles.map((entry) => entry.sourcePath));
const requiredCurrentSurfacePaths = [
  'src/components/LoginPage.tsx',
  'src/components/LegalAndFaqPages.tsx',
  'src/components/SubclassDetailModal.tsx',
];
for (const required of requiredCurrentSurfacePaths) {
  if (!selectedPaths.has(required)) {
    fail(`current graphical surface missing upstream: ${required}`);
  }
}

const architectureSummary = config.architectureRoots
  .map((sourcePath) => manifestFiles.find((entry) => entry.sourcePath === sourcePath))
  .filter(Boolean);
const fixtureSummary = config.visualFixtureExactPaths
  .map((sourcePath) => manifestFiles.find((entry) => entry.sourcePath === sourcePath))
  .filter(Boolean);
const componentSummary = manifestFiles
  .filter((entry) => entry.sourcePath.startsWith('src/components/'))
  .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
const uiSummary = manifestFiles
  .filter((entry) => entry.role === 'UI_SLICE')
  .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
const assetSummary = manifestFiles
  .filter((entry) => entry.role === 'VISUAL_ASSET')
  .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));

const mockDataSource = fs.readFileSync(path.join(sourceDir, 'src/data/mockData.ts'), 'utf8');
const visibleAssetCount = (mockDataSource.match(/\bmainCategory:\s*['"]/g) ?? []).length;

const manifest = {
  schemaVersion: config.schemaVersion,
  policyId: config.policyId,
  sourceRepository: config.source.repository,
  sourceRef: config.source.ref,
  sourceSha: observedSha,
  adoptionMode: 'FULL_PRESENTATION_ARCHITECTURE_SNAPSHOT',
  allCurrentElementsMirrored: true,
  currentGraphicalComponentCount: componentSummary.length,
  visualFixtureOnly: config.visualFixtureExactPaths,
  runtimePromotionAutomatic: false,
  financeComponentsBindAfterArchitectureAdoption: true,
  responsiveRuntimeAdapter: config.responsiveRuntimeAdapter,
  presentationSurfaces: {
    login: '/login',
    legalAndFaq: 'src/components/LegalAndFaqPages.tsx',
    assetSubclass: 'src/components/SubclassDetailModal.tsx',
    routingBlueprint: 'src/App.tsx',
    legalRoutes: ['/impressum', '/datenschutz', '/agb', '/faq'],
    routeNormalization: 'src/App.tsx::resolveAppRoute',
  },
  ownerBoundaries: {
    auth: 'Finance canonical auth/session remains authoritative; upstream LoginPage is presentation source only',
    compliance: 'CAPITAL-AI-COMP remains authoritative for all productive legal/FAQ content; upstream LegalAndFaqPages is design/routing reference only and its sample legal text MUST NOT be promoted',
    fintech: 'CAPITAL-AI-FINTECH remains authoritative for asset classes/subclasses; mockData is visual fixture only',
    analytics: 'upstream src/utils/analytics.ts and index.html are intentionally not mirrored by the presentation allowlist',
  },
  files: [...architectureSummary, ...fixtureSummary, ...componentSummary, ...uiSummary, ...assetSummary].map(
    ({ sourcePath, role }) => ({ sourcePath, role }),
  ),
  assetPresentation: {
    visibleAssetCount,
    symbolContract: 'Every market asset already visible on the landing carries a non-empty symbol/ticker and the active landing card renders asset.symbol.',
    authority: 'Presentation only; canonical asset taxonomy/data/scoring remains CAPITAL-AI-FINTECH.',
  },
};
fs.writeFileSync(path.join(config.destination, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

fs.writeFileSync(
  path.join(config.destination, 'README.md'),
  `# Mirrored FRONTEND presentation architecture

Pinned presentation source: \`${config.source.repository}@${observedSha}\`.

This snapshot contains the current allowlisted graphical architecture, including the dedicated login design, legal/FAQ presentation surface, robust public-route normalization, hierarchical asset-class/subclass navigation components, and the existing visual assets.

## Integration boundary

- \`/login\`: the upstream \`LoginPage.tsx\` is a graphical/routing source only. Productive authentication/session handling remains Finance-owned.
- \`/impressum\`, \`/datenschutz\`, \`/agb\`, \`/faq\`: \`LegalAndFaqPages.tsx\` is a design and navigation source only. All productive legal/FAQ wording, assertions, versions and review remain owned by \`CAPITAL-AI-COMP\`.
- The upstream legal component contains sample/template legal copy. That copy is inert evidence and MUST NOT be promoted into productive Finance routes.
- Asset classes and subclasses: the Sideboard/navigation presentation is mirrored, while canonical asset taxonomy and scoring semantics remain owned by \`CAPITAL-AI-FINTECH\`.
- Every market asset already visible on the active landing has a symbol/ticker in the presentation model; the Finance regression contract verifies complete symbol coverage.
- \`src/data/mockData.ts\` remains \`VISUAL_FIXTURE_ONLY\`.
- Upstream Analytics/SEO runtime code is not promoted by this presentation sync. Finance keeps its existing consent, analytics, SEO, auth, security and compliance controls.

Automatic runtime promotion remains disabled. Productive binding is performed only through bounded Finance adapters with exact-head validation and owner-correct handovers.
`,
  'utf8',
);
console.log(`[FRONTEND-UPSTREAM-SYNC] mirrored ${manifestFiles.length} presentation architecture file(s), ${totalBytes} bytes, upstream=${observedSha}`);
