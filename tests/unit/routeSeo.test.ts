import { describe, it, expect } from 'vitest';
import { getRouteSeo, normalizePathname } from '../../src/lib/routeSeo';

describe('routeSeo (D2)', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizePathname('/datenschutz/')).toBe('/datenschutz');
    expect(normalizePathname('/')).toBe('/');
  });

  it('returns distinct titles for legal routes', () => {
    expect(getRouteSeo('/impressum').title).toMatch(/Impressum/);
    expect(getRouteSeo('/agb').title).toMatch(/AGB/);
    expect(getRouteSeo('/datenschutz').title).toMatch(/Datenschutz/);
    expect(getRouteSeo('/').title).toMatch(/Marktdaten verstehen/);
  });
});
