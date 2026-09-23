# OPS-RENDER-MCP-AI-DEBUG-01 — Hosted Render MCP build debugging

**Project:** `CAPITAL-AI-OPS`  
**Owner:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02` — Controlled Implementation  
**Supporting PVC:** `PVC-08` — Production Operations  
**Activated by:** fresh Human Owner direction on 2026-09-24  
**Baseline:** `main@72a22038c88d3cc170cbecac6d04547d7226853d`  
**Status:** `OWNER-DIRECTED / IMPLEMENTATION_CANDIDATE / HOST_AUTHORIZATION_PENDING`

## Outcome

Make the official hosted Render MCP endpoint available to repository-aware Claude Code and Cursor sessions for natural-language build/deploy diagnosis while keeping credentials out of Git and preserving existing production-mutation gates.

## Scope

Included:
- project-scoped Claude Code remote MCP declaration in `.mcp.json`;
- project-scoped Cursor remote MCP declaration in `.cursor/mcp.json`;
- secret-free configuration tests;
- troubleshooting runbook and cost/security boundary;
- correction of the stale `CLAUDE.md` authority wording in the existing Render MCP fallback client;
- release of the touched superseded GA4 MCP work claim.

Excluded:
- installing Render plugins or remote skills;
- committing API keys/tokens;
- changing Render environment variables;
- triggering deploys;
- changing billing/workspace plan;
- creating a second MCP server or production control plane.

## Dependencies and risks

- Render OAuth is a Human execution-host action and cannot be proven from repository state.
- Render MCP exposes both read and mutating tools. Repository configuration alone cannot prove live host tool-grant/session isolation.
- The existing Security F04 external-host evidence gap therefore remains open until real host AuthN/AuthZ/tool-permission readback exists.
- Provider pricing can change; the observed no-separate-MCP-surcharge state is evidence dated 2026-09-24, not a permanent contract.

## Acceptance criteria

1. Exact hosted endpoint `https://mcp.render.com/mcp` is shared with Claude Code and Cursor using their native project configuration formats.
2. No Render secret, API key, Authorization header or OAuth token is committed.
3. Existing Google MCP configuration stays byte-semantically unchanged except for the additive Render entry.
4. Focused configuration tests prove endpoint identity and secret absence.
5. Existing Anthropic API fallback points to `/AGENTS.md@CURRENT_MAIN`, not `CLAUDE.md`.
6. PR exact-head checks pass without weakening Governance, Security or deployment controls.
7. Human/CODEOWNER merge remains required.
8. Post-merge host OAuth/readback proves the intended workspace/service can be read before external-host assurance is marked complete.

## Exit gate

`REPOSITORY_READY` requires merged exact-head evidence.  
`HOST_ASSURANCE_COMPLETE` additionally requires Human OAuth plus read-only Render MCP readback in the intended AI host.
