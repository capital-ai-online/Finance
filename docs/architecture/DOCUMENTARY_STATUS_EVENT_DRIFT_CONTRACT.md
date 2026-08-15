# Documentary Status-Event-Drift Contract (Phase A)

**Status:** DRAFT — OWNER REVIEW REQUIRED  
**Date:** 2026-08-15  
**Authority:** ESS-0010 Documentary Engine, ESS-0004 Enterprise Version Manager  
**Related:** ADR-0014 (Documentation Governance Validator, read-only), ADR-0020 (Repository Convention Validator, read-only), ESS-0011 Traceability, ESS-0012 Documentation Governance  
**Roadmap context:** DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP (D1/D3/D7/H1 line)  
**Phase:** A — Analysis & Contract only. No detector code, no writer, no schema change.

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

In-scope paths for discovery and (later) detection:

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

Observed / expected values include at least: `applied`, and intermediate states used by existing claims (e.g. draft/in-progress). Phase B detector treats:

- `status === "applied"` **and** non-empty `externalMutations[]` (or equivalent documented mutation evidence) as strong evidence that PRE_MUTATION header is no longer valid.
- Claim without `applied` or without mutation evidence does **not** force a header upgrade.

### 3.3 Evidence-section signals

Runbook section titles (or equivalent):

- `## Apply-Evidenz` / `## Apply Evidence` / similar localized headings.
- Tables or bullets that record step results with success indicators (`success: true`, `VERIFIED`, commit/apply timestamps, verification queries that passed).

Presence of a completed Apply-Evidenz block with at least one successful mutation step is a first-class evidence source (see priority below).

## 4. Sources of truth (priority order)

Canonical status for drift evaluation is derived **deterministically** from structured sources, not from free-text interpretation of the body.

| Priority | Source | Role |
| --- | --- | --- |
| 1 | Work-claim `status` + `externalMutations[]` (when claimId is linked from the document) | Machine-readable lifecycle |
| 2 | Runbook **Apply-Evidenz** (or equivalent) section with documented success + timestamp | Documented mutation outcome |
| 3 | Optional read-only ledger / schema evidence (e.g. `supabase_migrations.schema_migrations` via existing evidence notes only) | Corroboration; never the sole writer trigger |
| 4 | Document header `Status:` line | Current displayed state (subject of drift check) |

Rules:

- If claim is `applied` **and** Apply-Evidenz documents success, the header **must not** remain in class **PRE_MUTATION**.
- Recommended header class is then at least **APPLIED**, and **VERIFIED** if evidence explicitly records verification pass (e.g. ledger check, constraint check, or claim DoD marked complete).
- Conflicting sources → fail-closed: report drift with `recommendedHeaderStatus` only when priority-1 and priority-2 agree; otherwise emit finding with `drift: true` and `conflict: true` without auto-recommendation for write.
- Missing claim linkage or missing Apply-Evidenz → no forced upgrade recommendation.

## 5. Drift rule (normative)

**Drift exists** when:

1. Document header class is **PRE_MUTATION** (or equivalent owner-approval-required marker), **and**
2. Linked work claim has `status: "applied"` **and** non-empty `externalMutations[]`, **and/or**
3. The same document contains a completed Apply-Evidenz section documenting successful apply and verification.

**Minimum required case for Phase B tests:**

- Path: `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md`
- Must yield `drift: true`
- `headerStatus` extracts to PRE_MUTATION class
- `evidenceStatus` / claim status extracts to applied / verified-pass class
- `recommendedHeaderStatus` is in {APPLIED, VERIFIED} (prefer VERIFIED when verification rows are present)

Non-drift examples (must not false-positive as upgrade):

- Header PRE_MUTATION and no claim applied and no Apply-Evidenz success → no drift toward APPLIED.
- Header already VERIFIED and claim applied → no drift (or informational only).
- Design-only / PROPOSED documents without mutation claim → outside mutation-drift rule.

