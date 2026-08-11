# AI Agent Provider Profile Contract

Each provider profile declares: provider/product, plane, allowed capabilities, authentication source, tool transports, sandbox boundary, telemetry integration, data-retention constraints, prohibited capabilities and kill-switch procedure.

Profiles:
- ChatGPT: Research + controlled Execution; MCP/Apps/connectors; capability policy external to model.
- Claude Code: controlled Execution; permission modes/allowed tools/MCP; bypass-permissions prohibited for production.
- Google AI Studio/Gemini: Development/Prototype; function calls executed by application; managed sandbox allowed only as isolated execution.
- NotebookLM: Research & Evidence only; source-grounded, no mutation tools.

New providers require a profile before use; no new ADR is needed unless trust boundaries or capabilities change.