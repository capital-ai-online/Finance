# Phase 3.3 verification intent

The executable contract test in `analysisRouteExtraction.contract.test.ts` locks the provider-specific invariants of the extracted AI-analysis route factories. The later compatibility cutover must preserve these contracts and must not move startup, Stripe ingress, runtime-secret validation or scoring semantics into the AI route modules.
