# CAPITAL-AI Monetarisierungs-Roadmap

Status: DRAFT / Entscheidungsvorlage
Stand: 2026-08-11
Plattformversion: 0.6.0 Beta
Verhältnis zu bestehenden Achsen: ergänzt `docs/architecture/ROADMAP.md` (R-nnn) und die M0–M9-Governance-Achse aus `docs/evidence/m0/M0_EXIT_STATUS_2026-08-10.md`

## 1. Ausgangsbefund

Die Anwendung ist **weiter monetarisiert, als es aussieht, und weniger, als sie sein müsste.**

Was bereits produktiv läuft:

- Stripe ist live und hat **sechs echte Produktionsereignisse** verarbeitet (ADR-0045 COMPLETE, `server/stripe.ts`, `server/stripeEventInbox.ts`).
- Der Preisvertrag steht als einzige Quelle in `src/config/subscriptionEntitlements.ts`: Free 0 €, Starter 7 €, Pro 29 €, Enterprise 109 € pro Monat.
- Checkout, Billing-Portal, Coupon-Validierung und ein idempotenter Event-Inbox existieren.
- Ein Kraken-Affiliate-Link ist live ausgeliefert (`src/components/Dashboard.tsx`).

Was den Umsatz heute verhindert — in der Reihenfolge ihrer Wirkung:

1. **Der Rechtsstatus widerspricht dem Zahlungsverkehr.** `src/components/ImpressumAgb.tsx:95-96` erklärt „Privatperson, kein eingetragenes Unternehmen" und „Es wird derzeit keine Umsatzsteuer ausgewiesen (kein laufender Geschäftsbetrieb)" — bei gleichzeitig live laufendem Stripe.
2. **Die kostenpflichtigen Funktionen sind nicht kostenpflichtig.** `canUseFeature` und `getPlanEntitlements` werden von **keiner einzigen `.tsx`-Datei** importiert; Nutzer sind ausschließlich `server/entitlements.ts` und der Unit-Test. Das UI-Gating läuft über `src/lib/dailyScreeningTracker.ts` mit dem `localStorage`-Schlüssel `capital_ai_daily_screenings_v1` — durch Leeren des Browserspeichers zurücksetzbar. Serverseitig durchgesetzt sind nur `verified_screening` und `buffett_value_check`.
3. **Der Kaufabschluss ist defekt.** OPS-001: Produktions-SMTP scheitert mit `535 Authentication credentials invalid` — es gehen keine Bestätigungsmails raus.
4. **Es gibt keine öffentliche Preisseite.** `src/components/LandingPage.tsx` ist reiner Login-/Registrierungs-Einstieg; die Preisdarstellung in `src/components/Abonnements.tsx` ist erst nach Anmeldung sichtbar.

Punkt 2 ist der größte Hebel im gesamten Dokument: Solange Backtest, Monte Carlo, Full-AI-Analyse und Realtime-Newsfeed faktisch gratis sind, hat niemand einen Grund, Starter oder Pro zu kaufen.

## 2. Grundsätze dieser Roadmap

1. **Keine Umsatzprognosen.** Es existieren im Repository keine Nutzerzahlen, keine Conversion-Daten und keine Kostenwerte. Erfundene Zahlen wären wertlos.
2. **Reihenfolge vor Umfang.** Marketing vor geschlossener Umsatzleckage verbrennt Reichweite.
3. **Geschützte Invarianten bleiben geschützt.** Änderungen an AdSense, Consent, CSP und IAM folgen `CLAUDE.md` und ADR-0035 — OWNER, TOTP-Step-up und siebenteilige Offenlegung.
4. **Kostendeckel gilt.** `docs/governance/PLATFORM_COST_BUDGET_POLICY.md`: 40 EUR gesamt, Infrastruktur-Upgrades erst umsatzgekoppelt.

## 3. Phasen

### Phase 0 — Rechtsfähigkeit für den Geschäftsbetrieb (blockierend)

**Warum blockierend:** Ein laufender Zahlungsverkehr bei gleichzeitiger Erklärung „kein laufender Geschäftsbetrieb" ist ein Widerspruch, der mit jeder zusätzlichen Transaktion größer wird. Skalierung vor Klärung vergrößert das Problem, statt es zu lösen.

**Dieses Dokument ist keine Rechts- oder Steuerberatung.** Es benennt den Widerspruch und die zu klärenden Punkte; die Klärung gehört zu Steuerberatung und, für AGB/Widerruf, zu rechtlicher Beratung.

Zu klären:

