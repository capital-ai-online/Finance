# CAPITAL-AI Operations Handoff — 2026-08-29

## Zweck

Dieses Dokument konsolidiert die offenen Operations-Handoff-Punkte gegen den verifizierten
Repository-/Provider-Stand. Es ergänzt `DEPLOYMENT_ROLLBACK_UND_BACKUP.md`, ersetzt aber weder
Provider-Evidence noch Owner-Gates für produktive Mutationen.

## 1. Verifizierte Produktionsidentität

- GitHub `main`: `9b2c0205b611e1d9c76e8c25dcc0d45ec1ce6bfa`
- Render-Service: `Finance`, Docker, `main`, Region Frankfurt, Plan Starter
- Render Auto-Deploy: deaktiviert
- Render Health-Check: `/healthz`
- Live-Deploy: Commit `9b2c0205b611e1d9c76e8c25dcc0d45ec1ce6bfa`, Trigger `deploy_hook`
- Supabase-Projekt: `ryzywoktpmyhwzxmstyu`, Region `eu-west-1`, Status `ACTIVE_HEALTHY`
- Supabase Postgres: 17.6.1.127 / Engine 17

Damit besteht zum Handoff-Zeitpunkt keine Production→`main`-Commit-Abweichung.

## 2. Liveness und fachliche Readiness

`/healthz` bleibt bewusst der schnelle Render-Liveness-Contract. Externe Markt-/AI-Provider
dürfen diesen Endpunkt nicht durch Quota-, Preis- oder Drittanbieter-Ausfälle in einen
Restart-Loop zwingen.

Der fachliche Readiness-Contract wird deshalb additiv getrennt:

| Endpunkt | Semantik | HTTP-Verhalten |
|---|---|---|
| `/healthz` | Prozess-/Plattform-Liveness | 200 bei laufendem Prozess |
| `/healthz/readiness` | vollständige nicht-sensitive Readiness-Projektion | 200, auch bei fachlicher Degradation |
| `/readyz` | striktes fachliches Gate | 200 = ready, 503 = not-ready |

Blocking Checks von `/readyz`:

1. Supabase ist konfiguriert.
2. Das produktionsrelevante IAM-Schema `profiles.iam_role` ist tatsächlich erreichbar.
3. Stripe Core ist vollständig konfiguriert: Secret Key, Publishable Key, Webhook Secret.
4. Der erwartete Stripe-Produktkatalog ist vollständig konfiguriert: Starter monatlich/jährlich,
   Pro monatlich/jährlich, Enterprise, Founder und PDF-Export.

Optional konfigurierte Alpaca-/Anthropic-/OpenAI-Provider werden als Capability-Bools ausgegeben,
sind aber keine Restart-Bedingung. Secret-Werte, Präfixe, Längen oder Teilidentifikatoren werden
nicht ausgegeben.

Externe Market-Data-Provider werden vom Readiness-Endpunkt absichtlich nicht aktiv abgefragt.
Live-Logs zeigen zum Handoff-Zeitpunkt partielle Provider-Degradation (u. a. HTTP 429 sowie
402/404 bei einzelnen Historienprovidern), während Binance-Live-Daten weiter erfolgreich
bereitgestellt werden. Diese Fehler müssen capability-/provenance-basiert degradieren, nicht den
Container neu starten.

## 3. Render Secret Correlation

Kanonische Repository-Authority ist:

- Render Secret File: `finance-secrets.env`
- Key-Manifest: `scripts/security/secretFileManifest.ts`
- Runtime-Boot-Gate: `server/validateRuntimeSecrets.ts`
- Deployment-Coverage-Gate: `scripts/automation/verifyDeploymentReadiness.ts`

Der verfügbare Render-Connector liefert Service-/Deploy-Metadaten, aber keine vollständige
Secret-File-Keyliste und keine Secret-Werte. Deshalb gilt:

