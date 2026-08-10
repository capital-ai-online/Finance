import { describe, expect, it } from 'vitest';
import { DocumentaryEngine } from '../../src/platform/Documentary/Engine/DocumentaryEngine';

const sourceCommit = 'a'.repeat(40);
const versions = { componentVersion: '1.4.0', documentSchemaVersion: '1.0.0', platformVersion: '0.6.0' };
const evidence = {
  sourceCommit,
  evidence: [{ evidenceId: 'EVID-1', kind: 'module' as const, componentId: 'Documentary', sourceCommit, path: 'src/platform/Documentary/Models/DocumentaryDocument.ts' }],
};

function request() {
  return {
    correlationId: 'corr-d2-001',
    documentId: 'DOC-D2-001',
    documentType: 'component' as const,
    sourceCommit,
    generatedAt: '2026-08-10T02:30:00.000Z',
    title: 'Documentary Component',
    content: 'Structured component evidence.',
    conceptIds: ['VOC-PLATFORM-0001'],
    traceabilityIds: ['TRACE-DOC-0001'],
    codeEvidence: evidence,
    versions,
  };
}

describe('DocumentaryEngine', () => {
  it('creates a generated document model from governed evidence', () => {
    const result = new DocumentaryEngine().generate(request());
    expect(result.document.reviewStatus).toBe('generated');
    expect(result.document.sourceCommit).toBe(sourceCommit);
    expect(result.document.provenance[0].evidenceId).toBe('EVID-1');
    expect(result.evidenceIds).toEqual(['EVID-1']);
  });

  it('is idempotent for the same correlationId and request', () => {
    const engine = new DocumentaryEngine();
    const first = engine.generate(request());
    const second = engine.generate(request());
    expect(second).toBe(first);
  });

  it('fails closed when correlationId is reused for different content', () => {
    const engine = new DocumentaryEngine();
    engine.generate(request());
    expect(() => engine.generate({ ...request(), content: 'different' })).toThrow(/already used/);
  });

  it('fails closed without concept or traceability authority', () => {
    const engine = new DocumentaryEngine();
    expect(() => engine.generate({ ...request(), conceptIds: [] })).toThrow(/conceptId/);
    expect(() => engine.generate({ ...request(), traceabilityIds: [] })).toThrow(/traceabilityId/);
  });

  it('fails closed when evidence commit does not match request commit', () => {
    const engine = new DocumentaryEngine();
    expect(() => engine.generate({ ...request(), codeEvidence: { ...evidence, sourceCommit: 'b'.repeat(40) } })).toThrow(/must match/);
  });
});
