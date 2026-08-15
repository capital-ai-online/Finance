#!/usr/bin/env node
/**
 * Applies SEO Q2/D3 wiring to server.application.ts (idempotent).
 * Run from repo root: node scripts/seo/apply-server-wiring.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'server.application.ts');
let src = fs.readFileSync(file, 'utf8');
let changed = false;

const importBlock = `import { registerTrailingSlashNormalize } from './server/middleware/seoUrlNormalize';
import { registerProductionSpaFallback } from './server/runtime/spaFallback';`;

if (!src.includes('registerTrailingSlashNormalize')) {
  const anchor = "import { getStripeConfigurationStatus, hasFiniteScoreValues, resolveHeuristicCryptoScore, resolveRuntimePort } from './server/runtime/renderRuntimeSafety';";
  if (!src.includes(anchor)) {
    console.error('Import anchor not found — aborting.');
    process.exit(1);
  }
  src = src.replace(anchor, `${anchor}\n${importBlock}`);
  changed = true;
}

if (!src.includes('registerTrailingSlashNormalize(app)')) {
  const probeEnd = `app.use((req, res, next) => {
  if (PROBE_PATH_PATTERNS.some((pattern) => pattern.test(req.path))) {
    return res.status(404).end();
  }
  next();
});`;
  if (!src.includes(probeEnd)) {
    console.error('Probe middleware block not found — aborting.');
    process.exit(1);
  }
  src = src.replace(
    probeEnd,
    `${probeEnd}\n\n// SEO-ROADMAP-0001 / Q2: trailing-slash normalization (301) before API and SPA.\nregisterTrailingSlashNormalize(app);`,
  );
  changed = true;
}

const oldSpa = `  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }`;

const newSpa = `  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SEO-ROADMAP-0001 / D3: public SPA routes only; unknown paths → real 404.
    registerProductionSpaFallback(app, distPath);
  }`;

if (src.includes("app.get('*'") && src.includes('index.html')) {
  if (!src.includes('registerProductionSpaFallback(app, distPath)')) {
    if (!src.includes(oldSpa)) {
      console.error('SPA fallback block not found in expected form — aborting.');
      process.exit(1);
    }
    src = src.replace(oldSpa, newSpa);
    changed = true;
  }
}

if (!changed) {
  console.log('Already wired — no changes.');
  process.exit(0);
}

fs.writeFileSync(file, src, 'utf8');
console.log('Wired Q2/D3 into server.application.ts');
