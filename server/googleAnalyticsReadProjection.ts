import {
  getGoogleAnalyticsMcpReadClient,
  type GoogleAnalyticsMcpReadClient,
} from './googleAnalyticsMcpClient';

const CACHE_MS = 5 * 60 * 1000;
const MAX_ROWS = 25;

type Entry =
  | Readonly<{ status: 'PASS'; data: unknown }>
  | Readonly<{ status: 'NOT_OBSERVABLE'; reason: string }>;

export interface GoogleAnalyticsReadSnapshot {
  schemaVersion: 'google-analytics-render-readback/1.0.0';
  role: 'NON_AUTHORIZING_READ_ONLY_PROJECTION';
  status: 'PASS' | 'PARTIAL_COVERAGE';
  observedAt: string;
  propertyId: string;
  propertyBinding: Readonly<{
    status: 'PASS' | 'NOT_OBSERVABLE';
    discoveredInAccountSummaries: boolean;
  }>;
  eventEvidence: Readonly<{
    status: 'PAGE_VIEW_OBSERVED' | 'NO_PAGE_VIEW_OBSERVED';
    realtime: boolean;
    sevenDay: boolean;
  }>;
  entries: Readonly<{
    accountSummaries: Entry;
    propertyDetails: Entry;
    realtimeEventReport: Entry;
    sevenDayEventReport: Entry;
  }>;
  boundary: Readonly<{
    executionHost: 'FINANCE_RENDER_RUNTIME';
    openAiExecutionRequired: false;
    codexExecutionRequired: false;
    githubActionsExecutionRequired: false;
    provider: ReturnType<GoogleAnalyticsMcpReadClient['describeBoundary']>;
    cacheTtlMs: number;
    mutationPerformed: false;
    secretsOrTokensExposed: false;
  }>;
}

let cache: { key: string; at: number; value: GoogleAnalyticsReadSnapshot } | null = null;

function required(value: string | undefined, label: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`[GA4-READBACK] ${label} is not configured`);
  return normalized;
}

function normalizePropertyId(value: string): string {
  const normalized = value.replace(/^properties\//, '').trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error('[GA4-READBACK] GA4_PID must be numeric');
  }
  return normalized;
}

async function capture(
  label: string,
  run: () => Promise<unknown>,
): Promise<Entry> {
  try {
    return Object.freeze({ status: 'PASS' as const, data: await run() });
  } catch {
    return Object.freeze({
      status: 'NOT_OBSERVABLE' as const,
      reason: `${label} is not readable through the configured GA4 MCP reader`,
    });
  }
}

function entryPassed(entry: Entry): entry is Extract<Entry, { status: 'PASS' }> {
  return entry.status === 'PASS';
}

function containsConfiguredProperty(value: unknown, propertyId: string): boolean {
  const serialized = JSON.stringify(value);
  return (
    serialized.includes(`properties/${propertyId}`) ||
    serialized.includes(`"${propertyId}"`) ||
    serialized.includes(`:${propertyId}`)
  );
}

