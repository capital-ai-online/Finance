import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

interface ClaudeSettings {
  hooks?: {
    SessionStart?: Array<{
      hooks?: Array<{ type?: string; command?: string }>;
    }>;
  };
}

const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
const claudeSettingsPath = path.join(process.cwd(), '.claude', 'settings.json');
const gscCredentialHookPath = path.join(
  process.cwd(),
  '.claude',
  'hooks',
  'gsc-mcp-credentials.sh',
);

function readMcpConfig(): McpConfig {
  return JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8')) as McpConfig;
}

function readClaudeSettings(): ClaudeSettings {
  return JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8')) as ClaudeSettings;
}

describe('GSC MCP execution-host configuration', () => {
  it('pins the read-only Search Console MCP package and keeps stdio as the only configured transport', () => {
    const config = readMcpConfig();
    const gsc = config.mcpServers['search-console'];

    expect(gsc).toBeDefined();
    expect(gsc.command).toBe('npx');
    expect(gsc.args).toEqual(['-y', '@vmandic/searchconsole-mcp@1.1.1']);
    expect(gsc.args).not.toContain('--transport');
    expect(gsc.args).not.toContain('http');
    expect(gsc.env).toEqual({
      GOOGLE_APPLICATION_CREDENTIALS: '${HOME}/.capital-ai/gsc-mcp-credentials.json',
    });
  });

  it('isolates Search Console credentials from the GA4 MCP principal', () => {
    const config = readMcpConfig();
    const gsc = config.mcpServers['search-console'];
    const ga4 = config.mcpServers['ga4-analytics'];

    expect(gsc.env?.GOOGLE_APPLICATION_CREDENTIALS).toBe(
      '${HOME}/.capital-ai/gsc-mcp-credentials.json',
    );
    expect(ga4.env?.GOOGLE_APPLICATION_CREDENTIALS).toBe(
      '${HOME}/.capital-ai/ga4-mcp-credentials.json',
    );
    expect(gsc.env?.GOOGLE_APPLICATION_CREDENTIALS).not.toBe(
      ga4.env?.GOOGLE_APPLICATION_CREDENTIALS,
    );
  });

  it('registers the fail-closed GSC credential hook without exporting credentials globally', () => {
    const settings = readClaudeSettings();
    const commands = (settings.hooks?.SessionStart ?? []).flatMap((entry) =>
      (entry.hooks ?? []).map((hook) => hook.command ?? ''),
    );
    const hookSource = fs.readFileSync(gscCredentialHookPath, 'utf8');

    expect(commands).toContain('bash $CLAUDE_PROJECT_DIR/.claude/hooks/gsc-mcp-credentials.sh');
    expect(hookSource).toContain('GSC_MCP_SERVICE_ACCOUNT_KEY_JSON');
    expect(hookSource).toContain('rm -f "${CRED_FILE}"');
    expect(hookSource).not.toContain('CLAUDE_ENV_FILE');
  });

  it('preserves the existing GA4 MCP host contract unchanged', () => {
    const config = readMcpConfig();

    expect(config.mcpServers['ga4-analytics']).toEqual({
      command: 'uvx',
      args: ['--from', 'analytics-mcp==0.7.0', 'analytics-mcp'],
      env: {
        GOOGLE_APPLICATION_CREDENTIALS: '${HOME}/.capital-ai/ga4-mcp-credentials.json',
        GOOGLE_PROJECT_ID: '${GA4_MCP_PROJECT_ID:-}',
      },
    });
  });
});
