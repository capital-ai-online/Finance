# CAPITAL-AI Operations Handoff — 2026-08-29

Status: PARTIAL / ACTION REQUIRED
Last synchronized: 2026-08-30
Repository baseline: `main@2bc3020b3ea8fba122d9f9ca3a7051e079244b4f`
Live production deployment: `f714eae6a551ac8f3f92f4070f693c88ec35f6fc`
Canonical Security authority: `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`

## Zweck und Authority-Grenze

Dieses Dokument konsolidiert die **Operations-/Provider-/Recovery-Evidence** für den aktiven S1-Security-Hardening-Stand. Es ergänzt `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`, ersetzt aber weder die kanonische S1-Roadmap noch Provider-Evidence oder Owner-Gates für produktive Mutationen.

Es wird ausdrücklich **keine zweite Security-Roadmap** geführt. Security-Priorität, Finding-Status und `HARDENED / VERIFIED`-Gate gehören in `S1_SECURITY_HARDENING_ROADMAP.md`; dieses Handoff dokumentiert den operativen Ist-Stand und die verbleibenden Provider-/Recovery-Schritte.

## 1. Verifizierte Repository- und Produktionsidentität

### Repository

- GitHub `main`: `2bc3020b3ea8fba122d9f9ca3a7051e079244b4f`
- `main` enthält den Human-Merge von PR #617 nach PRs #611/#612/#614/#615.
- PR #617 war dokumentations-/governance-only; er änderte keine Runtime-, Dependency- oder Workflow-Datei.

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
- Live-Deploy: `f714eae6a551ac8f3f92f4070f693c88ec35f6fc`
- Live-Deploy-Status: `live`
- Deploy-Trigger: `deploy_hook`

Damit gilt aktuell:

```text
Production commit = f714eae6a551ac8f3f92f4070f693c88ec35f6fc
main commit       = 2bc3020b3ea8fba122d9f9ca3a7051e079244b4f
```

Die Commit-Identitäten sind **nicht gleich**. Der Abstand entsteht durch den dokumentations-/governance-only Merge von PR #617. Für Runtime-/Dependency-/Workflow-Scope wurde durch #617 kein neuer Produktionsunterschied eingeführt. Trotzdem dürfen Production und `main` nicht als dieselbe Deployment-Identität ausgegeben werden.

### Supabase — am 2026-08-30 erneut verifiziert

- Projekt: `AIFINANCIAL`
- Project Ref: `ryzywoktpmyhwzxmstyu`
- Region: `eu-west-1`
- Status: `ACTIVE_HEALTHY`
- Postgres: `17.6.1.127`
- Engine: `17`
- Release Channel: `ga`

Diese Provider-Lesung bestätigt Gesundheit/Version, aber **keine** Backup-Retention, Restore-Fähigkeit, leaked-password-Einstellung oder andere Auth-/Backup-Mutation.

## 2. Liveness und fachliche Readiness

`/healthz` bleibt bewusst der schnelle Render-Liveness-Contract. Externe Markt-/AI-Provider dürfen diesen Endpunkt nicht durch Quota-, Preis- oder Drittanbieter-Ausfälle in einen Restart-Loop zwingen.

Der fachliche Readiness-Contract bleibt getrennt:

| Endpunkt | Semantik | HTTP-Verhalten |
|---|---|---|
| `/healthz` | Prozess-/Plattform-Liveness | 200 bei laufendem Prozess |
| `/healthz/readiness` | nicht-sensitive fachliche Readiness-Projektion | 200 auch bei fachlicher Degradation |
| `/readyz` | striktes fachliches Gate | 200 = ready, 503 = not-ready |

Blocking Checks von `/readyz` bleiben:

1. Supabase ist konfiguriert.
2. Das produktionsrelevante IAM-Schema `profiles.iam_role` ist erreichbar.
3. Stripe Core ist vollständig konfiguriert: Secret Key, Publishable Key, Webhook Secret.
4. Der erwartete Stripe-Produktkatalog ist vollständig konfiguriert: Starter monatlich/jährlich, Pro monatlich/jährlich, Enterprise, Founder und PDF-Export.

Optional konfigurierte Markt-/AI-Provider werden als Capability-Zustand projiziert und sind keine Restart-Bedingung. Secret-Werte, Präfixe, Längen oder Teilidentifikatoren dürfen nicht ausgegeben werden.

### S1-R2-04 Bezug

