# CAPITAL-AI Plattform-Kostenrichtlinie — 40 EUR/Monat Gesamtdeckel

Status: Verbindlich (Owner-Entscheidung 2026-08-11)
Stand: 2026-08-11
Geltungsbereich: `SvenKulessa/Finance`, alle menschlichen und KI-basierten Contributors
Verhältnis zu bestehenden Richtlinien: Dachrichtlinie über `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`

## 1. Deckel

| Ebene | Deckel | Inhalt |
| --- | --- | --- |
| **Gesamt** | **40 EUR/Monat** | GitHub + Claude + Render + Supabase + Markt-/LLM-APIs + Domain |
| **Teilbudget GitHub** | **20 EUR/Monat** | GitHub-Plan, Actions, Packages, Codespaces, Marketplace |

### 1.1 Änderungshinweis zur Actions-Richtlinie

`GITHUB_ACTIONS_BUDGET_POLICY.md` nannte bisher **15 EUR/Monat** für GitHub-Actions-Zusatzkosten. Der Owner hat am 2026-08-11 ein GitHub-Teilbudget von **20 EUR** innerhalb eines Gesamtdeckels von 40 EUR festgelegt.

Dies ist eine **Lockerung** und wird deshalb ausdrücklich als attribuierte Owner-Entscheidung geführt, nicht als stillschweigende Anpassung. Unverändert in Kraft bleiben:

- die Stop-Regel am Budgetlimit und die Warnschwellen 50 / 75 / 90 / 100 %;
- sämtliche Run-Limits pro PR-Head-SHA und pro Merge-SHA;
- die Liste verbotener Kostenmuster;
- die Agentenrichtlinie, insbesondere: **ein KI-Agent darf Budget, Spending Limit oder Billing-Konfiguration niemals selbst erhöhen.**

Das Teilbudget von 20 EUR ist eine Obergrenze für den Fall, dass Zusatzkosten anfallen — kein Verbrauchsziel. Die Pipeline ist weiterhin so auszulegen, dass sie primär im Freikontingent arbeitet.

## 2. Ist-Kostenmodell

Rechenweg zum Stichtag. USD-Beträge sind mit rund 0,92 EUR/USD umgerechnet; der Kurs schwankt.

| Position | Betrag | Belegstatus |
| --- | --- | --- |
| Claude-Abo (Pro) | ~18,50 EUR | **zu verifizieren** — `claude.com` ist durch den Egress-Proxy gesperrt, Preis nicht abrufbar |
| GitHub-Plan (bezahlter Personal-Tier) | ~3,70 EUR | Plan-Vergleich github.com/pricing: 4 USD/Nutzer/Monat |
| Render Web Service `Finance`, Plan Starter | ~6,50 EUR | `render.yaml` (`plan: starter`), Betrag **zu verifizieren** im Render-Dashboard |
| Supabase (Free Tier) | 0,00 EUR | ADR-0031 |
| Domain `capital-ai.online` (IONOS, umgelegt) | ~1,00 EUR | **zu verifizieren** |
| GitHub Actions über Freikontingent | 0,00 EUR erwartet | 3.000 Minuten inklusive |
| Markt-/LLM-APIs | **unbekannt** | siehe §3 |
| **Summe der bezifferbaren Positionen** | **~29,70 EUR** | Restpuffer ~10 EUR |

### 2.1 Actions-Rechnung im Teilbudget

Der Linux-2-Core-Runner kostet nach der zum 01.01.2026 wirksamen Preissenkung **0,006 USD/Minute** (~0,0055 EUR). Bei ~3,70 EUR Planpreis verbleiben rechnerisch ~16 EUR, also rund **2.900 zusätzliche Runner-Minuten**, bevor das GitHub-Teilbudget bricht.

**Schlussfolgerung: Actions-Minuten sind nicht der begrenzende Faktor.** Das 3.000-Minuten-Freikontingent plus dieser Puffer liegt weit über dem, was die Run-Limits der Actions-Richtlinie überhaupt zulassen. Der begrenzende Faktor ist der Gesamtdeckel, und dort ist die einzige echte Unbekannte §3.

## 3. Die Blindstelle: LLM- und Markt-API-Kosten

Im gesamten Repository existiert **kein einziger dokumentierter Kostenwert** für Render, Supabase, Google Gemini, Anthropic, OpenAI, Alpha Vantage, FMP, EODHD oder die Börsen-Feeds. Die einzige Eurozahl zu Betriebskosten war bisher die Actions-Richtlinie.

