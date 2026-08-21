# VW-4 — Delivery Adapters

**Status:** IMPLEMENTED ON BRANCH / PENDING HUMAN MERGE  
**Authority:** `ESS-0017`

## Scope

- expose read-only catalog consumers for React, PDF, E-Mail, SEO and Accessibility;
- allow `shared` messages on all surfaces;
- fail closed on context mismatch, retired messages and missing declared placeholder values;
- add no new localization/runtime dependency;
- do not migrate existing hardcoded UI strings yet.

## Implementation

- `src/platform/Vocabulary/Delivery/MessageDeliveryAdapter.ts`
- `src/platform/Vocabulary/Delivery/createMessageDeliveryAdapters.ts`

## Acceptance

- [x] five delivery surfaces
- [x] context isolation
- [x] deterministic declared-placeholder interpolation
- [x] no financial/legal/security authorization through wording
- [x] focused unit tests
