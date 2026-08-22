import crypto from 'node:crypto';
import type { IVocabularyRegistry } from '../Interfaces/IVocabularyRegistry';
import type { UiMessageCatalog } from '../Messages/UiMessageCatalog';
import type { FintechValueChainWordingBinding } from '../ValueChain/FintechWordingBinding';

export const VOCABULARY_WIKI_SCHEMA = 'vocabulary-wiki-projection/1.0.0' as const;
export const VOCABULARY_WIKI_AUTHORITY = 'ESS-0017' as const;

export interface VocabularyWikiPage {
  filename: string;
  title: string;
  content: string;
  checksum: string;
}

export interface VocabularyWikiProjection {
  schemaVersion: typeof VOCABULARY_WIKI_SCHEMA;
  sourceCommit: string;
  authority: typeof VOCABULARY_WIKI_AUTHORITY;
  pages: VocabularyWikiPage[];
  checksum: string;
  repositoryAuthoritative: false;
  mutationAuthority: false;
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableUnique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function page(filename: string, title: string, body: string, sourceCommit: string): VocabularyWikiPage {
  if (!/^[A-Za-z0-9._-]+\.md$/.test(filename)) {
    throw new Error(`Invalid managed Wiki filename: ${filename}`);
  }
  const content = [
    `# ${title}`,
    '',
    '> Generated from the authoritative Finance repository. This Wiki page is a read-only human-facing projection and is not an authority source.',
    '',
    `Source commit: \`${sourceCommit}\``,
    `Authority: \`${VOCABULARY_WIKI_AUTHORITY}\``,
    '',
    body.trim(),
    '',
  ].join('\n');
  return Object.freeze({ filename, title, content, checksum: sha256(content) });
}

export function renderVocabularyWikiProjection(
  sourceCommit: string,
  vocabulary: IVocabularyRegistry,
  messages: UiMessageCatalog,
  bindings: readonly FintechValueChainWordingBinding[],
): VocabularyWikiProjection {
  if (!/^[0-9a-f]{40}$/i.test(sourceCommit)) {
    throw new Error('Vocabulary Wiki projection requires an exact 40-character source commit SHA.');
  }

  const concepts = vocabulary.list();
  const messageList = messages.list();
  const sortedBindings = [...bindings].sort((a, b) => a.stageId.localeCompare(b.stageId));

  const home = page(
    'Home.md',
    'CAPITAL-AI Vocabulary & Wording',
    [
      '## Scope',
      '',
      `- ${concepts.length} governed Concepts`,
      `- ${messageList.length} governed UI Messages`,
      `- ${sortedBindings.length} FinTech value-chain wording bindings`,
      '- One-way projection: Repository → generated Markdown → GitHub Wiki',
      '- Wiki edits never back-propagate into Registry, ESS, ADR or Message Catalog',
      '',
      '## Managed pages',
      '',
      '- [Canonical Vocabulary](Canonical-Vocabulary)',
      '- [UI Message Catalog](UI-Message-Catalog)',
      '- [FinTech Value Chain](FinTech-Value-Chain)',
      '- [Governance Boundary](Vocabulary-Governance-Boundary)',
    ].join('\n'),
    sourceCommit,
  );

  const vocabularyRows = concepts.map((concept) =>
    `| ${escapeCell(concept.id)} | ${escapeCell(concept.canonicalCodeTerm)} | ${escapeCell(concept.displayNameDE)} | ${escapeCell(concept.displayNameEN)} | ${escapeCell(concept.status)} | ${escapeCell(concept.version)} |`,
  );
  const vocabularyPage = page(
    'Canonical-Vocabulary.md',
    'Canonical Vocabulary',
    ['| Concept ID | Code term | DE | EN | Status | Version |', '|---|---|---|---|---|---|', ...vocabularyRows].join('\n'),
    sourceCommit,
  );

  const messageRows = messageList.map((message) =>
    `| ${escapeCell(message.key)} | ${escapeCell(message.context)} | ${escapeCell(message.text.de)} | ${escapeCell(message.text.en)} | ${escapeCell(message.conceptIds.join(', '))} | ${escapeCell(message.version)} |`,
  );
  const messagePage = page(
    'UI-Message-Catalog.md',
    'UI Message Catalog',
    ['| Key | Surface | DE | EN | Concepts | Version |', '|---|---|---|---|---|---|', ...messageRows].join('\n'),
    sourceCommit,
  );

  const bindingRows = sortedBindings.map((binding) =>
    `| ${escapeCell(binding.stageId)} | ${escapeCell(binding.stageName)} | ${escapeCell(binding.conceptIds.join(', '))} | ${escapeCell(binding.messageKeys.join(', '))} |`,
  );
  const valueChainPage = page(
    'FinTech-Value-Chain.md',
    'FinTech Value Chain Wording Projection',
    [
      '> Parent financial authority: `SC-MD-SPT-0001`. All bindings are read-only and non-authorizing.',
      '',
      '| Stage | Name | Concepts | Message Keys |',
      '|---|---|---|---|',
      ...bindingRows,
    ].join('\n'),
    sourceCommit,
  );

  const governancePage = page(
    'Vocabulary-Governance-Boundary.md',
    'Vocabulary Governance Boundary',
    [
      '## Invariants',
      '',
      '- Financial decision authority: **false**',
      '- Mutation authority: **false**',
      '- Wiki authority: **false**',
      '- No second Event Bus, Knowledge Graph, Traceability Store or Financial Runtime',
      '- `DATA_UNAVAILABLE`, DENY, partial and ineligible states may never be upgraded by wording',
      '- Security, Compliance, Legal, Billing and IAM wording remains subordinate to its parent authority',
      '',
      '## Sources',
      '',
      '- `ESS-0017` / `ESS-0017-CONTRACTS`',
      '- `ADR-0078`',
      '- `SC-MD-SPT-0001`',
    ].join('\n'),
    sourceCommit,
  );

  const pages = [home, vocabularyPage, messagePage, valueChainPage, governancePage]
    .sort((a, b) => a.filename.localeCompare(b.filename));
  const stablePayload = JSON.stringify({
    schemaVersion: VOCABULARY_WIKI_SCHEMA,
    sourceCommit: sourceCommit.toLowerCase(),
    authority: VOCABULARY_WIKI_AUTHORITY,
    pages: pages.map(({ filename, checksum }) => ({ filename, checksum })),
    conceptIds: stableUnique(concepts.map((concept) => concept.id)),
    messageKeys: stableUnique(messageList.map((message) => message.key)),
    stageIds: stableUnique(sortedBindings.map((binding) => binding.stageId)),
  });

  return Object.freeze({
    schemaVersion: VOCABULARY_WIKI_SCHEMA,
    sourceCommit: sourceCommit.toLowerCase(),
    authority: VOCABULARY_WIKI_AUTHORITY,
    pages,
    checksum: sha256(stablePayload),
    repositoryAuthoritative: false,
    mutationAuthority: false,
  });
}
