# M3 CI Hardening Evidence

Status: IN PROGRESS
Date: 2026-08-11
Baseline: `main@de879d7d060e769bf9240c891f75b5ac6a1556bf` (M2G merge)
Authority: ADR-0060, ADR-0053, ESS-0019, GitHub governance

## 1. Ausgangsbefund

Die M2G-Validierung von PR #194 war ein reiner Dokumentations-PR. Trotzdem lief im Required Check `build-and-test` vor dem Checkout ein vollständiger Build von Git 2.55.0 aus Source. Docker wurde bereits korrekt scope-basiert übersprungen. Damit waren zwei M3-Gaps bestätigt:

1. Der Git-Tarball wurde nur strukturell mit `xz --test`, nicht gegen einen repository-gepinnten kryptografischen Digest geprüft.
2. Reine Dokumentations-PRs verbrauchten weiterhin unnötig Actions-Minuten für Git-Source-Build, Node/npm, Tests und Production Build.

## 2. Implementierte Controls

### M3-C01 — stabiler Required Check
`build-and-test` bleibt unverändert die technische Job-ID und damit der Required-Check-Contract.

### M3-C02 — immutable Checkout / keine persistierten Credentials
Scope-Ermittlung beginnt mit dem bereits SHA-gepinnten `actions/checkout` und `persist-credentials: false`.

### M3-C03 — conservative Docs-only Fast Path
Nur PRs, deren geänderte Dateien vollständig in `docs/**`, `.ai/**` oder Markdown-Dateien fallen, dürfen `full_validation=false` erhalten. Jede andere Datei fällt fail-closed auf vollständige Validierung zurück. `push` auf `main` ist immer `full_validation=true`.

### M3-C04 — kein Repository-Code im Scope-Preflight
Vor der Scope-Entscheidung werden keine Package-Manager-, Test-, Build- oder Repository-Skripte ausgeführt. Es werden ausschließlich Git-Metadaten/Diffs gelesen und der Commit mit `git rev-parse` verifiziert.

### M3-C05 — kryptografischer Git-Source-Pin
Für vollständige Validierung wird `git-2.55.0.tar.xz` weiterhin über HTTPS von kernel.org geladen. Vor `xz --test`, Extraction und Build wird der exakte SHA-256-Digest geprüft:

`457fdb04dc8728e007d4688695e6912e6f680727920f2a40bf11eacc17505357`

Mismatch, Downloadfehler oder Buildfehler blockieren CI fail-closed.

### M3-C06 — vollständige Validierung für relevante Änderungen
Bei Code, Workflow, Dependencies, Konfiguration, Runtime, Docker oder Deployment bleiben Node Setup, `npm ci`, Audit, Production Config, Docker Hardening, TypeScript, Unit Tests, Production Build, CSP, Predeploy und gegebenenfalls Docker-Build verpflichtend.

### M3-C07 — main bleibt Full Validation
Jeder Push nach `main` läuft vollständig. Die Kostenoptimierung verändert damit nicht den bestehenden Production-Deploy-Gate.

## 3. Nicht Teil von M3

- kein GitHub `production` Environment;
- keine Render-/Supabase-/Stripe-Mutation;
- keine SLSA-Attestation oder Release-Provenance-Erzeugung (M6);
- keine Änderung am Agent IAM (M4);
- keine OTel/Audit-Erweiterung (M5).

## 4. Validierungsmatrix

| Evidence | Erwartung | Status |
|---|---|---|
| geänderter `ci.yml` PR | Full Validation | PENDING PR-CI |
| Git 2.55 SHA-256 Check | PASS vor Extraction | PENDING PR-CI |
| Workflow Security Validator | SHA pinning/minimal permissions/concurrency PASS | PENDING PR-CI |
| TypeScript + Unit Tests + Build | PASS | PENDING PR-CI |
| PR Production Deploy | Render-Trigger skipped | PENDING PR-CI |
| nachgelagerter docs-only PR | Fast Path, `build-and-test` success | PENDING POST-MERGE EVIDENCE |
| main push | Full Validation | PENDING POST-MERGE EVIDENCE |

## 5. M3 Exit

M3 darf erst `COMPLETE` werden, wenn:

1. der M3-Implementierungs-PR vollständig grün ist;
2. die Git-Tarball-Digestprüfung nachweislich im Full Path ausgeführt wurde;
3. Governance den geänderten Workflow akzeptiert;
4. nach Merge ein `main`-Run den Full Path bestätigt;
5. ein reiner Dokumentations-PR den Fast Path erfolgreich demonstriert;
6. `docs/architecture/ROADMAP.md`, die M0–M9-Roadmap und Traceability mit der M3-Evidence aktualisiert sind.

## 6. Rollback

Bei Fehlklassifikation oder CI-Regression wird der Docs-only Fast Path entfernt und Full Validation für alle PRs wiederhergestellt. Der SHA-256-Pin für den Git-Tarball bleibt erhalten und darf durch den Kosten-Rollback nicht zurückgenommen werden.
