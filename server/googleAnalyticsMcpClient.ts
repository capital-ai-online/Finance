import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MCP_COMMAND = '/opt/ga4-mcp/bin/analytics-mcp';
const MCP_PROTOCOL_VERSION = '2025-06-18';
const MCP_REQUEST_TIMEOUT_MS = 20_000;

export const GOOGLE_ANALYTICS_MCP_READ_TOOLS = Object.freeze([
  'get_account_summaries',
  'get_property_details',
  'run_realtime_report',
  'run_report',
] as const);

export type GoogleAnalyticsMcpReadTool =
  (typeof GOOGLE_ANALYTICS_MCP_READ_TOOLS)[number];

export interface GoogleAnalyticsMcpReadClient {
  listTools(): Promise<readonly string[]>;
  callTool(tool: GoogleAnalyticsMcpReadTool, args: Readonly<Record<string, unknown>>): Promise<unknown>;
  describeBoundary(): Readonly<{
    provider: 'analytics-mcp';
    version: '0.7.0';
    transport: 'stdio';
    command: string;
    allowedTools: readonly GoogleAnalyticsMcpReadTool[];
    rawProxy: false;
    mutationCapability: false;
  }>;
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

type RpcResponse = {
  jsonrpc?: string;
  id?: number | string;
  result?: unknown;
  error?: { code?: number; message?: string };
};

function required(value: string | undefined, label: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`[GA4-MCP] ${label} is not configured`);
  return normalized;
}

function normalizePropertyProjectId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

let credentialFingerprint: string | null = null;
let credentialPath: string | null = null;

async function materializeServiceAccount({
  serviceAccountJson,
  projectId,
}: {
  serviceAccountJson: string;
  projectId: string;
}): Promise<string> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(serviceAccountJson) as Record<string, unknown>;
  } catch {
    throw new Error('[GA4-MCP] service-account secret is not valid JSON');
  }

  if (
    parsed.type !== 'service_account' ||
    typeof parsed.client_email !== 'string' ||
    typeof parsed.private_key !== 'string' ||
    typeof parsed.project_id !== 'string'
  ) {
    throw new Error('[GA4-MCP] service-account secret is missing required service_account fields');
  }

  if (normalizePropertyProjectId(parsed.project_id) !== projectId) {
    throw new Error('[GA4-MCP] service-account project_id does not match GA4_MCP_PROJECT_ID');
  }

  const fingerprint = createHash('sha256').update(serviceAccountJson).digest('hex');
  if (credentialFingerprint === fingerprint && credentialPath) return credentialPath;

  const home = required(process.env.HOME, 'HOME');
  const directory = path.join(home, 'ga4-mcp');
  const target = path.join(directory, 'service-account.json');
  const temporary = path.join(directory, `.service-account.${process.pid}.tmp`);

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  await writeFile(temporary, JSON.stringify(parsed), { mode: 0o600, flag: 'w' });
  await chmod(temporary, 0o600);
  await rename(temporary, target);
  await chmod(target, 0o600);

  credentialFingerprint = fingerprint;
  credentialPath = target;
  return target;
}

class StdioGoogleAnalyticsMcpClient implements GoogleAnalyticsMcpReadClient {
  private child: ChildProcessWithoutNullStreams | null = null;
  private initializePromise: Promise<void> | null = null;
  private stdoutBuffer = '';
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private toolNames: readonly string[] = [];

  describeBoundary() {
    return Object.freeze({
      provider: 'analytics-mcp' as const,
      version: '0.7.0' as const,
      transport: 'stdio' as const,
      command: MCP_COMMAND,
      allowedTools: GOOGLE_ANALYTICS_MCP_READ_TOOLS,
      rawProxy: false as const,
      mutationCapability: false as const,
    });
  }

  async listTools(): Promise<readonly string[]> {
    await this.ensureInitialized();
    return this.toolNames;
  }

  async callTool(
    tool: GoogleAnalyticsMcpReadTool,
    args: Readonly<Record<string, unknown>>,
  ): Promise<unknown> {
    if (!GOOGLE_ANALYTICS_MCP_READ_TOOLS.includes(tool)) {
      throw new Error('[GA4-MCP] tool is outside the read allowlist');
    }
    await this.ensureInitialized();
    const result = await this.request('tools/call', { name: tool, arguments: args });
    return this.normalizeToolResult(result);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.child && this.toolNames.length > 0) return;
    if (this.initializePromise) return this.initializePromise;

