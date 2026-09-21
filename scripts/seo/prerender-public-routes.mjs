#!/usr/bin/env node
/**
 * SEO-ROADMAP-0001 / S2 — public-route prerender (meta + noscript body).
 *
 * Run after `vite build` (also hooked from npm run build):
 *   node scripts/seo/prerender-public-routes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://capital-ai.online';
const dist = path.join(process.cwd(), 'dist');
const indexPath = path.join(dist, 'index.html');
const packagePath = path.join(process.cwd(), 'package.json');
const packageMetadata = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const PLATFORM_VERSION = String(packageMetadata.version || '');

if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(PLATFORM_VERSION)) {
  throw new Error('[SEO prerender] package.json#version must be strict MAJOR.MINOR.PATCH SemVer.');
}

const ROUTES = [
  {
    routePath: '/',
    file: 'index.html',
    title: 'CAPITAL-AI – Marktdaten verstehen. Chancen besser erkennen.',
    description:
      `Offizielles CAPITAL-AI Portal (Version ${PLATFORM_VERSION}) – Marktdaten verstehen. Chancen besser erkennen: Echtzeit-Marktdaten, KI-gestütztes Scoring und fundierte Analysen für transparentere Entscheidungen an globalen Märkten.`,
    noscript:
      'CAPITAL-AI: Marktdaten verstehen, Chancen besser erkennen — mit Echtzeit-Marktdaten, KI-gestütztem Scoring und fundierten Analysen. Bildungsorientiert — keine Anlageberatung.',
  },
  {
    routePath: '/universe',
    file: 'universe/index.html',
    title: 'CAPITAL-AI Universe – Multi-Asset Intelligence',
    description:
      'CAPITAL-AI Universe verbindet Multi-Asset Discovery, verifizierte Evidence und kanonische Scoring-Projektionen für Krypto, Aktien, Indizes, Forex und Rohstoffe.',
    noscript:
      'CAPITAL-AI Universe: Multi-Asset Discovery, verifizierte Evidence und kanonische Scoring-Projektionen. Bildungsorientiert — keine Anlageberatung.',
  },
  {
    routePath: '/learning-platform',
    file: 'learning-platform/index.html',
    title: 'Capital-AI Learning Platform – Canonical Vocabulary',
    description:
      'Die Capital-AI Learning Platform stellt das freigegebene zweisprachige CAPITAL-AI Vocabulary mit Definitionen, Concept-IDs und Governance-Referenzen read-only bereit.',
    noscript:
      'Capital-AI Learning Platform: freigegebenes zweisprachiges Vocabulary mit Definitionen, Concept-IDs und Governance-Referenzen.',
  },
  {
    routePath: '/impressum',
    file: 'impressum/index.html',
    title: 'Impressum – CAPITAL-AI',
    description:
      'Impressum und Anbieterkennzeichnung gemäß § 5 DDG für CAPITAL-AI (Sven Kulessa).',
    noscript:
      'Impressum CAPITAL-AI — Anbieter: Sven Kulessa. Vollständiger Text nach Aktivierung von JavaScript.',
  },
  {
    routePath: '/agb',
    file: 'agb/index.html',
    title: 'AGB – CAPITAL-AI',
    description: 'Allgemeine Geschäftsbedingungen für die Nutzung des CAPITAL-AI Portals.',
    noscript:
      'Allgemeine Geschäftsbedingungen (AGB) von CAPITAL-AI. Vollständiger Text nach Aktivierung von JavaScript.',
  },
  {
    routePath: '/datenschutz',
    file: 'datenschutz/index.html',
    title: 'Datenschutzerklärung – CAPITAL-AI',
    description:
      'Datenschutzerklärung und Informationen zur Datenverarbeitung gemäß DSGVO für CAPITAL-AI.',
    noscript:
      'Datenschutzerklärung CAPITAL-AI (DSGVO). Vollständiger Text nach Aktivierung von JavaScript.',
  },
];

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html missing — run vite build first.');
  process.exit(1);
}

const base = fs.readFileSync(indexPath, 'utf8');

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function canonicalHref(routePath) {
  return routePath === '/' ? `${ORIGIN}/` : `${ORIGIN}${routePath}`;
}

function injectMeta(html, route) {
  const title = route.title;
  const description = route.description;
  const canonical = canonicalHref(route.routePath);
  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttr(title)}</title>`);

  out = out.replace(
    /<meta\s+name="title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="title" content="${escapeAttr(title)}" />`,
  );
  if (/<meta\s+name="description"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeAttr(description)}" />`,
    );
  } else {
    out = out.replace(
      /<head[^>]*>/i,
      (m) => `${m}\n    <meta name="description" content="${escapeAttr(description)}" />`,
    );
  }

  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`,
  );

  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
  );

  out = out.replace(
    /<meta\s+property="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:url" content="${canonical}" />`,
  );
  out = out.replace(
    /<meta\s+property="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:title" content="${escapeAttr(title)}" />`,
  );
  out = out.replace(
    /<meta\s+property="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:description" content="${escapeAttr(description)}" />`,
  );

  const noscriptBlock = `<noscript>
      <main>
        <h1>${escapeAttr(title)}</h1>
        <p>${escapeAttr(route.noscript)}</p>
        <p><a href="${ORIGIN}/universe">Universe</a> · <a href="${ORIGIN}/learning-platform">Learning Platform</a></p>
        <p><a href="${ORIGIN}/impressum">Impressum</a> ·
           <a href="${ORIGIN}/agb">AGB</a> ·
           <a href="${ORIGIN}/datenschutz">Datenschutz</a></p>
      </main>
    </noscript>`;
  if (/<noscript>[\s\S]*?<\/noscript>/i.test(out)) {
    out = out.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscriptBlock);
  } else {
    out = out.replace(/<body[^>]*>/i, (m) => `${m}\n    ${noscriptBlock}`);
  }

  return out;
}

for (const r of ROUTES) {
  if (r.routePath === '/') {
    fs.writeFileSync(indexPath, injectMeta(base, r), 'utf8');
    console.log('updated', r.file);
    continue;
  }
  const outFile = path.join(dist, r.file);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, injectMeta(base, r), 'utf8');
  console.log('wrote', r.file);
}

console.log('S2 prerender done for', ROUTES.length, 'routes.');