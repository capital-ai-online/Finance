# AI Agent Target Architecture

Baseline: `main@1c3706c4f24e5f5a9fe5b0398a2fcd5bee758b17`

## Target

`Human -> AI Client -> Agent Control Plane -> Capability/Policy -> Tool Adapter -> GitHub/Platform -> Evidence`

Four planes:
1. Research & Evidence: NotebookLM, Deep Research, read-only repository/platform inspection.
2. Agent Execution: ChatGPT/Claude/Gemini managed or local sandboxes performing bounded work.
3. Control: identity, capability, risk, approval, policy, audit, kill switch.
4. Production: protected GitHub main, CI, Render, Supabase, Stripe and runtime.

No model/provider crosses directly from Research/Execution to Production.

## Current-to-target mapping
Existing ESS-0018, ADR-0050/0051 and PolicyGate are retained as foundations. ADR-0056/O1 telemetry is extended, not replaced. GitHub branch/PR/CI remains the software change boundary.