| Punkt | Bezug |
| --- | --- |
| Gewerbliche Anmeldung erforderlich? | Betrieb einer entgeltlichen SaaS-Anwendung |
| Umsatzsteuerpflicht oder Kleinunternehmerregelung | Entscheidung wirkt unmittelbar auf die Preisdarstellung |
| Umsatzsteuer auf digitale Dienstleistungen an Verbraucher in der EU | Stripe-Tax-Konfiguration, ggf. OSS-Verfahren |
| Impressumsangaben | `src/components/ImpressumAgb.tsx` |
| AGB und Widerrufsbelehrung für digitale Abonnements | dito |
| Preisangaben brutto/netto | `src/config/subscriptionEntitlements.ts`, Stripe-Preisobjekte |

**Definition of Done:** Impressum, AGB und Preisdarstellung geben denselben Sachverhalt wieder wie der tatsächliche Betrieb; die Stripe-Steuerkonfiguration passt dazu.

**Owner-Handoff:** vollständig. Kein Agentenanteil außer der Textumsetzung nach Vorgabe.

### Phase 1 — Umsatzleckage schließen

**Ziel:** Der Preisvertrag aus `src/config/subscriptionEntitlements.ts` wird zur einzigen und durchgesetzten Autorität — im Frontend **und** serverseitig.

Arbeitspakete:

1. `canUseFeature` / `getPlanEntitlements` / `getWindowedFeatureLimit` in den Komponenten verwenden, die heute ad-hoc prüfen (Dashboard-Views, Backtest, Monte Carlo, Newsfeed, Full-AI-Analyse).
2. `src/lib/dailyScreeningTracker.ts` als Autorität ablösen; `localStorage` darf höchstens noch Anzeigezustand halten, nie Berechtigung.
3. Serverseitige Durchsetzung auf alle kostenpflichtigen Endpunkte ausdehnen — heute nur `verified_screening` und `buffett_value_check` in `server/quota.ts` / `server/entitlements.ts`.
4. Negativtests: Für jedes kostenpflichtige Feature ein Test, der bei Tier `Free` die Ablehnung erzwingt.

**Definition of Done:** Kein kostenpflichtiges Feature ist ohne serverseitige Prüfung erreichbar; das Leeren des Browserspeichers verändert keine Berechtigung; ADR-0034 kann von 🟡 auf abgeschlossen gehen.

**Abhängigkeiten:** keine. Diese Phase kann sofort und parallel zu Phase 0 laufen.

### Phase 2 — Kaufabschluss reparieren

| Aufgabe | Fundstelle | Wirkung |
| --- | --- | --- |
| OPS-001: Produktions-SMTP wiederherstellen | `docs/architecture/ROADMAP.md` | Ohne Bestätigungsmail fehlt dem Käufer der Vertragsnachweis |
| PDF-Credit-Migration produktiv anwenden | R-004 / ADR-0052, `supabase/migrations/20260810110642_pdf_credit_ledger.sql` | Einmalkäufe sind sonst nicht belastbar verbucht |
| Preisinkonsistenz auflösen | PRO-Jahrespreis live 248 € gegenüber dokumentierten 313,20 € bei 10 % Rabatt | Falsche Preisauszeichnung ist ein Rechtsrisiko, kein Schönheitsfehler |
| Hartcodierte Demo-Coupons entfernen | `server/stripe.ts` — u. a. ein Code mit 100 % Rabatt | Ein Rabattcode-Tisch im Quelltext gehört nicht in den Produktivbetrieb |
| Developer-Hub-Panel mit Beispielcode entfernen oder absichern | `src/components/Abonnements.tsx` | Zeigt angemeldeten Nutzern Stripe-Konfigurationsstatus |

**Definition of Done:** Ein vollständiger Testkauf je Tier führt zu korrekter Verbuchung, korrekter Bestätigungsmail und korrektem Entitlement.

### Phase 3 — Conversion ermöglichen

Heute kann niemand den Preis sehen, ohne sich zu registrieren. Das ist die engste Stelle des Funnels.

1. Öffentliche Preis-/Landingseite vor der Anmeldung, mit den Tiers aus dem Preisvertrag.
2. Founder-Tier: die `alert()`-Warteliste in `src/components/Abonnements.tsx` durch eine echte Erfassung ersetzen — oder den Tier bis dahin ausblenden. Ein Button, der nur einen Hinweis zeigt, kostet Vertrauen.
3. Kündigungs- und Portal-Wege sichtbar machen (Billing-Portal ist bereits angebunden).
4. Texte nach `docs/content-creator/CONTENT_STRATEGY.md`: keine Renditeversprechen, Hinweis „keine Anlageberatung" — die BaFin-/UWG-Vorgaben des Repositories gelten auch für Marketingtexte.

### Phase 4 — Zweitkanal: bewusste Entscheidung statt Automatismus

Der AdSense-Pfad ist vollständig vorbereitet — Publisher-ID, Consent-Gating über CookieHub, CSP-Kompatibilität (ADR-0035, ADR-0042) — aber es existiert **kein einziger Anzeigenplatz**. Es fließt kein Werbeumsatz.

