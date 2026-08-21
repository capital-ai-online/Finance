#!/usr/bin/env node

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').trim();
}

const EXACT_PROTECTED_PATHS = new Set([
  'index.html',
  'public/cookiehub-init.js',
  'public/google-analytics-consent.js',
  'server/securityResponse.ts',
  'server/logger.ts',
  'src/platform/Security/types.ts',
  'src/platform/Security/authMiddleware.ts',
  'src/services/cookieHubConsentBridge.ts',
  'scripts/security/verifyGoogleMarketingInvariants.ts',
  'scripts/security/verifyGoogleMarketingProtectedWiring.mjs',
  'tests/unit/googleMarketingConsent.test.ts',
  'tests/unit/securityResponse.test.ts',
  'tests/unit/securityResponse.production.test.ts',
  'tests/unit/googleMarketingGuardConsolidation.test.ts',
  'package.json',
  '.github/workflows/ci.yml',
  '.github/workflows/google-marketing-protected-change.yml',
  '.github/workflows/pr-governance.yml',
  '.github/CODEOWNERS',
  '.dockerignore',
  'docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_ARCHITECTURE.md',
  'docs/runbooks/GOOGLE_ANALYTICS_SETUP.md',
]);

const PROTECTED_PREFIXES = [
  '.ai/skills/ESS-0014-',
  'docs/adr/ADR-0035-',
  'docs/adr/ADR-0040-',
  'docs/adr/ADR-0042-',
];

export function isGoogleMarketingProtectedPath(filePath) {
  const normalized = normalizePath(filePath);
  return EXACT_PROTECTED_PATHS.has(normalized) || PROTECTED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function listChangedFiles(baseRef = 'origin/main', headRef = 'HEAD') {
  const out = execFileSync('git', ['diff', '--name-only', `${baseRef}...${headRef}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  return out ? out.split(/\r?\n/).map(normalizePath).filter(Boolean) : [];
}

function requireFile(filePath, errors) {
  if (!fs.existsSync(filePath)) errors.push(`required file missing: ${filePath}`);
}

export function validateGoogleMarketingProtectedWiring(root = process.cwd()) {
  const errors = [];
  const read = (relativePath) => fs.readFileSync(`${root}/${relativePath}`, 'utf8');

  requireFile(`${root}/.dockerignore`, errors);
  requireFile(`${root}/package.json`, errors);
  requireFile(`${root}/.github/workflows/ci.yml`, errors);
  requireFile(`${root}/tests/unit/securityResponse.production.test.ts`, errors);
  requireFile(`${root}/scripts/security/verifyGoogleMarketingInvariants.ts`, errors);
  if (errors.length > 0) return errors;

  const dockerignore = read('.dockerignore').split(/\r?\n/);
  for (const requiredLine of [
    '.github/*',
    '!.github/workflows/',
    '.github/workflows/*',
    '!.github/workflows/google-marketing-protected-change.yml',
  ]) {
    if (!dockerignore.includes(requiredLine)) errors.push(`.dockerignore marker missing: ${requiredLine}`);
  }

  const packageJson = JSON.parse(read('package.json'));
  const scripts = packageJson.scripts || {};
  for (const scriptName of ['build', 'predeploy:check']) {
    if (!String(scripts[scriptName] || '').includes('verifyGoogleMarketingInvariants.ts')) {
      errors.push(`Google-Marketing invariant guard missing from npm script ${scriptName}`);
    }
  }

  const ci = read('.github/workflows/ci.yml');
  const required = {
    unit: 'run: npm test',
    build: 'run: npm run build',
    productionCsp: 'run: npx vitest run tests/unit/securityResponse.production.test.ts',
    predeploy: 'npm run predeploy:check',
  };
  for (const [name, marker] of Object.entries(required)) {
    if (!ci.includes(marker)) errors.push(`central CI evidence missing: ${name}`);
  }

  if (errors.length === 0) {
    const buildPos = ci.indexOf(required.build);
    const cspPos = ci.indexOf(required.productionCsp);
    const predeployPos = ci.indexOf(required.predeploy);
    if (!(buildPos < cspPos && cspPos < predeployPos)) {
      errors.push('production CSP test must remain after build and before predeploy:check');
    }
    if (ci.split(required.productionCsp).length - 1 !== 1) {
      errors.push('production CSP test must be wired exactly once in central CI');
    }
  }

  return errors;
}

function main() {
  const force = process.argv.includes('--force');
  const baseRef = process.env.PR_BASE_REF || 'origin/main';
  const headRef = process.env.PR_HEAD_REF || 'HEAD';
  const changedFiles = force ? [] : listChangedFiles(baseRef, headRef);
  const correlated = force || changedFiles.some(isGoogleMarketingProtectedPath);

  if (!correlated) {
    console.log('[GOOGLE-MARKETING-WIRING] No correlated protected path change; static wiring check skipped inside existing governance runner.');
    return;
  }

  const errors = validateGoogleMarketingProtectedWiring(process.cwd());
  if (errors.length > 0) {
    console.error(`[GOOGLE-MARKETING-WIRING] FAIL\n- ${errors.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  console.log('[GOOGLE-MARKETING-WIRING] PASS — protected wiring remains complete and central CI evidence is ordered.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('/verifyGoogleMarketingProtectedWiring.mjs')) {
  main();
}
