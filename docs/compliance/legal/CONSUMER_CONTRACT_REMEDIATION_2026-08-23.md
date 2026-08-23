# Consumer Contract Remediation — 2026-08-23

**Traceability:** Owner-/Chat-Priorität „Rechtliche Prüfung Impressum, AGB und Datenschutz“  
**Baseline:** `main` @ `b35c86dfc9e038c629377d0d9a0761df1a65d663`  
**Branch:** `fix/legal-consumer-checkout-2026-08-23`  
**Status:** PARTIAL REMEDIATION — erster PR-fähiger Scope; offene P0-Punkte bleiben ausdrücklich offen

## Ziel und Abgrenzung

Dieser Scope übernimmt die Ergebnisse der rechtlichen Repository-Prüfung in eine versionierte, prüfbare Implementierungsbasis. Er ist keine anwaltliche Freigabe, Zertifizierung oder Aussage, dass sämtliche verbraucherrechtlichen Pflichten bereits erfüllt sind.

Der erste PR-fähige Scope beseitigt ausschließlich belegte Disclosure-/Contract-Drift, ohne eine neue Billing-, Auth- oder Kündigungsarchitektur einzuführen.

## Primärquellen / Rechtsbaseline

- § 5 DDG — allgemeine Informationspflichten: https://www.gesetze-im-internet.de/ddg/__5.html
- § 312k BGB — Kündigung von Verbraucherverträgen im elektronischen Geschäftsverkehr: https://www.gesetze-im-internet.de/bgb/__312k.html
- § 355 BGB — Widerrufsrecht bei Verbraucherverträgen: https://www.gesetze-im-internet.de/bgb/__355.html
- DSGVO Art. 7 — Nachweis und Trennung von Einwilligungen: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- DSGVO Art. 13 — Informationspflichten bei Datenerhebung: https://eur-lex.europa.eu/eli/reg/2016/679/oj

## Verifizierter Stripe-Live-Preisstand

Read-only gegen das produktive CAPITAL-AI Stripe-Konto am 23.08.2026 geprüft:

| Tarif | Monatlich | Jährlich | Status |
|---|---:|---:|---|
| Starter | 7,00 EUR | 75,60 EUR | aktiver recurring Price |
| Pro | 29,00 EUR | 248,00 EUR | aktiver recurring Price |
| Enterprise | 109,00 EUR | 1.280,00 EUR | aktiver recurring Price |

Die Price IDs bleiben Deployment-Konfiguration und werden nicht als zweite Source of Truth im Client dupliziert. Für den öffentlichen Vorvertragspreis existiert `src/legal/legalContracts.ts`; der tatsächlich belastete Betrag bleibt durch den Stripe Price im Checkout bestimmt.

## In diesem Scope umgesetzt

- [x] AGB erhalten eine explizite Dokumentversion (`2026-08-23`) und ein Wirksamkeitsdatum.
- [x] Öffentliche AGB zeigen den read-only verifizierten Stripe-Live-Preisstand für Monats- und Jahresabos.
- [x] Vertragsbedingungen unterscheiden Preis-/Abrechnungsintervall, Laufzeit/Kündigung und Widerruf klarer.
- [x] Impressumsdarstellung verwendet § 5 DDG konsistent; der verbliebene TMG-Hinweis im öffentlichen Router wurde entfernt.
- [x] CAPITAL-AI wird nicht als eigene juristische Person oder regulatorisch lizenzierte Stelle dargestellt.
- [x] Consumer-facing Contract-Werte werden in `src/legal/legalContracts.ts` versioniert und durch einen Unit-Test gegen unbeabsichtigte Preis-/Versionsdrift geschützt.
- [x] Keine Stripe-, Supabase-, Render- oder sonstige Produktionsmutation in diesem Scope.

## Noch offene P0-Folgeschritte

Diese Punkte sind **nicht** durch den vorliegenden Scope erledigt und dürfen weder in UI noch PR als erfüllt behauptet werden:

### P0-LEGAL-01 — Checkout-/Pricing-SoT anbinden

`src/components/Abonnements.tsx` berechnet Jahrespreise derzeit noch generisch über einen 10-%-Frontend-Rabatt. Das muss auf den versionierten Contract bzw. eine serverseitige Stripe-Preisprojektion umgestellt werden. Insbesondere darf der angezeigte Jahresbetrag nicht von dem produktiven Stripe Price abweichen.

### P0-LEGAL-02 — Enterprise-Yearly serverseitig korrekt routen

