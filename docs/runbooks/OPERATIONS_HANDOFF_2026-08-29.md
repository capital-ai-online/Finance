# CAPITAL-AI Operations Handoff — 2026-08-29

Status: PARTIAL / ACTION REQUIRED  
Last synchronized: 2026-08-30  
Repository baseline: `main@b8c4757aaa62a2a63745e2f86a777630968f4f5d`  
Live production deployment: `b8c4757aaa62a2a63745e2f86a777630968f4f5d`  
Active candidate branch: `security/s1-r2-09-11-hardening-20260830`  
Canonical Security authority: `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`

## Zweck und Authority-Grenze

Dieses Dokument konsolidiert Operations-, Provider-, Deployment- und Recovery-Evidence für S1. Es ergänzt `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`, ersetzt aber weder die kanonische S1-Roadmap noch Owner-Gates für externe Mutationen.

Es existiert weiterhin **keine zweite Security-Roadmap**. Finding-Status und das `HARDENED / VERIFIED`-Gate gehören ausschließlich in `S1_SECURITY_HARDENING_ROADMAP.md`.

## 1. Verifizierte Repository- und Produktionsidentität

### GitHub

- `main`: `b8c4757aaa62a2a63745e2f86a777630968f4f5d`
- Dieser Stand ist der Human-Merge von PR #618.
- Die aktive R2-09..R2-11-Arbeit liegt separat auf `security/s1-r2-09-11-hardening-20260830` und ist **noch keine Production Evidence**.

### Render — am 2026-08-30 erneut verifiziert

- Workspace: `AICapital`
- Service: `Finance`
- Runtime: Docker
- Branch: `main`
- Region: Frankfurt
- Plan: Starter
- Auto-Deploy: `no` / Trigger `off`
- Health-Check: `/healthz`
- Instanzen: 1
- Live Deploy: `b8c4757aaa62a2a63745e2f86a777630968f4f5d`
- Status: `live`
- Trigger des Live-Deploys: `deploy_hook`

Damit gilt am Synchronisationszeitpunkt:

```text
Production commit = b8c4757aaa62a2a63745e2f86a777630968f4f5d
main commit       = b8c4757aaa62a2a63745e2f86a777630968f4f5d
```

Production und `main` sind aktuell identisch. Der Candidate Head muss weiterhin separat gebunden werden.

### Supabase

Zuletzt erneut verifiziert am 2026-08-30:

- Projekt: `AIFINANCIAL`
- Ref: `ryzywoktpmyhwzxmstyu`
- Region: `eu-west-1`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: `17.6.1.127`, Engine `17`, Release Channel `ga`

Diese Health-/Versionslesung beweist keine Backup-Retention und keine Auth-Konfigurationsmutation.

## 2. Owner-Entscheidung zu S1-R2-08

Status: **OWNER-ACCEPTED / TIER EXCEPTION**.

Der Owner hat am 2026-08-30 festgelegt, dass Supabase leaked-password protection im aktuellen Free/Base-Tier nicht umgesetzt wird, weil die native Funktion auf diesem Tier nicht verfügbar ist. Es wird dafür **kein eigener Passwort-Leak-Dienst und keine zweite Passwortdatenbank** eingeführt.

Operative Konsequenzen:

- keine Supabase-Provider-Mutation für R2-08;
- vorhandene kompensierende Auth-/Abuse-Kontrollen bleiben bestehen und dürfen nicht geschwächt werden;
- die Ausnahme ist erneut zu bewerten, wenn der Supabase-Tier wechselt oder das Feature im aktiven Tier verfügbar wird;
- die Ausnahme autorisiert nicht das Überspringen anderer offener R2-P1-Gates.

## 3. Liveness, Readiness und Fatal Recovery

Betriebsvertrag bleibt:

| Endpunkt | Zweck | Semantik |
|---|---|---|
| `/healthz` | Render-Liveness | laufender Prozess |
| `/healthz/readiness` | nicht-sensitive Readiness-Projektion | kann Degradation anzeigen |
| `/readyz` | striktes Fach-/Dependency-Gate | `200` ready, `503` not-ready |

S1-R2-04 bleibt `OPEN / CONFIRMED`: der Fatal-Recovery-Pfad benötigt weiterhin fail-fast, bounded cleanup, non-zero exit und post-deploy Render-Supervisor-Evidence.

