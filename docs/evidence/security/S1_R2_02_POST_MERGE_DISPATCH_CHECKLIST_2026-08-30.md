# S1-R2-02 — Post-Merge Dispatch Checklist

- Date: 2026-08-30
- Code merge: PR #611 → `main@dc3dd333a14668a8510a98c30fdc5abef1087fb0`
- Current main at bind: `main@4e3de6f489989e64962225874dd7dd69400fcd95` (includes #612)
- Live production `/healthz`: `status=ok` at 2026-08-30T16:23:47Z; `x-capital-ai-commit=4e3de6f489989e64962225874dd7dd69400fcd95`; platform version `0.6.0`
- Mutation status: OWNER DISPATCH PENDING / FULL APPLY BLOCKED until script safety
- Does not apply the ruleset from this branch

## Warum dieser Schritt hier nicht ausgeführt wird

`ruleset-sync.yml` läuft nur auf `refs/heads/main` gegen Environment `ruleset-admin`. Ein Feature-Branch darf `mode=full` nicht anwenden.

## Owner-Schritte auf main

1. Actions → **Ruleset Sync (main-production-protection)** → `workflow_dispatch`
2. Zuerst `mode=plan`, Diff lesen
3. `mode=full` und `apply-package-a` bleiben **BLOCKED**, bis `scripts/security/rulesetSync.mjs` `required_linear_history` im Desired-Payload besitzt oder bewusst erhält (Befund in PR #615 / `S1_R2_02_RULESET_SYNC_FULL_SAFETY_AUDIT_2026-08-30.md`)
4. Erst nach Script-Fix und Owner-ACCEPT: `mode=full`
5. Readback-Evidence sichern

## Erwarteter Readback nach einem späteren zulässigen full apply

- `deletion` vorhanden
- `non_fast_forward` vorhanden
- `pull_request` vorhanden
- `required_review_thread_resolution=true`
- `required_linear_history` bleibt vorhanden
- Required Checks unverändert: `build-and-test`, `PR Governance (Kosten / Workflow / Vorlage)`, `Hardened image / HIGH+CRITICAL CVE gate`, `GitGuardian Security Checks`
- `bypass_actors=[]`
- `current_user_can_bypass=never`
- `required_signatures` bleibt **abwesend** gemäß Owner-Entscheidung 2026-08-30

## Live-Abweichung 2026-08-30 Abend

Owner hat `required_signatures` deaktiviert, damit Connector-Commits mergebar bleiben. PR #613 (Signing-Automation) wurde verworfen. Ein `full` Apply darf `required_signatures` nicht stillschweigend wieder einschalten und darf `required_linear_history` nicht entfernen.

## Rollback

Nur über denselben Owner-gated `ruleset-sync`-Pfad. Kein ad-hoc Ruleset-API-Call durch Agenten.
