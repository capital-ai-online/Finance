import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  GoogleAnalyticsMcpReadClient,
  GoogleAnalyticsMcpReadTool,
} from '../../server/googleAnalyticsMcpClient';
import {
  buildGoogleAnalyticsReadSnapshot,
  loadGoogleAnalyticsReadSnapshot,
  resetGoogleAnalyticsReadCacheForTests,
} from '../../server/googleAnalyticsReadProjection';

const root = process.cwd();
const PROPERTY_ID = '123456789';

function fakeClient(calls: Array<{ tool: string; args: unknown }>): GoogleAnalyticsMcpReadClient {
  return {
    async listTools() {
      return [
        'get_account_summaries',
        'get_property_details',
        'run_realtime_report',
        'run_report',
      ];
    },
    async callTool(tool: GoogleAnalyticsMcpReadTool, args: Readonly<Record<string, unknown>>) {
      calls.push({ tool, args });
      if (tool === 'get_account_summaries') {
        return [{ property_summaries: [{ property: `properties/${PROPERTY_ID}` }] }];
      }
      if (tool === 'get_property_details') {
        return { name: `properties/${PROPERTY_ID}`, display_name: 'CAPITAL-AI' };
      }
      if (tool === 'run_realtime_report') {
        return { rows: [{ dimension_values: [{ value: 'page_view' }], metric_values: [{ value: '1' }] }] };
      }
      return { rows: [{ dimension_values: [{ value: 'page_view' }], metric_values: [{ value: '7' }] }] };
    },
    describeBoundary() {
      return Object.freeze({
        provider: 'analytics-mcp' as const,
        version: '0.7.0' as const,
        transport: 'stdio' as const,
        command: '/opt/ga4-mcp/bin/analytics-mcp',
        allowedTools: [
          'get_account_summaries',
          'get_property_details',
          'run_realtime_report',
          'run_report',
        ] as const,
        rawProxy: false as const,
        mutationCapability: false as const,
      });
    },
  };
}

describe('GA4 Render MCP readback', () => {
  beforeEach(() => resetGoogleAnalyticsReadCacheForTests());

  it('uses only the bounded read toolset and binds reports to the configured property', async () => {
    const calls: Array<{ tool: string; args: unknown }> = [];
    const snapshot = await buildGoogleAnalyticsReadSnapshot({
      propertyId: PROPERTY_ID,
      client: fakeClient(calls),
      now: () => Date.parse('2026-09-24T17:00:00.000Z'),
    });

    expect(snapshot.status).toBe('PASS');
    expect(snapshot.propertyBinding).toEqual({
      status: 'PASS',
      discoveredInAccountSummaries: true,
    });
    expect(snapshot.eventEvidence).toEqual({
      status: 'PAGE_VIEW_OBSERVED',
      realtime: true,
      sevenDay: true,
    });
    expect(calls.map(call => call.tool)).toEqual([
      'get_account_summaries',
      'get_property_details',
      'run_realtime_report',
      'run_report',
    ]);
    expect(calls[2]?.args).toEqual({
      property_id: PROPERTY_ID,
      dimensions: ['eventName'],
      metrics: ['eventCount'],
      limit: 25,
    });
    expect(calls[3]?.args).toEqual({
      property_id: PROPERTY_ID,
      date_ranges: [{ start_date: '7daysAgo', end_date: 'today' }],
      dimensions: ['eventName'],
      metrics: ['eventCount'],
      limit: 25,
    });
    expect(snapshot.boundary).toMatchObject({
      executionHost: 'FINANCE_RENDER_RUNTIME',
      openAiExecutionRequired: false,
      codexExecutionRequired: false,
      githubActionsExecutionRequired: false,
      cacheTtlMs: 300000,
      mutationPerformed: false,
      secretsOrTokensExposed: false,
      provider: {
        provider: 'analytics-mcp',
        version: '0.7.0',
        transport: 'stdio',
        rawProxy: false,
        mutationCapability: false,
      },
    });
  });

  it('caches the provider projection for five minutes', async () => {
    const calls: Array<{ tool: string; args: unknown }> = [];
    let nowMs = Date.parse('2026-09-24T17:00:00.000Z');
    const client = fakeClient(calls);

    const first = await loadGoogleAnalyticsReadSnapshot({
      client,
      propertyId: PROPERTY_ID,
      now: () => nowMs,
    });
    nowMs += 299_999;
    const second = await loadGoogleAnalyticsReadSnapshot({
      client,
      propertyId: PROPERTY_ID,
      now: () => nowMs,
    });

    expect(second).toEqual(first);
    expect(calls).toHaveLength(4);

    nowMs += 2;
    await loadGoogleAnalyticsReadSnapshot({
      client,
      propertyId: PROPERTY_ID,
      now: () => nowMs,
    });
    expect(calls).toHaveLength(8);
  });

  it('fails closed before reports when the configured property was not discovered', async () => {
    const calls: Array<{ tool: string; args: unknown }> = [];
    const client = fakeClient(calls);
    const original = client.callTool.bind(client);
    client.callTool = async (tool, args) => {
      if (tool === 'get_account_summaries') {
        calls.push({ tool, args });
        return [{ property_summaries: [{ property: 'properties/987654321' }] }];
      }
      return original(tool, args);
    };

    const snapshot = await buildGoogleAnalyticsReadSnapshot({
      propertyId: PROPERTY_ID,
      client,
    });

    expect(snapshot.status).toBe('PARTIAL_COVERAGE');
    expect(snapshot.propertyBinding.status).toBe('NOT_OBSERVABLE');
    expect(snapshot.entries.realtimeEventReport.status).toBe('NOT_OBSERVABLE');
    expect(snapshot.entries.sevenDayEventReport.status).toBe('NOT_OBSERVABLE');
    expect(calls.map(call => call.tool)).toEqual([
      'get_account_summaries',
      'get_property_details',
    ]);
  });

  it('keeps the route owner-only and the provider secret server-side', () => {
    const routeSource = fs.readFileSync(
      path.join(root, 'server/routes/googleAnalyticsReadRoutes.ts'),
      'utf8',
    );
    const clientSource = fs.readFileSync(
      path.join(root, 'server/googleAnalyticsMcpClient.ts'),
      'utf8',
    );
    const dockerSource = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');
    const renderSource = fs.readFileSync(path.join(root, 'render.yaml'), 'utf8');

    expect(routeSource).toContain('OWNER_ONLY_ROLES');
    expect(routeSource).toContain("'google-analytics-readback:read'");
    expect(clientSource).toContain("'/opt/ga4-mcp/bin/analytics-mcp'");
    expect(clientSource).not.toContain('const childEnv: NodeJS.ProcessEnv = { ...process.env }');
    expect(clientSource).toContain('GOOGLE_APPLICATION_CREDENTIALS: credentials');
    expect(clientSource).toContain("GOOGLE_PROJECT_ID: projectId");
    expect(clientSource).not.toContain('private_key:');
    expect(dockerSource).toContain('analytics-mcp==0.7.0');
    expect(renderSource).toContain('GA4_MCP_SERVICE_ACCOUNT_KEY_JSON');
    expect(renderSource).toContain('GA4_MCP_PROJECT_ID');
    expect(renderSource).toContain('GA4_PID');
  });
});
