# Evidence — isolated pub/sub broker benchmark

**Claim:** `CAPITAL-AI-OPS-PUBSUB-BROKER-BENCHMARK-20260925`  
**Base:** `capital-ai-online/Finance@2a2244bd55bef6a88d892ec17c8ecc20b037e22f`  
**Runtime impact:** none. Folder is not imported by `server.ts`, Vite or `render.yaml`.

## Added

`benchmarks/pubsub-broker-2026/` contains isolated Compose networks for Redis 7.4, Valkey 8.1 and NATS 2.15, a raw-TCP harness for p50/p95/p99, publish latency, memory and disconnect recovery, profiles 100 / 1 000 / 10 000, and remote adapters for `UPSTASH_REDIS_URL` / `RENDER_VALKEY_URL`.

## Not done (fail-closed)

- No production Render Key Value instance was created from this change.
- No Upstash database was created from this change.
- No 10k-subscriber run was executed in the agent sandbox (2 vCPU / 1.9 GiB).
- No change to production `render.yaml`.

## Render future-load conclusion

Current Render Free/Starter/Standard cannot carry 10k subscribers (limits 50 / 250 / 1 000). Minimum accepting plan is Pro Plus `10g` (exactly 10 000 connections). Recommended is Pro Max `20g` for reconnect headroom.

## Next owner-verifiable step

Provision a dedicated non-production Render Key Value instance, export `RENDER_VALKEY_URL`, run `node src/run.mjs --profile mid` then `--profile future` on a host with ≥8 GB RAM, and commit only the resulting JSON under `results/`.
