import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const canonicalTicker = read('src/features/news/ui/Newsticker.tsx');
const newsUiIndex = read('src/features/news/ui/index.ts');
const legacyTickerBridge = read('src/components/Newsticker.tsx');

describe('news UI strangler boundary', () => {
  it('owns Newsticker implementation in the canonical news feature', () => {
    expect(canonicalTicker).toContain('export function Newsticker');
    expect(canonicalTicker).toContain("import { fetchAuthenticatedNews } from '../authenticatedNewsFetch'");
    expect(canonicalTicker).toContain("import { authFetch } from '../../../lib/authFetch'");
    expect(canonicalTicker).toContain("authFetch('/api/crypto/score'");
    expect(canonicalTicker).toContain('fetchAuthenticatedNews(`/api/news?symbol=${encodeURIComponent(symbol)}`)');
  });

  it('exports the canonical implementation from the news UI namespace', () => {
    expect(newsUiIndex).toContain("export { Newsticker } from './Newsticker'");
    expect(newsUiIndex).not.toContain("export { Newsticker } from '../../../components/Newsticker'");
  });

  it('keeps the old component path as a logic-free compatibility bridge', () => {
    expect(legacyTickerBridge).toContain('@deprecated Compatibility bridge');
    expect(legacyTickerBridge).toContain("export { Newsticker } from '../features/news/ui/Newsticker'");
    expect(legacyTickerBridge).not.toContain('useEffect');
    expect(legacyTickerBridge).not.toContain('useState');
    expect(legacyTickerBridge).not.toContain('authFetch');
    expect(legacyTickerBridge).not.toContain('fetchAuthenticatedNews');
    expect(legacyTickerBridge).not.toContain('/api/');
  });
});
