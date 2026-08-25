# SC-2 Commodity P2-B — Archive Manifest Integrity

**Status:** IMPLEMENTED ON SYNC BRANCH — awaiting PR validation / Human Merge  
**Date:** 2026-08-25  
**Branch:** `feat/commodity-p2b-archive-manifest-integrity-sync-2026-08-25`  
**Base:** `main@b08b8e0b73e5413aeec286a3522a85448c3e3421`  
**Work Claim:** `COMMODITY-P2B-ARCHIVE-MANIFEST-INTEGRITY-SYNC-2026-08-25`  
**Parent:** SC-2 Commodity Orchestrator / P2-B Historical Vintage Acquisition  
**Authority:** ADR-0087, ADR-0101, ADR-0102

## Zweck

Die bereits gemergte P2-B-Kette unterscheidet aktuelle Historien-API-Werte von historisch tatsächlich verfügbaren Vintages. Der erneute kanonische Audit identifizierte jedoch eine Integritätslücke zwischen archiviertem Artefakt und `CommodityArchivedReleaseEvidence`: Release-Metadaten konnten ohne kryptografische Bindung an die tatsächlich verwendeten Bytes angegeben werden. Zusätzlich konnte CFTC-Live/PRE-Historie durch beigefügte Archive-Metadaten Availability Provenance mit Value Provenance vermischen.

Dieses Paket schließt diese Lücken ohne neue Scoring-, Registry-, Dispatcher-, Ranking- oder Provider-Routing-Authority.

## Kanonischer Pfad

```text
Official Provider Artifact
  -> exact captured bytes
  -> CommodityHistoricalArchiveManifest
       provider origin
       release/revision lineage
       publishedAt / capturedAt
       media type / byte length
       SHA-256(payload)
       content-addressed availabilityEvidenceId
  -> verifyCommodityHistoricalArchiveArtifact(manifest, bytes)
  -> CommodityVerifiedArchivedReleaseEvidence | null
  -> archived-row/source-specific historical normalizer
  -> CommodityHistoricalVintage
  -> PIT policy
  -> Historical Dataset
  -> Walk-forward / OOS validation
```

**Invariante:** `Availability Provenance != Value Provenance`.

## Implementierte Änderungen

### Archive Manifest `1.0.0`

- Provider-/Artifact-/Release-/Revision-Bindung.
- `publishedAt <= capturedAt`.
- SHA-256 und Byte-Length des exakten Payloads.
- content-addressed `commodity-archive:<sha256>` Evidence-ID.
- `immutable=true`, `canonical=false`, `scoreEligible=false`.
- offizielle HTTPS-Origin-Allowlist für EIA, USDA FAS, CFTC, USGS und EU/CRMA.
- API-Key-/Token-/Secret-/Signature-Queryparameter werden vom Builder vor Persistenz und Hashing entfernt; manipulierte persistierte URLs werden fail-closed abgelehnt.

### Historical Official Acquisition `1.1.0`

- freie Archive-Metadaten werden nicht mehr als PIT-Grenze akzeptiert.
- Archived-Row-, USGS- und CRMA-Pfade verlangen `CommodityVerifiedArchivedReleaseEvidence` und validieren sie erneut.
- CFTC PRE/current-history bleibt immer `CURRENT_HISTORY_ONLY`; Archive-Metadaten können den live abgerufenen Wert nicht zu PIT hochstufen.
- promotion-grade CFTC-Werte müssen aus Rows stammen, die aus dem verifizierten Archivkontext normalisiert wurden.
- leere Archived-Row-Sets liefern `INVALID`.
- USGS Historical Evidence verwendet ausschließlich den verifizierten Release-SourcePath; ein Observation-SourcePath kann diese Provenance nicht überschreiben.

## ADR / Governance

ADR-0102 `Commodity Historical Archive Integrity` dokumentiert die neue Evidence-Grenze. Die ADR-Registry wurde von `1.21.0` auf `1.22.0` aktualisiert; die ADR-0102-Namespace-Reservation wurde im selben kontrollierten Zyklus konsumiert und wieder freigegeben. ADR-0087 bleibt Parent Authority; ADR-0101 bleibt Commodity Research-/Promotion-Governance.

