# OPS-08-SUPABASE-RESILIENCE — Backup, Retention, Security und Upgrade-Vorbereitung

**Project:** `CAPITAL-AI-OPS`  
**Alias:** `OPS`  
**Primary PVC:** `PVC-08 — Production Operations`  
**Canonical project folder:** `docs/projects/operations/`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Branch:** `agent/operations-supabase-resilience-postmerge-20260928`  
**Base:** `main@075c152dca639a9c238a94234295a16cb2f2f4c4`  
**State:** `MERGED_MAIN / EVIDENCE_GATE / RECOVERY_LIVE_EVIDENCE_PENDING / GDRIVE_CREDENTIALS_REQUIRED`

## Business outcome

Der Slice schützt die produktive User-/Auth-/Evidence-Datenbank, reduziert unnötigen
Postgres-Hot-Storage und macht den geplanten Supabase-Upgrade-Pfad reproduzierbar. Er
erweitert ausschließlich den bestehenden `OPS Recovery Evidence`-Pfad
(`OPS-08-SEC-07`) und erzeugt keinen zweiten Backup- oder Security-Controller.

Die technische Priorität bleibt dem Produktnutzen untergeordnet: Supabase wird nicht zu
einem monolithischen Backtesting-Warehouse ausgebaut. Für die nächste Monetarisierungsphase
bleiben User/Auth, Konfiguration, Jobs, Evidence, Scores und kleine operative Datensätze in
Supabase; große historische Marktserien werden kostengünstig separat gehalten.

## Live-baseline 2026-09-25

- Supabase project: `AIFINANCIAL / ryzywoktpmyhwzxmstyu`, `eu-west-1`.
- PostgreSQL: `17.6`, Supabase bundle `17.6.1.127`, `ACTIVE_HEALTHY`.
- Database size: ca. 86 MiB.
- `cron.job_run_details`: ca. 81k Datensätze / ca. 55 MiB.
- Cron producer: `stripe-sync-worker` jede Minute; zusätzlich täglicher Privacy-Retention-Job.
- Replication slots: 0.
- App tables `public + fintech_core`: 47; RLS überall aktiv; alle mit Primary Key;
  keine invaliden App-Indizes.
- SECURITY DEFINER: 21 Funktionen in den App-Schemas; keine davon durch `PUBLIC`
  ausführbar.
- Storage: 1 privater Bucket, 0 Objekte.
- Letzte 7 Tage `security_events`: 207 blockierte `suspicious_request`-Events;
  beobachtete Ursache vollständig `Blocked CORS Origin: https://mta-sts.capital-ai.online`.
  Dies ist ein blockiertes Routing/CORS-Signal, kein Malware-Nachweis.

## Backup- und Retention-Konzept

### B1 — täglicher verschlüsselter Recovery Point

Der kanonische Workflow läuft täglich um **04:00 Europe/Berlin**. Da GitHub-Schedules
UTC verwenden, existieren die beiden Trigger 02:00 und 03:00 UTC; ein kleiner
Timezone-Gate lässt nur den tatsächlich lokalen 04:00-Lauf weiterlaufen.

Der bestehende Supabase-Dump bleibt erhalten:

`roles.sql + schema.sql + data.sql -> tar.gz -> age/X25519 -> GitHub Artifact`.

Plaintext-Dumps werden nicht als Artifact veröffentlicht und nach der Verschlüsselung
gelöscht. Artifact-Retention bleibt 35 Tage. RPO-Ziel bleibt 24 Stunden.

### B2 — wöchentliches pg_cron-Archiv

Jeden Montag um 04:00 Europe/Berlin werden alle vollständig abgeschlossenen Kalenderwochen
aus `cron.job_run_details` einzeln exportiert:

`cron-job-run-details_YYYY-MM-DD_to_YYYY-MM-DD.csv -> gzip -9 -> age/X25519`.

Für jedes Paket werden Row-Count, Byte-Größe und SHA-256-Evidence geschrieben. Der
Cron-Command wird im Archiv nicht im Klartext gespeichert, sondern nur als SHA-256,
damit ein historischer Jobtext keine Secrets in die Off-site-Evidence trägt. Erst wenn
das verschlüsselte Wochenpaket zusammen mit dem normalen Recovery Artifact erfolgreich
in GitHub Actions **und** im wöchentlichen Google-Drive-Spiegel verifiziert wurde, darf
die zugehörige abgeschlossene Hot-History gelöscht werden. Die laufende Woche bleibt
immer in Postgres.

