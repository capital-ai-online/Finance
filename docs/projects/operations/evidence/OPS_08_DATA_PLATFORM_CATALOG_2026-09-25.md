# OPS-08 Data Platform Catalog — Supabase und Backtesting-Speicher

**Projection:** non-authorizing operational catalog  
**Owner mapping:** `CAPITAL-AI-OPS / PVC-08` for production-platform operation  
**Alias:** `OPS`  
**Canonical project folder:** `docs/projects/operations/`  
**FinTech consumer:** `CAPITAL-AI-FINTECH / PVC-09..17`  
**Security / Quality / Compliance:** cross-cutting assurance only

Dieses Inventar ordnet Plattformen nach tatsächlichem Einsatzzweck ein. Es überträgt keine
FinTech-, Scoring-, Security-, Compliance- oder Merge-Authority.

**Self-Healing Supply/Development-Chain projection:** Supabase resolves operationally to
`PVC-08 — Production Operations` under project `CAPITAL-AI-OPS`, alias `OPS`,
canonical folder `docs/projects/operations/`. Recovery convergence uses five reusable
validation gates: (1) exact source/project identity, (2) archive row-count/digest evidence,
(3) encrypted dual-offsite readback before retention, (4) database security-posture
invariants, (5) post-maintenance provider/application readback. These gates are evidence
and recovery mechanics only; they do not create a second lifecycle or authority.

| Plattform / Konzept | Katalogstatus | Geeignete Rolle | CAPITAL-AI Zuordnung | Aktueller Einsatz / Grenze |
|---|---|---|---|---|
| Supabase PostgreSQL 17 | ACTIVE | User/Auth OLTP, IAM, Profile, Produktzustand, Evidence, Score-Metadaten, Jobs | `CAPITAL-AI-OPS` / alias `OPS` / `PVC-08` / `docs/projects/operations/`; fachlicher Consumer `FINTECH PVC-09..17` | produktiv; nicht als alleiniger Bulk-Backtesting-Speicher |
| Supabase Auth | ACTIVE | Registrierung, Sessions, OAuth, Identität | OPS/PVC-08 betrieben; SEC/IAM cross-cutting | produktiv |
| Supabase Edge Functions | ACTIVE | Stripe Setup/Webhook/Worker | OPS/PVC-08 Plattformbetrieb; Payment-Vertrag bleibt separate Fachintegration | alternative Auth-Kontrollen live verifiziert |
| Supabase Vault | ACTIVE | serverseitige Worker-/Setup-Secrets | OPS/PVC-08 + SEC constraint | produktiv; kein Secret in Client/Repo |
| Supabase Storage | ACTIVE_EMPTY | private Objektablage | OPS/PVC-08 | 1 privater Bucket, aktuell 0 Objekte |
| GitHub Actions Artifact | ACTIVE | primäres verschlüsseltes Recovery-Archiv | OPS/PVC-02/07/08 | 35-Tage-Retention |
| Google Drive Recovery Mirror | PREPARED | sekundäre wöchentliche Off-site-Kopie | OPS/PVC-08 | Zielordner angelegt; GitHub-OAuth-Secrets vor erstem automatischen Sync erforderlich |
| Parquet + Object Storage | EVALUATE_NEXT | günstige historische OHLCV-/Feature-/Backtest-Daten | FINTECH PVC-09..15 fachlich; OPS betreibt Storage erst nach Auswahl | bevorzugter nächster Daten-Layer für Monetarisierungsphase |
| DuckDB | EVALUATE_NEXT | lokale/serverseitige Backtests direkt auf Parquet | FINTECH PVC-12..15 Consumer | sehr geringer Betriebsaufwand; kein User/Auth-System |
| ClickHouse Cloud | EVALUATE_SCALE | große historische Tick-/Quote-Analytik, schnelle Scans/Aggregate | FINTECH PVC-09..15 + OPS Betriebsgrenze | erst bei nachgewiesenem Volumen/Concurrency |
| Timescale Cloud | EVALUATE | PostgreSQL-nahe Time-Series, Hypertables/Continuous Aggregates | FINTECH PVC-09..15 | separate Instanz; TimescaleDB ist auf Supabase PG17 nicht verfügbar |
| QuestDB | EVALUATE | sehr schnelle Time-Series-Ingestion/ASOF-Analytik | FINTECH PVC-09..15 | Spezialengine; zusätzlicher Betriebsstack |
| Amazon Aurora PostgreSQL | FUTURE_ENTERPRISE | hochverfügbare transaktionale User-/Core-Daten | OPS/PVC-08; IAM/SEC/COMP Gates | sinnvoll erst bei Enterprise-HA/Compliance-/Lastbedarf |
| Neon Postgres | EVALUATE_DEV_OLTP | serverless Postgres / elastische Dev- oder Neben-OLTP-Workloads | OPS/PVC-08 | kein Ersatz für Auth-Suite oder Market-History-Analytics ohne Zusatzdienste |

## Empfohlenes 5-Monats-Zielbild

**Jetzt:** Supabase behalten und stabilisieren. Historische Marktserien nicht in denselben
Hot-OLTP-Pfad drücken.

**Nächster Daten-Slice:** Providerdaten normalisieren und als partitionierte Parquet-Dateien
nach `asset_class/provider/symbol/timeframe/year/month` schreiben. Backtests zunächst mit
DuckDB ausführen. Damit lassen sich Produktfeatures und bezahlbare Research-/Backtest-
Funktionen testen, bevor ein zweites dauerhaft laufendes Datenbanksystem Kosten erzeugt.

**Scale trigger:** ClickHouse/Timescale/QuestDB erst evaluieren/promoten, wenn gemessene
Abfragen, Tick-Volumen, Backtest-Latenz oder Nutzerparallelität die Parquet/DuckDB-Stufe
überschreiten.

## Asset scope

Im ersten Zielumfang:

- Crypto
- Aktien
- Forex
- Rohstoffe
- Indizes

Bonds sind explizit `OUT_OF_SCOPE_FOR_INITIAL_BACKTEST_STORE`.

## Current 1,000-asset readiness finding

The current repository already has provider/history gateways, FinTech durable traceability,
evidence/Data-Quality contracts and protected backtest authorization boundaries. However,
the canonical analysis inventory still classifies quantitative backtesting/history consumers
as `COMPATIBILITY_ONLY` or blocked until verified canonical history/OHLCV exists. The
database therefore is **control/evidence ready but not historical-market-warehouse ready**.

For the first 1,000-asset rollout, promote the canonical history contract to partitioned
Parquet/object storage and consume it through DuckDB before introducing another always-on
database. Supabase should persist dataset manifests, provider/provenance refs, DQ outcomes,
backtest run metadata and compact result/evidence records—not the entire raw historical
series.
