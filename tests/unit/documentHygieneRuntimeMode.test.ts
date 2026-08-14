import { describe, expect, it } from 'vitest';
import { isDocumentHygieneRuntimeWritable } from '../../server/runtime/documentHygieneRuntimeMode';

describe('Document Hygiene runtime write boundary', () => {
  it('ist in Produktion fail-closed und nicht beschreibbar', () => {
    expect(isDocumentHygieneRuntimeWritable('production')).toBe(false);
  });

  it.each([undefined, 'development', 'test'])('bleibt in %s für lokale Werkzeuge beschreibbar', (environment) => {
    expect(isDocumentHygieneRuntimeWritable(environment)).toBe(true);
  });
});
