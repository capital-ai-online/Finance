# Render Deployment Evidence

Stand: 2026-08-10
Workspace: `AICapital`
Service: `Finance`
Service-ID: `srv-d91o1o9o3t8c73edi55g`
Region: Frankfurt
Runtime: Docker
Plan: Starter
Branch: `main`
Healthcheck: `/healthz`

## Verifizierte Konfiguration

- Repository: `SvenKulessa/Finance`
- Dockerfile: `./Dockerfile`
- Docker Context: `.`
- Auto Deploy: `no`
- Auto Deploy Trigger: `off`
- PR Previews: aus
- Instanzen: 1
- Port: TCP 10000
- öffentliche IP-Allowlist: `0.0.0.0/0`
- Registry Credential: GitHub Container Registry Credential vorhanden

## Deployment Evidence

Aktueller Live-Deploy zum Prüfzeitpunkt:

- Commit: `f615cf4062f60eff07772c948c461025729a89dd`
- Commit-Kontext: Merge PR #183, Observability-/Telemetry-O1-Baseline
- Trigger: API
- Status: `live`

Vorherige Deployments zeigen Deploy-Hook-, API- und manuelle Trigger. Damit ist die produktive Deployment-Kette funktionsfähig, aber noch nicht auf ein ausschließlich kurzlebiges OIDC-Identity-Modell reduziert.

## Bewertung

Positiv:
- Produktionsbranch eindeutig `main`.
- Auto-Deploy ist abgeschaltet.
- Healthcheck ist konfiguriert.
- Docker-basierte reproduzierbare Runtime.

Offene Controls:
- OIDC statt langlebigem Deploy-Hook-/Secret-Modell prüfen.
- Deployment Authorization und Artifact Digest bis zur Runtime korrelieren.
- öffentliche Netzwerkexposition gegen tatsächlichen Web-Service-Bedarf dokumentieren.
- Deployment-Trigger auf eine einzige kontrollierte CI-Authority konsolidieren.

M7 bleibt der vorgesehene Meilenstein für OIDC/Deployment-Hardening.