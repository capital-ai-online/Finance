#!/usr/bin/env node
/**
 * Applies SEO Q2/D3 wiring to server.application.ts (idempotent).
 * Run from repo root: node scripts/seo/apply-server-wiring.mjs
 *
 * SEO-GM-ROADMAP-0002 / WP-D3:
 * - Production catch-all is registerProductionSpaFallback (allow-list; unknown → 404)
 * - express.static uses { redirect: false, index: false } to avoid Q2/S2 trailing-slash fights
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'server.application.ts');
let src = fs.readFileSync(file, 'utf8');
let changed = false;

const importLine = "import { registerProductionSpaFallback } from './server/runtime/spaFallback';";

if (!src.includes('registerProductionSpaFallback')) {
  const anchor = "import { getStripeConfigurationStatus, hasFiniteScoreValues, resolveHeuristicCryptoScore, resolveRuntimePort } from './server/runtime/renderRuntimeSafety';";
  if (!src.includes(anchor)) {
    console.error('Import anchor not found — aborting.');
    process.exit(1);
  }
  src = src.replace(anchor, `${anchor}\n${importLine}`);
  changed = true;
}

const oldSpaVariants = [
  `  } else {\n    const distPath = path.join(process.cwd(), 'dist');\n    app.use(express.static(distPath));\n    app.get('*', (req, res) => {\n      res.sendFile(path.join(distPath, 'index.html'));\n    });\n  }`,
  `  } else {\n    const distPath = path.join(process.cwd(), 'dist');\n    app.use(express.static(distPath));\n    // SEO-ROADMAP-0001 / D3: public SPA routes only; unknown paths → real 404.\n    registerProductionSpaFallback(app, distPath);\n  }`,
];

const newSpa = `  } else {\n    const distPath = path.join(process.cwd(), 'dist');\n    // SEO-GM-ROADMAP-0002 / WP-D3: no directory redirect (avoids Q2 vs S2 prerender dir ping-pong);\n    // public HTML is owned by the allow-list SPA fallback (unknown → real 404).\n    app.use(express.static(distPath, { redirect: false, index: false }));\n    registerProductionSpaFallback(app, distPath);\n  }`;

if (!src.includes('express.static(distPath, { redirect: false, index: false })')) {
  let replaced = false;
  for (const oldSpa of oldSpaVariants) {
    if (src.includes(oldSpa)) {
      src = src.replace(oldSpa, newSpa);
      replaced = true;
      changed = true;
      break;
    }
  }
  if (!replaced && src.includes("app.get('*'") && src.includes('index.html')) {
    console.error('SPA fallback block not found in expected form — aborting.');
    process.exit(1);
  }
}

if (!changed) {
  console.log('Already wired — no changes.');
  process.exit(0);
}

fs.writeFileSync(file, src, 'utf8');
console.log('Wired WP-D3 into server.application.ts (registerProductionSpaFallback + static redirect:false)');