export async function buildGoogleAnalyticsReadSnapshot({
  propertyId,
  client = getGoogleAnalyticsMcpReadClient(),
  now = () => Date.now(),
}: {
  propertyId: string;
  client?: GoogleAnalyticsMcpReadClient;
  now?: () => number;
}): Promise<GoogleAnalyticsReadSnapshot> {
  const resolvedPropertyId = normalizePropertyId(propertyId);
  const availableTools = await client.listTools();
  const requiredTools = [
    'get_account_summaries',
    'get_property_details',
    'run_realtime_report',
    'run_report',
  ] as const;

  for (const tool of requiredTools) {
    if (!availableTools.includes(tool)) {
      throw new Error(`[GA4-READBACK] required MCP tool unavailable: ${tool}`);
    }
  }

  const accountSummaries = await capture(
    'GA4 account summaries',
    () => client.callTool('get_account_summaries', {}),
  );

  const propertyDetails = await capture(
    'GA4 property details',
    () => client.callTool('get_property_details', { property_id: resolvedPropertyId }),
  );

  const discoveredInAccountSummaries =
    entryPassed(accountSummaries) &&
    containsConfiguredProperty(accountSummaries.data, resolvedPropertyId);

  const propertyReadable = entryPassed(propertyDetails);
  const canRunReports = discoveredInAccountSummaries && propertyReadable;

  const realtimeEventReport = canRunReports
    ? await capture(
        'GA4 realtime report',
        () =>
          client.callTool('run_realtime_report', {
            property_id: resolvedPropertyId,
            dimensions: ['eventName'],
            metrics: ['eventCount'],
            limit: MAX_ROWS,
          }),
      )
    : Object.freeze({
        status: 'NOT_OBSERVABLE' as const,
        reason: 'GA4 realtime report is gated by successful configured-property discovery',
      });

  const sevenDayEventReport = canRunReports
    ? await capture(
        'GA4 seven-day report',
        () =>
          client.callTool('run_report', {
            property_id: resolvedPropertyId,
            date_ranges: [{ start_date: '7daysAgo', end_date: 'today' }],
            dimensions: ['eventName'],
            metrics: ['eventCount'],
            limit: MAX_ROWS,
          }),
      )
    : Object.freeze({
        status: 'NOT_OBSERVABLE' as const,
        reason: 'GA4 standard report is gated by successful configured-property discovery',
      });

  const propertyBinding = Object.freeze({
    status:
      discoveredInAccountSummaries && propertyReadable
        ? ('PASS' as const)
        : ('NOT_OBSERVABLE' as const),
    discoveredInAccountSummaries,
  });

  const entries = Object.freeze({
    accountSummaries,
    propertyDetails,
    realtimeEventReport,
    sevenDayEventReport,
  });

  const realtimePageView =
    entryPassed(realtimeEventReport) &&
    JSON.stringify(realtimeEventReport.data).includes('page_view');
  const sevenDayPageView =
    entryPassed(sevenDayEventReport) &&
    JSON.stringify(sevenDayEventReport.data).includes('page_view');
  const eventEvidence = Object.freeze({
    status:
      realtimePageView || sevenDayPageView
        ? ('PAGE_VIEW_OBSERVED' as const)
        : ('NO_PAGE_VIEW_OBSERVED' as const),
    realtime: realtimePageView,
    sevenDay: sevenDayPageView,
  });

  const status =
    propertyBinding.status === 'PASS' &&
    Object.values(entries).every(entry => entry.status === 'PASS')
      ? ('PASS' as const)
      : ('PARTIAL_COVERAGE' as const);

  return Object.freeze({
    schemaVersion: 'google-analytics-render-readback/1.0.0' as const,
    role: 'NON_AUTHORIZING_READ_ONLY_PROJECTION' as const,
    status,
    observedAt: new Date(now()).toISOString(),
    propertyId: resolvedPropertyId,
    propertyBinding,
    eventEvidence,
    entries,
    boundary: Object.freeze({
      executionHost: 'FINANCE_RENDER_RUNTIME' as const,
      openAiExecutionRequired: false as const,
      codexExecutionRequired: false as const,
      githubActionsExecutionRequired: false as const,
      provider: client.describeBoundary(),
      cacheTtlMs: CACHE_MS,
      mutationPerformed: false as const,
      secretsOrTokensExposed: false as const,
    }),
  });
}

export async function loadGoogleAnalyticsReadSnapshot({
  client = getGoogleAnalyticsMcpReadClient(),
  propertyId = process.env.GA4_PID,
  now = () => Date.now(),
}: {
  client?: GoogleAnalyticsMcpReadClient;
  propertyId?: string;
  now?: () => number;
} = {}): Promise<GoogleAnalyticsReadSnapshot> {
  const resolvedPropertyId = normalizePropertyId(
    required(propertyId, 'GA4_PID'),
  );
  const nowMs = now();
  const cacheKey = resolvedPropertyId;

  if (cache && cache.key === cacheKey && nowMs - cache.at < CACHE_MS) {
    return cache.value;
  }

  const value = await buildGoogleAnalyticsReadSnapshot({
    propertyId: resolvedPropertyId,
    client,
    now: () => nowMs,
  });
  cache = { key: cacheKey, at: nowMs, value };
  return value;
}

export function resetGoogleAnalyticsReadCacheForTests(): void {
  cache = null;
}
