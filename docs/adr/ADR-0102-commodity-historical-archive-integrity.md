# ADR-0102 — Commodity Historical Archive Integrity

**Authority ID:** `AUTH-ADR-COMMODITY-HISTORICAL-ARCHIVE-INTEGRITY-2026-08-25`  
**Version:** `1.0.0`  
**Date:** 2026-08-25  
**Lifecycle:** accepted-for-implementation  
**Effective:** after Human Merge of the implementing Pull Request  
**Parent authorities:** ADR-0087, ADR-0101, SC-2 Commodity Orchestrator P2-B  
**Work Claim:** `COMMODITY-P2B-ARCHIVE-MANIFEST-INTEGRITY-2026-08-25`

## Kontext

P2-B trennt bereits `observedAt`, `availableAt` und `retrievedAt` und verhindert, dass eine heutige EIA-/USDA-/CFTC-Historienabfrage automatisch als historisch verfügbarer Daten-Vintage gilt. Für promotionsfähige Point-in-Time-Evidence benötigt die Source Policy reale Release-/Revision-/Availability-Lineage.

Der bisherige Archive-Einstieg akzeptierte jedoch Release-Metadaten ohne kryptografische Bindung an das tatsächlich archivierte Artefakt. Zusätzlich konnte der CFTC-PRE-Historienpfad einen heute abgerufenen Zahlenwert durch beigefügte Archive-Metadaten als `PIT_VERIFIED` behandeln, obwohl der Zahlenwert selbst nicht nachweislich aus dem archivierten Payload extrahiert worden war.

Damit waren **Availability Provenance** und **Value Provenance** nicht ausreichend getrennt.

## Entscheidung

1. Historical Archive Evidence erhält den Vertrag `commodity-historical-archive-manifest/1.0.0`.
2. Ein Manifest bindet mindestens Provider, Artifact-ID/-Rolle, offizielle Source-URL, Source-/Release-/Revision-Version, `publishedAt`, `capturedAt`, Media Type, Byte Length sowie SHA-256 der exakt archivierten Bytes.
3. `availabilityEvidenceId` ist content-addressed und bindet die vollständige Manifestidentität einschließlich Content-Hash.
4. Ein Manifest allein ist kein PIT-Nachweis. `verifyCommodityHistoricalArchiveArtifact()` muss die verwendeten Bytes erneut gegen SHA-256 und Byte Length prüfen, bevor `CommodityVerifiedArchivedReleaseEvidence` entsteht.
5. Bestehende Historical-Acquisition-Einstiegspunkte akzeptieren für Archive-Upgrades nur diese verifizierte Release-Evidence und validieren sie erneut fail-closed. Frei konstruierte Metadata-only Release-Objekte dürfen keine PIT-Vintages mehr erzeugen.
6. Offizielle Archive-Origins sind providergebunden und ausschließlich HTTPS. Userinfo-Credentials, nicht standardmäßige Ports und persistierte Credential-/Token-/Signature-Queryparameter sind verboten.
7. Der normale Manifest-Builder entfernt bekannte Credential-Queryparameter **vor** Persistenz und Evidence-Fingerprinting. Persistierte oder manipulierte Manifeste, die solche Parameter erneut enthalten, werden abgewiesen.
8. EIA-/USDA-Live-Historie bleibt `CURRENT_HISTORY_ONLY`, unabhängig vom wirtschaftlichen Zeitraum der zurückgegebenen Werte.
9. CFTC-PRE-Live-Historie bleibt ebenfalls ausnahmslos `CURRENT_HISTORY_ONLY`. Archive-Metadaten dürfen einen Wert aus dem heutigen PRE-Endpunkt nicht zu `PIT_VERIFIED` hochstufen. CFTC-PIT-Werte müssen als Rows aus dem verifizierten Archive-Kontext normalisiert und über `buildArchivedOfficialHistoricalVintages()` eingebracht werden.
10. USGS-/CRMA-Versioned-Release-Pfade benötigen ebenfalls verifizierte Release-Evidence. Ein observation-lokaler USGS-`sourcePath` darf die verifizierte Release-Herkunft nicht überschreiben.
11. Die bestehende `CommodityHistoricalVintage`-Source Policy, Dataset-/PIT-Validation und Walk-forward/OOS-Engine bleiben Authority. ADR-0102 erzeugt keine zweite DQ-, Registry-, Dispatcher-, Ranking- oder Persistence-Authority.
12. Ein verified Archive-Paket bleibt `canonical=false` und `scoreEligible=false`. Es autorisiert weder Modell-Promotion noch Ranking, Trading oder Execution.

