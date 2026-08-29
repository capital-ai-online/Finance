# CAPITAL-AI Node Toolchain Write-Boundary Supersession

**Document ID:** `DOC-GOV-NODE-TOOLCHAIN-WRITE-BOUNDARY-SUPERSESSION-2026-08-29`  
**Date:** `2026-08-29`  
**Lifecycle:** `PROPOSED / IMPLEMENTATION IN BRANCH`  
**Branch:** `governance/node-toolchain-write-boundary-supersession-20260829-r3`  
**Base:** `main@ee8d14d831ce5483a7ea41e176805b355a952774`  
**Supersedes:** `implementation-baseline/node-toolchain-24.18.0` ausschließlich für die explizit korrelierten aktiven Control-Plane-Pfade.  
**Replacement:** `implementation-baseline/node-toolchain-24.20.0`.  
**Owner directive:** Supersession zur Auflösung der geschützten Workflow-Write-Blockade erstellen.  
**Higher authority:** `AUTH-GOV-AGENT-TRUST-ROOT`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `AUTH-GOV-SUPERSESSION-POLICY`.

## 1. Zweck

Der Security-Review vom 2026-08-29 hat eine Toolchain-Drift identifiziert: die Produktions-Docker-Baseline ist bereits auf Node `24.20.0` gehärtet, während mehrere aktive GitHub-Control-Plane-Pfade und die Root-Engine-Metadaten noch `24.18.0` verwenden.

Ein direkter Connector-Write auf bestehende sensitive Workflows wurde sicherheitsseitig blockiert. Diese Supersession umgeht diese Schutzgrenze nicht. Stattdessen führt sie einen zweistufigen, Human-Merge-gebundenen Bootstrap ein:

```text
Supersession-PR
→ Human/CODEOWNER Merge
→ Owner workflow_dispatch auf exakt gebundenem main
→ deterministischer Branch-Writer
→ neuer Remediation-Branch
→ separate Owner-Freigabe für PR-Erstellung
→ technische/gehostete Validierung
→ Human Merge
```

Es gibt keinen Direkt-Write auf `main`, keine automatische PR-Erstellung, keinen Merge, keinen Deploy und keine Provider-Mutation.

## 2. Supersession-Klassifikation

Die alten Node-`24.18.0`-Pins besitzen keine eigene stabile `AUTH-*`-Identität im Authority Registry. Sie sind Implementierungsdetails unter bestehenden Repository-/SDLC-/Security-Authorities. Deshalb wird keine neue konkurrierende Governance-Hierarchie geschaffen.

| Feld | Inhalt |
|---|---|
| Stable authority IDs | Replacement bleibt unter `AUTH-GOV-AGENT-TRUST-ROOT`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `AUTH-GOV-SUPERSESSION-POLICY` |
| Source artifact | aktive Node-24.18.0 Toolchain-Pins und Root-Engine-Metadaten auf `main@ee8d14d8...` |
| Replacement artifact | `scripts/security/applyNodeToolchainSupersession.mjs` + `.github/workflows/node-toolchain-write-boundary-supersession.yml` |
| Correlation | exakt Node-Runtime/CI/Control-Plane Toolchain-Baseline |
| Authority comparison | bestehende Owner-/Governance-Authority; keine neue konkurrierende Authority |
| Semantic diff | `24.18.0` → `24.20.0` für aktive Node-Ausführungspfade; keine Auth-/Deploy-/IAM-Semantikänderung |
| Operational impact | einmaliger Owner-gated Branch-Writer; ausschließlich neuer Remediation-Branch |
| Security impact | alte Runtime-Pins werden entfernt; fail-closed bei Baseline-/Scope-/Parallel-Writer-Abweichung |
| Regulatory impact | `N/A` — technische Security-/Supply-Chain-Härtung |
| Evidence impact | Git-Historie bleibt unverändert; historische Evidence wird nicht umgeschrieben |
| Rollback | vor Merge Branch verwerfen; nach Merge Human-reviewed Revert-PR |
| Owner decision | PR-Erstellung und Merge bleiben jeweils separat Human-gated |

## 3. Exakter Replacement-Scope

Der deterministische Transformer darf ausschließlich folgende Remediation erzeugen:

- `.nvmrc`: `24.18.0` → `24.20.0`
- `package.json` Root `engines.node`: `>=24.18.0 <25` → `>=24.20.0 <25`
- `package-lock.json` Root `packages[""].engines.node`: gleicher Wechsel
- `.github/workflows/ci.yml` — exakt zwei aktive Pins
- `.github/workflows/pr-production-baseline-refresh.yml` — exakt zwei aktive Pins
- `.github/workflows/pr-governance.yml` — exakt ein aktiver Pin
- `.github/workflows/google-marketing-protected-change.yml` — exakt ein aktiver Pin
- `.github/workflows/ionos-dns-admin.yml` — exakt ein aktiver Pin
- `.github/workflows/systemadmin-work-package-runner.yml` — exakt ein aktiver Pin
- `.github/workflows/systemadmin-roadmap-executor.yml` — exakt ein aktiver Pin
- `tests/unit/productionCiRunnerConsolidation.test.ts` — Assertion auf Node `24.20.0`
- `tests/unit/nodeToolchainBaseline.test.ts` — neuer Regressionstest