## Security / Datenintegrität

- keine Secrets oder Credentials im Repository;
- keine Credential-/Render-/Supabase-/Stripe-Mutation;
- kein neuer HTTP-Transport;
- keine Registry-/Dispatcher-/Ranking-Mutation;
- keine produktiven Gewichte;
- kein automatisches Model Promotion;
- ein Manifest ohne exakte Payload-Verifikation erzeugt keine Verified Release Evidence;
- ein Live-History-Wert wird nicht durch Availability-Metadaten rückwirkend PIT-fähig.

## Regressionen / Negative Tests

Abgedeckt sind insbesondere:

- Payload-Tampering und SHA-256-Mismatch;
- Host-Suffix-Spoofing;
- HTTP statt HTTPS;
- Secret/API-Key in Evidence-URL;
- fehlende EIA-/USDA-Revision-Lineage;
- Manifest-Metadaten-Tampering;
- unbekannter Provider fail-closed ohne Throw;
- Metadata-only Archive-Evidence;
- CFTC PRE -> PIT Bypass;
- leere Archive-Row-Sets;
- USGS Source-Provenance Override;
- getrennte CRMA Economic-Importance-/Supply-Risk-Evidence.

## Main-/Concurrency-Synchronisierung

Der ursprüngliche Arbeitsbranch basierte auf `main@0743e667...`. Vor PR-Erstellung war `main` bereits 107 Commits weitergezogen. Deshalb wurde bewusst **kein** PR vom stale Branch erstellt. Stattdessen wurde dieser Scope auf `feat/commodity-p2b-archive-manifest-integrity-sync-2026-08-25` direkt von `main@b08b8e0b73e5413aeec286a3522a85448c3e3421` neu aufgebaut.

PR #527 (P2-C Promotion Governance) ist auf diesem Main bereits enthalten. Beim Sync war ausschließlich PR #532 offen; dessen Domain-Control-Plane-/Device-Session-Dateien besitzen keinen File-Level- oder Commodity-Authority-Overlap.

## Primärquellen-/Best-Practice-Abgleich

- CFTC: Report Date und Publication/Release Date bleiben unterschiedliche Zeitachsen; Live PRE wird daher nicht als archivierter Value-Beweis verwendet.
- USDA PSD: Forecast-/Market-Year-Werte können bei Releases revidiert werden; heutige Historie beweist keinen früheren Vintage.
- EIA: heutige API-Historie bleibt non-PIT; API-Key-Queryparameter werden nicht in persistierte Evidence übernommen.
- USGS: Statistikjahr und versionierter MCS-Releasezeitpunkt bleiben getrennt.
- EU CRMA: Economic Importance und Supply Risk bleiben getrennte, releasegebundene Bewertungsgrößen.

Für diesen bounded TypeScript-Evidence-Scope wurden keine zusätzlichen MLflow-/Great-Expectations-/Python-Runtimes übernommen, da sie bestehende Registry-/DQ-/Evidence-Authorities duplizieren würden. Die Plugin-Suche ergab keinen spezialisierten Connector mit geringerem Integrations- oder Governance-Risiko.

## Validierungsgrenze vor PR

Vor PR werden nur günstige Repository-/Diff-/Contract-/Authority-Prüfungen durchgeführt. Hosted TypeScript-, Unit-, Build- und Governance-CI wird gemäß Projektregel erst nach PR-Erstellung ausgeführt. Ein PASS wird erst für den konkreten PR-Head behauptet.

## Weitere Reihenfolge nach Merge

1. reale, rechtmäßig verfügbare archivierte EIA-/USDA-/CFTC-/USGS-/CRMA-Payloads erfassen und manifestieren;
2. Archive-to-Feature-Row-Transformation;
3. immutable `PIT_VERIFIED` Historical Datasets;
4. Correlation-/Sensitivity-Evidence auf denselben Datasets;
5. Walk-forward/OOS;
6. Stress-/Regime-Evidence;
7. Provider-Resilience über reale Beobachtungsfenster;
8. vollständiges P2-C Review Package;
9. P2-D Canonical Result/Consumer Integration;
10. P2-E Legacy Retirement;
11. P3 Shadow/SLA/Controlled Promotion.
