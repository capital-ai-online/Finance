import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('crypto orchestrator route/path correlation', () => {
  it('keeps the feature facade as the canonical CV-3/CV-7 composition', () => {
    const facade = read('src/features/crypto/ui/index.ts');
    const workspace = read('src/features/crypto/ui/CryptoScoringWorkspace.tsx');

    expect(facade).toContain("CryptoScoringWorkspace as CryptoScoringEnterprise");
    expect(workspace).toContain("from './CryptoScoringEnterprise'");
    expect(workspace).toContain("from './CryptoCategoryResearchLenses'");
    expect(workspace).toContain('<CryptoCategoryResearchLenses selectedSymbol={props.selectedSymbol} />');
  });

  it('keeps the legacy component path as a thin compatibility export only', () => {
    const legacy = read('src/components/CryptoScoringEnterprise.tsx');

    expect(legacy).toContain("export { CryptoScoringEnterprise } from '../features/crypto/ui'");
    expect(legacy).not.toContain('CanonicalCryptoScoringEnterprise');
    expect(legacy).not.toContain('CryptoCategoryResearchLenses selectedSymbol');
  });

  it('preserves the BB-2D dashboard feature-facade routing contract', () => {
    const router = read('src/app/dashboard/DashboardViewRouter.tsx');

    expect(router).toContain("import {\n  AnalyticsUI,");
    expect(router).toContain('CryptoUI,');
    expect(router).toContain("from '../../features'");
  });
});
