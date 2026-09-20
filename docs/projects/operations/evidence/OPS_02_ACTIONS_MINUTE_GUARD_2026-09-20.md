# OPS-02 — GitHub Actions Monthly Minute Guard

**Status:** IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING  
**Owner:** CAPITAL-AI-OPS  
**PVC:** PVC-02  
**Trust Root:** `/AGENTS.md@CURRENT_MAIN`

## Ziel

Der bestehende GitHub Cost Watch wird um einen minutenbasierten Schutz für die monatliche Enterprise-Actions-Nutzung erweitert:

- ab **5.000 Enterprise-Actions-Minuten**: einmalige SMTP-Warnung pro Monatszyklus;
- ab **45.000 Enterprise-Actions-Minuten**: dauerhafter GitHub-Blocker für die kanonischen kostenrelevanten Required-Workflows;
- unterhalb 45.000 Minuten in einem neuen Monatszyklus: automatische Blocker-Aufhebung durch den weiterlaufenden Cost Watch.

## Minuten-Authority

Die Schwellen werden nicht aus Geldbeträgen abgeleitet. Maßgeblich ist die Enterprise Billing Usage Summary:

- `product=Actions`
- `unitType=minutes`
- Summe von `grossQuantity`

Damit werden auch verbrauchte Minuten gezählt, wenn GitHub sie durch inkludierte/discounted Nutzung auf `netAmount=0` reduziert.

Persönliche Billing-Nutzung wird weiterhin im Kostenreport angezeigt, zählt aber nicht in den Enterprise-Actions-Minutenblocker hinein.

## SMTP-Verhalten

Der vorhandene produktive Mailpfad bleibt unverändert:

`GitHub Cost Watch -> OIDC-geschützter Billing-Alert-Endpunkt -> Supabase Outbox -> Render Mailer -> IONOS SMTP`.

Die Alert-Fingerprint-Semantik enthält den Minuten-Zustand, nicht den laufenden Minutenwert:

- `BELOW_WARNING`
- `WARNING`
- `BLOCKED`

Dadurch erzeugt ein wachsender Verbrauch innerhalb derselben Stufe keine wiederholten Mails. Der Übergang 5.000 -> 45.000 erzeugt einen neuen deduplizierten Alert.

## 45k Hard Blocker

Der Cost Watch materialisiert bei `>=45.000` Minuten einen maschinenverwalteten GitHub-Issue mit Marker:

`CAPITAL_AI_ACTIONS_MINUTE_BLOCKER_V1`

Die folgenden kanonischen kostenrelevanten Required-Workflows prüfen diesen Marker vor teurer Arbeit und brechen fail-closed ab:

1. `.github/workflows/ci.yml`
2. `.github/workflows/pr-governance.yml`
3. `.github/workflows/container-security.yml`

Der Cost Watch selbst wird **nicht** blockiert. Dadurch kann er beim Monatswechsel den offenen Blocker automatisch schließen.

Manuelles Schließen des Blocker-Issues umgeht die Grenze nicht dauerhaft: Wenn der aktuelle Monatsverbrauch weiterhin mindestens 45.000 Minuten beträgt, wird der Issue beim nächsten Monitor-Lauf erneut erzeugt.

## Provider-Budget-Abgrenzung

GitHub Actions Budgets können `prevent_further_usage` aktivieren, sind laut GitHub-Billing-API jedoch geldbasiert (`budget_amount` in ganzen Dollar). Ein Dollarbudget bildet eine exakte 45.000-Minuten-Schwelle nicht deterministisch ab, insbesondere bei unterschiedlichen Runner-SKUs, Preisen und Discounts.

Deshalb verwendet dieser Contract keinen approximativen Dollarwert als Minuten-Authority.

## Fail-Closed-Eigenschaften

- Fehlt die Billing-Evidence, wird kein Minuten-PASS erfunden.
- Mehrere offene maschinenverwaltete Blocker-Issues gelten als inkonsistenter Zustand und führen zum Fehler.
- Test-Modus darf keinen Blocker-Issue erzeugen oder schließen.
- SMTP-Secrets bleiben ausschließlich in der produktiven Render-Environment; GitHub Actions erhält keine SMTP-Credentials.
- Human/CODEOWNER Merge-Authority bleibt unverändert.
