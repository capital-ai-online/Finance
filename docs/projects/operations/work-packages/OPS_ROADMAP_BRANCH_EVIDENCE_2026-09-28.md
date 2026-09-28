# OPS-ROADMAP-BRANCH-EVIDENCE-01 — Live Branch Readback

**Project:** `CAPITAL-AI-OPS`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08`  
**Issue:** #1474  
**Baseline:** `main@14677ea3acc5316e025d784c7dc35d3a6b2dfe1a`  
**State:** `IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED`

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
- [ ] Exact-Head CI/Governance/Security;
- [ ] Human/CODEOWNER Merge;
- [ ] FE #1476 danach gegen gemergten Response-Vertrag korrelieren.
