import type {
  SeoContentInventoryItem,
  SeoKeyword,
  SeoRankSnapshot,
} from './types';

export interface SeoDashboardSummary {
  keywordCount: number;
  rankSnapshotCount: number;
  contentCount: number;
  publishedContentCount: number;
  hasMeasuredRanks: boolean;
}

export interface SeoDashboardData {
  summary: SeoDashboardSummary;
  keywords: SeoKeyword[];
  ranks: SeoRankSnapshot[];
  content: SeoContentInventoryItem[];
}

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function normalizeSeoDashboardPayloads(
  summaryPayload: unknown,
  keywordPayload: unknown,
  rankPayload: unknown,
  contentPayload: unknown,
): SeoDashboardData {
  const summary = summaryPayload && typeof summaryPayload === 'object'
    ? summaryPayload as Record<string, unknown>
    : {};
  const keywords = keywordPayload && typeof keywordPayload === 'object'
    && Array.isArray((keywordPayload as Record<string, unknown>).keywords)
    ? (keywordPayload as { keywords: SeoKeyword[] }).keywords
    : [];
  const ranks = rankPayload && typeof rankPayload === 'object'
    && Array.isArray((rankPayload as Record<string, unknown>).ranks)
    ? (rankPayload as { ranks: SeoRankSnapshot[] }).ranks
    : [];
  const content = contentPayload && typeof contentPayload === 'object'
    && Array.isArray((contentPayload as Record<string, unknown>).content)
    ? (contentPayload as { content: SeoContentInventoryItem[] }).content
    : [];

  return {
    summary: {
      keywordCount: finiteNonNegative(summary.keywordCount),
      rankSnapshotCount: finiteNonNegative(summary.rankSnapshotCount),
      contentCount: finiteNonNegative(summary.contentCount),
      publishedContentCount: finiteNonNegative(summary.publishedContentCount),
      hasMeasuredRanks: summary.hasMeasuredRanks === true,
    },
    keywords,
    ranks,
    content,
  };
}

export function seoSourceStatus(data: SeoDashboardData): {
  searchConsole: 'connected' | 'not-connected';
  ga4: 'not-connected';
  manualImports: number;
} {
  return {
    searchConsole: data.ranks.some((rank) =>
      rank.source === 'search-console' || rank.source === 'search_console')
      ? 'connected'
      : 'not-connected',
    ga4: 'not-connected',
    manualImports: data.ranks.filter((rank) =>
      rank.source === 'manual-import' || rank.source === 'manual').length,
  };
}
