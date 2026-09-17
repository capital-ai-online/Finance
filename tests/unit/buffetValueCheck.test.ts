import { describe, expect, it } from 'vitest';
import { formatBuffettMetric } from '../../src/components/BuffetValueCheck';

describe('formatBuffettMetric', () => {
  it('formatiert endliche numerische Werte', () => {
    expect(formatBuffettMetric(1234.5)).toBe((1234.5).toLocaleString('de-DE'));
  });

  it.each([null, undefined, '', Number.NaN, Number.POSITIVE_INFINITY])(
    'liefert für nicht verfügbare Werte einen sicheren Platzhalter: %s',
    value => {
      expect(formatBuffettMetric(value)).toBe('Nicht verfügbar');
    },
  );
});
