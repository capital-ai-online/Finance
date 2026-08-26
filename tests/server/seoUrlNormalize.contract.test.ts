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
    expect(stripTrailingSlashPath('/learning-platform/')).toBe('/learning-platform');
    expect(stripTrailingSlashPath('/datenschutz/')).toBe('/datenschutz');
    expect(stripTrailingSlashPath('/agb///')).toBe('/agb');
  });

  it('redirects trailing-slash public document paths', () => {
    expect(shouldRedirectTrailingSlash('/learning-platform/')).toBe(true);
    expect(shouldRedirectTrailingSlash('/datenschutz/')).toBe(true);
    expect(shouldRedirectTrailingSlash('/impressum/')).toBe(true);
    expect(shouldRedirectTrailingSlash('/')).toBe(false);
    expect(shouldRedirectTrailingSlash('/learning-platform')).toBe(false);
    expect(shouldRedirectTrailingSlash('/datenschutz')).toBe(false);
    expect(shouldRedirectTrailingSlash('/api/healthz/')).toBe(false);
  });

  it('preserves query string on redirect location', () => {
    expect(
      trailingSlashRedirectLocation({
        path: '/learning-platform/',
        url: '/learning-platform/?q=vocabulary',
        originalUrl: '/learning-platform/?q=vocabulary',
      }),
    ).toBe('/learning-platform?q=vocabulary');
  });

  it('recognizes only explicitly allowlisted public SPA paths', () => {
    expect(isPublicSpaPath('/')).toBe(true);
    expect(isPublicSpaPath('/learning-platform')).toBe(true);
    expect(isPublicSpaPath('/learning-platform/')).toBe(true);
    expect(isPublicSpaPath('/datenschutz/')).toBe(true);
    expect(isPublicSpaPath('/learning-platform-anything')).toBe(false);
    expect(isPublicSpaPath('/random-probe')).toBe(false);
    expect(isPublicSpaPath('/wp-admin')).toBe(false);
  });
});