## 6. Detector output contract (Phase B, read-only)

Machine-readable findings (JSON), one object per scanned document (or claim pair):

```json
{
  "documentPath": "docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md",
  "headerStatus": "PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH",
  "headerClass": "PRE_MUTATION",
  "evidenceStatus": "APPLIED_WITH_VERIFICATION",
  "claimId": "SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15",
  "claimStatus": "applied",
  "drift": true,
  "conflict": false,
  "recommendedHeaderStatus": "VERIFIED PASS",
  "sourceEvidenceIds": [],
  "evidenceTimestamps": ["2026-08-15"],
  "provenance": {
    "claimPath": ".ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json",
    "evidenceSection": "Apply-Evidenz",
    "detectorVersion": "0.1.0-phase-b",
    "scannedAt": "<ISO-8601>"
  }
}
```

- Detector is **read-only**. No file writes, no PR creation, no claim mutation.
- Integration: Documentary Discovery/Governance input (D1 / D7 / H1 line). Version Manager only if convention/version aspects of the finding are in scope (no second platform version authority).
- Unit/contract tests must cover the SEO-WP-S1 runbook case without requiring write privileges.

## 7. Controlled updater (Phase C — gated)

Only after:

1. Phase B detector merged and verified, and
2. Explicit Owner freigabe for Phase C,

the updater may:

- Propose header status changes aligned with the recommended class from the detector.
- Optionally keep claim/status-doc cross-references consistent.
- Apply changes only via **Draft-PR** with full provenance (claimId, evidence section, timestamp, agent/component id).
- Never write silently to `main`; never auto-merge.
- Fail-closed on missing evidence or conflicting sources.

No auto-rewrite of historical Apply-Evidenz body content.

## 8. Authority and non-goals

| Component | Role in this work |
| --- | --- |
| Documentary (ESS-0010) | Document/evidence layer; host of detector as discovery/governance input |
| Version Manager (ESS-0004) | Version/convention aspects only; no parallel version authority |
| Documentation Governance Validator (ADR-0014 / ESS-0012) | Read-only findings; this contract does not replace GOV rules |
| Naming & Repo Convention Validator (ADR-0020) | Read-only; path/naming conventions remain binding |
| Work claims | Primary structured status source |
| Traceability (ESS-0011) | Correlation via claimId / documentId; no second matrix |

Hard boundaries (non-negotiable):

- No second EventMesh, Traceability, or Version-Manager implementation.
- No automatic mutation of protected contracts, APIs, DB schemas, ENV keys, Stripe/Supabase/Render runtime.
- No silent write to `main`.
- Existing CI budget and PR-contract rules remain binding.
- No-demo-data, privilege, and shared-zone rules remain untouched.

## 9. Phase A deliverable and exit

This document is the Phase A contract.

Exit criteria for Phase A:

- [x] Drift pattern and example documented
- [x] Inventory paths defined
- [x] Status taxonomy and source priority defined
- [x] Normative drift rule defined
- [x] Detector output shape sketched for Phase B
- [x] Phase C write path gated and fail-closed
- [x] Authorities and out-of-scope explicit

**Next:** Owner review of this contract. Phase B (read-only detector + tests) starts only after explicit freigabe. Phase C only after a further explicit freigabe.

## 10. Handoff note (what is detected vs. what stays manual)

| Detected (Phase B) | Remains manual |
| --- | --- |
| Header vs. claim/Apply-Evidenz drift on in-scope paths | Choosing the exact final header wording beyond the class |
| Recommended class (APPLIED / VERIFIED) when sources agree | Owner decision on whether a Draft-PR is opened |
| Conflict when sources disagree | Resolving contradictory evidence content |
| Inventory of documents carrying Status headers | Business decision to apply or not apply outstanding migrations |

---

**Document class:** Architecture / Contract  
**PR class for this change:** D (docs-only)  
**Owner:** SvenKulessa
