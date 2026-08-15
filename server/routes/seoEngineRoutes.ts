/**
 * SEO-ROADMAP-0001 / S1 — admin-only SeoEngine HTTP surface.
 */
import { Router } from 'express';
import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../../src/platform/Security/types';
import { seoEngine } from '../../src/platform/SeoEngine';

export const seoEngineRouter = Router();

seoEngineRouter.get('/keywords', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:keywords:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  res.json({ keywords: seoEngine.listKeywords(false) });
});

seoEngineRouter.post('/keywords', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:keywords:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const row = seoEngine.addKeyword(req.body || {});
    res.status(201).json({ keyword: row });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

seoEngineRouter.get('/ranks', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:ranks:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const keywordId = typeof req.query.keywordId === 'string' ? req.query.keywordId : undefined;
  res.json({ ranks: seoEngine.listRanks(keywordId) });
});

seoEngineRouter.post('/ranks', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:ranks:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const row = seoEngine.addRankSnapshot(req.body || {});
    res.status(201).json({ rank: row });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

seoEngineRouter.get('/content', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:content:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  res.json({ content: seoEngine.listContent() });
});

seoEngineRouter.post('/content', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:content:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const row = seoEngine.addContentItem(req.body || {});
    res.status(201).json({ item: row });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

seoEngineRouter.get('/summary', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:summary:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const snap = seoEngine.snapshot();
  res.json({
    keywordCount: snap.keywords.length,
    rankSnapshotCount: snap.ranks.length,
    contentCount: snap.content.length,
    publishedContentCount: snap.content.filter((c) => c.status === 'published').length,
    hasMeasuredRanks: snap.ranks.length > 0,
  });
});
