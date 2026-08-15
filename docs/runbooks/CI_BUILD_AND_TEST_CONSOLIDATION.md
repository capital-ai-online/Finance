# Runbook — CI-Konsolidierung auf build-and-test

Status: OWNER ACTION REQUIRED BEFORE MERGE  
ADR: ADR-0073

## Vorher

Required Checks:

- `capital-ai-ci`
- `build-and-test`
- `GitGuardian Security Checks`

## Nachher

Required Checks:

- `build-and-test`
- `GitGuardian Security Checks`

## Owner-Schritte

1. Live-Ruleset `main-production-protection` öffnen.
2. Nur `capital-ai-ci` aus Required status checks entfernen.
3. Prüfen, dass `build-and-test` und GitGuardian erhalten bleiben.
4. Keine Bypass Actors hinzufügen.
5. Einstellung speichern.
6. Im Konsolidierungs-PR bestätigen, dass der Ruleset-Cutover abgeschlossen ist.
7. Erst danach Merge freigeben.

## Fail-Closed

Falls `capital-ai-ci` vor dem Merge weiterhin Required ist, darf der PR nicht gemergt werden.
Nach einem Merge würde sonst jeder neue PR auf einen nicht mehr gemeldeten Check warten.

## Umsetzung im Repository

`.github/workflows/capital-ai-ci-shadow.yml` wird **nicht gelöscht**, sondern stillgelegt:

- `on:` enthält nur noch `workflow_dispatch`;
- der Workflow meldet für Pull Requests keinen `capital-ai-ci`-Check mehr;
- Jobinhalt, Pinning, Read-only-Permissions und `persist-credentials: false` bleiben unverändert.

Grund: Der Required-Check `Sicherheit geänderter Workflows` verbietet Workflow-Löschungen
fail-closed und ohne Ausnahmepfad (`scripts/security/verifyChangedWorkflowSecurity.mjs`,
geladen aus dem vertrauenswürdigen `main`-Stand). Die Stilllegung erreicht dasselbe Ziel,
ohne diese Sicherheitsinvariante aufzuweichen.

## Rollback

Frischen Branch erstellen und den `pull_request`-Trigger wieder eintragen:

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, edited]
  workflow_dispatch:
```

`capital-ai-ci` erst nach einem realen PASS wieder als Required Check setzen.

## Erwarteter Nutzen

- ein statt zwei vollständiger Node-/Build-Läufe pro PR;
- geringere Actions-Kosten;
- unverändertes Owner-Gate;
- unveränderte technische Prüftiefe.
