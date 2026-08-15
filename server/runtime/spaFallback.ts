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
 */

function resolvePublicHtmlFile(distPath: string, requestPath: string): string {
  const normalized = stripTrailingSlashPath(requestPath);
  if (normalized === '/') {
    return path.join(distPath, 'index.html');
  }
  const routeFile = path.join(distPath, normalized.slice(1), 'index.html');
  if (fs.existsSync(routeFile)) {
    return routeFile;
  }
  return path.join(distPath, 'index.html');
}

export function registerProductionSpaFallback(app: Express, distPath: string): void {
  app.get('*', (req: Request, res: Response) => {
    if (isPublicSpaPath(req.path)) {
      return res.sendFile(resolvePublicHtmlFile(distPath, req.path));
    }
    return res.status(404).type('text/plain').send('Not Found');
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
export { resolvePublicHtmlFile };
