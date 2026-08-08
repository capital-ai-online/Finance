import type { Express, Request, Response, NextFunction } from 'express';

const PROBE_PATH_PATTERNS = [
  /\.php$/i,
  /^\/wp-(admin|login|content|includes|json)(\/|$)/i,
  /^\/(config|wp-config)\.(php|json|ya?ml|ini)$/i,
  /^\/\.env(\.|$)/i,
  /^\/\.git(\/|$)/i,
  /^\/(phpinfo|info|test)\.php$/i,
];

export function isKnownProbePath(pathname: string): boolean {
  return PROBE_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Rejects common scanner/probe paths before they reach the SPA fallback.
 * Preserves the existing server.ts behavior: HTTP 404 with an empty body.
 */
export function registerProbeProtection(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isKnownProbePath(req.path)) {
      return res.status(404).end();
    }
    next();
  });
}
