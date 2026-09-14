import express from 'express';
import fs from 'fs';
import { rateLimitMiddleware, resolveWithinRoot, UnsafePathError } from '../../src/platform/Security/safeIo';

/**
 * Read-only documentation HTTP boundary.
 *
 * ADR-0014 / R-002: production runtime artifacts are immutable. The historic
 * POST /api/docs-file compatibility handler is intentionally NOT reproduced
 * here because it mutates repository documentation at runtime. Its retirement
 * is tracked as a separate governance cleanup instead of being normalized into
 * the canonical route architecture.
 */
export function createDocumentationRouter(): express.Router {
  const router = express.Router();
  router.use(rateLimitMiddleware({ name: 'docs-file', maxRequests: 60, windowMs: 60_000 }));

  router.get('/api/docs-file', (req, res) => {
    const { path: docPath } = req.query;
    if (!docPath) {
      return res.status(400).json({ error: 'Path parameter is required.' });
    }

    const docsRoot = resolveWithinRoot(process.cwd(), 'docs');
    let absolutePath: string;
    try {
      absolutePath = resolveWithinRoot(docsRoot, String(docPath));
    } catch (err) {
      if (err instanceof UnsafePathError) {
        return res.status(403).json({ error: 'Access denied: Path lies outside of secure /docs boundary.' });
      }
      throw err;
    }

    try {
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: 'Dokumentation nicht gefunden.' });
      }
      const content = fs.readFileSync(absolutePath, 'utf-8');
      return res.json({ path: String(docPath).replace(/\\/g, '/').replace(/^\/+/, ''), content });
    } catch (err: any) {
      return res.status(500).json({ error: 'Fehler beim Lesen der Datei.' });
    }
  });

  return router;
}
