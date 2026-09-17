import { describe, it, expect } from 'vitest';
import {
  stripTrailingSlashPath,
  shouldRedirectTrailingSlash,
  isPublicSpaPath,
  trailingSlashRedirectLocation,
} from '../../server/middleware/seoUrlNormalize';

describe('seoUrlNormalize (Q2/D3)', () => {
  it('strips trailing slashes except root', () => {
    expect(stripTrailingSlashPath('/')).toBe('/');
    expect(stripTrailingSlashPath('/datenschutz/')).toBe('/datenschutz');
    expect(stripTrailingSlashPath('/agb///')).toBe('/agb');
  });

  it('redirects trailing-slash document paths', () => {
    expect(shouldRedirectTrailingSlash('/datenschutz/')).toBe(true);
    expect(shouldRedirectTrailingSlash('/impressum/')).toBe(true);
    expect(shouldRedirectTrailingSlash('/')).toBe(false);
    expect(shouldRedirectTrailingSlash('/datenschutz')).toBe(false);
    expect(shouldRedirectTrailingSlash('/api/healthz/')).toBe(false);
  });

  it('preserves query string on redirect location', () => {
    expect(
      trailingSlashRedirectLocation({
        path: '/agb/',
        url: '/agb/?x=1',
        originalUrl: '/agb/?x=1',
      }),
    ).toBe('/agb?x=1');
  });

  it('recognizes public SPA paths only', () => {
    expect(isPublicSpaPath('/')).toBe(true);
    expect(isPublicSpaPath('/datenschutz/')).toBe(true);
    expect(isPublicSpaPath('/random-probe')).toBe(false);
    expect(isPublicSpaPath('/wp-admin')).toBe(false);
  });
});
