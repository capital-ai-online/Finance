# Literature envelope (not a substitute for measured runs)

Values below are published ranges as of 2026-09. They bound expectations. They are not Capital-AI production SLOs.

| System | Access | p50 | p95 | p99 | Publish path | Memory | Disconnect recovery | 10k subscribers |
|---|---|---|---|---|---|---|---|---|
| Redis OSS 7/8 pub/sub | local / same-AZ TCP | 0.3–1.0 ms | 0.8–3 ms | 1–5 ms typical | in-process PUBLISH | ~60 MB idle + per-connection buffers | reconnect + resubscribe; messages during gap are lost | possible on dedicated node |
| Valkey 8.1 (Render engine) | local / same-AZ TCP | 0.3–1.0 ms | often tighter than Redis OSS | published ~22% lower p99 vs Redis OSS in cache benches | same RESP pub/sub | ~20% less memory than Redis OSS on large keysets | same as Redis | Render plan must expose ≥10k connections |
| Render Valkey | managed TCP | 1–3 ms same-region | 3–8 ms | 5–15 ms under contention | engine plus Render network | plan RAM cap | reconnect + resubscribe; free plan wipes data on restart | plan-gated |
| Upstash Redis | REST for KV; TCP for pub/sub | 1–3 ms | 3–8 ms | 5–15 ms | HTTPS adds ms vs in-VPC TCP | serverless | idle TCP may be evicted | 10k TCP ceiling; REST cannot hold 10k subscribers |
| NATS core 2.x | TCP 4222 | 0.21–0.8 ms local | <3 ms moderate | <10 ms until saturation | fire-and-forget PUB | few MB idle | reconnect + resubscribe; JetStream optional for replay | designed for this scale |

## Decision notes

1. 10k live subscribers on Render Valkey is a plan decision, not an engine decision.
2. Upstash is the wrong default for 10k persistent subscribers.
3. NATS is the only candidate here whose published design center is 10k+ connections with sub-ms local p50.
4. Redis/Valkey pub/sub drops messages during disconnect. Replay needs Streams or an external log.