Damit entsteht eine praktische Hot-Retention von höchstens ungefähr einer Woche bei
normalem Montagscadence, ohne Audit-Historie zu vernichten.

### B3 — Google-Drive-Spiegel alle sieben Tage

Der Montagslauf spiegelt ausschließlich verschlüsselte Dateien nach Google Drive.
Zielordner:

- `CAPITAL-AI Supabase Backups`
- Folder-ID: `13HiWDBT2WAID_7l0TL2SjS2DiI5HlP_e`

Die Upload-Implementierung ist immutable: vorhandener Dateiname + gleicher Digest wird
als verifiziert wiederverwendet; gleicher Name + anderer Digest führt fail-closed zum
Fehler statt zu einem stillen Überschreiben.

Für unbeaufsichtigte GitHub-Läufe werden eine dedizierte Google-OAuth-Identity und folgende
GitHub-Secrets benötigt:

- `OPS_RECOVERY_GDRIVE_CLIENT_ID`
- `OPS_RECOVERY_GDRIVE_CLIENT_SECRET`
- `OPS_RECOVERY_GDRIVE_REFRESH_TOKEN`

Die nicht geheime Zielordner-ID `13HiWDBT2WAID_7l0TL2SjS2DiI5HlP_e` ist direkt im Recovery-Workflow gebunden; dafür ist keine zusätzliche GitHub-Variable erforderlich.
Der OAuth-Account sollte ausschließlich für Recovery-Zwecke genutzt werden. Falls der
verwendete OAuth-Scope breiten Drive-Zugriff benötigt, begrenzen Account-Inhalt und
Uploader-Allowlist den praktischen Blast Radius auf dieses Recovery-Ziel.

## Zweck, Nutzen und Mehrwert der Retention

**Zweck:** operative Job-Historie aus dem teuren/latenten Hot-Postgres entfernen, ohne
Audit-Evidence zu verlieren.

**Nutzen:** weniger Tabellen- und Index-Bloat, schnellere Maintenance/Upgrade-Vorgänge,
kleineres Backup-Volumen und weniger Risiko beim von Supabase dokumentierten
`pg_cron`-Upgrade-Copy.

**Mehrwert:** die bisher schnell wachsende technische Nebenhistorie verbraucht nicht länger
den knappen Free-Tier-Datenbankplatz, während verschlüsselte Wochenarchive für Diagnose,
Audit und Restore nachvollziehbar bleiben.

## Security-Workflow

Der bestehende Recovery-Workflow schreibt pro Lauf zusätzlich eine kleine, PII-freie
Security-Posture-Evidence: RLS-Abweichungen, fehlende Primary Keys, invalide App-Indizes,
PUBLIC-ausführbare SECURITY-DEFINER-Funktionen, Replication Slots, Security-Event-Zähler,
Storage-Exposition sowie Cron-History-Größe.

Die Repository-Supply-Chain bleibt bei den bereits vorhandenen kostenlosen/open-source
Kontrollen:

`Gitleaks -> OSV Scanner -> npm audit -> Trivy -> zizmor -> GitGuardian`.

GitHub Advanced Security bzw. CodeQL werden durch diesen Slice weder benötigt noch
aktiviert.

## Supabase IAM / Schema / Contract Readback

Der Live-Readback hat keine benutzerdefinierte Login-Rolle gefunden; die beobachteten zehn
Login-Rollen sind Supabase-Systemrollen. Damit entfällt derzeit das zentrale
Pause/Restore-Risiko selbst verwalteter Rollenpasswörter.

Die drei Stripe Edge Functions bleiben bewusst `verify_jwt=false`, besitzen aber
alternative Authentisierung:

- `stripe-setup`: Bearer-Setup-Secret aus Supabase Vault; fehlendes/abweichendes Secret
  wird mit 401/403 abgewiesen.
- `stripe-webhook`: verlangt `stripe-signature` und validiert über Stripes
  `constructEventAsync`.
- `stripe-worker`: Bearer-Secret `stripe_sync_worker_secret` aus Vault; fehlend/ungültig
  führt zu 401/403.

Dies ersetzt nicht die externe Stripe-E2E-Prüfung, schließt aber die ältere
`verify_jwt=false / alternative control to verify`-Inventarlücke auf Code-/Live-Function-
Ebene.

