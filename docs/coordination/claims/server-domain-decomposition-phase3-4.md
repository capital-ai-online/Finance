# Work claim — server domain decomposition phase 3.4

Status: active
Owner: ChatGPT architecture workstream
Base: main @ 2ffc307a0405a872665718c244c9cd990a69549a

Exclusive scope:
- `server/routes/alphaVantageRoutes.ts`
- market-data adapter extraction documents/tests created by this workstream

Protected / do not modify in this PR:
- `server.application.ts`
- `server/validateRuntimeSecrets.ts`
- `server/stripe.ts`
- `server/runtime/**`
- `Dockerfile`
- `render.yaml`
- `src/services/*Scoring*`
- R-001/R-002/R-003 governance artifacts

Purpose: prepare provider-facing HTTP adapters before a separately gated shared-file cutover.
