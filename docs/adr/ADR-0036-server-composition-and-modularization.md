# ADR-0036 — Server Composition and Modularization

- **Status:** Accepted
- **Scope:** CAPITAL-AI backend composition
- **Decision type:** Structural / maintainability / operational safety

## Context

The root `server.ts` accumulated application composition, infrastructure configuration, domain routes, market-data aggregation, scoring, AI provider usage, frontend serving, background jobs and startup diagnostics. This created a high-change, high-coupling module with more than two thousand lines and increased regression risk.

## Decision

Adopt a modular Express composition architecture in which the root `server.ts` is only the composition root. Route families, services, middleware, security configuration and lifecycle behavior are separated by responsibility.

AI-dependent route modules receive provider instances through dependency injection. Market-data aggregation is isolated as a service so HTTP routing and background refresh use one implementation.

## Consequences

### Positive

- Smaller change surface in the application entry point.
- Clearer ownership and dependency boundaries.
- Easier unit/integration testing.
- Reduced accidental coupling between billing, IAM, scoring and market-data concerns.
- Provider-specific and domain-specific future refactors can be performed independently.

### Trade-offs

- More source files and explicit imports.
- Integration tests become important to ensure route registration order remains stable.
- Market-data service remains intentionally broad until provider-level tests are available.

## Guardrails

- Do not move Stripe raw-body webhook parsing behind `express.json()`.
- Do not weaken IAM, TOTP step-up, quota or rate-limit middleware while extracting routes.
- Do not introduce demo/generated market values to replace unavailable live data.
- Do not put API secrets in route modules or frontend code.
- Maintain Documentary/ADR traceability for subsequent architecture moves.

## Verification

The refactor must pass TypeScript parsing/type checking in the complete repository, existing route tests, billing webhook tests, IAM tests and production build before merge.
