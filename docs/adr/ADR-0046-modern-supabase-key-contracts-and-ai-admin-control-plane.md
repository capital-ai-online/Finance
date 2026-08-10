# ADR-0046 — Modern Supabase Key Contracts and AI Admin Control Plane

Status: PROPOSED / IMPLEMENTATION IN PROGRESS
Date: 2026-08-10

## Context

CAPITAL-AI historically accepted legacy Supabase JWT keys (`anon`, `service_role`) alongside modern publishable/secret keys. Supabase recommends modern `sb_publishable_*` and `sb_secret_*` keys for independent rotation and clearer privilege separation. CAPITAL-AI also requires AI-assisted system administration, diagnostics, evidence collection, reporting and controlled production mutations without granting unrestricted standing privilege to every agent.

## Decision

### Canonical Supabase key contract

Production clients SHALL use the following canonical variables:

- `SUPABASE_URL` — server project URL.
- `VITE_SUPABASE_URL` — build-time browser project URL.
- `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` — modern public client credential (`sb_publishable_*`).
- `SUPABASE_SECRET_KEY` — modern backend-only privileged credential (`sb_secret_*`).

Legacy `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are compatibility-only during migration and MUST NOT be introduced into new runtime consumers.

`SUPABASE_SECRET_KEY` MUST never be exposed through Vite, logs, diagnostics, API responses, client bundles, PR bodies or Documentary artifacts.

### Privilege planes

CAPITAL-AI separates five execution planes:

1. **Observe** — read-only health, logs, metrics, advisors, schema metadata and deployment state.
2. **Diagnose** — read-only queries and correlation across GitHub, Render, Supabase, Stripe and market-data providers.
3. **Operate** — bounded reversible mutations such as restart/redeploy, queue retry, cache invalidation or controlled configuration change.
4. **Administer** — privileged schema/configuration/credential changes guarded by IAM, step-up authentication and audit evidence.
5. **Break Glass** — time-limited emergency privilege with explicit owner authorization, reason, TTL and post-incident review.

No AI agent receives a raw long-lived secret merely because it can perform an administrative task. Tools/connectors SHALL hold credentials and enforce capability boundaries where possible.

### Service identities

System-to-system operations SHALL use purpose-specific service identities rather than a shared owner identity. At minimum:

- `capital-ai-web-runtime` — application runtime, minimum required server DB access.
- `capital-ai-ci-release` — repository/release validation and deployment evidence.
- `capital-ai-diagnostics` — read-only diagnostics and reporting.
- `capital-ai-db-migrator` — migration-only privileged role/service identity.
- `capital-ai-billing-processor` — Stripe/Supabase billing side effects.
- `capital-ai-break-glass` — emergency identity, disabled by default.

Supabase secret keys are infrastructure credentials, not user IAM roles. Application authorization remains session/JWT + IAM-role + step-up based.

## Mutation policy

Every production mutation must carry:

- authenticated principal/service identity;
- target environment/resource;
- capability/action;
- reason/change ticket or work item;
- precondition evidence;
- idempotency key where applicable;
- expected blast radius;
- rollback strategy;
- result and postcondition evidence;
- correlation/audit ID.

High-risk mutations require owner/step-up authorization. Read-only diagnostics do not require the same mutation approval but remain auditable.

## Migration sequence

1. Set modern publishable keys in Render/build environment.
2. Provision a modern Supabase `sb_secret_*` key in the project API-key control plane.
3. Store it only as `SUPABASE_SECRET_KEY` in the Render secret-file/runtime secret contract.
4. Deploy and validate privileged and RLS-bound paths independently.
5. Add CI/readiness checks that reject new legacy-key consumers.
6. Remove runtime fallback to `SUPABASE_SERVICE_ROLE_KEY` and `*_ANON_KEY` after production evidence confirms the modern contract.
7. Disable/revoke legacy keys only after all consumers are proven migrated.

## Consequences

Benefits: independent rotation, clearer privilege separation, reduced accidental browser exposure, auditable AI operations and narrower blast radius.

Tradeoffs: temporary dual-key compatibility during migration and additional IAM/control-plane complexity.

## Acceptance criteria

- Browser bundle uses only `sb_publishable_*`.
- Privileged server path uses only `SUPABASE_SECRET_KEY` (`sb_secret_*`).
- No production consumer requires legacy `anon`/`service_role` keys.
- Diagnostics can operate read-only without privileged mutation credentials.
- All privileged mutations are capability-scoped and auditable.
- Break-glass is disabled by default and requires explicit owner approval/step-up.
