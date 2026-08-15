/**
 * SEO-GM-ROADMAP-0002 / WP-S1 — admin-only SeoEngine HTTP surface.
 * Storage via ISeoEngineStore (privileged Supabase in production, memory in dev/test).
 */
import { Router } from 'express';
import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../../src/platform/Security/types';
import { getSeoEngineStore } from '../../src/platform/SeoEngine';

export const seoEngineRouter = Router();

function isConfigError(message: string): boolean {
  return (
    message.includes('[SeoEngine][SECURITY]')
    || message.includes('[Supabase][SECURITY]')
    || message.includes('privileged Supabase')
  );
}

function sendStoreError(res: import('express').Response, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  if (isConfigError(message)) {
    res.status(503).json({ error: 'SEO store unavailable.', reason: message });
    return;
  }
  res.status(400).json({ error: message });
}

seoEngineRouter.get('/keywords', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:keywords:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const store = getSeoEngineStore();
    res.json({ keywords: await store.listKeywords(false) });
  } catch (err: unknown) {
    sendStoreError(res, err);
  }
});

seoEngineRouter.post('/keywords', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:keywords:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const store = getSeoEngineStore();
    const row = await store.addKeyword(req.body || {});
    res.status(201).json({ keyword: row });
  } catch (err: unknown) {
    sendStoreError(res, err);
  }
});

seoEngineRouter.get('/ranks', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:ranks:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const store = getSeoEngineStore();
    const keywordId = typeof req.query.keywordId === 'string' ? req.query.keywordId : undefined;
    res.json({ ranks: await store.listRanks(keywordId) });
  } catch (err: unknown) {
    sendStoreError(res, err);
  }
});

seoEngineRouter.post('/ranks', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:ranks:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const store = getSeoEngineStore();
    const row = await store.addRankSnapshot(req.body || {});
    res.status(201).json({ rank: row });
  } catch (err: unknown) {
    sendStoreError(res, err);
  }
});

seoEngineRouter.get('/content', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:content:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const store = getSeoEngineStore();
    res.json({ content: await store.listContent() });
  } catch (err: unknown) {
    sendStoreError(res, err);
  }
});

seoEngineRouter.post('/content', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:content:write', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const store = getSeoEngineStore();
    const row = await store.addContentItem(req.body || {});
    res.status(201).json({ item: row });
  } catch (err: unknown) {
    sendStoreError(res, err);
  }
});

seoEngineRouter.get('/summary', async (req, res) => {
  const authz = await checkAdminAccess(req, 'seo:summary:read', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const store = getSeoEngineStore();
    const snap = await store.snapshot();
    res.json({
      keywordCount: snap.keywords.length,
      rankSnapshotCount: snap.ranks.length,
      contentCount: snap.content.length,
      publishedContentCount: snap.content.filter((c) => c.status === 'published').length,
      hasMeasuredRanks: snap.ranks.length > 0,
    });
  } catch (err: unknown) {
    sendStoreError(res, err);
  }
});
