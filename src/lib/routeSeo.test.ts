import { describe, expect, it } from 'vitest';
import {
  getRouteSeo,
  listPublicRouteSeoPaths,
  normalizePathname,
} from './routeSeo';

describe('routeSeo (WP-D2)', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizePathname('/')).toBe('/');
    expect(normalizePathname('/learning-platform/')).toBe('/learning-platform');
    expect(normalizePathname('/impressum/')).toBe('/impressum');
    expect(normalizePathname('/agb')).toBe('/agb');
  });

  it('returns unique titles for all public routes', () => {
    const home = getRouteSeo('/');
    const learning = getRouteSeo('/learning-platform');
    const impressum = getRouteSeo('/impressum');
    const agb = getRouteSeo('/agb');
    const datenschutz = getRouteSeo('/datenschutz');

    const titles = new Set([home.title, learning.title, impressum.title, agb.title, datenschutz.title]);
    expect(titles.size).toBe(5);
    expect(learning.title).toContain('Capital-AI Learning Platform');
    expect(learning.canonicalPath).toBe('/learning-platform');
    expect(impressum.title).toContain('Impressum');
    expect(impressum.description).toContain('§ 5 DDG');
    expect(home.description).toContain('Echtzeit-Marktdaten');
    expect(agb.title).toContain('AGB');
    expect(datenschutz.title).toContain('Datenschutz');
  });

  it('normalizes the Learning Platform trailing slash to its canonical route', () => {
    const learning = getRouteSeo('/learning-platform/');
    expect(learning.canonicalPath).toBe('/learning-platform');
  });

  it('falls back to default for unknown paths', () => {
    const unknown = getRouteSeo('/does-not-exist');
    expect(unknown.title).toBe('CAPITAL-AI Portal');
    expect(unknown.canonicalPath).toBe('/');
  });

  it('lists the five public SEO routes', () => {
    const paths = listPublicRouteSeoPaths();
    expect(paths).toEqual(expect.arrayContaining([
      '/',
      '/learning-platform',
      '/impressum',
      '/agb',
      '/datenschutz',
    ]));
    expect(paths).toHaveLength(5);
  });
});