## 4. GitHub Default-Branch Enforcement — S1-R2-02

Status: **PARTIAL / OWNER DISPATCH PENDING**.

Repositoryseitig sind Ruleset-Reconciliation und kanonischer Policy-Floor vorhanden. Live-Provider-Evidence benötigt weiterhin den Owner-gated Pfad:

1. trusted `main`;
2. `ruleset-sync mode=plan`;
3. vollständigen Diff prüfen;
4. separate Owner-Akzeptanz;
5. erst dann `mode=full`;
6. Provider-Readback und Enforcement-Nachweis.

`required_signatures` bleibt absichtlich optional. Dieser R2-09..R2-11-PR führt keine GitHub-Ruleset-Mutation aus.

## 5. Stripe Operations Boundary

### R2-05 — Redirect Boundary

Bleibt **OPEN / CONFIRMED**. Der separate Redirect-Finding wird durch den R2-10-Sandbox-Fix nicht als geschlossen dargestellt. Client-gelieferte absolute Redirect-Authorities müssen weiterhin durch einen server-owned Origin/relative-target Contract ersetzt werden.

### R2-10 — Demo-/Sandbox-Isolation im Candidate

Status: **IMPLEMENTED / PR VERIFY PENDING**.

Candidate-Verhalten:

- fehlender/Placeholder Stripe Publishable Key darf in **Development** einen Sandboxpfad öffnen;
- dieser Pfad ist explizit an `import.meta.env.DEV === true` gebunden;
- in Production führt derselbe Zustand fail-closed zu einer Checkout-Fehlermeldung;
- Production setzt `demoMode` nicht aktiv und kann den simulierten Success-/Tier-Pfad dadurch nicht erreichen;
- Couponvalidierung bleibt serverseitig über `/api/stripe/validate-coupon` autoritativ.

Post-Merge/Deploy muss verifiziert werden, dass der Production-Bundle-/Runtime-Pfad keine Development-Sandbox freigibt.

R2-00/R2-06 bleiben davon getrennt: Entitlement Authority muss weiterhin server-/Stripe-verifizierbar sein.

## 6. CSP Operations — S1-R2-09

Status: **IMPLEMENTED / PR + POST-DEPLOY VERIFY PENDING**.

Candidate-Verhalten in `server/securityResponse.ts`:

- zentrale CSP-Response-Boundary bleibt unverändert die Authority;
- Produktionsdefault wird von `report-only` auf **`strict`** angehoben;
- Nonce + `'strict-dynamic'` bleiben enforced;
- `'unsafe-eval'` bleibt ausgeschlossen;
- `CSP_MODE=report-only` bleibt expliziter Diagnose-/Rollbackpfad;
- `CSP_MODE=baseline` bleibt expliziter Availability-Recovery-Pfad;
- leere/ungültige Produktionswerte fallen auf `strict`, nicht auf eine schwächere Policy.

### Post-Deploy Evidence

Nach Human-Merge und verifiziertem Deployment sind mindestens zu prüfen:

- `X-CSP-Mode: strict`;
- enforced `Content-Security-Policy` enthält nonce/strict-dynamic;
- kein unerwarteter `Content-Security-Policy-Report-Only`-Header im Strict-Modus;
- App-Bootstrap funktioniert;
- Stripe Checkout, Consent/CookieHub, hCaptcha und weitere genehmigte Integrationen funktionieren;
- bei Availability-Regression ausschließlich bestehende `report-only`/`baseline` Recovery-Modi verwenden.

Bis diese Evidence vorliegt, ist R2-09 nicht `VERIFIED PASS`.

## 7. Backup / RPO / RTO — S1-R2-07

Status bleibt **OPEN / UNVERIFIED**.

Es fehlen weiterhin:

- business-approved RPO/RTO;
- nachweislich laufender verschlüsselter Off-site-Backup-Pfad;
- gemessene Backup-Age/RPO;
- isolierter Restore-Drill;
- gemessene End-to-End-RTO und Integritätsnachweis.

Ein Runbook allein ist kein Recovery-Nachweis.

## 8. Evidence Identity / Staleness — S1-R2-11

Status: **IMPLEMENTED / PR VERIFY PENDING**.

Bestehende Authority wird wiederverwendet:

