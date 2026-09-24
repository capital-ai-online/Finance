import type { Express, Request, Response, NextFunction } from 'express';
import { safeRelativeRedirectLocation, stripTrailingSlashes } from '../../src/platform/Security/safeIo';

/**
 * SEO-ROADMAP-0001 / Q2 + D3 helpers.
 * Preferred public URLs are without trailing slash (except bare `/`).
 */
export const PUBLIC_SPA_PATHS = new Set([
  '/',
  '/universe',
  '/learning-platform',
  '/vocabulary',
  '/impressum',
  '/agb',
  '/datenschutz',
  '/faq',
]);

/**
 * Non-indexable application routes that still need the production SPA entry document on direct
 * navigation. Keep them separate from PUBLIC_SPA_PATHS so auth/private and operational UI routes
 * never leak into the SEO prerender/public-route contract.
 */
export const APPLICATION_SPA_PATHS = new Set([
  '/login',
  '/profile',
  '/account/update-password',
  '/dashboard',
  '/media-studio',
  '/roadmap',
  '/glossar',
  '/lexikon',
  '/market-vocabulary',
  '/dictionary',
]);

export function stripTrailingSlashPath(pathname: string): string {
  return stripTrailingSlashes(pathname);
}

export function isPublicSpaPath(pathname: string): boolean {
  return PUBLIC_SPA_PATHS.has(stripTrailingSlashPath(pathname));
}

export function isApplicationSpaPath(pathname: string): boolean {
  const normalized = stripTrailingSlashPath(pathname);
  return PUBLIC_SPA_PATHS.has(normalized) || APPLICATION_SPA_PATHS.has(normalized);
}

/**
 * 301-redirect `/path/` → `/path` while preserving query string.
 * Skips `/` and any path that is only slashes.
 * Skips API and static asset-looking paths with a file extension.
 */
export function shouldRedirectTrailingSlash(pathname: string): boolean {
  if (!pathname || pathname === '/') return false;
  if (!pathname.endsWith('/')) return false;
  const withoutSlash = stripTrailingSlashes(pathname);
  if (/\.[a-zA-Z0-9]{1,8}$/.test(withoutSlash)) return false;
  if (withoutSlash.startsWith('/api')) return false;
  return true;
}

export function trailingSlashRedirectLocation(
  req: Pick<Request, 'path' | 'url' | 'originalUrl'>,
): string {
  const path = stripTrailingSlashPath(req.path);
  const original = req.originalUrl || req.url || '';
  const qIndex = original.indexOf('?');
  const query = qIndex >= 0 ? original.slice(qIndex) : '';
  return safeRelativeRedirectLocation(path, query);
}

export function registerTrailingSlashNormalize(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!shouldRedirectTrailingSlash(req.path)) return next();
    return res.redirect(301, trailingSlashRedirectLocation(req));
  });
}
