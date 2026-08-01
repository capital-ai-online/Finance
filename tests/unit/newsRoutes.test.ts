// Audit ARCH-AUDIT-0002 (H5): Testabdeckung fuer die aus server.ts nach
// src/features/news/ extrahierte Sentiment-Heuristik.

import { describe, it, expect } from 'vitest';
import { classifyNewsSentiment } from '../../src/features/news/newsRoutes';

describe('classifyNewsSentiment', () => {
  it('erkennt positive Schluesselwoerter', () => {
    expect(classifyNewsSentiment('Bitcoin surges to new high', '')).toBe('positive');
    expect(classifyNewsSentiment('', 'Markets rally after rate decision')).toBe('positive');
  });

  it('erkennt negative Schluesselwoerter', () => {
    expect(classifyNewsSentiment('Exchange hack drains millions', '')).toBe('negative');
    expect(classifyNewsSentiment('', 'Prices crash amid panic selling')).toBe('negative');
  });

  it('faellt auf neutral zurueck, wenn keine Schluesselwoerter vorkommen', () => {
    expect(classifyNewsSentiment('Central bank holds meeting', 'No major announcements made')).toBe('neutral');
  });

  it('behandelt fehlende Felder ohne zu werfen', () => {
    expect(classifyNewsSentiment(undefined as any, undefined as any)).toBe('neutral');
  });
});