- **Secret-Werte:** werden weder gelesen noch korreliert.
- **Manifest-Abdeckung im Repository:** automatisiert prüfbar.
- **Kritische Runtime-Secrets:** werden beim Produktionsstart fail-closed validiert.
- **Exakte Dashboard-Key-zu-Manifest-Gleichheit:** über den aktuellen Connector **UNVERIFIED**;
  sie darf nicht als erfolgreich behauptet werden, solange keine providerseitige Key-Inventur
  ohne Secret-Werte verfügbar ist.

### Erkannter Governance-Drift

Der Anwendungscode dokumentiert Gemini als anwendungsweit entfernt, während auf `main` noch
Gemini-Konfiguration in `render.yaml`, `.env.example` und dem Secret-Manifest vorhanden ist.
Dieser Drift wird nicht stillschweigend in den Recovery-/Runtime-Scope vermischt. Vor Entfernung
sind die zugehörigen ADR-0088/ADR-0089/ADR-0090-Authorities zu superseden/archivieren oder deren
aktueller Status eindeutig zu verifizieren. Bis dahin ist dies ein separater Governance-Cleanup.

## 4. Backup Retention, RPO und RTO

Die Owner-Freigabe für Backup-Retention ist dokumentiert. Der verifizierte Supabase-Stand ist
jedoch ein Free-Projekt; über den verfügbaren Connector existiert keine Backup-/Retention-Mutation.
Damit kann aus der Freigabe allein keine providerseitig aktive Retention abgeleitet werden.

Der operative Fallback und die Restore-Gates stehen in
`docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`.

- **RPO — Recovery Point Objective:** maximal tolerierbarer Datenverlust, gemessen als Zeitspanne
  zwischen letztem belastbaren Recovery Point und Incident.
- **RTO — Recovery Time Objective:** maximal tolerierbare Zeit bis zur Wiederherstellung des
  vereinbarten Betriebszustands.

Aktueller CAPITAL-AI-Status:

- RPO: **UNVERIFIED** — bis ein wiederkehrender Off-site-Backup-Lauf mit Retention und Evidence
  tatsächlich betrieben wird.
- RTO: **UNVERIFIED** — bis mindestens ein Restore-Drill auf separatem Ziel gemessen wurde.

Es werden bewusst keine erfundenen Minuten-/Stundenwerte als SLA/SLO ausgegeben.

## 5. Rollback

Anwendungs-/Deployment-Rollback und Daten-Restore bleiben getrennte Recovery-Ebenen.

- Code: branchbasierter Revert-PR, niemals direkte Main-Mutation.
- Render: letzter verifizierter Deploy/Commit anhand Evidence; anschließend `/healthz`, `/readyz`,
  Auth/IAM, Billing und betroffene Fachfunktion prüfen.
- Daten: nur mit belastbarem Backup und getrenntem Restore-Ziel; Produktiv-Restore bleibt
  Owner-gated.
- Credentials: bei Credential-Incident rotieren/revoken; niemals auf kompromittierte alte Werte
  zurückrollen.

## 6. Handoff-Status

Erledigt bzw. im bestehenden PR-Scope umgesetzt:

- Production↔`main`-Identität korreliert.
- Rollback-/Backup-Runbook vorhanden und Free-Plan-Realität dokumentiert.
- RPO/RTO fachlich definiert und als UNVERIFIED statt erfundener Zielwerte klassifiziert.
- fachlicher Readiness-Contract als `/healthz/readiness` + `/readyz` implementiert.
- Readiness-Negativtests ergänzt.
- Render-Secret-Korrelation auf nicht-sensitive, tatsächlich verifizierbare Evidence begrenzt.

Verbleibende Owner-/Provider-Evidence:

- wiederkehrenden Off-site-Backup-Lauf mit definierter Retention einrichten;
- Restore-Drill auf separatem Ziel durchführen und RPO/RTO daraus messen;
- exakte Render-Dashboard-Key-Inventur gegen Manifest durchführen, sobald ein sicherer
  key-only Provider-Zugriff verfügbar ist;
- Gemini-Konfigurationsdrift governance-konform separat bereinigen;
- nach jedem weiteren Branch-Commit `main` erneut korrelieren und exact-head Required Checks
  vollständig PASS abwarten.
