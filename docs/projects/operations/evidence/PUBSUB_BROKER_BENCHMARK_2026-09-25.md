# OPS evidence — pub/sub broker benchmark harness

**Date:** 2026-09-25  
**Project:** CAPITAL-AI-OPS  
**PVC:** PVC-08  
**Runtime impact:** none

Isolated harness lives at `benchmarks/pubsub-broker-2026/`. It does not change the Finance web service, `render.yaml` or production dependencies.

Owner action required before measured 10k-subscriber evidence exists: provision dedicated Render Key Value (recommended `20g`) and optional Upstash TCP URL, then run the future profile off the production runtime host.
