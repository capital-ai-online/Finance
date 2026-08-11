# CAPITAL-AI GitHub Main Protection Policy

Status: M1 Baseline
Stand: 2026-08-10
Repository: `SvenKulessa/Finance`

## Ziel

Diese Policy definiert den verbindlichen GitHub-Layer der providerunabhängigen AI-Agent-Delivery-Kette. Sie ergänzt CAPITAL-AI IAM, Capability Grants, Step-up, Approval und Audit Controls; sie ersetzt diese nicht.

## Verifizierter Serverzustand

Das aktive Ruleset `main-production-protection` schützt `main` bereits durch:

- Pull-Request-Pflicht,
- Required Check `build-and-test`, strict,
- Löschschutz,
- Non-Fast-Forward-Schutz,
- keine Bypass Actors.

## Single-Owner-Ausnahme

Zum M1-Zeitpunkt besitzt das private Repository genau einen Collaborator mit Admin-Rechten: `SvenKulessa`.

Deshalb bleibt `required_approving_review_count = 0`, solange keine zweite unabhängige vertrauenswürdige Reviewer-Identität existiert. Eine pauschale Pflicht zu einer GitHub-Approval würde den PR-Autor im aktuellen persönlichen Repository dauerhaft blockieren und damit kein wirksames Vier-Augen-Prinzip erzeugen.

Bis zur Einführung einer unabhängigen Reviewer-Identität gelten als kompensierende Kontrollen:

1. kein Agent darf direkt nach `main` schreiben;
2. Agentenänderungen müssen über isolierte Branches und Pull Requests laufen;
3. `build-and-test` bleibt fail-closed;
4. HIGH/CRITICAL-Aktionen benötigen die CAPITAL-AI Capability-/Approval-/Step-up-Kette;
5. Agenten dürfen ihre eigenen HIGH/CRITICAL-Änderungen nicht autorisieren;
6. Break-glass muss attributierbar, zeitlich begrenzt und auditierbar sein.

Sobald eine unabhängige Reviewer-Identität verfügbar ist, werden mindestens eine Approval sowie Code-Owner-Review und Last-Push-Approval aktiviert.

## Gewünschte weitere GitHub-Controls

Ohne Single-Owner-Deadlock sollen serverseitig gelten:

- `required_review_thread_resolution = true`
- `require_code_owner_review = true`
- `require_last_push_approval = true`
- stale review dismissal bei neuen relevanten Pushes
- dediziertes geschütztes GitHub Environment `production`
- Deployment nur von `main`

Die aktuell angebundene GitHub-App bietet keine Ruleset-/Environment-Schreiboperation. Diese serverseitigen Felder sind daher als expliziter Admin-Handoff zu behandeln und dürfen nicht fälschlich als automatisiert umgesetzt dokumentiert werden.

## Agent Branch Contract

Zugelassene Präfixe:

- `agent/`
- `claude/`
- `gemini/`
- `copilot/`
- `ai/`

Der Providername ist nur Herkunftsmetadatum. Autorisierung erfolgt ausschließlich über Capability, Risk Class, Policy und Approval.

## Geschützte Artefaktklassen

CODEOWNERS soll mindestens folgende sicherheitskritische Bereiche abdecken:

- GitHub Workflows und Policies
- Agent Tooling und Control Plane
- IAM / Step-up / Capability Controls
- Telemetry / Audit / Traceability
- Deployment Identity / Render-Konfiguration
- Supabase Migrationen
- Release-/Supply-Chain-Evidence
- ADR-/ESS-Governance für diese Controls

## Drift Contract

Der maschinenlesbare Sollvertrag liegt in:

`.github/policies/main-production-protection.expected.json`

Serverseitige Evidence soll in späteren Assurance-Läufen gegen diesen Sollvertrag verglichen werden.

## Definition of Done M1

M1 ist abgeschlossen, wenn:

- der Sollvertrag versioniert ist;
- CODEOWNERS die Agent-/IAM-/Telemetry-/Supply-Chain-Flächen abdeckt;
- Single-Owner-Risiko und Promotion-Bedingung dokumentiert sind;
- kein bestehender Ruleset-Schutz abgeschwächt wird;
- serverseitig nicht automatisierbare Einstellungen als Handoff ausgewiesen sind;
- PR-CI erfolgreich ist.