## Data-pipeline / Backtesting boundary

Für ungefähr 1.000 Assets aus Crypto, Aktien, Forex, Rohstoffen und Indizes wird Supabase
nicht als alleiniger historischer Tick-/Backtesting-Speicher geplant. Bonds bleiben in
diesem Slice ausdrücklich außerhalb des Zielumfangs.

Empfohlene kostenschonende Reihenfolge:

`Provider ingest -> canonical evidence/quality -> Parquet object history -> DuckDB backtest
-> optional ClickHouse/Timescale/QuestDB hot analytics -> Supabase metadata/evidence -> UI`.

Supabase bleibt Authority für User/Auth, Profile, IAM, Job-Metadaten, Evidenz, kleine
Score-Snapshots und Produktzustand. Markt-Rohhistorie wird getrennt, damit Userlast und
Backtesting-Scans nicht um dieselben Postgres-Ressourcen konkurrieren.

## GitHub Enterprise Webhook use cases

GitHub Enterprise Cloud supports repository-, organization- and enterprise-scoped webhooks.
For CAPITAL-AI sollen Webhooks keine neue Authority bilden, sondern Ereignisse in die vorhandene
OPS/PVC-18-Traceability einspeisen.

Sinnvolle Event-Familien:

- `push`, `pull_request`, `workflow_job` / `workflow_run`: Current-Main-, CI- und
  Evidence-Projektionen event-driven aktualisieren statt zu pollen.
- `deployment` / `deployment_status`: Post-Deploy-Korrelation und Health-/Identity-Readback
  anstoßen, ohne selbst Deployment-Authority zu erzeugen.
- `repository` / Organization-Ereignisse: Enterprise-/Repo-Konfigurationsdrift als Evidence
  erfassen.
- Release/Page-Build-Ereignisse: owner-correct an SEO/Social übergeben, um Sitemap-/Indexing-,
  Launch- und Content-Workflows zeitnah nach produktiven Releases zu starten.

Security-Vertrag für einen späteren Listener: nur notwendige Events abonnieren, HTTPS,
Webhook-Secret/HMAC validieren, `X-GitHub-Delivery` idempotent deduplizieren und den Request
schnell bestätigen; fachliche Verarbeitung erfolgt danach über die bestehende EventMesh-/
Queue-Grenze.

Aktuelle GitHub-Einschränkung: eine auf Enterprise-Ebene installierte GitHub App erhält derzeit
keine Webhooks. Für App-Webhooks muss die App auf den betreffenden Organisationen installiert
werden. Ein Enterprise-/Organization-Webhook ist davon getrennt.

## Produkt- und SEO-Leitplanke

Infrastrukturarbeit endet an einem messbaren Produkt- oder Risikonutzen. Die nächsten
Daten-/Backend-Ausbaustufen werden deshalb nicht nach technischer Eleganz, sondern nach
Conversion-/Produkt-Evidence priorisiert:

`SEO-Reichweite -> Registrierung/Activation -> Multi-Asset Research/Scoring -> Backtest-MVP
-> gemessene Paid-Conversion -> erst dann zusätzliche Datenbank-/Streaming-Skalierung`.

Datenbankmigration oder zusätzlicher Dauerbetrieb wird nur dann promoted, wenn Nutzerlast,
Backtest-Latenz, Datenvolumen oder Umsatzsignal den Trigger tatsächlich belegen.

## Upgrade gate

Supabase empfiehlt für Hosted Projects ein In-place-Upgrade; die aktuell verbundene
Supabase-MCP-Schnittstelle bietet jedoch keinen `upgrade_project`-Befehl. Für Free-Tier
existiert alternativ `pause -> restore`, das über die Schnittstelle möglich ist, aber
eine andere Plattformoperation mit eigenen Recovery-Semantiken darstellt.

Deshalb gilt:

1. Cron-Historie archivieren und Retention verifizieren.
2. Tägliches Recovery Artifact erfolgreich erzeugen.
3. Security-Posture ohne neue Blocker prüfen.
4. Danach den Upgrade-Pfad erneut gegen die dann verfügbare Provider-Capability auflösen.
5. Nach Upgrade: Version, Auth, Edge Functions, Stripe, Realtime, Migrations-Ledger,
   Advisors und Render-Anwendung erneut lesen.

