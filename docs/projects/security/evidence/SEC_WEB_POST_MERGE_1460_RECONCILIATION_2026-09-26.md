# SEC-WEB-HARDENING-01 — Post-Merge Reconciliation for PR #1460

**Project:** `CAPITAL-AI-SEC`  
**Program:** `SEC-WEB-HARDENING-01`  
**Status:** `POST_MERGE_RECONCILED / OWNER_DEPENDENCY_OPEN`  
**Priority:** `P1`  
**Observed CURRENT_MAIN:** `15e1e0e3dc6f127419b92e38aeb06e09da2bc7ac`  
**Merged PR:** `#1460`  
**Merged head:** `dc74d03bb13183ee2954c393629001bf67cfcef3`  
**Merge commit:** `021fc68d4010f4fd9f30f789e7739d65de2b1356`  
**Merged at:** `2026-09-26T09:08:09Z`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Current status source:** `docs/architecture/ROADMAP.md`

## 1. Before / intended delta / after

### Before

The PR head previously exposed a reproducible regression in the Edge-Trust path: incomplete internal/test request-like objects without a `headers` bag could throw while resolving Cloudflare→Render trust evidence.

### Intended delta

Keep the existing fail-closed provenance contract intact while ensuring incomplete internal request-like objects are classified as untrusted evidence instead of causing a runtime exception. Preserve telemetry/redaction coverage and do not weaken origin-spoofing protections.

### After

Human/CODEOWNER merged PR #1460. The merged implementation:

- treats a missing request `headers` bag as empty/untrusted evidence;
- retains canonical-host, HTTPS, edge-token, client-IP and Cloudflare Ray-ID verification;
- includes regression coverage for the missing-header-bag path;
- preserves telemetry-safe Edge-Trust evidence;
- does not mutate provider settings, secrets, IAM, database/schema, workflows or deployment configuration.

## 2. Exact-head exit evidence

Before merge, exact head `dc74d03bb13183ee2954c393629001bf67cfcef3` was correlated against then-current main and was terminal-success for:

- `PR #1460 – CI-Prüfung`;
- `PR #1460 – Governance-Prüfung`;
- `Container Security`;
- `PR` / OSS-quality evidence.

The branch was `behind=0`, mergeable, and had no competing open Pull Request writer at the final correlation.

Post-merge readback now establishes:

- PR #1460 = `merged=true`;
- merge commit = `021fc68d4010f4fd9f30f789e7739d65de2b1356`;
- CURRENT_MAIN = `15e1e0e3dc6f127419b92e38aeb06e09da2bc7ac`;
- open Pull Requests at correlation time = none.

## 3. Security finding impact

PR #1460 strengthens evidence for the existing API/abuse/telemetry boundary but does **not** close unrelated findings:

- `F20` remains bounded by the current one-instance/process-local rate-limiter topology;
- `F21` remains PARTIAL until mutation-specific denial coverage is complete;
- `F25` remains PARTIAL until broader website Security-event and redaction coverage is complete.

No finding is promoted to PASS solely because #1460 merged.

## 4. Canonical dependency state

The first unresolved P0 dependency of `SEC-WEB-HARDENING-01` remains:

`F15 = CONFIRMED_OPEN / OPS-07-A + OPS-08-A / PVC-07 + PVC-08`.

The next SEC sequence therefore remains:

`F15 owner return → F23 → F10 → production/open-writer re-correlation`.

Security does not take over the OPS release/deployment implementation. The exact unblock condition for downstream SEC phases is owner-correct F15 evidence showing that the deployed artifact identity equals the already scanned/signed immutable artifact identity, or a newer canonical replacement contract merged into CURRENT_MAIN.

## 5. Reconciliation result

`PR_1460_MERGED_AND_VERIFIED`

`SEC_PROGRAM_STILL_ACTIVE`

`FIRST_BLOCKING_DEPENDENCY_F15_FOREIGN_OWNER`

`NO_ARTIFICIAL_SEC_WORK_CREATED`
