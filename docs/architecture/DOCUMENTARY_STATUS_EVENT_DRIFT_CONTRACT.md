# Documentary Status-Event-Drift Contract

**Status:** ACCEPTED  
**Date:** 2026-08-15 (Phase B: 2026-08-16)  
**Authority:** ESS-0010 Documentary Engine, ESS-0004 Enterprise Version Manager  
**Related:** ADR-0014 (Documentation Governance Validator, read-only), ADR-0020 (Repository Convention Validator, read-only), ESS-0011 Traceability, ESS-0012 Documentation Governance  
**Roadmap context:** DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP (D1/D3/D7/H1 line)  
**Phase:** A complete (PR #346). B implemented (read-only detector). C gated.

## 1. Problem statement (observed drift)

Recurring pattern in the repository:

- Runbook headers remain on values such as `Status: PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH` (or equivalent `OWNER ACTION REQUIRED`, `HUMAN APPROVAL REQUIRED`).
- The same document already contains an **Apply-Evidenz** (or equivalent evidence) section documenting successful apply, timestamps, and verification results.
- Work claims under `.ai/work-claims/*.json` are set to `status: "applied"` with populated `externalMutations[]`.
- Status/Handoff docs and roadmap tables are sometimes updated manually to `applied` / `VERIFIED`, while the runbook header lags.

Canonical example (must be detectable in Phase B):

| Artifact | Observed |
| --- | --- |
| `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md` | Header: `Status: PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH` |
| Same file, section `## Apply-Evidenz` | Executed 2026-08-15; steps marked success; ledger verification complete |
| `.ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json` | `"status": "applied"`, `externalMutations` lists the two Supabase mutations |

This is documentation/status hygiene drift, not a second authority problem. Documentary remains the document/evidence layer; Version Manager remains the version/convention layer. No parallel EventMesh, Traceability, or Version-Manager implementation is introduced.

## 2. Scope (inventory paths)

In-scope paths for discovery and detection:

| Area | Paths |
| --- | --- |
| Runbooks | `docs/runbooks/**` |
| Work claims | `.ai/work-claims/*.json` |
| SEO / status / handoff | `docs/seo/**` (status and handoff docs) |
| Evidence (status headers only) | `docs/evidence/**` where a top-level `Status:` header is used |
| Roadmap tables | Status cells in `docs/roadmaps/**` and related tables that reference claim/runbook state (read-only correlation) |
| Architecture status docs | Selected docs under `docs/architecture/` that carry the same header pattern (e.g. Documentary D* notes) |

Out of scope for this contract (explicit):

- Applying or reversing Supabase / Render / Stripe mutations.
- Automatic ADR numbering.
- SEO store code or further SEO migrations beyond status hygiene of existing docs.
- Second CI pipeline or deployment gate solely for status hygiene.
- Rewriting historical evidence content (evidence sections stay as written; only header/status fields are candidates for later controlled update).
- Global auth/billing/deploy configuration files in the same PR as status updates.

Shared-zone lease for any later write path: Documentary, VersionManager, Runbook/Claim/Status paths and the docs named in this contract only.

## 3. Status taxonomy (canonical classes)

Statuses are classified into ordered lifecycle classes. Extraction is pattern-based (header line or claim field), not free-text NLP interpretation.

### 3.1 Header / document status values (examples, not exhaustive)

| Class | Typical header / marker values |
| --- | --- |
| **PRE_MUTATION** | `PRE-MUTATION`, `OWNER-FREIGABE ERFORDERLICH`, `OWNER ACTION REQUIRED`, `HUMAN APPROVAL REQUIRED`, `NO PRODUCTION MUTATION AUTHORIZED`, `PLANNED — NO PRODUCTION MUTATION AUTHORIZED` |
| **IN_PROGRESS** | `IN PROGRESS`, `IMPLEMENTED / … PENDING`, `IMPLEMENTED / PR+CI+POST-MERGE PROBE PENDING`, `IMPLEMENTED / CI + EXECUTION-HOST BINDING PENDING`, `SA2 IMPLEMENTATION / LIVE MUTATION BLOCKED …` |
| **APPLIED** | `APPLIED`, evidence of successful apply without full verification closure |
| **VERIFIED** | `VERIFIED PASS`, `VERIFIED`, `COMPLETE / VERIFIED PASS`, `**VERIFIED PASS**` |
| **SUPERSEDED** | `SUPERSEDED` |
| **ARCHIVED** | `ARCHIVED` |
| **OTHER / DESIGN** | `DESIGN ONLY`, `PROPOSED`, `ACTIVE`, `PLANNED`, roadmap-level states without mutation claim |

Normalization rule: map observed header string to the nearest class above. Prefer exact token match; fail closed (do not invent a class) when ambiguous.

### 3.2 Work-claim status values

Primary field: JSON `status` on `.ai/work-claims/*.json`.

Phase B detector treats:

- `status === "applied"` **and** non-empty `externalMutations[]` as strong evidence that PRE_MUTATION header is no longer valid.
- Claim without `applied` or without mutation evidence does **not** force a header upgrade.

### 3.3 Evidence-section signals

Runbook section titles (or equivalent):

- `## Apply-Evidenz` / `## Apply Evidence` / similar localized headings.
- Tables or bullets that record step results with success indicators (`success: true`, `VERIFIED`, commit/apply timestamps, verification queries that passed).

## 4. Sources of truth (priority order)

| Priority | Source | Role |
| --- | --- | --- |
| 1 | Work-claim `status` + `externalMutations[]` (when claimId is linked from the document) | Machine-readable lifecycle |
| 2 | Runbook **Apply-Evidenz** (or equivalent) section with documented success + timestamp | Documented mutation outcome |
| 3 | Optional read-only ledger / schema evidence (e.g. via existing evidence notes only) | Corroboration; never the sole writer trigger |
| 4 | Document header `Status:` line | Current displayed state (subject of drift check) |

Rules:

- If claim is `applied` **and** Apply-Evidenz documents success, the header **must not** remain in class **PRE_MUTATION**.
- Recommended header class is then at least **APPLIED**, and **VERIFIED** if evidence explicitly records verification pass.
- Conflicting sources → fail-closed recommendation path.
- Missing claim linkage or missing Apply-Evidenz → no forced upgrade recommendation.

## 5. Drift rule (normative)

**Drift exists** when:

1. Document header class is **PRE_MUTATION**, **and**
2. Linked work claim has `status: "applied"` **and** non-empty `externalMutations[]`, **and/or**
3. The same document contains a completed Apply-Evidenz section documenting successful apply and verification.

**Minimum required case for Phase B tests:**

- Path: `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`
- Must yield `drift: true`
- `headerClass` = `PRE_MUTATION`
- `recommendedHeaderStatus` in {APPLIED, VERIFIED} (prefer VERIFIED when verification rows are present)

## 6. Detector (Phase B, read-only) — implemented

| Item | Path |
| --- | --- |
| Types | `src/platform/Documentary/Discovery/StatusEventEvidence.ts` |
| Detector | `src/platform/Documentary/Discovery/StatusEventDriftDetector.ts` |
| Tests | `tests/unit/statusEventDriftDetector.test.ts` |
| Detector version | `0.1.0-phase-b` |

### 6.1 Merge as trigger (not as writer)

A **successful merge** is an optional **trigger context** for running the detector (`detectStatusEventDriftAfterMerge` / `mergeTrigger.mergeSucceeded`).

- Annotates findings and the report with PR number / merge commit / `mergedAt` when provided.
- Does **not** write headers, claims, or status fields.
- Does **not** auto-merge or open PRs.
- Status updates remain Phase C (owner-gated Draft-PR only).

### 6.2 Output shape

See `StatusEventDriftFinding` / `StatusEventDriftReport`. Detector is read-only. Integration: Documentary Discovery/Governance input (D1 / D7 / H1). Version Manager only for convention/version aspects if needed (no second platform version authority).

## 7. Controlled updater (Phase C — gated)

Only after:

1. Phase B detector merged and verified, and
2. Explicit Owner freigabe for Phase C,

the updater may propose header status changes via **Draft-PR** with provenance. Never silent write to `main`. Fail-closed on missing or conflicting evidence.

## 8. Authority and non-goals

Hard boundaries unchanged: no second EventMesh/Traceability/Version-Manager implementation; no automatic mutation of protected contracts/APIs/DB/ENV/Stripe/Supabase/Render; existing CI budget and PR-contract rules remain binding.

## 9. Phase status

| Phase | Status |
| --- | --- |
| A — Contract | Done (PR #346 merged) |
| B — Read-only detector + tests | Implemented on branch `feat/status-event-drift-detector-phase-b` |
| C — Controlled updater | Blocked until explicit Owner freigabe |

## 10. Handoff note

| Detected (Phase B) | Remains manual / Phase C |
| --- | --- |
| Header vs. claim/Apply-Evidenz drift | Exact final header wording |
| Recommended class when sources agree | Owner decision to open Draft-PR |
| Merge-success as scan trigger annotation | Applying the recommended header write |
| Conflict when sources disagree | Resolving contradictory evidence |

---

**Document class:** Architecture / Contract  
**Owner:** SvenKulessa
