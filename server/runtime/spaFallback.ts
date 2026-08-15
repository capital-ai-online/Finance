import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { isPublicSpaPath, stripTrailingSlashPath } from '../middleware/seoUrlNormalize';

/**
 * SEO-ROADMAP-0001 / D3 + S2 — production SPA fallback with soft-404 guard.
 *
 * Known public marketing/legal routes receive prerendered HTML when present
 * (dist/<route>/index.html from scripts/seo/prerender-public-routes.mjs),
 * otherwise dist/index.html (200).
 * Unknown paths receive HTTP 404 (no soft-404 SPA shell).
 *
 * Security: request URL segments are never joined into filesystem paths.
 * Only an allowlist maps public routes → fixed relative filenames under dist.
 */

/** Fixed relative paths under dist — no user input in these strings. */
const PUBLIC_ROUTE_HTML: Readonly<Record<string, string>> = {
  '/': 'index.html',
  '/impressum': path.join('impressum', 'index.html'),
  '/agb': path.join('agb', 'index.html'),
  '/datenschutz': path.join('datenschutz', 'index.html'),
};

function isPathInsideRoot(rootDir: string, candidate: string): boolean {
  const root = path.resolve(rootDir);
  const resolved = path.resolve(candidate);
  const rel = path.relative(root, resolved);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Resolve the HTML file for a public SPA path.
 * Input is only used for allowlist lookup after normalization — never as a path segment.
 */
function resolvePublicHtmlFile(distPath: string, requestPath: string): string {
  const root = path.resolve(distPath);
  const fallback = path.resolve(root, 'index.html');
  const normalized = stripTrailingSlashPath(requestPath);

  const relative = PUBLIC_ROUTE_HTML[normalized];
  if (!relative) {
    // Caller should only invoke for public paths; fail closed to root index.
    return fallback;
  }

  const candidate = path.resolve(root, relative);
  if (!isPathInsideRoot(root, candidate)) {
    return fallback;
  }

  if (normalized !== '/' && !fs.existsSync(candidate)) {
    return fallback;
  }

  return candidate;
}

export function registerProductionSpaFallback(app: Express, distPath: string): void {
  const root = path.resolve(distPath);

  app.get('*', (req: Request, res: Response) => {
    if (!isPublicSpaPath(req.path)) {
      return res.status(404).type('text/plain').send('Not Found');
    }

    const file = resolvePublicHtmlFile(root, req.path);
    if (!isPathInsideRoot(root, file)) {
      return res.status(404).type('text/plain').send('Not Found');
    }

    return res.sendFile(file);
  });
}

let soft404InterceptInstalled = false;

/**
 * Install once, before startServer() registers `app.get('*', sendFile)`.
 * Idempotent.
 */
export function installProductionSoft404Intercept(): void {
  if (soft404InterceptInstalled) return;
  soft404InterceptInstalled = true;

  // Lazy require so unit tests without a full Express app still load this module.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express') as typeof import('express');
  const proto = express.application as Express & {
    get: (path: string, ...handlers: RequestHandler[]) => Express;
  };
  const originalGet = proto.get;

  proto.get = function patchedGet(this: Express, routePath: unknown, ...handlers: RequestHandler[]) {
    if (
      routePath === '*' &&
      process.env.NODE_ENV === 'production' &&
      handlers.length >= 1
    ) {
      const wrapped: RequestHandler[] = handlers.map((handler) => {
        return function soft404Guard(req: Request, res: Response, next: NextFunction) {
          if (isPublicSpaPath(req.path)) {
            return handler(req, res, next);
          }
          return res.status(404).type('text/plain').send('Not Found');
        };
      });
      return originalGet.call(this, routePath as string, ...wrapped);
    }
    return originalGet.call(this, routePath as string, ...handlers);
  } as typeof proto.get;
}

/** Exported for unit tests */
export { resolvePublicHtmlFile, isPathInsideRoot, PUBLIC_ROUTE_HTML };