    this.initializePromise = this.start();
    try {
      await this.initializePromise;
    } finally {
      this.initializePromise = null;
    }
  }

  private async start(): Promise<void> {
    const serviceAccountJson = required(
      process.env.GA4_MCP_SERVICE_ACCOUNT_KEY_JSON,
      'GA4_MCP_SERVICE_ACCOUNT_KEY_JSON',
    );
    const projectId = required(process.env.GA4_MCP_PROJECT_ID, 'GA4_MCP_PROJECT_ID');
    const credentials = await materializeServiceAccount({ serviceAccountJson, projectId });

    // Deliberately do not inherit the application's full Render environment:
    // the GA4 MCP child needs only its Python/runtime paths plus Google read credentials.
    const childEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      HOME: required(process.env.HOME, 'HOME'),
      TMPDIR: process.env.TMPDIR || '/tmp',
      LANG: process.env.LANG || 'C.UTF-8',
      GOOGLE_APPLICATION_CREDENTIALS: credentials,
      GOOGLE_PROJECT_ID: projectId,
      PYTHONUNBUFFERED: '1',
    };

    const child = spawn(MCP_COMMAND, [], {
      env: childEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.child = child;

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => this.handleStdout(String(chunk)));
    // Drain stderr so a verbose provider cannot block its own stdio session.
    // Provider stderr is deliberately not forwarded because it can contain
    // environment/resource diagnostics that do not belong in application logs.
    child.stderr.on('data', () => undefined);
    child.once('error', () => this.failSession(new Error('[GA4-MCP] provider process failed to start')));
    child.once('exit', () => this.failSession(new Error('[GA4-MCP] provider process exited')));

    await this.request('initialize', {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: 'capital-ai-render-ga4-readback',
        version: '1.0.0',
      },
    });
    this.notify('notifications/initialized', {});

    const listed = await this.request('tools/list', {});
    const tools = Array.isArray((listed as any)?.tools) ? (listed as any).tools : [];
    this.toolNames = Object.freeze(
      tools
        .map((tool: any) => String(tool?.name || '').trim())
        .filter(Boolean),
    );

    for (const requiredTool of GOOGLE_ANALYTICS_MCP_READ_TOOLS) {
      if (!this.toolNames.includes(requiredTool)) {
        this.failSession(new Error(`[GA4-MCP] required tool unavailable: ${requiredTool}`));
        throw new Error(`[GA4-MCP] required tool unavailable: ${requiredTool}`);
      }
    }
  }

  private handleStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    while (true) {
      const newline = this.stdoutBuffer.indexOf('\n');
      if (newline < 0) return;
      const line = this.stdoutBuffer.slice(0, newline).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newline + 1);
      if (!line) continue;

      let message: RpcResponse;
      try {
        message = JSON.parse(line) as RpcResponse;
      } catch {
        continue;
      }

      if (typeof message.id !== 'number') continue;
      const pending = this.pending.get(message.id);
      if (!pending) continue;

      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error('[GA4-MCP] provider returned an MCP error'));
      } else {
        pending.resolve(message.result);
      }
    }
  }

  private request(method: string, params: Record<string, unknown>): Promise<unknown> {
    const child = this.child;
    if (!child || child.killed || !child.stdin.writable) {
      return Promise.reject(new Error('[GA4-MCP] provider process is not connected'));
    }

    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`[GA4-MCP] ${method} timed out`));
      }, MCP_REQUEST_TIMEOUT_MS);

      this.pending.set(id, { resolve, reject, timer });
      child.stdin.write(
        JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n',
        error => {
          if (!error) return;
          const pending = this.pending.get(id);
          if (!pending) return;
          clearTimeout(pending.timer);
          this.pending.delete(id);
          pending.reject(new Error('[GA4-MCP] failed to write to provider process'));
        },
      );
    });
  }

  private notify(method: string, params: Record<string, unknown>): void {
    const child = this.child;
    if (!child || child.killed || !child.stdin.writable) return;
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  private normalizeToolResult(result: unknown): unknown {
    const raw = result as any;
    if (raw?.isError === true) {
      throw new Error('[GA4-MCP] provider tool returned an error result');
    }

    if (!Array.isArray(raw?.content)) return result;
    const values = raw.content
      .filter((part: any) => part?.type === 'text' && typeof part?.text === 'string')
      .map((part: any) => {
        try {
          return JSON.parse(part.text);
        } catch {
          return part.text;
        }
      });

    for (const value of values) {
      if (value && typeof value === 'object' && 'error' in value) {
        throw new Error('[GA4-MCP] provider tool returned an error payload');
      }
    }

    if (values.length === 1) return values[0];
    return values;
  }

  private failSession(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    this.toolNames = [];
    if (this.child && !this.child.killed) {
      this.child.kill('SIGTERM');
    }
    this.child = null;
  }
}

let singleton: GoogleAnalyticsMcpReadClient | null = null;

export function getGoogleAnalyticsMcpReadClient(): GoogleAnalyticsMcpReadClient {
  singleton ??= new StdioGoogleAnalyticsMcpClient();
  return singleton;
}

export function resetGoogleAnalyticsMcpReadClientForTests(): void {
  singleton = null;
  credentialFingerprint = null;
  credentialPath = null;
}
