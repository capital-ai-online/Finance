import { describe, expect, it } from 'vitest';
import { buildRawMaterialFallbackList } from '../../src/components/RawMaterialsDashboard';
import { buildDefiRadarData } from '../../src/components/DeFiOrchestration';

describe('P0 Scoring-Datenintegrität', () => {
  it('weist lokalen Rohstoff-Fallbacks keinen Ersatzscore zu', () => {
    const rows = buildRawMaterialFallbackList();

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(row => row.score === null)).toBe(true);
    expect(rows.every(row => row.scoreStatus === 'DATA_UNAVAILABLE')).toBe(true);
  });

  it('nimmt nur tatsächlich vorhandene numerische DeFi-Faktoren in das Radar auf', () => {
    const radar = buildDefiRadarData({
      tokenomics: 71,
      networkActivity: null,
      liquidity: undefined,
      security: Number.NaN,
      utility: 64,
    });

    expect(radar).toEqual([
      { name: 'Tokenomics (Supply-Ratio)', wert: 71, max: 100 },
      { name: 'Adoption & Nutzen', wert: 64, max: 100 },
    ]);
  });

  it('erzeugt ohne DeFi-Evidence keine Radarwerte', () => {
    expect(buildDefiRadarData(null)).toEqual([]);
    expect(buildDefiRadarData({})).toEqual([]);
  });
});