Kein Upgrade-PASS wird vor diesem Readback behauptet.


## Provider maintenance result — 2026-09-25

The Human-authorized Free-tier maintenance path was executed through the connected Supabase
provider: `ACTIVE_HEALTHY -> PAUSING -> INACTIVE -> restore -> COMING_UP -> ACTIVE_HEALTHY`.

The database remained PostgreSQL `17.6` / bundle `17.6.1.127`; no newer minor bundle was
offered/applied by the restore path. Application/database invariants survived the refresh.

A fresh 2026-09-26 provider readback closes the earlier migration-ledger drift:
remote history now contains `20260924171500_index_stripe_managed_webhooks_account_fk`,
and the previous Stripe managed-webhook FK advisor finding is no longer present.

Current Performance Advisor follow-up is separate from this recovery slice: three
unindexed owner-authorization/device foreign keys, four social-media RLS initplan
performance warnings and unused-index INFO findings. They remain owner-correct
maintenance candidates and are not changed ad hoc by this package.


## Post-merge live evidence — 2026-09-28

- PR #1469 was Human/CODEOWNER merged on 2026-09-26 at merge commit
  `f961ce6c9a15a4c627b7e6a21adf840f1584b5e9`.
- Current repository baseline for this reconciliation:
  `075c152dca639a9c238a94234295a16cb2f2f4c4`.
- Google Drive folder `CAPITAL-AI Supabase Backups` exists and remains empty at the
  2026-09-28 readback; no automatic Drive mirror is therefore claimed.
- Supabase remains `ACTIVE_HEALTHY` on PostgreSQL 17 / bundle `17.6.1.127`.
- Fresh database readback at 2026-09-28T02:05:56Z:
  database size `93,482,131` bytes; `cron.job_run_details` `85,754` rows /
  `60,579,840` bytes; no cron retention is claimed.
- Security Advisor follow-up is separate from this recovery work package:
  five RLS-enabled tables without policies, one mutable function search_path warning,
  plus plan-constrained leaked-password protection. These findings require owner-correct
  security/auth follow-up and are not silently remediated here.
- Recovery exit evidence remains pending until a successful encrypted recovery artifact
  is observed and, for weekly retention, the encrypted Google Drive mirror is verified
  before any `pg_cron` deletion.


## Recovery schedule delay defect — 2026-09-28

Observed GitHub scheduled runs `#23` and `#24` completed successfully but skipped
`Encrypted backup and isolated recovery evidence`. They started at 07:53Z and 08:49Z,
hours after the nominal cron slots, while the schedule gate evaluated the runner's actual
Europe/Berlin wall-clock hour and required it to equal `04`.

The last pre-gate recovery run `#22` produced
`ops-recovery-20260926T074010Z.tar.gz.age` with 1,116,486 bytes and SHA-256
`9b9f07b4b09a55ec6475fb3769fedf26fa1165f0d42b5dc7144ede00d5f06581`,
proving the dump/encryption/artifact path was functional before this scheduling regression.

The bounded remediation keeps both UTC cron slots but chooses the valid slot from
`github.event.schedule` plus the current Europe/Berlin UTC offset
(`+0200 -> 02:00 UTC`, `+0100 -> 03:00 UTC`). Delayed runner start time no longer
suppresses the backup. Weekly Monday archival still requires the selected slot and local
weekday Monday.


## PR #1486 post-merge closure — 2026-09-28

- Human/CODEOWNER merge: PR #1486 → `314cc14e3345573ee86b969ca84cf98e5c2d858a`.
- Implementation head: `ede12a8272aca2d8cc72fc48d8e69825df5e2694`.
- Exact-head evidence before merge: CI #6660, Governance #6155, Container Security #3640, Project Directive #919, PR #1015 and zizmor #766 completed successfully.
- Fresh CURRENT_MAIN readback: `d6fa99aa0980f72744855cf0d111c9cb91df0e38`; the PR #1486 merge is an ancestor of this generation with `behind=0`.
- Recovery schedule-gate claim is released/non-exclusive by issue #1488 closure.
- Repository implementation is therefore merged, but the package remains intentionally **EVIDENCE_GATE**: a successful encrypted recovery artifact and the weekly encrypted Google-Drive mirror must still be observed before retention/deletion exit evidence can be claimed.
- No Supabase, Google Drive, secret, IAM, retention or Production mutation is performed by this closure.
