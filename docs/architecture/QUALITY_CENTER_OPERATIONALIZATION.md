# Quality Center Operationalization

**Status:** IMPLEMENTED IN DRAFT PR #464 — EXACT-HEAD CI VALIDATION IN PROGRESS  
**Authority:** ESS-0005, ESS-0001-CONTRACTS Chapter 12, ADR-0096  
**Data contract:** `quality-center-report/1.3.0`  
**Synchronized base:** `main@cb07abdeb871c1c7ba682fecfa91faa4a8de852e`

## Ziel

Der bestehende `QualityCenterReport` wird operational nutzbar gemacht, ohne eine zweite Quality-, Governance-, Compliance-, Security-, Scoring-, Ranking- oder Release-Authority einzufuehren.

Die Operationalisierung besteht aus vier Schichten:

1. **Report Factory** — eine gemeinsame Composition-Funktion erzeugt den bestehenden Report aus den vorhandenen Validator-, Gate-, Coverage-, Scoring- und EventMesh-Adaptern.
2. **Commitgebundener Snapshot** — der Build schreibt denselben Report atomar nach `.quality/quality-center-report.json` und `dist/quality/quality-center-report.json`.
3. **Release-Identity Binding** — die Runtime liest die bestehende immutable Release-Projektion und liefert einen Snapshot nur aus, wenn `snapshot.repositoryObservation.sourceCommit === release.commitSha`.
4. **Read-only Admin API / bestehende Admin-Oberflaeche** — `GET /api/admin/quality-center` verwendet die bestehende `checkAdminAccess`-/`DIAGNOSTIC_ZONE_ROLES`-Boundary; die Performance-Zentrale projiziert ausschliesslich diesen Report.

## Sicherheits- und Authority-Grenzen

- Der Endpoint besitzt ausschliesslich `GET`.
- Kein Supabase-, Render-, Stripe-, IAM-, Billing-, Scoring- oder Ranking-Write wird hinzugefuegt.
- Der Server erzeugt bei einem Request keinen Live-Repository-Scan. Er liest nur den beim Build erzeugten Snapshot.
- Fehlende, ungueltige oder commit-ungebundene Snapshots ergeben `503 quality_snapshot_not_available`.
- Eine fehlende oder ungueltige Runtime-Release-Identitaet ergibt `503 quality_release_identity_not_available`.
- Der Snapshot muss `quality-center-report/1.3.0`, `quality-center-contract/1.3.0`, einen gueltigen Timestamp und einen exakten 40-stelligen Source-Commit enthalten.
- Der Snapshot-Commit muss zur Laufzeit exakt dem bestehenden `platformVersionControlPlane`-/Release-Manifest-Commit entsprechen.
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
  -> platformVersionControlPlane reads immutable release identity
  -> GET /api/admin/quality-center
  -> require snapshot sourceCommit == release commitSha
  -> read-only QualityCenterReport
  -> Performance-Zentrale / Quality Evidence Panel
```

Der bestehende Runtime Release Manifest wird durch den nachfolgenden Quality-Snapshot nicht invalidiert, da sein Build-Identity-Material Package-/Lock-/Documentary-Inputs und nicht den `dist`-Dateibaum hasht.

## Frontend-Integration

Die bestehende Frontend-Migrationsauthority erlaubt aktuell Admin-intern komponierte Module weiterhin als Legacy-Implementierung unter `src/components`, waehrend `src/features/governance/ui/index.ts` die kanonische Governance-Fassade bildet.

Das Quality Panel folgt deshalb dem vorhandenen Migrationsmuster und erzeugt **keine zweite Frontend-Root-Struktur**. Eine physische Verschiebung des Components ist fuer diese Operationalisierung nicht erforderlich und wuerde den Scope ohne funktionalen Gewinn vergroessern.

## Keine neue Parallelarchitektur

Die neue `repositoryQualityReport.ts`-Factory extrahiert lediglich die bisher direkt in `validateRepositoryQuality.ts` enthaltene Composition. CLI-Validierung und Snapshot-Erzeugung verwenden damit dieselbe Factory.

`QualityCenterSnapshotStore` persistiert und liest den bestehenden `QualityCenterReport`; es definiert keinen neuen fachlichen Reportvertrag. Die Runtime-Commit-Pruefung verwendet die bereits bestehende `platformVersionControlPlane`-/Release-Authority.

## Noch offene Evidence-Punkte

### Historische Quality-Trends

Der aktuelle Snapshot ist commitgebunden, aber noch nicht als laengerfristige Zeitreihe persistiert. Eine vorgesehene rein repository-seitige Option ist ein GitHub-Workflow-Artefakt pro exaktem Commit. Die entsprechende Workflow-Mutation wurde in dieser Session vom Connector-Sicherheitsgate blockiert und daher **nicht** umgangen oder als umgesetzt dokumentiert.

Eine produktive Trend-Persistenz in Supabase oder einem anderen Application Store bleibt ausserhalb dieses PRs, da dies eine eigene Persistenz-/Produktionsmutation und Authority-Entscheidung waere.

### Code Coverage

Der vorhandene `CoverageCollector` konsumiert ein echtes `coverage-summary.json`, falls eines existiert. Im aktuellen Dependency-Graph ist `@vitest/coverage-v8` jedoch nur als optionale Vitest-Peer-Capability referenziert und nicht als installierte Projekt-Dependency vorhanden.

Deshalb wird in PR #464 **keine** implizite neue Coverage-Dependency und kein synthetischer Coverage-Wert eingefuehrt. Eine verpflichtende Repository-Code-Coverage wuerde bewusst gleichzeitig bedeuten:

- neue Dev-Dependency und Lockfile-Aenderung;
- zusaetzliche CI-Laufzeit/Kosten;
- Festlegung des Messumfangs und spaeter ggf. eines Threshold-Gates.

Bis diese Dependency-/CI-Entscheidung explizit autorisiert ist, bleibt Statements/Branches/Functions/Lines korrekt `NOT_AVAILABLE`.

### Numerische Quality-Score-Grenzen

Documentation, Architecture, Knowledge, Metadata und Twin bleiben ohne numerischen Score, solange keine bestehende Authority eine deterministische Formel definiert. PR #464 leitet aus PASS/FAIL-Zustaenden **keine** 0/100-Ersatzformeln ab.

## Akzeptanzkriterien

- [x] eine gemeinsame Quality-Report-Factory
- [x] atomare commitgebundene Snapshot-Persistenz
- [x] Build erzeugt runtime-faehigen Snapshot
- [x] Snapshot wird zur Laufzeit gegen die bestehende Release-Commit-Identity verifiziert
- [x] read-only, IAM-geschuetzte Admin-API
- [x] bestehende Admin-/Performance-Oberflaeche projiziert den Report
- [x] keine erfundenen Messwerte
- [x] keine neue finanzielle Hot-Path-Abhaengigkeit
- [x] keine externe Plattformmutation
- [x] fehlende numerische Score-Authorities bleiben explizite Evidence-Grenzen
- [x] Code-Coverage bleibt bis zur expliziten Dependency-/CI-Entscheidung fail-safe `NOT_AVAILABLE`
- [ ] commitgebundene CI-Artefakt-Historie — Workflow-Mutation noch offen
- [ ] Exact-Head TypeScript/Lint PASS
- [ ] Exact-Head Unit/Architecture Tests PASS
- [ ] Exact-Head Production Build PASS
- [ ] Exact-Head Governance/Security PASS
