# CAPITAL-AI API QA Report

**Status:** INITIAL AUDIT SEED  
**Governance:** ESS-0015  
**Snapshot:** 2026-08-03

## 1. Scope

Initialer QA-Seed aus aktuellem GitHub-Repository und produktiver Supabase-Instanz. Dieser Bericht ist noch keine vollständige Provider-Freigabe; er definiert priorisierte Findings und die Tests, die vor der neuen FinTech-API-Architekturentscheidung abgeschlossen werden müssen.

## 2. Supabase Live Findings

### QA-SUPA-001 — Edge Functions ohne JWT-Verifikation

Produktiv aktiv:

- `stripe-setup` v3 — `verify_jwt=false`
- `stripe-webhook` v4 — `verify_jwt=false`
- `stripe-worker` v3 — `verify_jwt=false`

**Bewertung:** REVIEW REQUIRED. `verify_jwt=false` ist für Webhooks nicht per se unsicher, wenn die Funktion eine starke alternative Authentizitätsprüfung (z. B. Stripe-Signatur) implementiert. Für `stripe-setup` und `stripe-worker` muss der konkrete alternative Schutz ebenfalls codebasiert nachgewiesen werden.

**Required tests:** unsigned request, invalid signature/token, replay, malformed payload, privilege boundary, idempotency.

### QA-SUPA-002 — `screening_slo_evidence` RLS ohne Policy

Security Advisor meldet `rls_enabled_no_policy` für `public.screening_slo_evidence`.

**Bewertung:** INFO / intentionality must be proven. Wenn die Tabelle bewusst service-role-only und fail-closed ist, muss dies im Inventory als Access Contract dokumentiert und per negativer anon/authenticated-Abfrage getestet werden.

Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

### QA-SUPA-003 — Leaked Password Protection

Security Advisor meldet `auth_leaked_password_protection` als WARN.

**Bewertung:** bestehende plan-/risk-acceptance-relevante Abweichung; nicht Teil der FinTech-Datenproviderentscheidung, aber als Plattform-API-Risiko im Inventory zu führen.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### QA-SUPA-004 — RLS Performance / InitPlan

Performance Advisor meldet mehrere Policies, die `auth.<function>()` bzw. `current_setting()` zeilenweise neu evaluieren, u. a. bei `subscriptions`, `profiles`, IAM-/Security-/Quota-/Compliance-Tabellen.

**Bewertung:** PERFORMANCE DEBT. Vor hoher API-Last sollen Policies auf `(select auth.<function>())`-Muster geprüft werden, ohne Semantik oder Authorization zu schwächen.

Reference: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan

### QA-SUPA-005 — Unindexed Foreign Keys

Advisor meldet fehlende Covering Indexes u. a. für `audit_logs_iam.actor_user_id`, `audit_logs_iam.target_user_id`, `security_events.actor_user_id`.

**Bewertung:** INFO / scalability review.

Reference: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

## 3. FinTech Market Data QA Priorities

### Binance

- Contract: 24h ticker + klines schema
- symbol allowlist / normalization
- timeout / 429 / 5xx
- stale timestamp detection
- no fabricated fallback values
- compare selected symbols against second provider snapshots
- latency p50/p95

### CoinGecko

- snapshot/history consistency
- freshness labels
- rate-limit behavior
- consensus interaction with alternate sources

### FMP

- index symbol mapping accuracy
- quote/history freshness
- entitlement/plan failure behavior
- missing-symbol handling

### Alpha Vantage

- fundamentals freshness
- provider rate-limit and throttling
- schema drift / null fields
- overlap with FMP/Alpaca candidates

### Alpaca candidate

No active code integration was located in the current repository snapshot. Therefore Alpaca remains `EVALUATE`, irrespective of whether a production secret has already been provisioned. Before activation, QA must establish exact product (Market Data API vs Trading API), scopes, feed entitlement, asset coverage, rate limits, data timestamps, cost and fallback semantics.

## 4. AI Provider QA

For Anthropic/OpenAI/Gemini routing:

- prove actual fallback order and provider attribution
- schema-equivalence tests for structured outputs
- no silent semantic downgrade
- token/cost ledger
- timeout/rate-limit behavior
- prompt/version attribution
- AI output must not overwrite market provenance

## 5. Payment/API QA

Stripe Render backend and Supabase Stripe Edge Functions must be tested as one end-to-end topology:

- identify canonical webhook ingestion path
- prove event idempotency across all active paths
- invalid-signature rejection
- duplicate event replay
- checkout metadata/user-id integrity
- subscription state consistency between Stripe and Supabase
- no billing mutation from unauthenticated public endpoints

## 6. Required automated test suites

Target structure:

- `tests/api/contracts/`
- `tests/api/auth/`
- `tests/api/failure/`
- `tests/api/market-data/`
- `tests/api/webhooks/`
- `tests/api/security/`
- `tests/api/performance/`

Every production interface must have at least one contract test and one negative/failure-path test before `qa_status=PASS`.

## 7. Decision readiness

Current status: **NOT DECISION READY**.

The next provider architecture ADR must not be accepted until the ESS-0015 inventory reaches full production coverage and all FinTech market-data interfaces have measured QA results.
