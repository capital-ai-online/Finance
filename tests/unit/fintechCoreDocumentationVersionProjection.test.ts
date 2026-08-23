import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION,
  CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT,
  CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION,
  CRYPTO_MEME_RESEARCH_MODEL_CONTRACT,
} from '../../src/platform/Scoring/CryptoResearchModelContracts';
import { DEFAULT_SCORING_MODELS } from '../../src/platform/Scoring/ScoringModelRegistry';

const repoRoot = process.cwd();
const readme = fs.readFileSync(path.join(repoRoot, 'src/platform/FinTechCore/README.md'), 'utf8');

function model(modelId: string) {
  const descriptor = DEFAULT_SCORING_MODELS.find((candidate) => candidate.modelId === modelId);
  if (!descriptor) throw new Error(`missing scoring model: ${modelId}`);
  return descriptor;
}

describe('FinTechCore documentation version projection', () => {
  it('projects Meme and DeFi versions from the canonical scoring authorities', () => {
    const meme = model(CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.modelId);
    const defi = model(CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT.modelId);

    expect(meme.version).toBe(CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.modelVersion);
    expect(meme.featureContractVersion).toBe(CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION);
    expect(defi.version).toBe(CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT.modelVersion);
    expect(defi.featureContractVersion).toBe(CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION);

    expect(CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.modelVersion).toBe(
      CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT.modelVersion,
    );
    expect(readme).toContain(
      `Supersession B: Meme/DeFi Research Models \`${CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.modelVersion}\``,
    );
    expect(readme).toContain(
      `crypto-meme-integrity@${CRYPTO_MEME_RESEARCH_MODEL_CONTRACT.modelVersion}`,
    );
    expect(readme).toContain(
      `crypto-defi-fundamental@${CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT.modelVersion}`,
    );
    expect(readme).toContain(`\`${CRYPTO_MEME_RESEARCH_FEATURE_CONTRACT_VERSION}\``);
    expect(readme).toContain(`\`${CRYPTO_DEFI_RESEARCH_FEATURE_CONTRACT_VERSION}\``);
  });
});