## Provider-Origins

| Provider | zugelassene Origin-Suffixe |
|---|---|
| EIA | `eia.gov` |
| USDA FAS PSD | `fas.usda.gov` |
| CFTC COT | `cftc.gov` |
| USGS MCS | `usgs.gov` |
| EU CRMA | `eur-lex.europa.eu`, `ec.europa.eu` |

Die Allowlist ist Provenance-/Secret-Hygiene, keine allgemeine Netzwerk- oder Provider-Routing-Authority.

## Datenintegritätsinvarianten

- `publishedAt <= capturedAt`.
- Content SHA-256 und Byte Length müssen zu den verifizierten Bytes passen.
- Provider-spezifische Release-/Revision-Anforderungen aus `commodityHistoricalSourcePolicy()` bleiben verbindlich.
- `CURRENT_HISTORY_ONLY` kann nicht durch Release-Metadaten in `PIT_VERIFIED` konvertiert werden.
- Availability Evidence beweist nicht automatisch den Inhalt eines live abgefragten historischen Zahlenwerts.
- Eine geänderte Payload erzeugt eine andere Content- und Availability-Identität.
- Secret-bearing Request-URLs sind keine persistierbare Evidence.
- Fehlende oder inkonsistente Archive-Evidence führt zu `INVALID`, `PARTIAL` oder bleibt Current History; niemals zu einem neutralen/synthetischen PIT-Wert.

## Security / Compliance / Governance

- Keine neuen Credentials, Secrets, IAM-Rechte oder externen Write-Pfade.
- Keine Speicherung von API Keys/Tokens in Archive-Manifests.
- Kein neuer HTTP-Fetcher; bestehende Live-Provider-Governance bleibt unverändert.
- Kein DB-/Render-/Supabase-/Stripe-Schema oder Produktionsmutationspfad.
- Keine Änderung an `ScoringModelRegistry`, `ScoringDispatcher`, `CanonicalScoreResult` oder Ranking.
- Human Merge bleibt erforderlich; technische Evidence ist keine Autorisierung.

## Open-Source-/Plattformentscheidung

MLflow wurde als generische Model-Registry-/Lineage-Lösung geprüft, aber nicht übernommen: CAPITAL-AI besitzt bereits die kanonische `ScoringModelRegistry` und content-addressed Evidence-/Fingerprint-Primitiven; ein zusätzlicher MLflow-Backend-/Python-Stack würde eine zweite Artifact-/Registry-Betriebsfläche schaffen.

Great Expectations wurde als generische Data-Validation-Lösung geprüft, aber nicht übernommen: Der konkrete Gap betrifft Archive-Content-/Release-Provenance innerhalb vorhandener TypeScript-PIT-Verträge. Ein zusätzlicher Python Data Context/Checkpoint Stack würde DQ-Governance duplizieren.

Die verfügbare Plugin-Suche nach Model Validation, MLOps, Backtesting und Data Provenance ergab keinen spezialisierten Connector mit geringerem Integrations- und Governance-Risiko.

## Nicht gewählt

- Metadata-only Archive-Upgrade.
- Heutige API-Historienwerte als implizit historische Vintages.
- CFTC Friday-/Report-Date-Heuristik als Ersatz für reales Release-Artefakt.
- Live-PRE-Wert plus Archive-Metadaten als PIT-Evidence.
- Secret-bearing URLs in Audit-/Evidence-Artefakten.
- zweite Model Registry oder separates DQ-/Backtest-Framework.
- automatische Modell-Promotion.

## Folgen / nächste Gates

Nach ADR-0102 können reale, rechtmäßig verfügbare Archive-Artefakte content-addressed erfasst und anschließend in die vorhandene P2-B-Kette überführt werden. Die tatsächliche empirische Arbeit bleibt separat erforderlich:

1. reale EIA-/USDA-/CFTC-Archive und versionierte USGS-/CRMA-Releases erfassen;
2. Archive-Payloads nachvollziehbar in Feature Rows transformieren;
3. `PIT_VERIFIED` Historical Datasets aufbauen;
4. Correlation-/Sensitivity- und Walk-forward/OOS-/Stress-Evidence erzeugen;
5. Provider-Resilience über reale Beobachtungsfenster messen;
6. nach Merge von PR #527 P2-C Promotion Review Packages aus genau diesen Evidence-Artefakten erstellen;
7. erst danach P2-D/P2-E/P3 fortführen.
