# CAPITAL-AI-DATA — DATA-14 Provider Input Validation Slice

**Date:** `2026-09-07`  
**Project:** `CAPITAL-AI-DATA`  
**Project stage:** `PVC-09`  
**DATA status:** `PROVIDER_INPUT_SLICE_IMPLEMENTED`  
**main SHA at branch creation:** `d423da75e5f43b423d39abd3c4dffbfa0da8a2a5`  
**Work branch:** `agent/data-14-provider-input-20260907`

## Scope

Canonical gate `provider-input-validation/1.0.0` inspects inbound snapshot/history payloads before evidence promotion:

- provider identity
- asset/symbol binding and known asset class
- correlation identity
- evidence reference
- ISO timestamps
- positive finite numerics / history points

Malformed or ambiguous input is `NON_ADMISSIBLE`. The gate does not synthesize a zero/default payload.

## Residual

Per-provider schema adapters (Alpaca/CoinGecko raw HTTP bodies) remain backlog. This slice validates the canonical inbound envelope, not every vendor JSON dialect.