Der Readiness-Contract ist vorhanden, aber **Fatal Process Recovery ist nicht geschlossen**. Der aktuelle Servercode behandelt `uncaughtException` weiterhin als Log-only-Fall und beendet den Prozess bewusst nicht. Damit fehlt weiterhin die verifizierte Sequenz:

```text
fatal error
→ readiness unhealthy / no new work
→ bounded cleanup
→ non-zero process exit
→ Render supervisor replacement
→ healthy replacement instance
```

Bis lokale Child-Process-Evidence und post-deployment recovery evidence vorliegen, bleibt S1-R2-04 `OPEN / CONFIRMED`.

## 3. Render Secret Correlation

Kanonische Repository-Authority bleibt:

- Render Secret File: `finance-secrets.env`
- Key-Manifest: `scripts/security/secretFileManifest.ts`
- Resolver: `server/env.ts`
- Runtime-Boot-Gate: `server/validateRuntimeSecrets.ts`
- Deployment-Coverage-Gate: `scripts/automation/verifyDeploymentReadiness.ts`

Alle Einträge aus `SECRET_FILE_KEYS` sind **server-only**. Für diese Secrets gilt weiterhin:

- exakter unpräfixierter Server-Key oder serverseitiges Environment;
- kein `VITE_*`-Alias darf einen fehlenden Server-Key ersetzen;
- keine Rückauflösung eines privilegierten Serverwerts in einen client-facing Namespace;
- kritische Runtime-Secrets werden beim Produktionsstart fail-closed validiert.

Negative Tests existieren für mindestens:

- `SUPABASE_SECRET_KEY`;
- `STRIPE_SECRET_KEY`;
- `STRIPE_WEBHOOK_SECRET`;
- `TOTP_ENCRYPTION_KEY`.

Der verfügbare Render-Zugriff liefert Service-/Deploy-Metadaten, aber keine vollständige sichere Secret-File-Keyliste und keine Secret-Werte. Deshalb gilt weiterhin:

- **Secret-Werte:** werden nicht gelesen oder korreliert.
- **Manifest-Abdeckung im Repository:** automatisiert prüfbar.
- **Kritische Runtime-Secrets:** fail-closed Boot-Gate vorhanden.
- **`VITE_*`-Alias für server-only Secrets:** DENY/fail-closed.
- **Exakte Dashboard-Key-zu-Manifest-Gleichheit:** **UNVERIFIED**, solange kein sicherer key-only Provider-Zugriff verfügbar ist.

### Governance-Drift

Der zuvor dokumentierte Gemini-Konfigurationsdrift bleibt als separater Governance-Cleanup zu behandeln, solange die zugehörigen Authorities und die tatsächliche Konfigurationslage nicht gemeinsam superseded/verifiziert wurden. Er wird nicht stillschweigend in S1 Recovery oder Runtime-Hardening vermischt.

## 4. GitHub Default-Branch Enforcement — S1-R2-02

Aktueller Status: **PARTIAL / OWNER DISPATCH PENDING**.

Repository-seitig sind die Remediation-/Policy-Bausteine gemergt:

- PR #611: Ruleset-Reconciliation-Pfad;
- PR #615: Policy-/Builder-/Floor-Härtung, `required_linear_history`, squash/rebase-only Zielvertrag und explizite Owner-Entscheidung gegen mandatory signing;
- PR #617: Post-Merge-Dispatch-Checkliste und Current-State-Synchronisierung.

Der dokumentierte Provider-Readback nach #615 zeigt jedoch weiterhin Live-Drift:

- vorhanden: `non_fast_forward`;
- vorhanden: `pull_request`, aber ohne CODEOWNER- und required-thread-resolution-Pflicht;
- vorhanden: advisory `code_quality`;
- leerer Bypass-Actor-Satz / `current_user_can_bypass=never` laut dokumentierter Evidence;
- fehlend: `required_status_checks`;
- fehlend: `required_linear_history`;
- fehlend: `deletion`;
- fehlend: CODEOWNER enforcement;
- fehlend: required review-thread resolution.

`required_signatures` bleibt **absichtlich abwesend**. Signing ist optionale Provenance und kein S1-Exit-Kriterium.

### Verbindlicher nächster Operations-Pfad

1. nur trusted `main`;
2. Owner startet `ruleset-sync` mit `mode=plan`;
3. vollständigen Diff gegen canonical expected policy/floor prüfen;
4. `mode=full` bleibt bis zu separatem Owner-ACCEPT blockiert;
5. nach akzeptiertem Full Apply providerseitigen Readback sichern;
6. erst danach R2-02 als `VERIFIED PASS` bewerten.