Zwei Wege, beide legitim:

- **Ausbauen:** Anzeigenplätze platzieren. Das ist eine geschützte Änderung: OWNER, frisches TOTP-Step-up, siebenteilige Offenlegung, `scripts/security/verifyGoogleMarketingInvariants.ts` bleibt Gate.
- **Verwerfen:** Werbung neben einem 29-€-Abo schwächt die Zahlungsbereitschaft. Wird verworfen, sollte ADR-0035 den Status entsprechend festhalten, statt dauerhaft „in Arbeit" zu bleiben.

Der Kraken-Affiliate-Link läuft bereits und braucht keine Arbeit — nur eine Kennzeichnungsprüfung nach §5a UWG.

**Empfehlung:** erst nach Phase 1–3 entscheiden. Vor geschlossener Leckage ist Werbeumsatz die falsche Antwort auf ein Preisdurchsetzungsproblem.

### Phase 5 — Unit Economics

Ohne diese Phase ist unbekannt, ob Starter zu 7 € überhaupt kostendeckend ist.

1. Kosten je Provider für einen vollen Monat erheben (Render, Supabase, Gemini, Anthropic, OpenAI, Markt-APIs) — heute im Repository **nirgends dokumentiert**.
2. Kosten je Nutzer und je Agentenlauf instrumentieren, Anbindung an `src/platform/Telemetry/`.
3. Deckungsbeitrag je Tier gegen 7 / 29 / 109 € rechnen. Besonders zu prüfen: Pro mit „unbegrenzter Full-AI-Analyse" und unbegrenztem Buffett-Check bei nutzungsabhängigen LLM-Kosten.
4. Falls negativ: Preis, Limits oder Modellrouting anpassen — nicht das Budget erhöhen.
5. Supabase-Free-Tier-Risiko (ADR-0031) mit einer umsatzgekoppelten Upgrade-Schwelle versehen.

**Definition of Done:** Für jeden Tier existiert ein belegter Deckungsbeitrag; die Schwelle für Infrastruktur-Upgrades ist in `PLATFORM_COST_BUDGET_POLICY.md` §4 beziffert.

### Phase 6 — Governance parallel

Läuft unabhängig und blockiert nichts: M1 und M7 über `docs/governance/GITHUB_PRO_ENABLEMENT_PLAN.md` — geschütztes `production`-Environment (P1) und die zweite Reviewer-Identität (P3).

Der Bezug zur Monetarisierung ist real: Ein geschütztes Deployment-Environment ist die Voraussetzung dafür, dass ein zahlender Nutzerbestand nicht von einem versehentlichen Deploy getroffen wird.

## 4. Reihenfolge und Abhängigkeiten

```
Phase 0 (Recht)      ──────────────► blockiert Umsatzskalierung
Phase 1 (Leckage)    ──┐             läuft sofort, unabhängig
Phase 2 (Abschluss)  ──┤
Phase 3 (Conversion) ──┴──► braucht 1 und 2
Phase 4 (Zweitkanal) ─────► Entscheidung nach 3
Phase 5 (Economics)  ─────► braucht Daten aus 1–3
Phase 6 (Governance) ─────► parallel, unabhängig
```

Empfohlener Start: **Phase 1 technisch und Phase 0 organisatorisch gleichzeitig.** Phase 1 ist der größte Umsatzhebel und vollständig in Eigenregie umsetzbar; Phase 0 hat die längste externe Laufzeit.

## 5. Offene Owner-Entscheidungen

1. Kleinunternehmerregelung oder Regelbesteuerung?
2. AdSense ausbauen oder verwerfen?
3. Bleibt der Founder-Tier im Angebot, oder wird er entfernt?
4. Welche Umsatzschwelle rechtfertigt Supabase Pro?
5. Wird der PRO-Jahrespreis auf 313,20 € korrigiert oder der dokumentierte Rabatt auf den gelebten Preis angepasst?

## 6. Verwandte Dokumente

- `docs/architecture/ROADMAP.md` — technische Roadmap (R-001…R-101, OPS-001)
- `docs/adr/ADR-0034-central-subscription-entitlements-and-buffett-access.md` — Preismatrix und Preisinkonsistenz
- `docs/adr/ADR-0045-stripe-event-ownership-durable-inbox.md` — Stripe-Event-Verarbeitung
- `docs/adr/ADR-0035-protected-google-marketing-integration-strict-csp.md` — AdSense/CSP, geschützte Invariante
- `docs/governance/PLATFORM_COST_BUDGET_POLICY.md` — Kostenseite
- `docs/content-creator/CONTENT_STRATEGY.md` — verbindliche Vorgaben für Marketingtexte
