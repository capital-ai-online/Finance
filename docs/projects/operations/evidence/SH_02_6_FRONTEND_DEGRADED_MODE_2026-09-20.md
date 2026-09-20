# SH-02.6 Frontend Degraded Mode & Version-Skew Recovery — 2026-09-20

**Project:** `CAPITAL-AI-OPS`  
**Work package:** `OPS-08-B-SH-02 / SH-02.6`  
**Frontend participation:** `CAPITAL-AI-FE` cross-cutting presentation/recovery only  
**Baseline:** `main@10dd68d1c448a71f681da78b76329d960d7a9279`  
**Branch:** `agent/operations-sh02-6-frontend-degraded-mode-v2-20260920`  
**Status:** `IMPLEMENTED_BRANCH / VALIDATION_PENDING`

## 1. Goal

Provide bounded frontend recovery without creating a second frontend, auth, data, scoring, deployment or observability control plane.

The slice implements:

1. safe read retry for `GET`/`HEAD` only;
2. bounded exponential backoff with jitter;
3. event-driven online/offline/degraded-state feedback;
4. session-local deployment identity correlation using existing `x-capital-ai-*` headers;
5. one reload per observed deployment transition;
6. feature-local render recovery/remount;
7. deny-by-default Last-Known-Good storage requiring explicit bounded stale-data opt-in.

## 2. Safety boundaries

- Mutation methods (`POST`, `PUT`, `PATCH`, `DELETE`) are never generically retried.
- Authentication/authorization responses such as 401/403 are not treated as transient network failures.
- No financial or scoring source is opted into Last-Known-Good by this slice.
- `allowStale=false` returns `DENIED`; stale data cannot be inferred from cache presence.
- Deployment skew is observed from the existing same-origin `/healthz` response headers.
- The client does not mutate Render, Release or GitHub state.
- Recovery clears no Supabase/auth persistent storage and performs no global `localStorage.clear()`.
- A deployment transition updates only session-local reliability identity before the one-shot reload, preventing reload loops.
- Feature render recovery remounts only the affected subtree.

## 3. Event model

The global reliability boundary performs no timer polling. It probes on:

- initial mount;
- browser `online`;
- browser window focus;
- document transition back to `visible`.

`offline` immediately projects the offline state without a network request.

## 4. User-visible degraded states

The global shell exposes accessible `role=status` / `aria-live=polite` feedback for:

- `OFFLINE`;
- `DEGRADED`;
- `VERSION_SKEW` after automatic reload budget exhaustion.

The public analysis preview and each active public analysis tool use the shared feature recovery boundary. A render defect therefore does not need to destroy the whole application session.

## 5. Validation targets

Focused repository tests must prove:

- GET/HEAD are the only generic retryable methods;
- POST is attempted exactly once even on a retryable status;
- 401 is not retried;
- retry delay stays bounded;
- LKG is denied without source opt-in and expires after `maxAgeMs`;
- missing immutable deployment commit evidence fails closed;
- one deployment transition consumes at most one automatic reload budget;
- App composition uses the global reliability boundary;
- no interval polling or auth/localStorage reset is introduced;
- public preview and public tool rendering use the reusable feature-local boundary.

No validation result is represented as PASS before CI executes on the final PR head.
