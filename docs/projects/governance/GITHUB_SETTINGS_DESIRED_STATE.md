# GitHub Settings Desired State

**Status:** CONTRACT · NON-APPLYING until merge trigger + `apply: true`  
**Project:** CAPITAL-AI-GOV  
**Base:** `main@de4ebc6fb25ccf0fa3d2a2712e0410432cdc0793`  
**Machine file:** `docs/projects/governance/github-desired-state.yml`

Merge this file onto `main` is the owner trigger. Unchecked boxes are ignored. Paid GHAS stays blocked until a later explicit ACCEPT.

## Self-healing constraints

- MERGE only Human.
- Autofix may *dispatch* workflows. Autofix may not merge.
- No `require_last_push_approval` on solo-owner `main`.
- Required checks stay on `main-production-protection`.
- Settings apply is idempotent and fail-closed without the App permission for that item.
- Enterprise-Admin-Write is granted per step, not as a blanket Owner-Clone.

## Live (already applied 2026-09-20)

- [x] RS-MAIN-CHECKS — Required Checks + Non-Fast-Forward
- [x] RS-MAIN-DELETION — `main` not deletable
- [x] RS-MAIN-SOLO-OWNER — Review 0, last-push off, merge-only, EnterpriseOwner bypass always
- [x] RS-TAGS — Tag deletion + force-push blocked

## Proposed (check to authorize apply after Enterprise App rights)

- [ ] REPO-WIKI-OFF — Wiki aus
- [ ] REPO-PROJECTS-OFF — Projects aus
- [ ] REPO-FORKING — Forking aus
- [ ] ENV-PRODUCTION — Environment `production` + Required Reviewer `SvenKulessa`
- [ ] ORG-ACTIONS-FORKS — Fork-PR-Workflows aus
- [ ] ORG-ACTIONS-POLICY — Actions auf GitHub + vorhandene Pins begrenzen
- [ ] ORG-PAT-CLASSIC — Classic PAT einschränken, Fine-grained Approval
- [ ] SECRET-SCANNING-ALERTS — nur kostenfreie Alerts, ohne Push Protection

## Blocked (cost / origin unresolved)

- [ ] GHAS-CODE-SECURITY — **blocked-cost** (6,00)
- [ ] GHAS-SECRET-PROTECTION — **blocked-cost** (3,80)

## App rights (owner pending)

- [ ] APP-ENTERPRISE-ADMIN-READ — Inventar-Read-Pack auf Enterprise + Org
- [ ] APP-SETTINGS-APPLY-WRITE — genau ein Write je akzeptiertem Item

## Apply trigger

Workflow `.github/workflows/github-settings-apply.yml` läuft nach Merge nach `main`, wenn sich diese Dateien ändern. Solange die App keine passenden Writes hat, endet der Job mit `PLAN_ONLY` und ändert nichts.