Das ist das einzige Element, das den 40-EUR-Deckel **unbemerkt** sprengen kann: Actions-Kosten sind gedeckelt und sichtbar, API-Kosten sind es nicht — und sie skalieren mit der Nutzung der Anwendung, also genau dann, wenn die Monetarisierung greift.

Erste Maßnahme ist deshalb **messen, nicht schätzen**:

1. Ist-Kosten je Provider für einen vollen Abrechnungsmonat erheben und hier eintragen.
2. Kosten pro Nutzer und pro Agentenlauf instrumentieren (Anbindung an `src/platform/Telemetry/`).
3. Erst mit diesen Werten den Deckungsbeitrag je Abo-Tier rechnen — siehe `docs/architecture/MONETIZATION_ROADMAP.md`, Phase 5.

Bis diese Werte vorliegen, gilt jede Aussage über die Einhaltung des 40-EUR-Deckels als **unvollständig belegt**.

## 4. Eskalationsregel bei Wachstum

Zwei absehbare Schritte passen rechnerisch **nicht** unter 40 EUR:

- **Supabase Pro** (~25 USD/Monat): notwendig, um die in ADR-0031 akzeptierten Free-Tier-Risiken (u. a. fehlender Leaked-Password-Schutz) aufzulösen.
- **Render-Skalierung** über einen Starter-Instanz-Betrieb hinaus.

Beide werden deshalb nicht als Budgetposten geführt, sondern als **umsatzgekoppelte Schwellen**: Sie werden freigegeben, wenn wiederkehrender Umsatz sie trägt, und die Freigabe ist eine bewusste Owner-Entscheidung, keine technische Notwendigkeit. Der Deckel steigt nicht, weil ein Bedarf entsteht — er steigt, wenn Einnahmen ihn tragen.

## 5. Priorisierung bei Deckelkonflikt

Wenn der Gesamtdeckel zu brechen droht, gilt diese Reihenfolge — von zuerst zu schützen bis zuerst abzuschalten:

1. **Produktionsbetrieb** (Render, Supabase, Domain) — ein Ausfall trifft zahlende Nutzer.
2. **Merge-/produktionskritische CI** — das `build-and-test`-Gate bleibt fail-closed.
3. **Claude-Abo** — die einzige Entwicklungskapazität in einem Ein-Personen-Setup.
4. **Optionale CI-Läufe, Codespaces, Marketplace-Dienste** — zuerst abzuschalten.

## 6. Agentenpflichten

Zusätzlich zu den Pflichten aus der Actions-Richtlinie gilt für jeden KI-Agenten:

1. keine Beschaffung kostenpflichtiger Dienste, Add-ons oder Marketplace-Apps ohne ausdrückliche Owner-Freigabe;
2. keine Änderung von Plan, Spending Limit oder Billing bei irgendeinem Provider;
3. bei absehbarer Deckelüberschreitung: Owner informieren und keine weiteren kostenpflichtigen Läufe auslösen;
4. Kostenaussagen nur mit Beleg — geschätzte Beträge sind als Schätzung zu kennzeichnen.

## 7. Review

Diese Richtlinie wird überprüft, sobald:

- die Ist-Kosten aus §3 erstmals vollständig vorliegen;
- der Gesamtdeckel zweimal in drei Monaten zu mehr als 75 % ausgeschöpft wird;
- wiederkehrender Umsatz eine der Schwellen aus §4 erreicht;
- sich Provider-Preise ändern.

## 8. Verwandte Dokumente

- `docs/governance/GITHUB_PRO_ENABLEMENT_DECISION.md` — M2-Festlegung, dass ein Plan-Upgrade eine separate Kosten-/Nutzen-Entscheidung erfordert; diese Richtlinie ist deren Kostenseite
- `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md` — Run-Limits und Kostenmuster im GitHub-Teilbudget
- `docs/governance/GITHUB_PRO_ENABLEMENT_PLAN.md` — Plattformfunktionen im GitHub-Teilbudget
- `docs/governance/AI_ASSISTANT_AND_GITHUB_FEATURE_COST_BENEFIT.md` — Kosten-Nutzen je Feature und Assistenz-Tool
- `docs/architecture/MONETIZATION_ROADMAP.md` — Umsatzseite und Deckungsbeitrag
