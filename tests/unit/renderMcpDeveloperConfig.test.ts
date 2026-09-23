import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const renderMcpUrl = 'https://mcp.render.com/mcp';

describe('Render MCP developer-host configuration', () => {
  it('declares the hosted Render MCP endpoint for Claude Code without embedding credentials', () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8'));
    const render = config.mcpServers?.render;

    expect(render).toEqual({
      type: 'http',
      url: renderMcpUrl,
    });
    expect(JSON.stringify(render)).not.toMatch(/authorization|token|api[_-]?key|secret/i);
  });

  it('declares the same hosted endpoint for Cursor project configuration without credentials', () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(root, '.cursor', 'mcp.json'), 'utf8'),
    );
    const render = config.mcpServers?.render;

    expect(render).toEqual({ url: renderMcpUrl });
    expect(JSON.stringify(render)).not.toMatch(/authorization|token|api[_-]?key|secret/i);
  });

  it('keeps repository authority on AGENTS.md and does not revive the retired CLAUDE.md mirror', () => {
    const source = fs.readFileSync(
      path.join(root, 'scripts', 'deployment', 'renderMcpClient.ts'),
      'utf8',
    );

    expect(source).toContain('/AGENTS.md@CURRENT_MAIN');
    expect(source).not.toContain('Governance (CLAUDE.md');
  });
});
