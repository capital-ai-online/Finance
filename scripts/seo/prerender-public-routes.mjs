#!/usr/bin/env node
/**
 * SEO-ROADMAP-0001 / S2 — scaffold for public-route prerender.
 *
 * Run after `vite build`:
 *   node scripts/seo/prerender-public-routes.mjs
 *
 * Current behaviour: clones dist/index.html into route folders and injects
 * route-specific <title> / meta description. Full textual body prerender is a
 * follow-up once legal copy is extracted to a shared module.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(process.cwd(), 'dist');
const indexPath = path.join(dist, 'index.html');

const ROUTES = [
  {
    routePath: '/',
    file: 'index.html',
    title: 'CAPITAL-AI — KI-gestützte Finanzanalyse',
    description:
      'CAPITAL-AI: strukturierte, compliance-bewusste Markt- und Scoring-Analyse. Bildungsorientiert — keine Anlageberatung.',
  },
  {
    routePath: '/impressum',
    file: 'impressum/index.html',
    title: 'Impressum — CAPITAL-AI',
    description: 'Impressum und Anbieterkennzeichnung von CAPITAL-AI.',
  },
  {
    routePath: '/agb',
    file: 'agb/index.html',
    title: 'AGB — CAPITAL-AI',
    description: 'Allgemeine Geschäftsbedingungen von CAPITAL-AI.',
  },
  {
    routePath: '/datenschutz',
    file: 'datenschutz/index.html',
    title: 'Datenschutz — CAPITAL-AI',
    description: 'Datenschutzerklärung von CAPITAL-AI.',
  },
];

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html missing — run vite build first.');
  process.exit(1);
}

const base = fs.readFileSync(indexPath, 'utf8');

function injectMeta(html, title, description) {
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  if (/name="description"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${description}" />`,
    );
  } else {
    out = out.replace(
      /<head[^>]*>/i,
      (m) => `${m}\n    <meta name="description" content="${description}" />`,
    );
  }
  return out;
}

for (const r of ROUTES) {
  if (r.routePath === '/') {
    const html = injectMeta(base, r.title, r.description);
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('updated', r.file);
    continue;
  }
  const outFile = path.join(dist, r.file);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const html = injectMeta(base, r.title, r.description);
  fs.writeFileSync(outFile, html, 'utf8');
  console.log('wrote', r.file);
}

console.log('S2 prerender scaffold done.');
