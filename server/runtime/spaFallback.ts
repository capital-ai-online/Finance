import type { Express, Request, Response } from 'express';
import path from 'path';
import { isPublicSpaPath } from '../middleware/seoUrlNormalize';

/**
 * SEO-ROADMAP-0001 / D3 — production SPA fallback with soft-404 guard.
 *
 * Known public marketing/legal routes receive index.html (200).
 * Unknown paths receive HTTP 404 with empty body (no soft-404 SPA shell).
 * Static files are still served by express.static mounted before this handler.
 */
export function registerProductionSpaFallback(app: Express, distPath: string): void {
  app.get('*', (req: Request, res: Response) => {
    if (isPublicSpaPath(req.path)) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    // Soft-404 fix: do not serve the SPA shell for arbitrary URLs.
    return res.status(404).type('text/plain').send('Not Found');
  });
}
