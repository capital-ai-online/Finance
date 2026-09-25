# Pub/Sub Broker Benchmark (isolated)

**Status:** evidence harness only — not mounted into the Capital-AI runtime  
**Owner surface:** `CAPITAL-AI-OPS` / `PVC-08` (capacity + Render future-load)  
**Subject matter:** live fan-out for FinTech event paths  
**Date:** 2026-09-25

Compares four systems **in isolation** (separate compose networks / separate remote endpoints):

| Target | What is measured | How it is installed |
|---|---|---|
| `redis-local` | Redis OSS 7.4 pub/sub | isolated compose service |
| `valkey-local` | Valkey 8.1 engine (Render Key Value engine equivalent) | isolated compose service |
| `nats-local` | NATS 2.15 core pub/sub | isolated compose service |
| `upstash` | Upstash Redis TCP pub/sub | remote only (`UPSTASH_REDIS_URL`) |
| `render-valkey` | Render Key Value (Valkey 8.x) | remote only (`RENDER_VALKEY_URL`) |

Render Valkey and Upstash cannot be installed in this repository. The harness talks to owner-provisioned endpoints. Local Valkey is the engine-equivalent baseline until a Render instance is attached.

## Metrics

- end-to-end delivery latency: p50 / p95 / p99
- publish ACK latency
- broker process memory (local) or reported `used_memory`
- disconnect recovery (drop 10% of subscribers, reconnect, time-to-next-message)
- subscriber fan-out profiles: `100` / `1_000` / `10_000`

## Isolation rules

1. One broker per Docker network. No shared volume, no shared port, no shared process.
2. Only one target is load-tested at a time.
3. Production `render.yaml`, runtime `package.json` and server code are out of scope.
4. Credentials stay in environment variables. Nothing is committed.

## Render future-load gate (10k subscribers)

Redis/Valkey pub/sub needs **one TCP connection per subscriber**.

| Render Key Value plan | RAM | Connection limit | 10k subscribers |
|---|---|---|---|
| Free | 25 MB | 50 | fail |
| Starter `256mb` | 256 MB | 250 | fail |
| Standard `1g` | 1 GB | 1 000 | fail |
| Pro `5g` | 5 GB | 5 000 | fail |
| Pro Plus `10g` | 10 GB | 10 000 | capacity-ok, no headroom |
| Pro Max `20g` | 20 GB | 20 000 | recommended for 10k + reconnect spikes |
| Pro Ultra `40g` | 40 GB | 40 000 | headroom for mixed cache + pub/sub |

Upstash current published TCP ceiling is **10 000 concurrent connections**. REST cannot carry classic pub/sub.

## Run

```bash
cd benchmarks/pubsub-broker-2026
cp .env.example .env

docker compose up -d redis-local valkey-local nats-local

node src/run.mjs --profile smoke --targets redis-local,valkey-local,nats-local
node src/run.mjs --profile mid --targets redis-local,valkey-local,nats-local
node src/run.mjs --profile future --targets valkey-local,nats-local
node src/run.mjs --profile future --targets render-valkey
node src/run.mjs --profile future --targets upstash
```

Results are written to `results/<iso-stamp>-<profile>.json`.
