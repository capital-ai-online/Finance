import { describe, expect, it } from 'vitest';
import { createDocumentaryDocument } from '../../src/platform/Documentary/Models/DocumentaryDocument';
import { generateBilingualDocumentaryMarkdownArtifacts, generateDocumentaryMarkdownArtifact } from '../../src/platform/Documentary/Generators/DocumentaryRenderer';

const sourceCommit = 'b'.repeat(40);
const versions = { componentVersion: '1.7.0', documentSchemaVersion: '1.0.0', platformVersion: '0.6.0' };

function makeDocument(type: 'architecture' | 'component' | 'api' | 'runbook' | 'release-evidence' | 'handoff' = 'architecture') {
  return createDocumentaryDocument({
    documentId: `DOC-${type}-001`,
    documentType: type,
    sourceCommit,
    generatedAt: '2026-08-10T05:50:00.000Z',
    title: 'CAPITAL-AI Documentary Test',
    content: 'Stable governed content.',
    conceptIds: ['VOC-002', 'VOC-001'],
    traceabilityIds: ['TRACE-002', 'TRACE-001'],
    provenance: [{ kind: 'code', referenceId: 'src/platform/Documentary', sourceCommit, path: 'src/platform/Documentary' }],
  }, versions);
}

describe('Documentary D6 generators and renderers', () => {
  it('renders deterministic markdown without changing lifecycle or fingerprint', () => {
    const document = makeDocument();
    const first = generateDocumentaryMarkdownArtifact(document, 'de');
    const second = generateDocumentaryMarkdownArtifact(document, 'de');

    expect(first).toEqual(second);
    expect(first.fingerprint).toBe(document.fingerprint);
    expect(document.reviewStatus).toBe('generated');
    expect(first.body).toContain(`Source-Commit: \`${sourceCommit}\``);
  });

  it('creates stable DE/EN artifacts with localized metadata labels', () => {
    const [de, en] = generateBilingualDocumentaryMarkdownArtifacts(makeDocument('component'));
    expect(de.fileName).toBe('doc-component-001.de.md');
    expect(en.fileName).toBe('doc-component-001.en.md');
    expect(de.body).toContain('## Komponenteninhalt');
    expect(en.body).toContain('## Component Content');
    expect(de.body).toContain('## Traceability-IDs');
    expect(en.body).toContain('## Traceability IDs');
  });

  it.each([
    ['architecture', 'Architecture Content'],
    ['component', 'Component Content'],
    ['api', 'API Content'],
    ['runbook', 'Operational Runbook'],
    ['release-evidence', 'Release Evidence'],
    ['handoff', 'Handoff Content'],
  ] as const)('uses a document-type-specific profile for %s', (type, heading) => {
    expect(generateDocumentaryMarkdownArtifact(makeDocument(type), 'en').body).toContain(`## ${heading}`);
  });

  it('keeps evidence lists deterministically sorted', () => {
    const body = generateDocumentaryMarkdownArtifact(makeDocument(), 'en').body;
    expect(body.indexOf('VOC-001')).toBeLessThan(body.indexOf('VOC-002'));
    expect(body.indexOf('TRACE-001')).toBeLessThan(body.indexOf('TRACE-002'));
  });
});