Evidence: `docs/evidence/security/S1_R2_02_POST_MERGE_DISPATCH_CHECKLIST_2026-08-30.md`.

## 5. Stripe Operations Boundary — S1-R2-00 / R2-05 / R2-06 / R2-10

Der aktuelle Serverpfad bestätigt weiterhin einen offenen Redirect-Boundary-Finding:

- `/create-checkout-session` akzeptiert `successUrl` und `cancelUrl` aus dem Request Body;
- `finalSuccessUrl` wird aus dem client-gelieferten `successUrl` abgeleitet;
- `cancel_url` wird weiterhin aus dem client-gelieferten Wert gesetzt.

Damit bleibt S1-R2-05 `OPEN / CONFIRMED` bis Produktions-Checkout-URLs aus einer server-owned Origin und validierten relativen Zielen konstruiert werden und die Negativtests externe/obfuskierte Redirect-Autoritäten ablehnen.

R2-00 bleibt zusätzlich als vollständiger Entitlement-Authority-Trace offen. R2-06 wird nur aktiviert, wenn dieser Trace einen echten browser-reachable Authority Gap bestätigt. R2-10 bleibt für die Isolation/Entfernung von Demo-/Simulationspfaden zuständig.

Wichtig: Checkout-Redirect oder Success-Page-Navigation ist **kein** Zahlungs-/Entitlement-Nachweis. Stripe-verifizierbare Server-/Webhook-Evidence bleibt die Authority.

## 6. Backup Retention, RPO und RTO — S1-R2-07

Status bleibt **OPEN / UNVERIFIED**.

Der operative Fallback und die Restore-Gates stehen in `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`.

- **RPO — Recovery Point Objective:** maximal tolerierbarer Datenverlust, gemessen als Zeit zwischen letztem belastbaren Recovery Point und Incident.
- **RTO — Recovery Time Objective:** maximal tolerierbare Zeit bis zur Wiederherstellung des vereinbarten Betriebszustands.

Aktueller Evidence-Stand:

- Supabase ist `ACTIVE_HEALTHY`, aber diese Health-Lesung beweist keine Backup-Retention.
- Wiederkehrender verschlüsselter Off-site-Backup-Lauf mit definierter Retention: **UNVERIFIED**.
- Tatsächlich gemessene Backup-Age / RPO: **UNVERIFIED**.
- Isolierter Restore-Drill auf separatem Ziel: **UNVERIFIED**.
- Gemessene End-to-End-RTO: **UNVERIFIED**.

Es werden weiterhin keine erfundenen Minuten-/Stundenwerte als SLA/SLO ausgegeben.

### Exit Operations Evidence

R2-07 darf erst schließen, wenn mindestens ein isolierter Restore-Drill:

- das tatsächliche Backup verwendet;
- nicht standardmäßig Production überschreibt;
- Schema/Daten/critical invariants validiert;
- Backup-Age/RPO und Restore-RTO misst;
- Credential-/Key-Failure fail-closed behandelt;
- Owner-Sign-off und nächsten Drill-Termin dokumentiert.

## 7. CSP Operations — S1-R2-09

Status: **PARTIAL / REPORT-ONLY**.

Die Runtime verfügt inzwischen über eine zentrale CSP-Response-Boundary mit:

- per-response Nonce;
- `baseline`;
- `report-only`;
- `strict`;
- Produktionsdefault `report-only`;
- Strict-Enforcement erst bei explizitem `CSP_MODE=strict`.

Damit ist die Implementierungsgrundlage vorhanden, aber der Produktions-Exit nicht erreicht. Vor Promotion sind ein definierter Observation-Zeitraum, Violation-Klassifikation sowie verifizierte Stripe/Supabase/Consent/hCaptcha-/sonstige Third-Party-Integrationen erforderlich. Rollback auf report-only bleibt Teil des Availability-Contracts.

## 8. Evidence Identity / Staleness — S1-R2-11

Status: **PARTIAL**.

Fortschritt:

- aktuelle PR-Governance kann Production, `main` und Candidate Head getrennt binden;
- content-addressed Baseline IDs werden eingesetzt;
- gleiche Repository-Inhalte und gleiche Deployment-Commit-Identität werden nicht gleichgesetzt.

Offen bleibt die automatische Stale-State-Logik für Security-/Operations-Snapshots. Ein `main`-Advance oder Production-Rollback muss alte Current-State-Evidence maschinell als `STALE` erkennbar machen, sofern sie nicht ausdrücklich historische Evidence ist.

