# Quality Center Operationalization

**Status:** IMPLEMENTED ON FEATURE BRANCH — CI VALIDATION PENDING  
**Authority:** ESS-0005, ESS-0001-CONTRACTS Chapter 12, ADR-0096  
**Data contract:** `quality-center-report/1.3.0`

## Ziel

Der bestehende `QualityCenterReport` wird operational nutzbar gemacht, ohne eine zweite Quality-, Governance-, Compliance-, Security-, Scoring-, Ranking- oder Release-Authority einzufuehren.

Die Operationalisierung besteht aus vier Schichten:

1. **Report Factory** — eine gemeinsame Composition-Funktion erzeugt den bestehenden Report aus den vorhandenen Validator-, Gate-, Coverage-, Scoring- und EventMesh-Adaptern.
2. **Commitgebundener Snapshot** — nach erfolgreichem `npm run build` wird derselbe Report atomar nach `.quality/quality-center-report.json` und `dist/quality/quality-center-report.json` geschrieben.
3. **Read-only Admin API** — `GET /api/admin/quality-center` liefert ausschliesslich den persistierten Report und verwendet die bestehende `checkAdminAccess`-/`DIAGNOSTIC_ZONE_ROLES`-Boundary.
4. **Bestehende Admin-Oberflaeche** — das Quality Evidence Panel wird in die vorhandene Performance-Zentrale eingebunden. Es erzeugt keine eigenen Messwerte.

## Sicherheits- und Authority-Grenzen

- Der Endpoint besitzt ausschliesslich `GET`.
- Kein Supabase-, Render-, Stripe-, IAM-, Billing-, Scoring- oder Ranking-Write wird hinzugefuegt.
- Der Server erzeugt bei einem Request keinen Live-Repository-Scan. Er liest nur den beim Build erzeugten Snapshot.
- Fehlende, ungueltige oder commit-ungebundene Snapshots ergeben `503 quality_snapshot_not_available`.
- Der Snapshot muss `quality-center-report/1.3.0`, `quality-center-contract/1.3.0`, einen gueltigen Timestamp und einen exakten 40-stelligen Source-Commit enthalten.
- Die UI behandelt `null`/`NOT_AVAILABLE` explizit und erzeugt keine Ersatzscores.
- `Cache-Control: no-store` verhindert, dass veraltete Admin-Evidence als aktuelle Quality-Sicht zwischengespeichert wird.

## Build- und Runtime-Fluss

```text
npm run test
  -> commit-bound Contract/Test Evidence

npm run build
  -> Google Marketing Invariant Guard
  -> build:raw
  -> Runtime Release Manifest
  -> commit-bound Build Evidence
  -> buildQualityCenterSnapshot.ts
       -> .quality/quality-center-report.json
       -> dist/quality/quality-center-report.json

Docker runtime
  -> COPY dist
  -> GET /api/admin/quality-center
  -> read-only QualityCenterReport
  -> Performance-Zentrale / Quality Evidence Panel
```

Der bestehende Runtime Release Manifest wird durch den nachfolgenden Quality-Snapshot nicht invalidiert, da sein Build-Identity-Material Package-/Lock-/Documentary-Inputs und nicht den `dist`-Dateibaum hasht.

## Keine neue Parallelarchitektur

Die neue `repositoryQualityReport.ts`-Factory extrahiert lediglich die bisher direkt in `validateRepositoryQuality.ts` enthaltene Composition. CLI-Validierung und Snapshot-Erzeugung verwenden damit dieselbe Factory. Dadurch wird keine zweite Orchestrierung gepflegt.

`QualityCenterSnapshotStore` persistiert und liest den bestehenden `QualityCenterReport`; es definiert keinen neuen fachlichen Reportvertrag.

## Bewusst verbleibende Evidence-Grenzen

- Ein Gesamt-Quality-Score bleibt `PARTIAL`/`NOT_AVAILABLE`, solange nicht alle sieben Achsen eine autoritative numerische Quelle besitzen.
- Statements/Branches/Functions/Lines bleiben `NOT_AVAILABLE`, solange kein echtes Coverage-Summary-Artefakt erzeugt wird.
- Historical Trend Storage ist nicht Teil dieses Slices. Eine spaetere Historisierung benoetigt eine separat autorisierte Persistenzentscheidung und darf nicht stillschweigend Supabase oder andere Produktionsspeicher mutieren.
- GitHub-Actions-Artifact-Upload wird in diesem Slice nicht durch eine Workflow-Mutation eingefuehrt. Der runtime-faehige Snapshot wird bereits im Build-`dist` erzeugt.

## Akzeptanzkriterien

- [x] eine gemeinsame Quality-Report-Factory
- [x] atomare commitgebundene Snapshot-Persistenz
- [x] Build erzeugt runtime-faehigen Snapshot
- [x] read-only, IAM-geschuetzte Admin-API
- [x] bestehende Admin-/Performance-Oberflaeche projiziert den Report
- [x] keine erfundenen Messwerte
- [x] keine neue finanzielle Hot-Path-Abhaengigkeit
- [x] keine externe Plattformmutation
- [ ] Exact-Head TypeScript/Lint PASS
- [ ] Exact-Head Unit/Architecture Tests PASS
- [ ] Exact-Head Production Build PASS
- [ ] Exact-Head Governance/Security PASS