- `scripts/pr/productionPreflight.mjs` erzeugt content-addressed Production/Main/Head-Baselines;
- `.github/workflows/pr-production-baseline-refresh.yml` ist der trusted-main Auto-Refresh-Pfad;
- Candidate-Code wird dort nicht als Policy-Authority ausgeführt.

Der Candidate erweitert die bestehende Semantik um explizite Maschinenzustände:

| Zustand | Bedeutung |
|---|---|
| `CURRENT` | Body bindet bereits die aktuelle Production/Main/Head-Identität |
| `STALE` | aktuelle Baseline weicht von der im Body gebundenen Identität ab |
| `CURRENT_AFTER_REFRESH` | STALE wurde durch trusted Auto-Refresh atomar korrigiert |
| `STALE_RETRY_REQUIRED` | Head/Main/Boundary änderte sich während Preflight/Write; kein unsicherer Write |

Regressionstests prüfen `CURRENT`, `STALE`, markerfreien kontrollierten Repair sowie fail-closed Duplicate-/Ambiguity-Zustände.

Dieser Mechanismus ersetzt keine Human-Merge-Entscheidung. Kandidaten dürfen ihre eigene Governance-Semantik nicht als vertrauenswürdige Policy ausführen.

## 9. Render Secret Boundary

Kanonische server-only Authority bleibt:

- `finance-secrets.env`;
- `scripts/security/secretFileManifest.ts`;
- `server/env.ts`;
- `server/validateRuntimeSecrets.ts`;
- `scripts/automation/verifyDeploymentReadiness.ts`.

Keine Secret-Werte werden für diesen Workstream gelesen oder in Evidence/PR-Body aufgenommen.

## 10. Rollback

- **Code:** Human-reviewed Revert-PR; keine direkte `main`-Mutation.
- **CSP:** explizit `report-only` oder `baseline` als bestehende Recovery-Modi; keine zweite CSP-Authority.
- **Billing Sandbox:** Revert des Candidate-Commits nur über normalen PR-Pfad; Production darf nicht als Sandbox-Ersatz betrieben werden.
- **Evidence Refresh:** bestehender trusted-main Workflow; bei Identity Race `STALE_RETRY_REQUIRED`, kein erzwungener Body-Write.
- **Render:** nur verifizierte Deployment-Identitäten, anschließend Health/Ready/Auth/Billing prüfen.
- **GitHub Ruleset / Supabase / sonstige Provider:** nur separat Owner-gated.

## 11. Combined R2 Tail Handoff

Der Owner hat ausdrücklich angeordnet, R2-09 bis R2-11 in **einem Pull Request** zu erledigen. Der kombinierte Scope ist:

```text
R2-08 Owner-Tier-Exception dokumentieren
+ R2-09 CSP strict production default
+ R2-10 Stripe demo/sandbox production isolation
+ R2-11 machine stale-state semantics
+ targeted regression tests
+ S1/Ops synchronization
```

Keine Provider-Mutation erfolgt durch den Branch. Der PR ist wegen Runtime-/Security-Scope als Klasse R zu behandeln.

Vor Merge erforderlich:

- Branch gegen aktuellen `main` korrelieren;
- vollständige kanonische PR-Baseline Production/Main/Head;
- Governance/Security;
- TypeScript/Lint;
- Unit Tests inklusive `s1R2SecurityHardening.test.ts` und PR-Governance-Tests;
- Production Build/CSP-Pfad;
- Predeploy/Readiness soweit Workflow-Contract verlangt;
- `build-and-test`;
- Human/CODEOWNER Review;
- separater Human-Merge.

Nach Merge erforderlich:

- verifiziertes Render-Deployment des Merge-Commits;
- CSP Strict Post-Deploy Evidence;
- Billing Production Sandbox-DENY bestätigen;
- Production/Main/PR-Evidence-Auto-Refresh beobachten und R2-11 final verifizieren;
- Roadmap/Handoff nur dann auf `VERIFIED PASS` für R2-09..11 fortschreiben, wenn die jeweilige Evidence vollständig ist.

## 12. Gesamt-Handoff

R2-08 ist eine explizite Tier-Ausnahme. R2-09..11 sind auf dem Candidate implementiert, aber noch nicht Human-gemergt oder Production-verifiziert. Frühere offene P1-Controls R2-00, R2-02..R2-07 bleiben unverändert offen/partial und blockieren weiterhin den globalen `HARDENED / VERIFIED`-Status.
