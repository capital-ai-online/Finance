import { describe, expect, it } from 'vitest';
import path from 'node:path';
import {
  UnsafePathError,
  UnsafeRedirectError,
  escapeHtml,
  escapeMarkdownTableCell,
  hostEquals,
  htmlToPlainText,
  isSimpleEmail,
  resolveWithinRoot,
  resolveWorkspacePath,
  safeRelativeRedirectLocation,
  stripTrailingSlashes,
} from '../../src/platform/Security/safeIo';

describe('safeIo guards', () => {
  it('rejects path traversal out of the declared root', () => {
    const root = path.resolve(process.cwd(), 'docs');
    expect(() => resolveWithinRoot(root, '../.env')).toThrow(UnsafePathError);
    expect(resolveWithinRoot(root, 'projects/security/ROADMAP.md').startsWith(root)).toBe(true);
  });

  it('rejects workspace paths outside allowlisted roots', () => {
    expect(() => resolveWorkspacePath('../package.json')).toThrow(UnsafePathError);
    expect(() => resolveWorkspacePath('uploads/secret.json')).toThrow(UnsafePathError);
    expect(resolveWorkspacePath('docs/projects/security/ROADMAP.md')).toContain(`${path.sep}docs${path.sep}`);
  });

  it('allows only same-origin relative redirects', () => {
    expect(safeRelativeRedirectLocation('/impressum', '?q=1')).toBe('/impressum?q=1');
    expect(() => safeRelativeRedirectLocation('//evil.example')).toThrow(UnsafeRedirectError);
    expect(() => safeRelativeRedirectLocation('https://evil.example/')).toThrow(UnsafeRedirectError);
  });

  it('strips trailing slashes without a quantified regex', () => {
    expect(stripTrailingSlashes('/learning-platform///')).toBe('/learning-platform');
    expect(stripTrailingSlashes('/')).toBe('/');
  });

  it('validates simple emails without ReDoS-prone patterns', () => {
    expect(isSimpleEmail('alerts@capital-ai.online')).toBe(true);
    expect(isSimpleEmail('not-an-email')).toBe(false);
    expect(isSimpleEmail(`${'!@!.'.repeat(200)}@x.y`)).toBe(false);
  });

  it('converts HTML to text without leaving script tags', () => {
    expect(htmlToPlainText('<p>Hallo</p><script>alert(1)</script>')).toBe('Hallo alert(1)');
    expect(htmlToPlainText('<script\n>payload')).toBe('');
  });

  it('encodes HTML meta characters', () => {
    expect(escapeHtml('<script>&"\'')).toBe('\u0026lt;script\u0026gt;\u0026amp;\u0026quot;\u0026#39;');
  });

  it('escapes backslashes before pipes in markdown cells', () => {
    expect(escapeMarkdownTableCell('a\\|b\nnext')).toBe('a\\\\\\|b<br>next');
  });

  it('compares URL hosts exactly instead of substring matching', () => {
    expect(hostEquals('https://api.coingecko.com/api/v3', 'api.coingecko.com')).toBe(true);
    expect(hostEquals('https://evil.example/api.coingecko.com', 'api.coingecko.com')).toBe(false);
  });
});
