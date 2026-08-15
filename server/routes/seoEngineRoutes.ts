/**
 * SEO-ROADMAP-0001 / S1 — admin-only SeoEngine HTTP surface.
 */
import express from 'express';
import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../../src/platform/Security/types';
import { seoEngineStore } from '../../src/platform/SeoEngine';

export const seoEngineRouter = express.Router();

seoEngineRouter.get('/keywords', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:keywords:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  res.json({ keywords: seoEngineStore.listKeywords() });
});

seoEngineRouter.post('/keywords', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:keywords:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const row = seoEngineStore.addKeyword(req.body || {});
    res.status(201).json({ keyword: row });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || String(err) });
  }
});

seoEngineRouter.get('/ranks', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:ranks:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const keywordId = typeof req.query.keywordId === 'string' ? req.query.keywordId : undefined;
  res.json({ ranks: seoEngineStore.listRankSnapshots(keywordId) });
});

seoEngineRouter.post('/ranks', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:ranks:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const row = seoEngineStore.addRankSnapshot(req.body || {});
    res.status(201).json({ rank: row });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || String(err) });
  }
});

seoEngineRouter.get('/content', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:content:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  res.json({ content: seoEngineStore.listContent() });
});

seoEngineRouter.post('/content', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:content:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const row = seoEngineStore.addContentItem(req.body || {});
    res.status(201).json({ item: row });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || String(err) });
  }
});

seoEngineRouter.get('/summary', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:summary:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const keywords = seoEngineStore.listKeywords();
  const ranks = seoEngineStore.listRankSnapshots();
  const content = seoEngineStore.listContent();
  res.json({
    keywordCount: keywords.length,
    rankSnapshotCount: ranks.length,
    contentCount: content.length,
    publishedContentCount: content.filter((c) => c.status === 'published').length,
    hasMeasuredRanks: ranks.length > 0,
  });
});