`server/stripe.ts` verwendet für Enterprise derzeit keinen separaten `STRIPE_PRICE_ID_ENTERPRISE_YEARLY`-Pfad. Der nächste Runtime-Scope muss die Jahres-Price-ID explizit unterstützen und bei fehlender Konfiguration fail-closed reagieren, statt versehentlich den Monats-Price zu verwenden.

### P0-LEGAL-03 — AGB-/Privacy-Evidence-Versionen zentralisieren

`server/stepUp.ts` führt weiterhin `CURRENT_TERMS_VERSION = '2026-08-14'` und `CURRENT_PRIVACY_VERSION = '2026-08-14'`, während die veröffentlichte Privacy Notice bereits `2026-08-19` ist und die AGB in diesem Scope `2026-08-23` erhalten. Diese Drift muss im nächsten Runtime-Scope durch Importe aus kanonischen Contract-/Privacy-Modulen beseitigt werden.

Privacy bleibt semantisch `acknowledgement`; Marketing bleibt eine eigenständige optionale Einwilligung; AGB sind Vertragsannahme. Diese Kategorien dürfen nicht wieder zu einer pauschalen „DSGVO-Einwilligung“ zusammengeführt werden.

### P0-LEGAL-04 — Checkout-Vertragsannahme nachweisbar machen

Vor dem Start eines kostenpflichtigen Checkout muss die aktuelle AGB-Version klar zugänglich sein und die relevante Vertragsannahme nachweisbar an die Checkout-/Webhook-Evidence gebunden werden. Clientseitig übermittelte Versionen dürfen nicht die serverseitige Version autorisieren.

Stripe Checkout/Billing bleibt die bevorzugte native Zahlungs- und Subscription-Infrastruktur; eine parallele Zahlungsarchitektur ist nicht vorgesehen.

### P0-LEGAL-05 — § 312k BGB Kündigungsstrecke

Der vorhandene authentifizierte Stripe Customer Portal Flow ist für die Abo-Selbstverwaltung wiederzuverwenden. Ob und wie er mit einer ständig verfügbaren, unmittelbar und leicht zugänglichen Kündigungsschaltfläche und Bestätigungsseite nach § 312k BGB zu kombinieren ist, muss vor Umsetzung gegen die konkrete Anwendbarkeit und UX-Anforderungen final geprüft werden.

Bis diese Strecke implementiert und geprüft ist, wird **keine** vollständige §-312k-Compliance behauptet.

### P0-LEGAL-06 — Widerrufsbelehrung / digitale Leistung

Die AGB enthalten jetzt einen allgemeinen Widerrufshinweis. Vor produktiver rechtlicher Freigabe ist zusätzlich zu prüfen, welche konkrete Widerrufsbelehrung und welche Erklärung zum vorzeitigen Beginn/gegebenenfalls Erlöschen des Widerrufsrechts für die angebotenen digitalen Leistungen erforderlich ist. Eine automatische Verkürzung oder ein Erlöschen wird nicht angenommen.

## Stripe State-of-the-Art / Integrationsentscheidung

- Bestehende Stripe Billing + Checkout Sessions bleiben erhalten.
- Stripe Customer Portal ist die bevorzugte native Self-Service-Komponente für Abo-Verwaltung.
- Keine Eigenentwicklung eines zweiten Billing-Systems.
- Die aktuelle Verwendung von `payment_method_types: ['card']` wird in diesem Scope nicht verändert. Aktuelle Stripe-Best-Practice bevorzugt Dynamic Payment Methods; eine Änderung muss jedoch mit der bestehenden Owner-/Produktpolicy und den angebotenen Zahlungsarten separat korreliert werden.
- Stripe Tax wird in diesem Scope nicht aktiviert oder verändert. Steuerregistrierung/-pflichten sind vor einer Aktivierung separat zu verifizieren.

## Architektur-/Governance-Entscheidung

Kein neuer ADR: Dieser Scope ändert keine Trust Boundary, Billing-Architektur oder Datenbankstruktur. Er führt einen expliziten Consumer-Contract im bestehenden Frontend-/Contract-Modell ein und dokumentiert die nächsten Runtime-Gates.

`ESS-0001-CONTRACTS` bleibt die technische Contract-Baseline; `src/legal/legalContracts.ts` ist die scoped, ausführbare Projektion der hier benötigten Legal-/Preiswerte.

## Release-/Merge-Gate

Vor Merge dieses Scopes:

- Branch erneut gegen aktuellen `main` korrelieren und synchronisieren.
- Diff auf ausschließlich Legal-/Contract-/Routing-/Test-/Dokumentationsänderungen prüfen.
- Klasse-C-Checks nach PR-Erstellung vollständig ausführen.
- Juristische Textprüfung bleibt Human-/Owner-Aufgabe; grüne CI ist keine Rechtsfreigabe.
