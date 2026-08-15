import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { installProductionSoft404Intercept } from '../../server/runtime/spaFallback';
import { isPublicSpaPath } from '../../server/middleware/seoUrlNormalize';

describe('D3 soft-404 intercept', () => {
  const prev = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    installProductionSoft404Intercept();
  });

  afterEach(() => {
    process.env.NODE_ENV = prev;
  });

  it('isPublicSpaPath allows only marketing/legal surfaces',
    () => {
      expect(isPublicSpaPath('/')).toBe(true);
      expect(isPublicSpaPath('/impressum')).toBe(true);
      expect(isPublicSpaPath('/agb/')).toBe(true);
      expect(isPublicSpaPath('/datenschutz')).toBe(true);
      expect(isPublicSpaPath('/wp-admin')).toBe(false);
      expect(isPublicSpaPath('/this-does-not-exist')).toBe(false);
    });

  it('production catch-all returns 404 for unknown paths',
    async () => {
      const app = express();
      app.get('*', (_req, res) => {
        res.status(200).send('SPA_SHELL');
      });

      const unknown = await request(app).get('/totally-unknown-path-xyz');
      expect(unknown.status).toBe(404);
      expect(unknown.text).toBe('Not Found');

      const legal = await request(app).get('/impressum');
      expect(legal.status).toBe(200);
      expect(legal.text).toBe('SPA_SHELL');

      const home = await request(app).get('/');
      expect(home.status).toBe(200);
      expect(home.text).toBe('SPA_SHELL');
    });
});
