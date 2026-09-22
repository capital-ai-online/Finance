import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import fs from 'fs';
import path from 'path';
import { checkRateLimit, getClientIp } from '../../src/platform/Security/rateLimiter';
import { isApplicationSpaPath, stripTrailingSlashPath } from '../middleware/seoUrlNormalize';

/**
 * SEO-ROADMAP-0001 / D3 + S2 — production SPA fallback with soft-404 guard.
 *
 * Security invariant: request data may select a known route, but it must never
 * participate in construction of a filesystem path passed to sendFile.
 */

interface PublicHtmlFiles {
  root: string;
  universe: string;
  learningPlatform: string;
  impressum: string;
  agb: string;
  datenschutz: string;
}

function isPathInsideRoot(rootDir: string, candidate: string): boolean {
  const root = path.resolve(rootDir);
  const resolved = path.resolve(candidate);
  const rel = path.relative(root, resolved);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** Build every sendFile candidate exclusively from trusted server configuration and literals. */
function buildPublicHtmlFiles(distPath: string): PublicHtmlFiles {
  const rootDir = path.resolve(distPath);
  const root = path.resolve(rootDir, 'index.html');
  const candidates: PublicHtmlFiles = {
    root,
    universe: path.resolve(rootDir, 'universe', 'index.html'),
    learningPlatform: path.resolve(rootDir, 'learning-platform', 'index.html'),
    impressum: path.resolve(rootDir, 'impressum', 'index.html'),
    agb: path.resolve(rootDir, 'agb', 'index.html'),
    datenschutz: path.resolve(rootDir, 'datenschutz', 'index.html'),
  };
  for (const candidate of Object.values(candidates)) {
    if (!isPathInsideRoot(rootDir, candidate)) {
      throw new Error('Public HTML route escaped the configured distribution root.');
    }
  }
  return candidates;
}

export function registerProductionSpaFallback(app: Express, distPath: string): void {
  const files = buildPublicHtmlFiles(distPath);
  const existingOrRoot = (candidate: string): string =>
    fs.existsSync(candidate) ? candidate : files.root;

  app.get('*', (req: Request, res: Response) => {
    if (!checkRateLimit(`spa-fallback:${getClientIp(req as any)}`, 240, 60_000)) {
      return res.status(429).type('text/plain').send('Too Many Requests');
    }
    // The untrusted request value controls only this finite branch selection.
    // Every sendFile argument below was precomputed from trusted literals.
    switch (stripTrailingSlashPath(req.path)) {
      case '/':
        return res.sendFile(files.root);
      case '/login':
      case '/dashboard':
      case '/media-studio':
      case '/faq':
        return res.sendFile(files.root);
      case '/universe':
        return res.sendFile(existingOrRoot(files.universe));
      case '/learning-platform':
        return res.sendFile(existingOrRoot(files.learningPlatform));
      case '/impressum':
        return res.sendFile(existingOrRoot(files.impressum));
      case '/agb':
        return res.sendFile(existingOrRoot(files.agb));
      case '/datenschutz':
        return res.sendFile(existingOrRoot(files.datenschutz));
      default:
        return res.status(404).type('text/plain').send('Not Found');
    }
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

  const proto = express.application as Express & {
    get: (path: string, ...handlers: RequestHandler[]) => Express;
  };
  const originalGet = proto.get;

  proto.get = function patchedGet(
    this: Express,
    routePath: unknown,
    ...handlers: RequestHandler[]
  ) {
    if (
      routePath === '*' &&
      process.env.NODE_ENV === 'production' &&
      handlers.length >= 1
    ) {
      const wrapped: RequestHandler[] = handlers.map((handler) => {
        return function soft404Guard(req: Request, res: Response, next: NextFunction) {
          if (isApplicationSpaPath(req.path)) {
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

/** Exported for unit tests. */
export { buildPublicHtmlFiles, isPathInsideRoot };