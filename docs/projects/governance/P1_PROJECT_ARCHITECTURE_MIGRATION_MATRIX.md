# P1 — Project Architecture Migration Matrix

**Baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Target:** `docs/projects/<project>/` + `PVC-*` project namespace  
**Rule:** project-location migration does not transfer technical authority or foreign execution ownership.

| Current source | Current location | Target project location | PVC treatment | Action | Owner status |
|---|---|---|---|---|---|
| merged `CAPITAL-AI-CLIENT` project | `docs/projects/agent-client/` | keep | migrate project label `VC-01` -> `PVC-01` in CLIENT-owned update | KEEP + REFERENCE | foreign CLIENT handoff |
| GOV consolidation candidate | `docs/projects/governance/` | keep | `PVC-05` | CONSOLIDATE | local GOV |
| prior OPS consolidation work | `docs/operations/**` and related historical branches | `docs/projects/operations/**` | `PVC-02/04/06/07/08/18` | REUSE CONTENT / OWNER MIGRATION | foreign OPS handoff |
| DATA project work | data project/domain paths | `docs/projects/data/**` navigation | `PVC-09/10/11` | OWNER MIGRATION | foreign DATA handoff |
| FINTECH project work | fintech project/domain paths | `docs/projects/fintech/**` navigation | `PVC-12..17`; technical chain stays separate | OWNER MIGRATION | foreign FINTECH handoff |
| Documentary project work | documentary architecture/component paths | `docs/projects/documentary/**` navigation | `PVC-03` | GAP / REFERENCE | foreign DOC handoff |
| Quality project work | Quality paths / project drafts | `docs/projects/quality-management/**` navigation | no Primary PVC | KEEP DOMAIN + PROJECT NAVIGATION | QM dependency |
| merged Compliance project | `docs/compliance/CAPITAL-AI-COMP/**` | future project navigation | no Primary PVC | REFERENCE / OWNER MIGRATION GAP | cross-cutting COMP |
| Frontend / SEO / Social projects | domain-specific paths | future `docs/projects/<project>/` navigation | no Primary PVC | REFERENCE / OWNER MIGRATION GAP | cross-cutting owners |

## Migration policy

1. `docs/projects/<project>/` is the organizational navigation/execution surface.
2. Existing canonical technical/domain documents may remain in canonical domain paths and be referenced; project-folder adoption does not require physical relocation.
3. Stale/diverged branches are reuse inputs only and are never merged unchanged against newer main.
4. Every target project performs its own fresh-main correlation and migration.
5. Project ownership labels use `PVC-*`; existing technical `SC-MD-SPT-0001` stage IDs are not rewritten by P1.
6. Cross-cutting projects declare no Primary PVC ownership unless separately authorized.

Foreign rows remain `REFERRED` / `REFERRED_NOT_EXECUTED` until the target owner supplies current-main implementation evidence.
