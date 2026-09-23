// Render-MCP-Client über die Anthropic Messages API.
//
// Anbindung des gehosteten Render-MCP-Servers (https://mcp.render.com/mcp) ohne lokalen
// MCP-Prozess und ohne OAuth-Browserflow: Der MCP-Connector der Messages API baut die
// Verbindung serverseitig bei Anthropic auf. Dadurch funktioniert dieser Pfad auch aus
// Umgebungen, deren Egress-Policy mcp.render.com blockiert.
//
// Governance (/AGENTS.md@CURRENT_MAIN): Render ist eine produktive Control Plane. Der Client
// laeuft deshalb standardmaessig als reine Read-/Evidence-Plane - es werden ausschliesslich
// die in READ_ONLY_TOOLS freigegebenen Tools aktiviert. Mutationen gehoeren weiterhin hinter
// Policy -> IAM/Grant -> Approval -> Dry-run -> Fingerprint -> Apply -> Verify -> Audit und
// nicht in dieses Skript.
//
// Dieser Anthropic-API-Pfad bleibt ein optionaler Fallback und kann separate Modell/API-Kosten
// verursachen. Fuer interaktive Coding-Hosts ist der direkte OAuth-Zugriff auf den gehosteten
// Render-MCP-Endpunkt vorzuziehen; dabei werden keine Render-API-Schluessel ins Repository geschrieben.
//
// Aufruf:
//   tsx scripts/deployment/renderMcpClient.ts --discover
//   tsx scripts/deployment/renderMcpClient.ts "Welche Services laufen und wie ist ihr Status?"

import Anthropic from '@anthropic-ai/sdk';

const MCP_SERVER_NAME = 'render';
const MCP_SERVER_URL = 'https://mcp.render.com/mcp';
const MCP_BETA = 'mcp-client-2025-11-20';
const MODEL = 'claude-opus-5';

// Freigegebene, ausschliesslich lesende Render-Tools.
//
// Bewusst leer vorbelegt: Die tatsaechlichen Tool-Namen liefert der Server selbst. Einmalig
// `--discover` ausfuehren, die gemeldeten lesenden Tools hier eintragen und danach nur noch
// im Restricted-Modus arbeiten. Keine Namen raten - ein falscher Name wird stillschweigend
// ignoriert und erzeugt eine Freigabe, die niemand geprueft hat.
const READ_ONLY_TOOLS: string[] = [];

function fail(message: string): never {
  console.error(`[FEHLER] ${message}`);
  process.exit(1);
}

function requireEnv(name: string, hint: string): string {
  const value = (process.env[name] ?? '').trim();
  if (!value) fail(`${name} ist nicht gesetzt. ${hint}`);
  return value;
}

/**
 * Discovery-Modus: kein Allowlist-Filter, damit der Server sein vollstaendiges Tool-Inventar
 * meldet. Bewusst nur zur Inventarisierung - hier ist der Schreibzugriff nicht eingeschraenkt,
 * deshalb ausschliesslich mit einem lesenden Prompt verwenden.
 */
function buildToolset(discover: boolean) {
  if (discover) {
    return { type: 'mcp_toolset' as const, mcp_server_name: MCP_SERVER_NAME };
  }

  if (READ_ONLY_TOOLS.length === 0) {
    fail(
      'READ_ONLY_TOOLS ist leer. Zuerst `--discover` ausfuehren, die gemeldeten lesenden ' +
        'Tools in scripts/deployment/renderMcpClient.ts eintragen und erneut starten.',
    );
  }

  // `configs` ist ein nach Tool-Namen indiziertes Objekt, kein Array.
  const configs: Record<string, { enabled: boolean }> = {};
  for (const name of READ_ONLY_TOOLS) {
    configs[name] = { enabled: true };
  }

  return {
    type: 'mcp_toolset' as const,
    mcp_server_name: MCP_SERVER_NAME,
    default_config: { enabled: false },
    configs,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const discover = args.includes('--discover');
  const prompt =
    args.filter((arg) => !arg.startsWith('--')).join(' ') ||
    (discover
      ? 'Liste alle Tools auf, die dir der Render-MCP-Server bereitstellt. Gib pro Tool den ' +
        'exakten Namen, eine knappe Beschreibung und ob es lesend oder schreibend wirkt. ' +
        'Rufe dabei kein einziges Tool auf.'
      : 'Liste die Render-Services dieses Accounts mit Name, Typ und aktuellem Status auf.');

  const anthropicApiKey = requireEnv(
    'ANTHROPIC_API_KEY',
    'Anthropic-API-Key aus der Console hinterlegen.',
  );
  const renderToken = requireEnv(
    'RENDER_MCP_TOKEN',
    'Bearer-Token fuer mcp.render.com hinterlegen (siehe docs/runbooks zum Render-MCP-Connector).',
  );

  const client = new Anthropic({ apiKey: anthropicApiKey });

  if (discover) {
    console.log('[WARN] Discovery-Modus: Tool-Allowlist ist deaktiviert. Nur lesend verwenden.');
  } else {
    console.log(`[OK] Restricted-Modus: ${READ_ONLY_TOOLS.length} Tool(s) freigegeben.`);
  }

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: [MCP_BETA],
    mcp_servers: [
      {
        type: 'url',
        name: MCP_SERVER_NAME,
        url: MCP_SERVER_URL,
        authorization_token: renderToken,
      },
    ],
    tools: [buildToolset(discover)],
    messages: [{ role: 'user', content: prompt }],
  });

  if (response.stop_reason === 'refusal') {
    fail(`Anfrage wurde abgelehnt (${response.stop_details?.category ?? 'unbekannt'}).`);
  }

  for (const block of response.content) {
    if (block.type === 'text') {
      console.log(block.text);
    }
  }

  const usage = response.usage;
  console.log(
    `\n[OK] Fertig. Tokens: ${usage.input_tokens} in / ${usage.output_tokens} out ` +
      `(stop_reason: ${response.stop_reason}).`,
  );
}

main().catch((error: unknown) => {
  if (error instanceof Anthropic.AuthenticationError) {
    fail('ANTHROPIC_API_KEY wurde abgelehnt (401).');
  }
  if (error instanceof Anthropic.BadRequestError) {
    fail(
      `Ungueltige Anfrage (400): ${error.message}\n` +
        'Haeufigste Ursachen: fehlendes mcp_toolset zu einem Eintrag in mcp_servers, ' +
        `abweichender mcp_server_name oder fehlendes Beta-Flag "${MCP_BETA}".`,
    );
  }
  if (error instanceof Anthropic.APIError) {
    fail(`API-Fehler ${error.status}: ${error.message}`);
  }
  fail(String(error));
});
