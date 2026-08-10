import type { DocumentaryDocument, DocumentaryDocumentType } from '../Models/DocumentaryDocument';

export type DocumentaryRenderLocale = 'de' | 'en';

export interface DocumentaryRenderedArtifact {
  documentId: string;
  documentType: DocumentaryDocumentType;
  locale: DocumentaryRenderLocale;
  fileName: string;
  mediaType: 'text/markdown';
  body: string;
  sourceCommit: string;
  fingerprint: string;
}

const TYPE_SECTION: Readonly<Record<DocumentaryDocumentType, Readonly<Record<DocumentaryRenderLocale, string>>>> = Object.freeze({
  architecture: { de: 'Architekturinhalt', en: 'Architecture Content' },
  component: { de: 'Komponenteninhalt', en: 'Component Content' },
  api: { de: 'API-Inhalt', en: 'API Content' },
  runbook: { de: 'Betriebsanweisung', en: 'Operational Runbook' },
  'release-evidence': { de: 'Release-Evidence', en: 'Release Evidence' },
  handoff: { de: 'Übergabeinhalt', en: 'Handoff Content' },
});

const LABELS = Object.freeze({
  de: {
    metadata: 'Metadaten', documentType: 'Dokumenttyp', status: 'Lifecycle-Status', schemaVersion: 'Dokument-Schema-Version',
    componentVersion: 'Documentary-Komponentenversion', platformVersion: 'Plattformversion', sourceCommit: 'Source-Commit',
    fingerprint: 'Fingerprint', concepts: 'Concept-IDs', traceability: 'Traceability-IDs', provenance: 'Provenance', generatedAt: 'Generiert am',
  },
  en: {
    metadata: 'Metadata', documentType: 'Document Type', status: 'Lifecycle Status', schemaVersion: 'Document Schema Version',
    componentVersion: 'Documentary Component Version', platformVersion: 'Platform Version', sourceCommit: 'Source Commit',
    fingerprint: 'Fingerprint', concepts: 'Concept IDs', traceability: 'Traceability IDs', provenance: 'Provenance', generatedAt: 'Generated At',
  },
} as const);

function safeFileToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
}

function bullet(values: readonly string[]): string {
  return values.length ? [...values].sort().map((value) => `- ${value}`).join('\n') : '- —';
}

function renderProvenance(document: DocumentaryDocument): string {
  return [...document.provenance]
    .sort((a, b) => `${a.kind}|${a.referenceId}|${a.evidenceId ?? ''}`.localeCompare(`${b.kind}|${b.referenceId}|${b.evidenceId ?? ''}`))
    .map((item) => `- ${item.kind}: ${item.referenceId}${item.evidenceId ? ` [${item.evidenceId}]` : ''}`)
    .join('\n');
}

export function renderDocumentaryMarkdown(document: DocumentaryDocument, locale: DocumentaryRenderLocale): string {
  const labels = LABELS[locale];
  const contentHeading = TYPE_SECTION[document.documentType][locale];

  return [
    `# ${document.title}`,
    '',
    `## ${labels.metadata}`,
    '',
    `- ${labels.documentType}: \`${document.documentType}\``,
    `- ${labels.status}: \`${document.reviewStatus}\``,
    `- ${labels.schemaVersion}: \`${document.schemaVersion}\``,
    `- ${labels.componentVersion}: \`${document.componentVersion}\``,
    `- ${labels.platformVersion}: \`${document.platformVersion}\``,
    `- ${labels.sourceCommit}: \`${document.sourceCommit}\``,
    `- ${labels.generatedAt}: \`${document.generatedAt}\``,
    `- ${labels.fingerprint}: \`${document.fingerprint}\``,
    '',
    `## ${contentHeading}`,
    '',
    document.content,
    '',
    `## ${labels.concepts}`,
    '',
    bullet(document.conceptIds),
    '',
    `## ${labels.traceability}`,
    '',
    bullet(document.traceabilityIds),
    '',
    `## ${labels.provenance}`,
    '',
    renderProvenance(document),
    '',
  ].join('\n');
}

export function generateDocumentaryMarkdownArtifact(
  document: DocumentaryDocument,
  locale: DocumentaryRenderLocale,
): DocumentaryRenderedArtifact {
  return Object.freeze({
    documentId: document.documentId,
    documentType: document.documentType,
    locale,
    fileName: `${safeFileToken(document.documentId)}.${locale}.md`,
    mediaType: 'text/markdown' as const,
    body: renderDocumentaryMarkdown(document, locale),
    sourceCommit: document.sourceCommit,
    fingerprint: document.fingerprint,
  });
}

export function generateBilingualDocumentaryMarkdownArtifacts(document: DocumentaryDocument): readonly DocumentaryRenderedArtifact[] {
  return Object.freeze([
    generateDocumentaryMarkdownArtifact(document, 'de'),
    generateDocumentaryMarkdownArtifact(document, 'en'),
  ]);
}