Quoted und unquoted YAML-Darstellungen der exakt erwarteten alten Version werden unterstützt; der Replacement-Output wird kanonisch quoted geschrieben.

**Nicht im Scope:** historische Security-/Evidence-Dokumente, Docker-Digest, Provider-Konfiguration, Supabase, Stripe, Render, Auth/IAM, M10-Semantik, Rulesets, PR-Template oder Deployment-Authority.

## 4. Fail-closed Preconditions

Der Bootstrap darf nur laufen, wenn alle Bedingungen gleichzeitig erfüllt sind:

1. `workflow_dispatch` läuft auf `refs/heads/main`.
2. Actor ist exakt `SvenKulessa`.
3. Owner gibt den exakten aktuellen `main` SHA als Input an.
4. Bestätigung lautet exakt `SUPERSEDE NODE TOOLCHAIN TO 24.20.0`.
5. Remote-`main` entspricht weiterhin dem erwarteten SHA.
6. Keine offene PR ändert einen Replacement-Zielpfad.
7. Der Transformer bestätigt die vollständig alte erwartete Remediation-Baseline; Mischzustände sind Fehler.
8. Nach Transformation entspricht die Git-Diff-Dateiliste exakt der festen Allowlist.
9. Die Transformation wird zunächst nur lokal im Hosted Runner committed.
10. Unmittelbar vor der ersten persistenten Mutation werden `main` und alle offenen PRs erneut korreliert.
11. Es wird ausschließlich ein Branch mit Prefix `security/node-toolchain-24-20-remediation-` erzeugt.
12. Der Workflow öffnet keinen PR und merged nichts.

Jede Abweichung vor dem finalen Push beendet die Supersession ohne persistenten Remediation-Branch.

## 5. Credential- und Privilege-Boundary

Der Bootstrap erhält ausschließlich:

```text
contents: write
pull-requests: read
```

Keine `id-token`, keine Provider-Secrets, keine Actions-Administration, kein Environment-Secret und kein Produktionszugriff sind erforderlich. `actions/checkout` verwendet `persist-credentials: false`. Erst nach erfolgreicher zweiter Main-/Open-PR-Korrelation wird der GitHub-Token für einen einzelnen Branch-Push als ephemerer HTTP-Authorization-Header verwendet.

## 6. Aktuelle Parallel-Korrelation

Unmittelbar vor Erstellung dieses R3-Kandidaten:

- aktueller `main`: `ee8d14d831ce5483a7ea41e176805b355a952774`;
- seit der R2-Baseline wurden 14 Commits integriert;
- deren geänderte Dateien liegen in Contract-Assurance- und Auth/Login-Scope und überschneiden keinen Node-/Workflow-Replacement-Zielpfad;
- aktuell existieren keine offenen Pull Requests gegen `main`;
- der frühere unvollständige Branch `security/node-toolchain-24-20-consolidation-20260829` bleibt kein Merge-Kandidat;
- R1/R2 sind historische Zwischenstände und werden nicht als PR-Kandidaten verwendet.

Vor jeder späteren PR-Erstellung oder Dispatch-Ausführung sind `main`, Candidate-Head und offene PRs erneut exact-snapshot-gebunden zu prüfen.

## 7. Semantic / Security Delta

### Vorher

```text
Docker production runtime: Node 24.20.0
GitHub CI/Governance/Systemadmin: teilweise Node 24.18.0
package metadata: >=24.18.0 <25
```

### Nachher

```text
Docker production runtime: Node 24.20.0
GitHub CI/Governance/Systemadmin: Node 24.20.0
.nvmrc/package.json/package-lock root engine: 24.20.0 baseline
```

Keine Autorisierungs-, IAM-, Billing-, Secret-, Provider- oder Deployment-Entscheidung wird erweitert.

## 8. Rollback

- Bootstrap noch nicht gemergt: Branch verwerfen; `main` bleibt unverändert.
- Bootstrap gemergt, Remediation-Branch noch nicht gemergt: Remediation-Branch löschen; Bootstrap via Human-reviewed Revert-PR zurücksetzen.
- Remediation bereits gemergt: frischen Revert-Branch vom dann aktuellen `main` erstellen und Human-reviewed mergen.

## 9. Effektivitätsgrenze

Dieses Dokument allein ändert keine aktive Node-Version. Die Supersession wird erst technisch wirksam, wenn der Bootstrap nach Human Review gemergt wurde, der Owner den exact-main-gebundenen Dispatch ausführt, der erzeugte Remediation-Branch separat reviewed wird, alle erforderlichen Exact-Head-Checks erfolgreich sind und der Human/CODEOWNER den Remediation-PR merged.
