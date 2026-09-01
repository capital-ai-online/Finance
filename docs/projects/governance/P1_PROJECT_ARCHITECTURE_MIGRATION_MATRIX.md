# P1 — Project Architecture Migration Matrix

**Original P1 baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Cross-cutting folder correlation baseline:** `main@22c4b53f83313eb03090ef0867f8f793b98e5fcc`  
**Target:** `docs/projects/<project>/` + `PVC-*` project namespace  
**Rule:** project-location migration does not transfer technical authority or foreign execution ownership.

| Project / source | Current canonical implementation/domain location | Canonical project location | PVC treatment | Current action | Owner status |
|---|---|---|---|---|---|
| `CAPITAL-AI-CLIENT` | `docs/projects/agent-client/` + client runtime | `docs/projects/agent-client/` | `PVC-01` | KEEP; migrate remaining unqualified project `VC-01` labels owner-scoped | foreign CLIENT handoff |
| `CAPITAL-AI-GOV` | `docs/projects/governance/` + existing Governance Control Plane | `docs/projects/governance/` | `PVC-05` + cross-cutting Governance | KEEP / CONSOLIDATE | local GOV |
| `CAPITAL-AI-OPS` | existing OPS runtime/components + `docs/projects/operations/` | `docs/projects/operations/` | `PVC-02/04/06/07/08/18` | KEEP / REFERENCE | owner surface present |
| `CAPITAL-AI-DATA` | DATA runtime/domain paths + `docs/projects/data/` | `docs/projects/data/` | `PVC-09/10/11` | KEEP / REFERENCE | owner surface present |
| `CAPITAL-AI-FINTECH` | FINTECH runtime/domain paths + `docs/projects/fintech/` | `docs/projects/fintech/` | `PVC-12..17`; technical chain stays separate | KEEP / REFERENCE | owner surface present |
| `CAPITAL-AI-DOC` | `src/platform/Documentary/**` + `docs/projects/documentary/` + Documentary architecture/roadmap paths | `docs/projects/documentary/` | `PVC-03` | KEEP / REFERENCE; project surface materialized by PR #645 | owner surface present |
| `CAPITAL-AI-QM` | Quality domain/evidence + `docs/projects/quality-management/` | `docs/projects/quality-management/` | no productive PVC | KEEP DOMAIN + PROJECT NAVIGATION | owner surface present |
| `CAPITAL-AI-SEC` | `src/platform/Security/**` + Security roadmap/evidence/traceability | `docs/projects/security/` | no productive PVC | OWNER MIGRATION GAP; keep Security runtime/authority paths in place | foreign SEC handoff |
| `CAPITAL-AI-COMP` | `docs/compliance/CAPITAL-AI-COMP/**` | `docs/projects/compliance/` | no productive PVC | OWNER MIGRATION GAP; keep Compliance normative/domain paths in place | cross-cutting COMP handoff |
| `CAPITAL-AI-FE` | `docs/frontend/**` + frontend runtime | `docs/projects/frontend/` | no productive PVC; presentation consumer only | OWNER MIGRATION GAP; keep Frontend architecture/runtime in place | cross-cutting FE handoff |
| `CAPITAL-AI-SEO` | `docs/seo/**` + canonical SEO/marketing roadmap/runtime | `docs/projects/seo/` | no productive PVC | OWNER MIGRATION GAP; keep SEO domain/roadmap/runtime in place | cross-cutting SEO handoff |
| `CAPITAL-AI-SOCIAL` | `docs/social-media/CAPITAL-AI-SOCIAL/**` | `docs/projects/social-media/` | no productive PVC | OWNER MIGRATION GAP; keep Social domain artifacts in place | cross-cutting SOCIAL handoff |

## Correlation rationale

The previously unresolved cross-cutting project-folder identities reuse stable repository domain basenames rather than creating a second alias namespace:

- Security → `security`;
- Compliance → `compliance`;
- Frontend → `frontend`;
- SEO → `seo`;
- Social → `social-media`.

`CAPITAL-AI-SEC` already uses `projectFolder: security` in merged repository work-claim evidence. The remaining mappings follow the same deterministic rule from their established canonical domain basenames. This is organizational routing only; it does not relocate or supersede technical/normative domain surfaces.

The Documentary row is no longer a migration gap: PR #645 materialized `docs/projects/documentary/` on `main@22c4b53f83313eb03090ef0867f8f793b98e5fcc` while leaving the Documentary runtime and technical authorities in their existing canonical locations.

## Migration policy

1. `docs/projects/<project>/` is the organizational navigation/execution surface.
2. Existing canonical technical/domain documents may remain in canonical domain paths and be referenced; project-folder adoption does not require physical relocation.
3. Stale/diverged branches are reuse inputs only and are never merged unchanged against newer main.
4. Every target project performs its own fresh-main correlation and migration.
5. Project ownership labels use `PVC-*`; existing technical `SC-MD-SPT-0001` stage IDs are not rewritten by P1.
6. Cross-cutting projects declare no productive PVC ownership unless separately authorized.
7. Branch project-folder slugs are derived from the canonical `docs/projects/<folder>/` basename and do not infer authority.
8. A missing target folder is a migration gap, not permission for Governance or another project to materialize foreign scope.

Foreign rows remain `REFERRED` / `REFERRED_NOT_EXECUTED` until the target owner supplies current-main implementation evidence.
