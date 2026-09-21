/**
 * SEO-GM-ROADMAP-0002 / WP-D2 — route-specific titles and meta descriptions.
 * Applied client-side after hydration; crawlers with JS see updated values.
 * Full prerender remains S2 (scripts/seo/prerender-public-routes.mjs).
 */

import { CAPITAL_AI_VERSION } from '../platform/Release/clientVersion';

export interface RouteSeo {
  title: string;
  description: string;
  canonicalPath: string;
}

const DEFAULT: RouteSeo = {
  title: 'CAPITAL-AI – Marktdaten verstehen. Chancen besser erkennen.',
  description:
    `CAPITAL-AI (Version ${CAPITAL_AI_VERSION}) vereint Echtzeit-Marktdaten, KI-gestütztes Scoring und fundierte Analysen für transparentere Entscheidungen an den globalen Märkten.`,
  canonicalPath: '/',
};

const ROUTES: Record<string, RouteSeo> = {
  '/': DEFAULT,
  '/universe': {
    title: 'CAPITAL-AI Universe – Multi-Asset Intelligence',
    description:
      'CAPITAL-AI Universe verbindet Multi-Asset Discovery, verifizierte Evidence und kanonische Scoring-Projektionen für Krypto, Aktien, Indizes, Forex und Rohstoffe.',
    canonicalPath: '/universe',
  },
  '/learning-platform': {
    title: 'Capital-AI Learning Platform – Canonical Vocabulary',
    description:
      'Die Capital-AI Learning Platform stellt das freigegebene zweisprachige CAPITAL-AI Vocabulary mit Definitionen, Concept-IDs und Governance-Referenzen read-only bereit.',
    canonicalPath: '/learning-platform',
  },
  '/impressum': {
    title: 'Impressum – CAPITAL-AI',
    description: 'Impressum und Anbieterkennzeichnung gemäß § 5 DDG für CAPITAL-AI (Sven Kulessa).',
    canonicalPath: '/impressum',
  },
  '/agb': {
    title: 'AGB – CAPITAL-AI',
    description: 'Allgemeine Geschäftsbedingungen für die Nutzung des CAPITAL-AI Portals.',
    canonicalPath: '/agb',
  },
  '/datenschutz': {
    title: 'Datenschutzerklärung – CAPITAL-AI',
    description: 'Datenschutzerklärung und Informationen zur Datenverarbeitung gemäß DSGVO für CAPITAL-AI.',
    canonicalPath: '/datenschutz',
  },
};

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function getRouteSeo(pathname: string): RouteSeo {
  const key = normalizePathname(pathname);
  return ROUTES[key] ?? DEFAULT;
}

export function applyRouteSeo(pathname: string): void {
  if (typeof document === 'undefined') return;
  const seo = getRouteSeo(pathname);
  document.title = seo.title;

  const setMeta = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };

  setMeta('meta[name="title"]', 'content', seo.title);
  setMeta('meta[name="description"]', 'content', seo.description);
  setMeta('meta[property="og:title"]', 'content', seo.title);
  setMeta('meta[property="og:description"]', 'content', seo.description);
  setMeta(
    'meta[property="og:url"]',
    'content',
    `https://capital-ai.online${seo.canonicalPath === '/' ? '/' : seo.canonicalPath}`,
  );
  setMeta('meta[property="twitter:url"]', 'content', `https://capital-ai.online${seo.canonicalPath === '/' ? '/' : seo.canonicalPath}`);
  setMeta('meta[property="twitter:title"]', 'content', seo.title);
  setMeta('meta[property="twitter:description"]', 'content', seo.description);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute(
      'href',
      `https://capital-ai.online${seo.canonicalPath === '/' ? '/' : seo.canonicalPath}`,
    );
  }
}

/** Public route keys used by prerender and checklist DoD. */
export function listPublicRouteSeoPaths(): string[] {
  return Object.keys(ROUTES);
}
