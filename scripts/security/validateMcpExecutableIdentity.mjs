import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXPECTED_MCP_EXECUTABLE_IDENTITY = Object.freeze({
  server: 'ga4-analytics',
  command: 'uvx',
  distribution: 'analytics-mcp',
  version: '0.7.0',
  executable: 'analytics-mcp',
});

export const EXPECTED_MCP_ARGS = Object.freeze([
  '--from',
  `${EXPECTED_MCP_EXECUTABLE_IDENTITY.distribution}==${EXPECTED_MCP_EXECUTABLE_IDENTITY.version}`,
  EXPECTED_MCP_EXECUTABLE_IDENTITY.executable,
]);

export function validateMcpExecutableIdentity(config) {
  const errors = [];
  const server = config?.mcpServers?.[EXPECTED_MCP_EXECUTABLE_IDENTITY.server];

  if (!server || typeof server !== 'object' || Array.isArray(server)) {
    errors.push(`missing MCP server declaration: ${EXPECTED_MCP_EXECUTABLE_IDENTITY.server}`);
    return errors;
  }

  if (server.command !== EXPECTED_MCP_EXECUTABLE_IDENTITY.command) {
    errors.push(`unexpected MCP command: expected ${EXPECTED_MCP_EXECUTABLE_IDENTITY.command}`);
  }

  if (!Array.isArray(server.args)) {
    errors.push('MCP executable args must be an array');
    return errors;
  }

  const exactArgs =
    server.args.length === EXPECTED_MCP_ARGS.length &&
    server.args.every((value, index) => value === EXPECTED_MCP_ARGS[index]);

  if (!exactArgs) {
    errors.push(
      `MCP executable identity must be pinned exactly as: ${EXPECTED_MCP_ARGS.join(' ')}`,
    );
  }

  return errors;
}

export function readAndValidateMcpExecutableIdentity(configPath = path.resolve(process.cwd(), '.mcp.json')) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    return [`unable to read or parse ${configPath}: ${error instanceof Error ? error.message : String(error)}`];
  }

  return validateMcpExecutableIdentity(parsed);
}

const isDirectExecution = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isDirectExecution) {
  const errors = readAndValidateMcpExecutableIdentity();
  if (errors.length > 0) {
    for (const error of errors) console.error(`[mcp-executable-identity] ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `[mcp-executable-identity] PASS ${EXPECTED_MCP_EXECUTABLE_IDENTITY.distribution}==${EXPECTED_MCP_EXECUTABLE_IDENTITY.version} -> ${EXPECTED_MCP_EXECUTABLE_IDENTITY.executable}`,
    );
  }
}
