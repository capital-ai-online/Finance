import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EXPECTED_MCP_ARGS,
  EXPECTED_MCP_EXECUTABLE_IDENTITY,
  validateMcpExecutableIdentity,
} from '../../scripts/security/validateMcpExecutableIdentity.mjs';

function configWith(args: string[]) {
  return {
    mcpServers: {
      'ga4-analytics': {
        command: 'uvx',
        args,
      },
    },
  };
}

describe('SEC-SOTA03 MCP executable identity', () => {
  it('accepts the repository MCP configuration only when the package identity is exactly pinned', () => {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '.mcp.json'), 'utf8'));

    expect(validateMcpExecutableIdentity(config)).toEqual([]);
    expect(config.mcpServers['ga4-analytics'].args).toEqual(EXPECTED_MCP_ARGS);
    expect(EXPECTED_MCP_EXECUTABLE_IDENTITY).toMatchObject({
      distribution: 'analytics-mcp',
      version: '0.7.0',
      executable: 'analytics-mcp',
    });
  });

  it('rejects the previous unconstrained mutable executable declaration', () => {
    expect(validateMcpExecutableIdentity(configWith(['analytics-mcp']))).toContain(
      'MCP executable identity must be pinned exactly as: --from analytics-mcp==0.7.0 analytics-mcp',
    );
  });

  it('rejects package-version drift', () => {
    expect(
      validateMcpExecutableIdentity(
        configWith(['--from', 'analytics-mcp==0.7.1', 'analytics-mcp']),
      ),
    ).toContain(
      'MCP executable identity must be pinned exactly as: --from analytics-mcp==0.7.0 analytics-mcp',
    );
  });

  it('rejects executable-name drift even when the distribution version remains pinned', () => {
    expect(
      validateMcpExecutableIdentity(
        configWith(['--from', 'analytics-mcp==0.7.0', 'different-executable']),
      ),
    ).toContain(
      'MCP executable identity must be pinned exactly as: --from analytics-mcp==0.7.0 analytics-mcp',
    );
  });
});
