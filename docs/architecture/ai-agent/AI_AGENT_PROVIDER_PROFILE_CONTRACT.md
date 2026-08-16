# AI Agent Provider Profile Contract

Each provider profile declares: provider/product, plane, allowed capabilities, authentication source, tool transports, sandbox boundary, telemetry integration, data-retention constraints, prohibited capabilities and kill-switch procedure.

## Canonical DEVELOPMENT Chain / AI value-chain providers (Owner 2026-08-16)

| appId | Provider | Plane | Role |
|-------|----------|-------|------|
| `chatgpt-github-connector` | OpenAI / ChatGPT | Research + controlled Execution | MCP/Apps/connectors; capability policy external to model |
| `claude-code-cli` | Anthropic / Claude | controlled Execution | permission modes/allowed tools/MCP; bypass-permissions prohibited for production |
| `grok-xai-connector` | xAI / Grok | Research + controlled Execution | GitHub MCP / Grok Chat connector; same control-plane policy as ChatGPT/Claude |

**Google AI Studio, NotebookLM and Gemini are NOT part of the active DEVELOPMENT Chain or AI value chain.** They remain retired aliases and resolve to DENY/RETIRED in the control plane.

New providers require a profile before use; no new ADR is needed unless trust boundaries or capabilities change.

## M8 Cutover Readiness

Ein Provider-Profil mit mutierenden Capabilities darf erst als kanonischer Ausführungspfad gelten, wenn alle folgenden Nachweise vorliegen:

- realer Aufrufer verifiziert;
- provider-neutraler Control-Plane-Pfad verifiziert;
- provider-spezifischer Bypass nachweislich verweigert;
- vollständige Audit-Korrelation verifiziert;
- Rollback auf Read-only verifiziert;
- externe Host-/Connector-Konfiguration durch deren zuständige Plattform verifiziert.

Read-only-Profile ohne mutierende Capability sind für einen privilegierten Cutover `NOT_APPLICABLE`. Retired aliases are `RETIRED`. Eine Modell- oder Providerbezeichnung erzeugt niemals Ausführungsberechtigung.
