import type { Express, Request, Response, NextFunction } from 'express';

/**
 * SEO-ROADMAP-0001 / Q2 + D3 helpers.
 * Preferred public URLs are without trailing slash (except bare `/`).
 */

export const PUBLIC_SPA_PATHS = new Set([
  '/',
  '/impressum',
  '/agb',
  '/datenschutz',
]);

export function stripTrailingSlashPath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function isPublicSpaPath(pathname: string): boolean {
  return PUBLIC_SPA_PATHS.has(stripTrailingSlashPath(pathname));
}

/**
 * 301-redirect `/path/` → `/path` while preserving query string.
 * Skips `/` and any path that is only slashes.
 * Skips API and static asset-looking paths with a file extension.
 */
export function shouldRedirectTrailingSlash(pathname: string): boolean {
  if (!pathname || pathname === '/') return false;
  if (!pathname.endsWith('/')) return false;
  // Never redirect asset-like paths (e.g. /assets/foo.js/)
  const withoutSlash = pathname.replace(/\/+$/, '');
  if (/\.[a-zA-Z0-9]{1,8}$/.test(withoutSlash)) return false;
  if (withoutSlash.startsWith('/api')) return false;
  return true;
}

export function trailingSlashRedirectLocation(req: Pick<Request, 'path' | 'url' | 'originalUrl'>): string {
  const path = stripTrailingSlashPath(req.path);
  const original = req.originalUrl || req.url || '';
  const qIndex = original.indexOf('?');
  const query = qIndex >= 0 ? original.slice(qIndex) : '';
  return path + query;
}

export function registerTrailingSlashNormalize(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!shouldRedirectTrailingSlash(req.path)) return next();
    return res.redirect(301, trailingSlashRedirectLocation(req));
  });
}
