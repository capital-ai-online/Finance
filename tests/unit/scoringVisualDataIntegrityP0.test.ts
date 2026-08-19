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

  it('nimmt nur tatsächlich vorhandene numerische kanonische Crypto-Faktoren in das DeFi-Radar auf', () => {
    const radar = buildDefiRadarData({
      fundamentals: 71,
      technicalStrength: null,
      liquidity: undefined,
      risk: 36,
    });

    expect(radar).toEqual([
      { name: 'Fundamentaldaten', wert: 71, max: 100 },
      { name: 'Risiko-Qualität', wert: 64, max: 100 },
    ]);
  });

  it('erzeugt ohne DeFi-Evidence keine Radarwerte', () => {
    expect(buildDefiRadarData(null)).toEqual([]);
    expect(buildDefiRadarData({})).toEqual([]);
  });
});
