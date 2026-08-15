#!/usr/bin/env node
/**
 * SEO-ROADMAP-0001 / S2 — public-route prerender (meta + noscript body).
 *
 * Run after `vite build` (also hooked from npm run build):
 *   node scripts/seo/prerender-public-routes.mjs
 *
 * Full React-body HTML extraction remains a follow-up; this step ensures crawlers
 * without JS still see route-specific title/description/canonical and a minimal
 * noscript content block.
 */
import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://capital-ai.online';
const dist = path.join(process.cwd(), 'dist');
const indexPath = path.join(dist, 'index.html');

const ROUTES = [
  {
    routePath: '/',
    file: 'index.html',
    title: 'CAPITAL-AI Portal',
    description:
      'Offizielles CAPITAL-AI Portal (Version 0.6.0) – Sichere quantitative Analysen, Compliance-Management, Asset-Scoring und automatisierte DSGVO-Dokumentation.',
    noscript:
      'CAPITAL-AI Portal: quantitative Analysen, Compliance und Asset-Scoring. Bildungsorientiert — keine Anlageberatung.',
  },
  {
    routePath: '/impressum',
    file: 'impressum/index.html',
    title: 'Impressum – CAPITAL-AI',
    description:
      'Impressum und Anbieterkennzeichnung gemäß TMG §5 für CAPITAL-AI (Sven Kulessa).',
    noscript:
      'Impressum CAPITAL-AI — Anbieter: Sven Kulessa. Vollständiger Text nach Aktivierung von JavaScript oder unter capital-ai.online/impressum.',
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
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function canonicalHref(routePath) {
  return routePath === '/' ? `${ORIGIN}/` : `${ORIGIN}${routePath}`;
}

function injectMeta(html, route) {
  const title = route.title;
  const description = route.description;
  const canonical = canonicalHref(route.routePath);
  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  const replaceMeta = (attrName, content) => {
    const re = new RegExp(
      `<meta\\s+[^>]*${attrName}\\s*=\\s*["'][^"']*["'][^>]*>`,
      'i',
    );
    const tag = attrName.startsWith('property')
      ? `<meta property="${attrName.replace(/^property=["']?|["']$/g, '').replace(/^property=/, '')}" content="${escapeAttr(content)}" />`
      : null;
    // Simpler path: named replacements below
    return re;
  };

  // name="title" / name="description"
  if (/name=["']title["']/i.test(out)) {
    out = out.replace(
      /<meta\\s+name=["']title["']\\s+content=["'][^"']*["']\\s*\\/?>/i,
      `<meta name="title" content="${escapeAttr(title)}" />`,
    );
  }
  if (/name=["']description["']/i.test(out)) {
    out = out.replace(
      /<meta\\s+name=["']description["']\\s+content=["'][^"']*["']\\s*\\/?>/i,
      `<meta name="description" content="${escapeAttr(description)}" />`,
    );
  } else {
    out = out.replace(
      /<head[^>]*>/i,
      (m) => `${m}\n    <meta name="description" content="${escapeAttr(description)}" />`,
    );
  }

  // Fix: the double-escaped regex above may not match. Use practical replacements.
  out = out.replace(
    /<meta\s+name="title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="title" content="${escapeAttr(title)}" />`,
  );
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeAttr(description)}" />`,
  );

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

  // Enrich noscript for non-JS crawlers / accessibility
  const noscriptBlock = `<noscript>
      <main>
        <h1>${escapeAttr(title)}</h1>
        <p>${escapeAttr(route.noscript)}</p>
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

  // silence unused helper in strict tooling
  void replaceMeta;

  return out;
}

for (const r of ROUTES) {
  if (r.routePath === '/') {
    const html = injectMeta(base, r);
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('updated', r.file);
    continue;
  }
  const outFile = path.join(dist, r.file);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const html = injectMeta(base, r);
  fs.writeFileSync(outFile, html, 'utf8');
  console.log('wrote', r.file);
}

console.log('S2 prerender done for', ROUTES.length, 'routes.');
