# OPS-ROADMAP-BRANCH-EVIDENCE-01 — Live Branch Readback

**Project:** `CAPITAL-AI-OPS`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08`  
**Issue:** #1474  
**Baseline:** `main@14677ea3acc5316e025d784c7dc35d3a6b2dfe1a`  
**State:** `DONE_MAIN / TERMINAL`

## Ziel

Den bestehenden `/api/roadmap`-Read-Pfad um eine nicht-autorisierende Branch-Projektion erweitern. Ein Branch wird nur als **Live** projiziert, wenn sein Vergleich gegen den im selben Read beobachteten `CURRENT_MAIN` exakt `behindBy=0` und `aheadBy>0` ergibt.

## Vertrag

`GET /api/roadmap/branches`

liefert:

- exakte `currentMainSha`;
- Branchname und Head-SHA;
- `aheadBy` / `behindBy`;
- Relation `LIVE_CURRENT_MAIN_DESCENDANT`;
- Project Owner / Folder / Label aus dem kanonischen Branch-Slug in `docs/projects/README.md`;
- explizite `UNRESOLVED`-Owner-Auflösung statt erfundener Zuordnung;
- Scan-/Failure-Metadaten;
- `stale=true` nur aus einem zuvor erfolgreichen Cache-Readback.

## Sicherheitsgrenzen

- ausschließlich GitHub GET/compare Reads;
- kein GitHub-Token im Browser oder Response;
- keine Branch-, PR-, Workflow-, Settings- oder Deploy-Mutation;
- keine zweite Roadmap-/Task-State-Authority;
- Branch-Aktivität ist Evidence, nicht Task-Aktivierung;
- divergierte, hinter Main liegende oder identische Branches erscheinen nicht als Live;
- 5-Minuten Runtime-Cache begrenzt Provider-Last; öffentliche HTTP-Cache-Header bleiben kurz.

## Evidence

Beim Owner-Readback vor Umsetzung wurden unter anderem folgende Branch-Relationen beobachtet:

- `agent/operations-auth-profile-route-stability-20260928`: ahead 2 / behind 0;
- `agent/fintech-pipeline-builder-tool-catalog-v3-20260928`: ahead 10 / behind 0;
- ältere FE-Branches waren bereits hinter CURRENT_MAIN und sind dadurch für Live nicht eligible.

## Exit

- [x] Route und Projection implementiert;
- [x] kanonische Branch-Slug-Zuordnung;
- [x] divergierte/behind Branches fail-closed;
- [x] fokussierter Unit-Test ergänzt;
- [x] Exact-Head CI/Governance/Security — PR #1479 Head `4f725c9703433af64f30f0c51d675fdc46aa6f51`: CI #6651, Governance #6148, Container Security #3631, Project #914 und PR #1008 erfolgreich;
- [x] Human/CODEOWNER Merge — PR #1479 als `8862857f962a681c7853268e15822c719654412f` gemerged;
- [x] FE #1476 gegen den gemergten Response-Vertrag korreliert und als `be5e1d8d2574c55677d2e3ac855ee0b137626305` gemerged.


## Post-Merge Closure — 2026-09-28

- OPS-Merge: PR #1479 → `8862857f962a681c7853268e15822c719654412f`.
- Fresh CURRENT_MAIN readback: `f0b9b9f3368b3c9cc241fadef3100af89dc5256a`; der OPS-Merge ist Vorfahr dieser Generation (`behind=0`).
- FE-Nachfolger: PR #1476 → `be5e1d8d2574c55677d2e3ac855ee0b137626305`, Human/CODEOWNER-gemerged.
- Der zugehörige Work Claim wird durch #1485 auf `released / exclusive=false` konvergiert.
- Für dieses bounded OPS-Paket verbleibt kein Gate; Branch-Evidence bleibt read-only und nicht autorisierend.
