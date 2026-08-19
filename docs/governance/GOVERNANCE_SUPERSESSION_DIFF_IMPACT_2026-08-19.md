# Governance Supersession Diff & Impact — 2026-08-19

**Document ID:** GOV-SUPERSESSION-IMPACT-2026-08-19  
**Status:** OWNER REVIEW PACKAGE — proposed branch changes only  
**Baseline:** `main@345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`

## Decision scope

This package covers only the known conflict around the retired pre-CI PR-body checkbox / Files-Viewed / `💪` or `okay` ritual and the interpretation of `PROPOSED` documents as normative authority.

No historical evidence is deleted or archived by this branch.

## Authority comparison

| Artifact | Current lifecycle / authority | Relevant statement | Assessment |
|---|---|---|---|
| `docs/adr/ADR-0069-human-owner-comment-gate-and-dispatched-pr-ci.md` | **ACCEPTED**, Owner addendum 2026-08-16 | checkbox/emoji ritual retired; Human Merge remains | controlling Accepted Decision |
| `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md` | REQUIRED, updated 2026-08-16 | ritual retired; simplified pre-M10 CI | aligned |
| `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` | ACTIVE, updated 2026-08-16 | ritual retired; M10 later uses Passkey | aligned |
| `AGENTS.md` Systemadmin exception section | root governance | still says current-head review + Viewed attestations mandatory | stale/current-facing conflict |
| `docs/governance/CAPITAL_AI_GOVERNANCE_LIBRARY_REPORT_2026-08-15.md` | dated report | labels Diff + Viewed + emoji review as non-negotiable | historical snapshot presented too strongly for current use |
| `.github/policies/main-production-protection.expected.json` | machine-readable expected state | promotion notes still say Human/Owner head-bound gate remains unchanged | historical decision residue without later explicit current-state override |
| `docs/adr/ADR-0039-human-authorized-pr-creation-and-advisory-governance.md` | **PROPOSED** | per-PR human creation authorization and advisory process rules | may inform process; must not be sole Accepted authority |

## Semantic diff

### A. PR pre-CI authorization

**Before (stale references):**

```text
PR → Owner body checkboxes → all files Viewed → current-head review 💪/okay → expensive CI → Human Merge
```

**After (current Accepted authority):**

```text
Pre-M10: PR → Governance/technical CI → Human/Owner merge decision → Human Merge
Post-M10 controlled cutover: PR → Passkey AUTHORIZE_PR_CI → CI → Human/Owner merge decision → Human Merge
```

### B. Proposed-document authority

**Before:** `PROPOSED` ADRs can appear in `Authority:` lists without qualification, allowing readers/agents to infer normative authority.

**After:** Proposed/Draft material is explicitly design input only. Protected actions require separate Accepted/Active authority.

## Impact analysis

| Dimension | Impact |
|---|---|
| Merge authority | unchanged: Human/Owner-only |
| Technical CI | no new checkbox/emoji gate; pre-M10 behavior remains current policy |
| M10 | unchanged: Passkey/WebAuthn cutover remains future controlled gate; no completion claimed |
| Agent capabilities | no elevation; agents still cannot merge or self-authorize HIGH/CRITICAL work |
| Recovery | ADR-0069 anti-self-bootstrap invariants remain intact |
| Historical evidence | retained; reclassified as historical where necessary, not rewritten as if it never happened |
| Security | removes ambiguous weaker legacy authorization signals from current-facing governance |
| Regulatory | improves traceability and accountable human oversight; does not itself establish legal applicability |
| Rollback | revert this PR on a fresh branch; historical source documents remain available |

## Owner decision required

Human Merge of the resulting PR constitutes acceptance of this semantic normalization for repository governance. If rejected, no supersession becomes effective on `main`.
