# S1-R2-02 — Post-Merge Dispatch Checklist

- Date: 2026-08-30
- Code merge: PR #611 → `main@dc3dd333a14668a8510a98c30fdc5abef1087fb0`
- Current synchronized repository baseline: `main@f714eae6a551ac8f3f92f4070f693c88ec35f6fc` (includes #612, #614 and #615)
- Production identity: bound separately by the machine-managed exact-head PR preflight; not inferred by this checklist
- Mutation status: OWNER DISPATCH PENDING / #615 REMEDIATION MERGED / FULL APPLY REQUIRES SEPARATE OWNER-ACCEPT
- Does not apply the ruleset from this branch

## Warum dieser Schritt hier nicht ausgeführt wird

`ruleset-sync.yml` läuft nur auf `refs/heads/main` gegen Environment `ruleset-admin`. Ein Feature-Branch darf `mode=full` nicht anwenden.

## Owner-Schritte auf main

1. Auf trusted `main@f714eae6` prüfen, dass die #615-Remediation und deren Exact-Head-PASS vorliegen
2. Actions → **Ruleset Sync (main-production-protection)** → `workflow_dispatch`
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

## Live-Abweichung nach #615-Merge — Readback 2026-08-30, 19:39 CEST

Der Readback enthält weiterhin nur `non_fast_forward`, `pull_request` (ohne CODEOWNER- und Thread-Resolution-Pflicht) und `code_quality`. `required_status_checks`, `required_linear_history` und `deletion` fehlen live. `required_signatures` ist gemäß Owner-Entscheidung absichtlich deaktiviert; PR #613 bleibt verworfen. Die über #615 gemergte Policy-/Builder-/Floor-Remediation hat selbst keine Provider-Mutation ausgeführt. Ein späteres `full` Apply darf Signing nicht still reaktivieren und muss die fehlenden Schutzregeln herstellen.

## Rollback

Nur über denselben Owner-gated `ruleset-sync`-Pfad. Kein ad-hoc Ruleset-API-Call durch Agenten.
