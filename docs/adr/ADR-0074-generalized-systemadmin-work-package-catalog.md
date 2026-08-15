# ADR-0074 — Generalized Systemadmin Work-Package Catalog

Status: PROPOSED / OWNER-DIRECTED, DORMANT UNTIL ACTIVATION
Date: 2026-08-15
Authority: ESS-0021, ADR-0065, ADR-0059, ADR-0067, ADR-0068

## Context

SA3B proved the execution-host boundary (real GitHub Actions OIDC workload identity, durable M5
authorization before every repository side effect, correlated terminal outcome). SA4 proved the
full BRANCH -> COMMIT -> PR chain, but only for exactly one hardcoded, already-merged target
(`docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`) — `scripts/systemadmin/runSa4Pilot.mjs`
is not a reusable engine; a second work package would need an entirely new workflow file, a new
broker route mapping and a new bespoke runner script, each independently reviewed.

Owner instruction ("fahre mit der Umsetzung des Systemadministrators fort... über die Action
Workflows"), refined via three rounds of clarification, settled on Model A from
`docs/architecture/GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md`: generalize the *machinery*
so that multiple pre-approved, already-reviewed work packages can run through the same Action
infrastructure, without changing the fundamental trust property that has held since SA4 — the
triggering Issue never supplies executable content, only a selection among choices that were
already code-reviewed and merged to `main`. Model B (an LLM generating code at runtime) is
explicitly out of scope for this ADR; that design document identified an unsolved blocker
(no tool-call-level policy enforcement) that this change does not attempt to solve.

## Decision

Add one new, generic execution host alongside SA3B and SA4 — never replacing or modifying either
— that dispatches to a hardcoded catalog of pre-approved work packages instead of one hardcoded
target.

Canonical chain (identical structure to SA4's, ADR-0068):

`OWNER WORK-PACKAGE ISSUE → TRUSTED main WORKFLOW → STRICT REQUEST VALIDATION AGAINST THE CATALOG
→ GITHUB OIDC → M5 BRANCH AUTH → BRANCH → M5 BRANCH OUTCOME → M5 COMMIT AUTH → CATALOG-GENERATED
DETERMINISTIC FILE COMMIT → TARGETED VALIDATION → M5 COMMIT OUTCOME → M5 PR AUTH → DRAFT PR → M5
PR OUTCOME → HUMAN REVIEW → HUMAN MERGE`

The host does not delegate `CI_REQUEST`, deployment, production mutation or merge — identical to
SA4.

## What actually generalizes

Only the *selection* step generalizes. Everything downstream of that selection remains exactly as
trust-constrained as SA4:

- **Trusted catalog, not trusted input.** `scripts/systemadmin/workPackages/registry.mjs` is a
  hardcoded `Map` from `workPackageId` to a catalog module. Each module (e.g.
  `generalizationProof.mjs`) is ordinary, human/interactively-reviewed, `main`-merged code that
  declares its own exact target path, exact branch namespace, exact mandate file and a pure
  `generate()` function producing deterministic Markdown from bounded execution metadata only.
  The Issue body supplies **only** `workPackageId` (validated against the catalog's known keys),
  `baseSha` and `branchName` — never file content, never a path, never a mandate.
- **One mandate per work package, `REM-WORKPACKAGE-*` prefix required.** The broker
  (`systemadminExecutionBrokerRouter.ts`) does not enumerate individual mandates for this host —
  it checks only that the OIDC-verified workflow is the one new generic runner AND that the
  presented `mandateId` carries the reserved `REM-WORKPACKAGE-` prefix. Per-work-package scoping
  (`allowedPaths`, `allowedCapabilities`) is enforced entirely by the existing SA1 REM_SCOPE layer
  (`roadmapExecutionMandate.ts`) against that specific mandate's own content — unchanged from how
  SA3B/SA4 already work. SA3B and SA4 keep their existing exact-match bindings; this is purely
  additive.
- **Per-side-effect audit rule unchanged.** Each of `BRANCH`, `COMMIT` and `PR` still requires its
  own authorization event and its own terminal outcome event, with the identical permit-binding
  checks (mandate, branch, current-head, requested-paths) proven correct by SA4.
- **Deterministic commit, re-verified after write.** Identical to SA4: the runner re-reads the
  committed file and checks its SHA-256 digest against the trusted, locally generated content
  before recording the COMMIT outcome.
- **Draft PR only, Human merge boundary unchanged.** Identical to SA4.
- **`runSa4Pilot.mjs` is untouched.** This ADR does not refactor or extract shared code from the
  already-`VERIFIED PASS` SA4 pilot — the new `runWorkPackage.mjs` duplicates the proven security
  pattern rather than risk regressing a verified security-critical path for the sake of DRY.

## First catalog entry

`GENERALIZATION-PROOF` (`scripts/systemadmin/workPackages/generalizationProof.mjs`) writes exactly
one file, `docs/evidence/systemadmin-work-packages/WORK_PACKAGE_GENERALIZATION_PROOF.md`, proving
the catalog-driven runner executes correctly through the new machinery. Its mandate,
`.ai/mandates/REM-WORKPACKAGE-GEN-PROOF-001.json`, is **`status: DRAFT`** — not Owner-approved.
Per `src/platform/Security/roadmapExecutionMandate.ts` (`mandate.status !== 'OWNER_APPROVED'` →
`deny`), this is independently, structurally unusable even if the dormant workflow trigger below
were ever accidentally enabled. This session did not and cannot self-approve it (CLAUDE.md
Authorized Principals: only a verified human OWNER with fresh TOTP step-up).

## Dormant by default

Exactly like SA4 before its first pilot run, `.github/workflows/systemadmin-work-package-runner.yml`
carried `if: false && ...` — merging this ADR's code did not create a live privileged execution
surface. Activation (flipping the `if:` condition) is a separate, explicit, documented Human/Owner
change, and even after that flip, running the `GENERALIZATION-PROOF` work package specifically
still additionally requires the Owner to approve `REM-WORKPACKAGE-GEN-PROOF-001` (flip `status` to
`OWNER_APPROVED` with a real `approvalEvidenceRef`) — two independent gates, not one.

### Nachtrag 2026-08-15 — Schritt 1 von 2 aktiviert

Auf explizite Owner-Anweisung ("aktiviere den Work-Package-Runner") wurde `if: false && ...` aus
`.github/workflows/systemadmin-work-package-runner.yml` entfernt. Der Host kann jetzt bei einem
passenden Owner-Issue anlaufen. **Schritt 2 (Mandat-Freigabe) ist weiterhin offen:**
`REM-WORKPACKAGE-GEN-PROOF-001.json` bleibt `status: DRAFT`, wodurch jede tatsächliche Ausführung
weiterhin an der SA1-REM_SCOPE-Prüfung fehlschlägt (`mandate.status !== 'OWNER_APPROVED'` →
`deny`) — unabhängig vom jetzt aktiven Trigger. `tests/unit/systemadminWorkPackageCatalogContracts.test.ts`
entsprechend aktualisiert (Test benannt in „... (activated 2026-08-15)" umbenannt, prüft jetzt das
Fehlen von `false &&`).

## Trust-root boundary

The new workflow, both new scripts, the new catalog module, the new mandate and this ADR itself
are added to **both** existing Systemadmin self-authority rings
(`SYSTEMADMIN_SELF_AUTHORITY_PATHS` in `roadmapExecutionMandate.ts`,
`SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS` in `systemadminAuditedExecution.ts`) — no future
`REM-WORKPACKAGE-*` mandate can ever authorize modifying this execution machinery itself, mirroring
the protection SA4 already has.

## What this ADR does not do

- It does not build Model B (runtime code generation) — see
  `docs/architecture/GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md` for why that remains
  unsolved.
- It does not activate the new workflow.
- It does not approve the `GENERALIZATION-PROOF` mandate.
- It does not add a second real (non-proof) work package to the catalog — that is a separate,
  future Owner-directed change, same as any new SA4-style pilot would have been.

## Exit criteria

This generalization reaches `VERIFIED PASS` only after:

1. this PR is Human-reviewed, CI PASS, Human-merged;
2. the Owner separately activates the workflow trigger;
3. the Owner separately approves `REM-WORKPACKAGE-GEN-PROOF-001` with a real `approvalEvidenceRef`;
4. a fresh Owner work-package Issue runs from the exact current `main`;
5. separate durable authorization/outcome pairs exist for BRANCH, COMMIT and PR;
6. the committed file is the exact catalog-generated deterministic artifact;
7. one draft PR is created and points to the exact audited commit;
8. no production mutation occurred;
9. Human merge boundary remains intact;
10. evidence, roadmap and traceability are synchronized.

## Consequences

Positive: future bounded, documentation/repository-scoped work packages need only a new catalog
module + a new Owner-approved REM, not a new workflow file and broker route each time. Negative:
the catalog itself is now a place where a careless future entry could request an inappropriately
broad `allowedPaths`/`allowedCapabilities` — mitigated by the unchanged SA1 REM_SCOPE enforcement
and by each new mandate still needing individual Owner review and approval, same as SA4's.