Dieses Handoff folgt dem Contract bereits manuell, indem es Production `f714eae6...` und `main@2bc3020...` getrennt ausweist. Das ersetzt noch nicht den R2-11-Maschinennachweis.

## 9. Rollback

Anwendungs-/Deployment-Rollback und Daten-Restore bleiben getrennte Recovery-Ebenen.

- **Code:** branchbasierter Revert-PR; keine direkte Main-Mutation.
- **GitHub Ruleset:** ausschließlich über den Owner-gated kanonischen `ruleset-sync`-Pfad; keine ad-hoc Agent-API-Mutation.
- **Render:** letzter verifizierter Deploy/Commit anhand Evidence; anschließend `/healthz`, `/readyz`, Auth/IAM, Billing und betroffene Fachfunktion prüfen.
- **Daten:** nur mit belastbarem Backup und getrenntem Restore-Ziel; Produktiv-Restore bleibt Owner-gated.
- **Credentials:** bei Credential-Incident rotieren/revoken; niemals auf kompromittierte alte Werte zurückrollen.
- **CSP:** bei Availability-Impact zurück auf den dokumentierten report-only/baseline Recovery-Pfad, nicht durch Einführung einer zweiten CSP-Authority.

## 10. Handoff-Status

### Verifiziert / weiterhin belastbar

- aktuelles `main@2bc3020b3ea8fba122d9f9ca3a7051e079244b4f` gelesen;
- Render live Production `f714eae6a551ac8f3f92f4070f693c88ec35f6fc` am 2026-08-30 gelesen;
- Render Auto-Deploy bleibt aus; Service bleibt Docker/`main`/Frankfurt/Starter mit `/healthz`;
- Supabase-Projekt am 2026-08-30 erneut als `ACTIVE_HEALTHY`, `eu-west-1`, PostgreSQL 17.6.1.127 / engine 17 gelesen;
- Readiness-Contract `/healthz` + `/healthz/readiness` + `/readyz` bleibt dokumentierter Betriebsvertrag;
- server-only Secret-Resolver-/Boot-Gate-Härtung bleibt repositoryseitig vorhanden;
- S1-R2-01 ist als obsolete historische Phantom-Control klassifiziert;
- S1-R2-02 Repository-Remediation ist gemergt, aber Live-Apply/Readback bleibt offen;
- S1-R2-09 besitzt die technische baseline/report-only/strict Grundlage;
- content-addressed PR-Baseline/Identity-Binding ist vorhanden.

### Verbleibende Security/Ops-Arbeit

1. **R2-00:** vollständigen Entitlement-Authority-Trace abschließen.
2. **R2-02:** Owner `mode=plan`, separater ACCEPT, `mode=full`, Provider-Readback und Enforcement-Evidence.
3. **R2-03:** Node Control Plane vollständig auf 24.20.0 konvergieren.
4. **R2-04:** Fatal Process fail-fast + Render-Supervisor-Recovery beweisen.
5. **R2-05:** Stripe Redirect Boundary server-owned schließen.
6. **R2-06:** nur bei bestätigtem Authority Gap aktivieren.
7. **R2-07:** wiederkehrendes verschlüsseltes Off-site Backup + isolierten gemessenen Restore-Drill betreiben.
8. **R2-08:** leaked-password native Einstellung oder Owner-approved Compensating Controls evidenzieren.
9. **R2-09:** report-only Observation abschließen und Strict-Promotion evidenzieren.
10. **R2-10:** Demo-/Sandbox-Billing sauber vom Production Contract isolieren.
11. **R2-11:** automatische Security-Evidence-Staleness implementieren und testen.
12. exakte Render-Dashboard-Key-Inventur gegen Manifest erst durchführen, wenn ein sicherer key-only Provider-Zugriff verfügbar ist.
13. Gemini-Konfigurationsdrift governance-konform separat bereinigen.

## 11. Übergabe-Regel

Nach jedem weiteren relevanten Merge, Deploy, Ruleset-Apply oder Provider-Change werden mindestens folgende Identitäten erneut gelesen und getrennt dokumentiert:

```text
mainCommit
productionCommit
candidateHead (wenn PR-Kontext)
provider/config readback identity or timestamp
```

Weder Merge noch Roadmap-Status noch dieses Handoff autorisieren eigenständig Render-, Supabase-, Stripe-, Secret-, Ruleset- oder andere produktive Provider-Mutationen. Diese bleiben unter ihren jeweiligen Human-/Owner-Gates.