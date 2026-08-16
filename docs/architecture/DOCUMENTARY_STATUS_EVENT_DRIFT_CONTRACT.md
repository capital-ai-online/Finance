# Documentary Status-Event-Drift Contract

**Status:** ACCEPTED  
**Date:** 2026-08-15 (Phase B/C: 2026-08-16)  
**Authority:** ESS-0010 Documentary Engine, ESS-0004 Enterprise Version Manager  
**Related:** ADR-0014 (Documentation Governance Validator, read-only), ADR-0020 (Repository Convention Validator, read-only), ESS-0011 Traceability, ESS-0012 Documentation Governance  
**Roadmap context:** DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP (D1/D3/D7/H1 line)  
**Phase:** A complete (PR #346). B complete (PR #358). C implemented (controlled updater + first hygiene Draft-PR).

## 1. Problem statement (observed drift)

Recurring pattern in the repository:

- Runbook headers remain on values such as `Status: PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH` (or equivalent `OWNER ACTION REQUIRED`, `HUMAN APPROVAL REQUIRED`).
- The same document already contains an **Apply-Evidenz** (or equivalent evidence) section documenting successful apply, timestamps, and verification results.
- Work claims under `.ai/work-claims/*.json` are set to `status: "applied"` with populated `externalMutations[]`.
- Status/Handoff docs and roadmap tables are sometimes updated manually to `applied` / `VERIFIED`, while the runbook header lags.

Canonical example (Phase B detection; Phase C hygiene applied on Draft-PR):

| Artifact | Observed (pre Phase C) |
| --- | --- |
| `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md` | Header was `PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH` |
| Same file, section `## Apply-Evidenz` | Executed 2026-08-15; steps marked success; ledger verification complete |
| `.ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json` | `"status": "applied"`, `externalMutations` lists mutations |

After Phase C controlled update (Draft-PR only): header → `VERIFIED PASS`. Apply-Evidenz body unchanged.

## 2. Scope (inventory paths)

In-scope paths for discovery, detection, and **header-only** updates:

| Area | Paths |
| --- | --- |
| Runbooks | `docs/runbooks/**` |
| Work claims | `.ai/work-claims/*.json` (read for detection; not rewritten by Phase C updater) |
| SEO / status / handoff | `docs/seo/**` |
| Evidence (status headers only) | `docs/evidence/**` |
| Architecture status docs | `docs/architecture/**` (header pattern only) |

Out of scope unchanged: Supabase/Render/Stripe mutations, ADR auto-numbering, second CI gate, rewriting historical Apply-Evidenz bodies, global auth/billing/deploy config in the same change as status headers.

## 3–5. Taxonomy, sources of truth, drift rule

Unchanged from Phase A/B. Detector remains the sole machine recommendation source for Phase C proposals.

## 6. Detector (Phase B, read-only) — complete

| Item | Path |
| --- | --- |
| Types | `src/platform/Documentary/Discovery/StatusEventEvidence.ts` |
| Detector | `src/platform/Documentary/Discovery/StatusEventDriftDetector.ts` |
| Tests | `tests/unit/statusEventDriftDetector.test.ts` |
| Detector version | `0.1.0-phase-b` |

Successful merge remains an optional **trigger annotation** only.

## 7. Controlled updater (Phase C) — implemented

| Item | Path |
| --- | --- |
| Updater | `src/platform/Documentary/Discovery/StatusEventDriftUpdater.ts` |
| Tests | `tests/unit/statusEventDriftUpdater.test.ts` |
| Updater version | `0.1.0-phase-c` |

### Rules

- Proposals only from Phase B findings with `drift: true`, `conflict: false`, and non-null `recommendedHeaderStatus`.
- Path allowlist: `docs/runbooks/`, `docs/seo/`, `docs/evidence/`, `docs/architecture/`.
- **dryRun defaults to true** (no filesystem write).
- Write mode (`dryRun: false`) is for preparing a **Draft-PR** working tree only — never silent write to `main`, never auto-merge.
- Header line only; Apply-Evidenz body is never rewritten.
- Fail-closed on missing file, missing recommendation, or path outside allowlist.

### First controlled hygiene case

- Document: `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`
- Change: `PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH` → `VERIFIED PASS`
- Provenance: claim `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15` + Apply-Evidenz 2026-08-15

## 8. Authority and non-goals

Hard boundaries unchanged: no second EventMesh/Traceability/Version-Manager implementation; no automatic mutation of protected contracts/APIs/DB/ENV/Stripe/Supabase/Render; existing CI budget and PR-contract rules remain binding.

## 9. Phase status

| Phase | Status |
| --- | --- |
| A — Contract | Done (PR #346) |
| B — Read-only detector + tests | Done (PR #358) |
| C — Controlled updater + first header hygiene | Implemented on `feat/status-event-drift-updater-phase-c` |

## 10. Handoff note

| Automated | Remains Owner/manual |
| --- | --- |
| Detect drift + recommend class | Merge of Draft-PR |
| Propose/apply header in working tree (`dryRun: false`) | Opening further Draft-PRs for additional drift docs |
| Path allowlist + fail-closed | Business decision on open migrations |

---

**Document class:** Architecture / Contract  
**Owner:** SvenKulessa
