# GOV-03 — ADR-0060 Lifecycle / Registry / Authority Reconciliation Evidence

**Evidence role:** non-authorizing implementation/correlation evidence  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Work item:** `GOV-03 — ADR-0060 Supply-Chain Authority Drift Reconciliation`  
**Correlation baseline:** `main@f1622359ad7956809f82ed9bc4fb81fd625d3fb8`  
**Branch:** `agent/governance-gov03-adr0060-reconcile-20260905`  
**Date:** `2026-09-05`

## 1. Purpose

This evidence records the bounded GOV-03 reconciliation between the existing M6 software supply-chain implementation/evidence and the canonical ADR/Authority registry state. It does not itself authorize ADR acceptance, merge, deployment, production mutation or a new supply-chain architecture.

## 2. Current-main correlation before implementation

The work started only after the prior Governance coordination PR #741 reached a terminal Human-merged state. The then-current `main` was `f1622359ad7956809f82ed9bc4fb81fd625d3fb8`.

At branch creation:

- `CAPITAL-AI-GOV / PVC-05` was the resolved Primary Owner;
- the Governance Roadmap identified GOV-03 as the next active Governance item;
- no open Pull Request remained against `main`;
- no GOV-03 work claim / active parallel ADR-0060 writer was found;
- no changed-file or namespace overlap was identified;
- the scoped branch was created directly from the exact current-main SHA.

## 3. Pre-change drift

| Surface | Pre-change state | Finding |
|---|---|---|
| `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md` | `PROPOSED`, no stable `AUTH-*` metadata | lifecycle/identity not reconciled with current Governance model |
| `docs/adr/registry.json` | no migrated ADR-0060 record | canonical ADR lifecycle registry did not resolve ADR-0060 |
| `docs/governance/authority-registry.json` | no ADR-0060 authority entry | stable authority identity was absent |
| M6 implementation evidence | historical `VERIFIED PASS` | valid technical evidence but non-authorizing for ADR lifecycle |
| ADR-0060 standards wording | direct NIST SSDF mapping | conflicts with current Trust Root rule withdrawing NIST-derived repository bindings unless explicitly re-adopted |

## 4. Reconciliation applied

### ADR-0060

ADR-0060 is prepared as version `1.1.0` with stable Authority ID:

`AUTH-ADR-SOFTWARE-SUPPLY-CHAIN-PROVENANCE-0060`

Its lifecycle is expressed as `ACCEPTED / ACTIVE` only after Human Merge of this accepted version. The document explicitly separates architectural acceptance from historical M6 implementation evidence.

The decision reuses the existing source → lockfile → SBOM → artifact → provenance → keyless attestation/signature → deployment/runtime identity chain. No second Supply-Chain, Release or Governance control plane is introduced.

### ADR Registry

`docs/adr/registry.json` is advanced from `1.34.0` to `1.35.0` and receives one ADR-0060 migrated record with:

- display ID `ADR-0060`;
- Authority ID `AUTH-ADR-SOFTWARE-SUPPLY-CHAIN-PROVENANCE-0060`;
- version `1.1.0`;
- lifecycle `accepted`;
- canonical ADR path;
- no supersession edge.

### Authority Registry

`docs/governance/authority-registry.json` is advanced from `1.52.0` to `1.53.0`. The ADR Registry authority projection is correlated to `1.35.0`, and one bounded ADR-0060 authority entry is added at precedence tier 2.

The new entry does not grant merge, deployment, IAM, production-mutation or parallel Governance/Release authority.

## 5. Standards and historical-evidence boundary

The original current-authority statement mapping M6 controls to NIST SSDF is removed from ADR-0060. Under `/AGENTS.md` v2.7.0, historical NIST references remain non-authorizing unless a future explicit Human/Owner decision re-adopts a named source/version/scope.

Historical M6 evidence is intentionally not rewritten. SLSA provenance semantics and Sigstore/cosign keyless signing remain technical references to the existing implementation, subordinate to repository authority.

## 6. Changed-file boundary

Expected GOV-03 branch delta is limited to:

1. `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md`;
2. `docs/adr/registry.json`;
3. `docs/governance/authority-registry.json`;
4. `docs/projects/governance/evidence/GOV03_ADR0060_AUTHORITY_RECONCILIATION_2026-09-05.md`.

No runtime, workflow, dependency, release implementation, provider configuration, secret, database, billing, IAM or foreign-project file is intentionally modified.

## 7. Validation contract

Before PR creation the exact branch head must be re-correlated against then-current `main` and open PRs. Available structural validation must confirm:

- unique ADR display/Authority identities;
- ADR file / ADR Registry / Authority Registry version and lifecycle agreement;
- registry self-version consistency;
- canonical target paths exist;
- no active namespace reservation collision;
- no new current NIST repository binding is introduced by ADR-0060;
- branch delta remains within the four-file scope above.

Hosted checks after PR creation remain independent evidence. A check that was not run is never reported as PASS.

## 8. Activation and remaining gate

This evidence is non-authorizing. ADR-0060 v1.1.0 becomes effective only after the Human/CODEOWNER merges the exact reviewed PR. PR creation itself remains subject to the exact `main SHA` + `branch head SHA` Human/Owner approval gate in `/AGENTS.md`.
