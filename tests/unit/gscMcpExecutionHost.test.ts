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

const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
const codexConfigPath = path.join(process.cwd(), '.codex', 'config.toml');
const codexSetupPath = path.join(
  process.cwd(),
  '.codex',
  'setup-google-mcp-credentials.sh',
);

function readMcpConfig(): McpConfig {
  return JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8')) as McpConfig;
}

describe('GSC MCP OpenAI Codex execution-host configuration', () => {
  it('keeps the canonical MCP executable identities pinned while Codex owns execution', () => {
    const config = readMcpConfig();
    const codexConfig = fs.readFileSync(codexConfigPath, 'utf8');
    const gsc = config.mcpServers['search-console'];

    expect(gsc).toBeDefined();
    expect(gsc.command).toBe('npx');
    expect(gsc.args).toEqual(['-y', '@vmandic/searchconsole-mcp@1.1.1']);
    expect(codexConfig).toContain('[mcp_servers.search-console]');
    expect(codexConfig).toContain('@vmandic/searchconsole-mcp@1.1.1');
    expect(codexConfig).not.toContain('--transport');
    expect(codexConfig).not.toContain('GSC_MCP_SERVICE_ACCOUNT_KEY_JSON');
  });

  it('isolates Search Console credentials from the GA4 MCP principal in Codex', () => {
    const codexConfig = fs.readFileSync(codexConfigPath, 'utf8');

    expect(codexConfig).toContain('$HOME/.capital-ai/gsc-mcp-credentials.json');
    expect(codexConfig).toContain('$HOME/.capital-ai/ga4-mcp-credentials.json');
    expect(codexConfig).toContain('[mcp_servers.ga4-analytics]');
    expect(codexConfig).toContain('analytics-mcp==0.7.0');
  });

  it('materializes setup-only Codex secrets fail-closed without persisting raw secrets in config', () => {
    const codexConfig = fs.readFileSync(codexConfigPath, 'utf8');
    const setupSource = fs.readFileSync(codexSetupPath, 'utf8');

    expect(setupSource).toContain('GSC_MCP_SERVICE_ACCOUNT_KEY_JSON');
    expect(setupSource).toContain('GA4_MCP_SERVICE_ACCOUNT_KEY_JSON');
    expect(setupSource).toContain('rm -f "${target}"');
    expect(setupSource).toContain('chmod 600 "${target}"');
    expect(setupSource).toContain('unset GSC_MCP_SERVICE_ACCOUNT_KEY_JSON');
    expect(codexConfig).not.toContain('private_key');
  });

  it('removes active Claude Code host mechanics instead of running parallel host bootstraps', () => {
    expect(fs.existsSync(path.join(process.cwd(), '.claude', 'settings.json'))).toBe(false);
    expect(
      fs.existsSync(path.join(process.cwd(), '.claude', 'hooks', 'gsc-mcp-credentials.sh')),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(process.cwd(), '.claude', 'hooks', 'ga4-mcp-credentials.sh')),
    ).toBe(false);
  });

  it('preserves the existing GA4 executable-identity manifest unchanged', () => {
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
