# CAPITAL-AI Plattform-Kostenrichtlinie — konsolidierte Entscheidungsvorlage

Status: **DRAFT / OWNER REVIEW REQUIRED**  
Stand: 2026-08-12  
Geltungsbereich: `SvenKulessa/Finance`

## 1. Budgetgrenzen

Die in PR #193 vorbereitete Plattform-Kostenperspektive wird übernommen, **ohne** die aktuell verbindliche GitHub-Actions-Grenze eigenmächtig zu erhöhen.

- **Gesamtplattform-Zieldeckel:** 40 EUR/Monat als Planungsrahmen.
- **GitHub-Actions-Zusatzkosten:** maximal **15 EUR/Monat** gemäß `GITHUB_ACTIONS_BUDGET_POLICY.md`.
- GitHub-Plan, Marketplace, Codespaces oder andere kostenpflichtige Dienste benötigen jeweils eine bewusste Owner-Entscheidung und dürfen das Actions-Limit nicht stillschweigend umdefinieren.

Der Deckel ist eine Obergrenze, kein Verbrauchsziel. Freikontingente und vorhandene Evidence sind zuerst zu nutzen.

## 2. Kostenmodell

Kosten werden nur als belastbar behandelt, wenn sie aus Billing/Provider-Evidence stammen. Preisangaben aus älteren Dokumenten oder Modellwissen sind vor einer Beschaffung erneut zu verifizieren.

Zu erfassen sind mindestens:

- GitHub Plan und Actions;
- Render;
- Supabase;
- Domain/DNS;
- LLM-/Agent-Provider;
- Markt-/Daten-APIs;
- optionale Marketplace-/Monitoring-Dienste.

## 3. Kritische Blindstelle

Nutzungsabhängige LLM- und Markt-API-Kosten können mit Produktnutzung wachsen. Deshalb gilt:

1. Ist-Kosten je Provider monatlich erfassen;
2. Kosten pro Nutzer und Agentenlauf über Telemetry messbar machen;
3. Deckungsbeitrag je Abo-Tier erst mit realen Daten bewerten;
4. negative Unit Economics durch Preis/Limits/Routing korrigieren, nicht durch automatische Budgeterhöhung.

## 4. Priorisierung bei Budgetkonflikt

1. Produktionsbetrieb und Sicherheitskontrollen;
2. merge-/produktionskritische CI;
3. notwendige Entwicklungswerkzeuge;
4. optionale Remote-Läufe, Add-ons, Marketplace und Komfortfunktionen.

## 5. Agentenpflichten

Ein Agent darf niemals selbst:

- Spending Limits erhöhen;
- einen kostenpflichtigen Plan/Add-on beschaffen;
- Billing-Einstellungen ändern;
- zusätzliche Remote-CI nur zur Statuskosmetik erzeugen.

Bei absehbarer Überschreitung wird der Owner informiert und optionale Kosten werden gestoppt.

## 6. Verwandte Dokumente

- `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`
- `docs/governance/GITHUB_PRO_ENABLEMENT_PLAN.md`
- `docs/governance/AI_ASSISTANT_AND_GITHUB_FEATURE_COST_BENEFIT.md`
- `docs/architecture/MONETIZATION_ROADMAP.md`
