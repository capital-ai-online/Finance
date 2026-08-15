# AI Agent Provider Profile Contract

Each provider profile declares: provider/product, plane, allowed capabilities, authentication source, tool transports, sandbox boundary, telemetry integration, data-retention constraints, prohibited capabilities and kill-switch procedure.

Profiles:
- ChatGPT: Research + controlled Execution; MCP/Apps/connectors; capability policy external to model.
- Claude Code: controlled Execution; permission modes/allowed tools/MCP; bypass-permissions prohibited for production.
- Google AI Studio: Development/Prototype ohne privilegierten Ausführungstransport. Keine Gemini-API-/Runtime-Integration ist Bestandteil des Repositorys; externe Stripe-/Supabase-/Render-Mutationen bleiben ausgeschlossen und handoff-gesteuert.
- NotebookLM: Research & Evidence only; source-grounded, no mutation tools.

New providers require a profile before use; no new ADR is needed unless trust boundaries or capabilities change.

## M8 Cutover Readiness

Ein Provider-Profil mit mutierenden Capabilities darf erst als kanonischer Ausführungspfad gelten, wenn alle folgenden Nachweise vorliegen:

- realer Aufrufer verifiziert;
- provider-neutraler Control-Plane-Pfad verifiziert;
- provider-spezifischer Bypass nachweislich verweigert;
- vollständige Audit-Korrelation verifiziert;
- Rollback auf Read-only verifiziert;
- externe Host-/Connector-Konfiguration durch deren zuständige Plattform verifiziert.

Read-only- und Development-Profile ohne mutierende Capability sind für einen privilegierten Cutover `NOT_APPLICABLE`. Eine Modell- oder Providerbezeichnung erzeugt niemals Ausführungsberechtigung.
