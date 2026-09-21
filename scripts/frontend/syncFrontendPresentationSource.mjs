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
  if (config?.schemaVersion !== '1.0.0') fail('unsupported config schema');
  if (!config?.source?.repository || !config?.destination) fail('source/destination missing');
  if (String(config.destination).startsWith('src/')) fail('destination must remain outside runtime src/');
  if (config?.runtimePromotion?.automatic !== false) fail('automatic runtime promotion must stay disabled');
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
  if (config.allowedExactPaths.includes(file)) return true;
  return matchesAny(file, config.allowedPathPatterns);
}

function isDeniedPath(file, config) {
  return matchesAny(file, config.neverCopyPathPatterns);
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

const config = readConfig();
const sourceDir = process.env.FRONTEND_UPSTREAM_DIR;
const expectedSha = process.env.FRONTEND_UPSTREAM_SHA;

if (!sourceDir) fail('FRONTEND_UPSTREAM_DIR is required');
if (!expectedSha || !/^[0-9a-f]{40}$/i.test(expectedSha)) fail('FRONTEND_UPSTREAM_SHA must be a full commit SHA');

const observedSha = git(sourceDir, ['rev-parse', 'HEAD']);
if (observedSha !== expectedSha) fail(`upstream SHA mismatch: expected=${expectedSha} observed=${observedSha}`);

const tracked = git(sourceDir, ['ls-files', '-z'])
  .split('\0')
  .filter(Boolean)
  .map(safeRelativePath);

const selected = tracked.filter((file) => isAllowedPath(file, config));
if (selected.length === 0) fail('allowlist selected no upstream presentation files');

for (const file of selected) {
  if (isDeniedPath(file, config)) fail(`allowlist/denylist conflict for ${file}`);
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
  manifestFiles.push({
    sourcePath: file,
    mirroredPath: targetPath.replaceAll('\\', '/'),
    bytes: stat.size,
    runtimePromotionEligible: promotionBlockPatterns.length === 0,
    promotionBlockPatterns,
  });
}

const manifest = {
  schemaVersion: '1.0.0',
  policyId: config.policyId,
  sourceRepository: config.source.repository,
  sourceRef: config.source.ref,
  sourceSha: observedSha,
  destination: config.destination,
  runtimePromotionAutomatic: false,
  totalBytes,
  files: manifestFiles,
};

fs.writeFileSync(
  path.join(config.destination, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

fs.writeFileSync(
  path.join(config.destination, 'README.md'),
  `# Mirrored FRONTEND presentation source

This directory is an inert, generated presentation-source snapshot from \`${config.source.repository}@${observedSha}\`.

It is **not runtime code** and is intentionally outside \`src/\`. Text sources are stored with a \`.source\` suffix so TypeScript/Vite cannot compile them by accident. The hourly sync copies only allowlisted graphical components, UI slices, visual assets, the composition blueprint and stylesheet. It does not copy upstream data, API, provider, auth, billing, scoring, entitlement, server, package or environment files.

A mirrored file with \`runtimePromotionEligible=false\` contains a dependency pattern that must be removed or replaced by a Finance-owned adapter before any separately reviewed runtime promotion. Automatic promotion to production code is forbidden.
`,
  'utf8',
);

console.log(
  `[FRONTEND-UPSTREAM-SYNC] mirrored ${manifestFiles.length} presentation file(s), ${totalBytes} bytes, upstream=${observedSha}`,
);
