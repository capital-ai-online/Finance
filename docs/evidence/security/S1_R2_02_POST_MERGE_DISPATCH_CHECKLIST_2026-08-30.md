# S1-R2-02 — Post-Merge Dispatch Checklist

- Date: 2026-08-30
- Code merge: PR #611 → `main@dc3dd333a14668a8510a98c30fdc5abef1087fb0`
- Current main at bind: `main@4e3de6f489989e64962225874dd7dd69400fcd95` (includes #612)
- Live production `/healthz`: `status=ok` at 2026-08-30T16:14:33Z; platform version remains `0.6.0`
- Mutation status: OWNER DISPATCH PENDING
- Does not apply the ruleset from this branch

## Warum dieser Schritt hier nicht ausgeführt wird

`ruleset-sync.yml` läuft nur auf `refs/heads/main` gegen Environment `ruleset-admin`. Ein Feature-Branch darf `mode=full` nicht anwenden.

## Owner-Schritte auf main

1. Actions → **Ruleset Sync (main-production-protection)** → `workflow_dispatch`
2. Zuerst `mode=plan`, Diff lesen
3. Bei ACCEPT `mode=full`
4. Readback-Evidence sichern

## Erwarteter Readback nach full apply

- `deletion` vorhanden
- `non_fast_forward` vorhanden
- `pull_request` vorhanden
- `required_review_thread_resolution=true`
- Required Checks unverändert: `build-and-test`, `PR Governance (Kosten / Workflow / Vorlage)`, `Hardened image / HIGH+CRITICAL CVE gate`, `GitGuardian Security Checks`
- `bypass_actors=[]`
- `current_user_can_bypass=never`

## Live-Abweichung 2026-08-30 Abend

Owner hat `required_signatures` wieder deaktiviert, damit Connector-Commits mergebar bleiben. PR #613 (Signing-Automation) wurde verworfen. Ein `full` Apply darf `required_signatures` nicht stillschweigend gegen diese Owner-Entscheidung wieder einschalten, sofern der Expected-Policy-Stand das noch als live beschreibt. Plan-Diff vor Apply ist verpflichtend.

## Rollback

Nur über denselben Owner-gated `ruleset-sync`-Pfad. Kein ad-hoc Ruleset-API-Call durch Agenten.
