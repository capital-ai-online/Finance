import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const workspace = read('src/features/crypto/ui/CryptoCategoryWorkspace.tsx');
const composition = read('src/features/crypto/ui/CryptoScoringWorkspace.tsx');
const facade = read('src/features/crypto/ui/index.ts');

describe('crypto category/subclass workspace', () => {
  it('derives visible category membership from the existing asset and classification contracts', () => {
    expect(workspace).toContain('assetRegistry');
    expect(workspace).toContain('.getAssets()');
    expect(workspace).toContain("asset.type === 'crypto'");
    expect(workspace).toContain('ClassificationService.classifyAsset(asset.symbol)');
    expect(workspace).toContain('classification.category_main');
    expect(workspace).toContain('classification.category_sub');
    expect(workspace).toContain('classification.tier');
    expect(workspace).toContain('classification.confidence');
    expect(workspace).not.toContain('const CRYPTO_CATEGORIES');
  });

  it('never promotes local registry finance fields into category truth', () => {
    expect(workspace).not.toContain('asset.price');
    expect(workspace).not.toContain('asset.score');
    expect(workspace).not.toContain('asset.marketCap');
    expect(workspace).not.toContain('asset.volume24h');
    expect(workspace).not.toContain('asset.change24h');
    expect(workspace).not.toContain("fetch('/api/");
  });

  it('projects the existing FINTECH category/research bindings instead of creating a second scoring registry', () => {
    expect(workspace).toContain('buildCryptoCategoryResearchViewModel');
    expect(workspace).toContain('cryptoProfileLabel(model.profileId)');
    expect(workspace).toContain('model.researchLens.modelId');
    expect(workspace).toContain('model.researchLens.modelVersion');
    expect(workspace).toContain('ScoringDispatcher only');
    expect(workspace).toContain('DATA → FINTECH → FE');
    expect(workspace).not.toContain('ScoringModelRegistry =');
  });

  it('provides keyboard-aware overview, category, and models/orchestration navigation with touch-sized controls', () => {
    expect(workspace).toContain("type WorkspaceTab = 'overview' | 'categories' | 'models'");
    expect(workspace).toContain('role="tablist"');
    expect(workspace).toContain('role="tab"');
    expect(workspace).toContain("event.key === 'ArrowRight'");
    expect(workspace).toContain("event.key === 'ArrowLeft'");
    expect(workspace).toContain('min-h-11');
    expect(workspace).toContain('Models & Orchestration');
  });

  it('is composed in the canonical crypto workspace and exported by the crypto feature facade', () => {
    expect(composition).toContain("import { CryptoCategoryWorkspace } from './CryptoCategoryWorkspace'");
    expect(composition).toContain('<CryptoCategoryWorkspace selectedSymbol={props.selectedSymbol} onSelectSymbol={props.onSelectSymbol} />');
    expect(facade).toContain("export { CryptoCategoryWorkspace } from './CryptoCategoryWorkspace'");
  });
});
