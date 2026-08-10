# ADR-0053 — Node.js 24 LTS & Git 2.55 Toolchain Baseline

Status: Proposed  
Date: 2026-08-10  
Owner: CAPITAL-AI

## Deutsch

### Kontext

CAPITAL-AI verwendete vor diesem ADR Node.js 22 in GitHub Actions und in beiden Docker-Stages. Die GitHub-hosted Ubuntu-24.04-Runner liefern Git 2.54.0, während Git 2.55.0 als gewählte Upstream-Baseline verwendet wird. Node.js 26 ist die Current-Linie; Node.js 24 (Krypton) ist die gewählte Produktions-LTS-Linie.

Für die Produktionsanwendung wird nicht auf die nicht-LTS Current-Linie Node 26 gewechselt. Stattdessen wird Node.js 24.18.0 LTS als einheitliche CI-, lokale Entwicklungs- und Docker-Runtime eingeführt. Das Docker-Image bleibt unveränderlich über einen SHA-256-Digest gepinnt.

Git 2.55.0 wird vor `actions/checkout` aus dem offiziellen Source-Tarball von kernel.org gebaut und unter `/opt/git-2.55.0` installiert. Das heruntergeladene XZ-Archiv wird vor dem Entpacken strukturell mit `xz --test` validiert. Der optionale Rust-Unterbau von Git 2.55 wird mit dem upstream unterstützten `NO_RUST=YesPlease` deaktiviert, weil CAPITAL-AI in CI ausschließlich die klassische Git-CLI benötigt. Dadurch wird zugleich die Cargo/GNU-make-jobserver-Warnung vermieden, ohne Buildfehler zu unterdrücken.

### Release-Impact

Git 2.55 verbessert unter anderem Merge-, Fetch-, Repository- und Sicherheitsverhalten. Rust-Unterstützung ist in Git 2.55 optional und wird für diesen CI-Build bewusst nicht benötigt. Nach Checkout verifiziert CI den Commit und die Repository-Objektdatenbank mit `git rev-parse --verify 'HEAD^{commit}'` sowie `git fsck --strict --no-dangling`.

Node.js 24.17.0 enthielt mehrere Security-Fixes in TLS, HTTP/2, DNS/Net und WebCrypto. Node.js 24.18.0 aktualisiert unter anderem Root-Zertifikate und HTTP-/Crypto-Verhalten. Im Repository wurden keine bekannten Legacy-Node-APIs gefunden, die vor diesem Upgrade eine Code-Migration erfordern.

### Entscheidung

1. Produktions- und CI-Runtime: Node.js 24.18.0 LTS.
2. Docker: `node:24.18.0-alpine` mit immutable Multi-Platform-Digest.
3. Lokale Node-Authority: `.nvmrc` mit `24.18.0`; `package.json` begrenzt auf die Node-24-LTS-Linie.
4. Git CI Baseline: exakt 2.55.0 für diesen Upgrade-Schritt.
5. Git-Source wird über HTTPS von kernel.org bezogen; XZ-Strukturintegrität wird vor Extraction geprüft.
6. Optionale Rust-Git-Subsysteme werden im CI-Build mit `NO_RUST=YesPlease` deaktiviert.
7. Nach Checkout ist `git fsck --strict --no-dangling` ein fail-closed Repository-Integritätsgate.
8. Keine Node-26-Current-Runtime in Produktion vor einer separaten LTS-/Compatibility-Entscheidung.
9. Docker-Hardening-Regex wird gemeinsam mit der Runtime-Basis aktualisiert; ein Node-22-Produktionsimage wird danach explizit blockiert.

### Risiken und Rollback

Das Node-Major-Upgrade verändert V8, npm und einzelne Core-API-Details. Deshalb bleiben TypeScript, Unit-Tests, Production Build, Docker Build, Runtime-Metadaten und Render-Deploy verpflichtende Gates. Bei Regression wird auf den letzten verifizierten Node-22-Digest und Node-22-CI-Stand zurückgerollt.

Der Git-Source-Build betrifft ausschließlich CI-Tooling und nicht das Produktionscontainer-Image. Ist kernel.org nicht erreichbar, ist das Archiv beschädigt, schlägt der Build fehl oder meldet `git fsck` einen Objektfehler, blockiert CI fail-closed. Ein stilles Downgrade unter Git 2.55 findet nicht statt. `xz --test` validiert die Archivstruktur, ist jedoch keine kryptografische Publisher-Signaturprüfung.

### ADR-ID-Integrität

Während der Synchronisation mit `main` wurde festgestellt, dass `ADR-0052` bereits dem Transactional PDF-Credit Ledger gehört. Der Toolchain-ADR wurde deshalb auf `ADR-0053` verschoben, um eine doppelte Architekturentscheidungs-ID zu verhindern.

## English

### Context

CAPITAL-AI previously used Node.js 22 in GitHub Actions and both Docker stages. GitHub-hosted Ubuntu 24.04 runners expose Git 2.54.0, while this change selects Git 2.55.0 as the CI baseline. Node.js 26 is the Current line; Node.js 24 (Krypton) is the selected production LTS line.

### Decision

CAPITAL-AI standardizes CI, local development and production Docker on Node.js 24.18.0 LTS and keeps the Docker base immutable by SHA-256 digest. Git 2.55.0 is built before checkout from the official kernel.org source tarball. The XZ archive is structurally validated before extraction, optional Rust subsystems are disabled via upstream-supported `NO_RUST=YesPlease`, and the checked-out repository is validated with strict Git object-database checks.

Node 26 Current is intentionally not introduced into production. The Docker hardening policy is updated together with the runtime baseline so a legacy Node 22 production image is rejected. Existing TypeScript, unit, build, Docker, runtime-metadata and Render deployment gates remain mandatory.

The toolchain decision uses ADR-0053 because ADR-0052 became authoritative for the Transactional PDF-Credit Ledger on `main` before this PR was merged.
