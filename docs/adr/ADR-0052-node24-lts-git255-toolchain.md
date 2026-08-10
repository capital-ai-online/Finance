# ADR-0052 — Node.js 24 LTS & Git 2.55 Toolchain Baseline

Status: Proposed  
Date: 2026-08-10  
Owner: CAPITAL-AI

## Deutsch

### Kontext

CAPITAL-AI verwendete vor diesem ADR Node.js 22 in GitHub Actions und in beiden Docker-Stages. Die GitHub-hosted Ubuntu-24.04-Runner lieferten Git 2.54.0. Upstream ist Git 2.55.0 aktuell. Node.js 26 ist die Current-Linie, während Node.js 24 (Krypton) die aktuelle LTS-Linie ist.

Für die Produktionsanwendung wird nicht auf die nicht-LTS Current-Linie Node 26 gewechselt. Stattdessen wird Node.js 24.18.0 LTS als einheitliche CI-, lokale Entwicklungs- und Docker-Runtime eingeführt. Das Docker-Image bleibt unveränderlich über einen SHA-256-Digest gepinnt.

Git wird im CI-Hauptlauf auf mindestens 2.55.0 angehoben. Dafür wird auf Ubuntu das auf git-scm.com für die aktuelle stabile Upstream-Version dokumentierte `git-core/ppa` verwendet. Die Installation erfolgt vor `actions/checkout`, sodass auch nachfolgende Git-Operationen des Workflows die aktualisierte Version verwenden.

### Release-Impact

Git 2.55 verbessert unter anderem Merge-, Fetch-, Repository- und Sicherheitsverhalten. Rust-Unterstützung ist beim Bau von Git standardmäßig aktiviert, ist für die Verwendung des vorgebauten Ubuntu-Pakets jedoch kein Applikations-Build-Requirement.

Node.js 24.17.0 enthielt mehrere Security-Fixes in TLS, HTTP/2, DNS/Net und WebCrypto. Node.js 24.18.0 aktualisiert unter anderem Root-Zertifikate und HTTP-/Crypto-Verhalten und vergrößert den standardmäßigen Buffer-Pool. Im Repository wurden keine bekannten Legacy-Node-APIs gefunden, die vor diesem Upgrade eine Code-Migration erfordern.

### Entscheidung

1. Produktions- und CI-Runtime: Node.js 24.18.0 LTS.
2. Docker: `node:24.18.0-alpine` mit immutable Multi-Platform-Digest.
3. Lokale Node-Authority: `.nvmrc` mit `24.18.0`.
4. Git CI Minimum: 2.55.0.
5. Keine Node-26-Current-Runtime in Produktion vor einer separaten LTS-/Compatibility-Entscheidung.
6. Docker-Hardening-Regex wird gemeinsam mit der Runtime-Basis aktualisiert; ein Node-22-Produktionsimage wird danach explizit blockiert.

### Risiken und Rollback

Das Node-Major-Upgrade verändert V8, npm und einzelne Core-API-Details. Deshalb bleiben TypeScript, Unit-Tests, Production Build, Docker Build, Runtime-Metadaten und Render-Deploy verpflichtende Gates. Bei Regression wird auf den letzten verifizierten Node-22-Digest und Node-22-CI-Stand zurückgerollt.

Die Git-PPA-Nutzung betrifft ausschließlich CI-Tooling und nicht das Produktionscontainer-Image. Fällt die PPA-Verfügbarkeit aus, blockiert CI fail-closed; ein stilles Downgrade unter Git 2.55 findet nicht statt.

## English

### Context

CAPITAL-AI previously used Node.js 22 in GitHub Actions and both Docker stages. GitHub-hosted Ubuntu 24.04 runners exposed Git 2.54.0 while upstream Git 2.55.0 is current. Node.js 26 is the Current line; Node.js 24 (Krypton) is the production-oriented LTS line.

### Decision

CAPITAL-AI standardizes CI, local development and production Docker on Node.js 24.18.0 LTS, keeps the Docker base immutable by SHA-256 digest, and upgrades the primary CI Git toolchain to at least Git 2.55.0 using the Ubuntu `git-core/ppa` documented by git-scm.com. Node 26 Current is intentionally not introduced into production in this change.

The Docker hardening policy is updated together with the runtime baseline so a legacy Node 22 production image is rejected. Existing TypeScript, unit, build, Docker, runtime-metadata and Render deployment gates remain mandatory.
