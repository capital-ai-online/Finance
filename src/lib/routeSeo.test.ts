import { describe, expect, it } from 'vitest';
import {
  getRouteSeo,
  listPublicRouteSeoPaths,
  normalizePathname,
} from './routeSeo';

describe('routeSeo (WP-D2)', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizePathname('/')).toBe('/');
    expect(normalizePathname('/impressum/')).toBe('/impressum');
    expect(normalizePathname('/agb')).toBe('/agb');
  });

  it('returns unique titles for legal public routes', () => {
    const home = getRouteSeo('/');
    const impressum = getRouteSeo('/impressum');
    const agb = getRouteSeo('/agb');
    const datenschutz = getRouteSeo('/datenschutz');

    const titles = new Set([home.title, impressum.title, agb.title, datenschutz.title]);
    expect(titles.size).toBe(4);
    expect(impressum.title).toContain('Impressum');
    expect(agb.title).toContain('AGB');
    expect(datenschutz.title).toContain('Datenschutz');
  });

  it('falls back to default for unknown paths', () => {
    const unknown = getRouteSeo('/does-not-exist');
    expect(unknown.title).toBe('CAPITAL-AI Portal');
    expect(unknown.canonicalPath).toBe('/');
  });

  it('lists the four public SEO routes', () => {
    const paths = listPublicRouteSeoPaths();
    expect(paths).toEqual(expect.arrayContaining(['/', '/impressum', '/agb', '/datenschutz']));
    expect(paths).toHaveLength(4);
  });
});
