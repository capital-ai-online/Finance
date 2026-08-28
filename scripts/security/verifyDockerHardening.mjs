import fs from 'node:fs';

const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
const dockerignore = fs.readFileSync('.dockerignore', 'utf8');

const requirements = [
  ['immutable Node 24.18 LTS base image digest', /FROM\s+node:24\.18\.0-alpine@sha256:[a-f0-9]{64}/],
  ['multi-stage builder', /AS\s+builder/i],
  ['dedicated production dependency stage', /AS\s+prod-deps/i],
  ['multi-stage runner', /AS\s+runner/i],
  ['unprivileged builder dependency install', /AS\s+builder[\s\S]*?USER\s+node[\s\S]*?RUN\s+npm\s+ci/],
  ['unprivileged production dependency install', /AS\s+prod-deps[\s\S]*?USER\s+node[\s\S]*?RUN\s+npm\s+ci\s+--omit=dev/],
  ['production esbuild binaries pruned before runner copy', /AS\s+prod-deps[\s\S]*?rm\s+-rf\s+\/app\/node_modules\/esbuild\s+\/app\/node_modules\/@esbuild/],
  ['Vite import verified after esbuild pruning', /node\s+--input-type=module\s+-e\s+"const vite = await import\('vite'\); if \(typeof vite\.createServer !== 'function'\) process\.exit\(1\)"/],
  ['production dependencies copied from isolated stage', /COPY\s+--from=prod-deps\s+--chown=root:root\s+\/app\/node_modules\s+\.\/node_modules/],
  ['runtime OpenSSL security upgrade', /apk\s+upgrade\s+--no-cache\s+libcrypto3\s+libssl3/],
  ['runtime npm and corepack removed', /rm\s+-rf\s+\/usr\/local\/lib\/node_modules\/npm\s+\/usr\/local\/lib\/node_modules\/corepack/],
  ['runtime npm executables removed', /rm\s+-f\s+\/usr\/local\/bin\/npm\s+\/usr\/local\/bin\/npx\s+\/usr\/local\/bin\/corepack/],
  ['non-root runtime user', /USER\s+capitalai/],
  ['root-owned runtime build artifacts', /COPY\s+--from=builder\s+--chown=root:root\s+\/app\/dist/],
  ['root-owned runtime guard', /COPY\s+--from=builder\s+--chown=root:root\s+\/app\/server\/runtime\/runtimeArtifactGuard\.mjs/],
  ['read-only application artifacts', /chmod\s+-R\s+a-w\s+\/app\/node_modules\s+\/app\/dist\s+\/app\/server/],
  ['explicit writable uploads path', /chown\s+capitalai:capitalai\s+\/app\/uploads/],
  ['isolated runtime temp directory', /TMPDIR=\/tmp\/capitalai/],
  ['private runtime temp permissions', /chmod\s+0700\s+\/tmp\/capitalai/],
  ['backend source map removed', /rm\s+-f\s+\/app\/dist\/server\.cjs\.map/],
  ['Render-aligned runtime port', /PORT=10000/],
  ['Render-aligned exposed port', /^EXPOSE\s+10000\s*$/m],
  ['container healthcheck', /HEALTHCHECK[\s\S]*\/healthz/],
  ['healthcheck follows runtime port contract', /127\.0\.0\.1:\$\{PORT:-10000\}\/healthz/],
  ['direct node PID 1 command', /CMD\s*\[\s*"node"\s*,\s*"dist\/server\.cjs"\s*\]/],
  ['explicit CI source-commit build arg', /^ARG\s+RELEASE_SOURCE_COMMIT\s*$/m],
  ['explicit Render source-commit fallback arg', /^ARG\s+RENDER_GIT_COMMIT\s*$/m],
  ['source commit scoped to build command', /RUN\s+RELEASE_SOURCE_COMMIT="\$\{RELEASE_SOURCE_COMMIT:-\$RENDER_GIT_COMMIT\}"\s+npm run build/],
];

const forbidden = [
  ['floating Node 24.18 base tag without digest', /^FROM\s+node:24\.18\.0-alpine(?:\s|$)/m],
  ['legacy Node 22 production base', /^FROM\s+node:22(?:[.-]|\s|$)/m],
  ['root runtime user', /^USER\s+root\s*$/m],
  ['production npm shim command', /CMD\s*\[\s*"npm"/],
  ['runtime artifacts owned by application user', /COPY\s+--from=(?:builder|prod-deps)\s+--chown=capitalai:capitalai/],
  ['source commit persisted as image ENV', /^ENV\s+RELEASE_SOURCE_COMMIT\b/m],
  ['legacy exposed port 3000', /^EXPOSE\s+3000\s*$/m],
  ['legacy fixed healthcheck port 3000', /127\.0\.0\.1:3000\/healthz/],
];

const ignoreRequirements = [
  '.env',
  '.env.*',
  '.git',
  '.mcp.json',
  'node_modules',
  'coverage',
  '*.log',
  '*.pem',
  '*.key',
  'secrets/',
];

const failures = [];
for (const [name, pattern] of requirements) {
  if (!pattern.test(dockerfile)) failures.push(`missing: ${name}`);
}
for (const [name, pattern] of forbidden) {
  if (pattern.test(dockerfile)) failures.push(`forbidden: ${name}`);
}
for (const entry of ignoreRequirements) {
  if (!dockerignore.split(/\r?\n/).includes(entry)) failures.push(`.dockerignore missing: ${entry}`);
}

const baseImages = dockerfile.match(/^FROM\s+node:24\.18\.0-alpine@sha256:[a-f0-9]{64}/gm) || [];
if (baseImages.length !== 3 || new Set(baseImages).size !== 1) {
  failures.push('all builder/prod-deps/runner stages must use the same immutable Node image digest');
}

const sourceMapRemovalIndex = dockerfile.indexOf('rm -f /app/dist/server.cjs.map');
const prodDepsStageIndex = dockerfile.indexOf(' AS prod-deps');
if (sourceMapRemovalIndex < 0 || prodDepsStageIndex < 0 || sourceMapRemovalIndex > prodDepsStageIndex) {
  failures.push('backend source map must be removed in builder before any runner COPY can capture it');
}

const runnerStageIndex = dockerfile.indexOf(' AS runner');
const runnerSection = runnerStageIndex >= 0 ? dockerfile.slice(runnerStageIndex) : '';
if (/\bnpm\s+(?:ci|install)\b/.test(runnerSection)) {
  failures.push('forbidden: runtime stage must not install npm dependencies');
}

if (/ARG\s+(?:.*SECRET|.*PASSWORD|.*TOKEN|STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY)/i.test(dockerfile)) {
  failures.push('forbidden: secret-like Docker ARG detected');
}

if (failures.length) {
  console.error('Docker hardening policy failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Docker hardening policy passed.');
