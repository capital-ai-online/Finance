# ADR-0053 — Node.js 24 LTS & Git 2.55 Toolchain Baseline

Status: Accepted  
Date: 2026-08-10  
Last updated: 2026-08-11 (M3 CI Hardening)  
Owner: CAPITAL-AI

## Deutsch

### Kontext

CAPITAL-AI verwendete vor diesem ADR Node.js 22 in GitHub Actions und in beiden Docker-Stages. Die GitHub-hosted Ubuntu-Runner liefern eine andere Git-Version als die für CAPITAL-AI gewählte Upstream-Baseline Git 2.55.0. Node.js 24.18.0 LTS ist die gewählte Produktions-, CI- und lokale Entwicklungs-Linie.

Das Produktions-Docker-Image bleibt über einen SHA-256-Digest unveränderlich gepinnt. Git 2.55.0 wird für vollständige Validierung aus dem offiziellen Source-Tarball von kernel.org gebaut und unter `/opt/git-2.55.0` installiert. Der optionale Rust-Unterbau wird mit `NO_RUST=YesPlease` deaktiviert, weil CAPITAL-AI in CI ausschließlich die klassische Git-CLI benötigt.

### Entscheidung

1. Produktions- und CI-Runtime: Node.js 24.18.0 LTS.
2. Docker: `node:24.18.0-alpine` mit immutable Multi-Platform-Digest.
3. Lokale Node-Authority: `.nvmrc` mit `24.18.0`; `package.json` begrenzt auf die Node-24-LTS-Linie.
4. Git CI Baseline: exakt 2.55.0 für vollständige Validierungsläufe.
5. Git-Source wird über HTTPS von kernel.org bezogen.
6. Der Git-2.55.0-Tarball MUSS vor `xz --test`, Extraction und Build fail-closed gegen den im Repository/Workflow gepinnten SHA-256-Wert `457fdb04dc8728e007d4688695e6912e6f680727920f2a40bf11eacc17505357` geprüft werden.
7. `xz --test` bleibt als zusätzliche Strukturprüfung bestehen, ist aber nicht mehr der alleinige Integritätsnachweis.
8. Optionale Rust-Git-Subsysteme werden im CI-Build mit `NO_RUST=YesPlease` deaktiviert.
9. Nach Checkout ist für vollständige Validierung `git fsck --strict --no-dangling` ein fail-closed Repository-Integritätsgate.
10. Keine Node-26-Current-Runtime in Produktion vor einer separaten LTS-/Compatibility-Entscheidung.
11. Der stabile Required Check bleibt technisch `build-and-test`.

## M3 Addendum — Risk-based CI & kryptografischer Source-Pin (2026-08-11)

### Anlass

Die M0/M2G-Evidence zeigte, dass selbst reine Dokumentations-PRs den vollständigen Git-2.55.0-Source-Build, `npm ci`, Unit-Tests und den Production Build ausführen. Dies verursacht vermeidbare GitHub-Actions-Kosten, obwohl der Docker-Build bereits scope-basiert übersprungen wurde. Gleichzeitig dokumentierte dieser ADR selbst, dass `xz --test` keine kryptografische Integritätsprüfung darstellt.

### Ergänzende Entscheidung

CAPITAL-AI führt einen fail-closed, pfadbasierten CI-Fast-Path ein:

- `push` auf `main`: immer vollständige Validierung.
- Pull Requests mit Änderungen außerhalb von `docs/**`, `.ai/**` oder Markdown-Dateien: immer vollständige Validierung.
- Reine Dokumentations-PRs: der Required Check `build-and-test` bleibt vorhanden und erfolgreich ausführbar, überspringt jedoch Git-Source-Kompilation, Node/npm-Setup, Tests, Production Build, Predeploy und Docker-Build.
- Die separaten Governance-Workflows bleiben für Dokumentations-PRs aktiv; Repository-Konventionen und Workflow-Security werden dadurch nicht umgangen.
- Die Scope-Klassifikation erfolgt unmittelbar nach einem minimalen, SHA-gepinnten `actions/checkout` mit `persist-credentials: false`.
- Dieser initiale Checkout dient nur der Ermittlung des Diffs und der Commit-Existenz. Bei Vollvalidierung wird vor Ausführung von Repository-Code, Dependency-Installation, Tests oder Builds die verifizierte Git-2.55.0-Toolchain installiert.
- Damit wird die frühere Formulierung „Git 2.55.0 wird vor `actions/checkout` gebaut“ für den M3-Stand ersetzt.

### Trust Boundary

Der initiale Scope-Checkout besitzt keine persistierten Zugangsdaten und verwendet ausschließlich eine auf vollständigen 40-Zeichen-SHA gepinnte Checkout-Action. Er darf keine Repository-Skripte, Package-Manager oder Build-Schritte ausführen. Sobald `full_validation=true` ist, gilt Git 2.55.0 als Toolchain-Authority für die folgenden Git-Integritäts- und Software-Validierungsschritte.

### Kosten-/Sicherheitsauswirkung

Die Optimierung reduziert teure Linux-Actions-Minuten nur bei nachweislich dokumentationsreinem PR-Scope. Sie reduziert keine Tests für Code, Workflow, Dependencies, Runtime, Docker oder Deployment. `main` bleibt immer vollständig validiert, sodass vor dem bestehenden Produktions-Deploy-Pfad weiterhin die vollständige CI durchlaufen wird.

### Risiken und Rollback

Risiko: Eine zu breite Docs-only-Klassifikation könnte eine relevante Änderung fälschlich in den Fast Path einordnen. Deshalb ist die Allowlist bewusst eng; jede nicht eindeutig dokumentarische Datei fällt automatisch auf vollständige Validierung zurück.

Rollback: Die Scope-Bedingungen können entfernt und alle Schritte wieder unconditional ausgeführt werden. Der SHA-256-Pin für den Git-Tarball darf bei einem Rollback der Kostenoptimierung nicht entfernt werden.

### Verification

M3 ist erst abgeschlossen, wenn:
- ein Workflow-ändernder PR die vollständige Validierung erfolgreich durchläuft;
- die SHA-256-Prüfung des Git-Tarballs in diesem Lauf erfolgreich ist;
- ein nachgelagerter reiner Dokumentations-PR den Fast Path nachweislich nutzt und trotzdem `build-and-test` + Governance erfolgreich meldet;
- `main` nach Merge weiterhin vollständige Validierung ausführt.

## ADR-ID-Integrität

Der Toolchain-ADR verwendet `ADR-0053`, da `ADR-0052` der Transactional PDF-Credit Ledger Authority ist.

## English summary

CAPITAL-AI standardizes production/CI on Node.js 24.18.0 LTS and full-validation Git operations on Git 2.55.0. M3 adds a pinned SHA-256 verification for the upstream Git tarball before extraction/build and introduces a conservative documentation-only PR fast path. The required check remains `build-and-test`; every `main` push and every non-documentation change still receives full validation. The initial checkout used for scope classification is immutable-SHA pinned and does not persist credentials or execute repository code.