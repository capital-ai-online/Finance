# S1-R2-02 — Post-Merge Dispatch Checklist

- Date: 2026-08-30
- Code merge: PR #611 → `main@dc3dd333a14668a8510a98c30fdc5abef1087fb0`
- Current synchronized baseline: `main@460e8dd088a78f426cac392c20da104f5873ecad` (includes #612 and #614)
- Production preflight baseline: production/main `460e8dd088a78f426cac392c20da104f5873ecad`; platform version `0.6.0`
- Mutation status: OWNER DISPATCH PENDING / FULL APPLY BLOCKED until PR #615 is Human-merged and its exact head is green
- Does not apply the ruleset from this branch

## Warum dieser Schritt hier nicht ausgeführt wird

`ruleset-sync.yml` läuft nur auf `refs/heads/main` gegen Environment `ruleset-admin`. Ein Feature-Branch darf `mode=full` nicht anwenden.

## Owner-Schritte auf main

1. PR #615 Human-reviewen und mergen; dessen Exact-Head-Checks müssen PASS sein
2. Danach auf aktuellem `main`: Actions → **Ruleset Sync (main-production-protection)** → `workflow_dispatch`
3. Zuerst `mode=plan`, Diff lesen und gegen den kanonischen Floor prüfen
4. `mode=full` und `apply-package-a` bleiben bis zur expliziten Owner-Freigabe **BLOCKED**
5. Erst nach Owner-ACCEPT: `mode=full`; anschließend Readback-Evidence sichern

## Erwarteter Readback nach einem späteren zulässigen full apply

- `deletion` vorhanden
- `non_fast_forward` vorhanden
- `pull_request` vorhanden
- `required_review_thread_resolution=true`
- `required_linear_history` vorhanden
- Required Checks vorhanden: `build-and-test`, `PR Governance (Kosten / Workflow / Vorlage)`, `Hardened image / HIGH+CRITICAL CVE gate`, `GitGuardian Security Checks`
- `bypass_actors=[]`
- `current_user_can_bypass=never`
- `required_signatures` bleibt **abwesend** gemäß Owner-Entscheidung 2026-08-30

## Live-Abweichung 2026-08-30, 19:08 CEST

Der Readback enthält nur `non_fast_forward`, `pull_request` (ohne CODEOWNER- und Thread-Resolution-Pflicht) und `code_quality`. `required_status_checks`, `required_linear_history` und `deletion` fehlen live. `required_signatures` ist gemäß Owner-Entscheidung absichtlich deaktiviert; PR #613 bleibt verworfen. PR #615 behebt Policy, Builder und Floor, führt aber selbst keine Provider-Mutation aus. Ein späteres `full` Apply darf Signing nicht still reaktivieren und muss die fehlenden Schutzregeln herstellen.

## Rollback

Nur über denselben Owner-gated `ruleset-sync`-Pfad. Kein ad-hoc Ruleset-API-Call durch Agenten.
