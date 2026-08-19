# ADR-0089: Gemini Research Shadow — Free-Tier-only / Zero-Cost Policy

- **Status:** Accepted
- **Datum:** 2026-08-19
- **Owner-Entscheidung:** „der Gemini key soll free to use genutzt werden und keine Kosten verursachen.“
- **Authority:** SC-MD-SPT-0001 + ADR-0086 + ADR-0087 + ADR-0088
- **Ersetzt:** ADR-0088 §§4–5 soweit dort eine konfigurierbare Paid-/USD-Kostensteuerung für Gemini vorgesehen war.

## Kontext

ADR-0088 implementierte einen default-off, server-only Gemini Research Shadow Transport mit konfigurierbaren Modell-/Preis-/USD-Budgets. Der Owner hat anschließend festgelegt, dass dieser Gemini-Pfad ausschließlich kostenlos genutzt werden darf.

Stand 2026-08-19 dokumentiert Google für die Gemini Developer API Free Tier, dass `gemini-2.5-flash` kostenlose Input-/Output-Tokens bietet, URL Context im Free Tier kostenlos ist und Google Search Grounding bis zu 500 RPD kostenlos angeboten wird. Google weist zugleich darauf hin, dass dieselbe API bei einem Projekt mit aktivierter Abrechnung in die Paid Tier fallen kann. Ein API-Key selbst liefert CAPITAL-AI keinen belastbaren, lokal verifizierbaren Billing-Status.

## Entscheidung

### 1. Paid Gemini ist für Research Shadow verboten

Der kanonische serverseitige Entry-Point ist ausschließlich:

`createGeminiResearchFreeTierRuntime()` aus `server/researchEvidence/`.

Dieser Factory besitzt keinen Paid-Mode-Schalter. `paidBillingPermitted=false` ist eine Architektur-Invariante.

### 2. Modell wird auf Free-Tier-fähige stabile Version gepinnt

Für diese Policy wird `gemini-2.5-flash` gepinnt. Modell-Overrides über Environment-Konfiguration werden vom kanonischen Factory ignoriert.

Ein späterer Modellwechsel benötigt:

1. erneute Prüfung der offiziellen Google-Free-Tier-Dokumentation;
2. Owner-Freigabe;
3. Update dieser ADR/Policy-Version und Regressionstests.

### 3. Billing-freies Projekt ist Voraussetzung

`GEMINI_API_KEY` muss aus einem Gemini Developer API Projekt stammen, bei dem **keine Billing-Verknüpfung aktiviert ist**.

Zusätzlich zum allgemeinen Kill-Switch gelten:

- `GEMINI_RESEARCH_FREE_TIER_ONLY=true`;
- `GEMINI_RESEARCH_FREE_TIER_ATTESTED=false` als Default;
- Shadow-Traffic ist erst zulässig, wenn ein Operator nach Prüfung des Google-Projekts `GEMINI_RESEARCH_FREE_TIER_ATTESTED=true` setzt.

Wird Billing später am Projekt aktiviert oder ist der Status unklar, muss die Attestation sofort auf `false` zurückgesetzt werden.

### 4. Keine konfigurierbaren Paid-Preise im kanonischen Pfad

Der Free-Tier-Factory erzwingt lokal:

- Input Unit Cost = 0;
- Output Unit Cost = 0;
- Google Search Unit Cost = 0.

Vorhandene `GEMINI_RESEARCH_*USD*`-Overrides werden im kanonischen Pfad nicht konsumiert. Der generische Low-Level-Transport bleibt Implementierungsdetail und wird nicht über den package-level Server-Entry-Point als Runtime-Factory exponiert.

### 5. Free-Tier-Quota wird zusätzlich lokal unterschritten

Der aktuell dokumentierte Search-Free-Tier-Wert von 500 RPD ist **kein Zielbudget**, sondern eine externe Obergrenze. CAPITAL-AI verwendet:

- Blueprint Default: 50 Requests/Tag;
- hartes Code-Cap: maximal 100 Requests/Tag;
- RPM Default: 3.

Damit bleibt der Shadow-Betrieb bewusst unter der aktuell dokumentierten Search-Free-Tier-Grenze. Externe Providerlimits können sich ändern; sie müssen vor Aktivierung erneut verifiziert werden.

### 6. Keine Änderung an Evidence-/Scoring-Grenzen

Zero-Cost ändert nicht die fachliche Trust Boundary:

- Gemini bleibt Research-/Extraction-/Evidence-Discovery;
- provider-owned Citations bleiben Pflicht;
- `AI_DISCOVERED_EVIDENCE` bleibt `scoreEligible=false`;
- keine automatische Promotion zu `ScoringEvidenceRef`;
- kein Score-/Ranking-/Eligibility-Impact.

## Sicherheits-/Betriebsfolgen

- Ein irrtümlich billing-enabled Google-Projekt ist ein Konfigurationsverstoß und muss durch den Attestation-Gate verhindert werden.
- Der API-Key wird weiterhin ausschließlich in `finance-secrets.env` geführt.
- Es gibt keinen Codepfad, der bewusst Paid-Tier-Budgets freigibt.
- `GEMINI_RESEARCH_SHADOW_ENABLED=false` und `GEMINI_RESEARCH_FREE_TIER_ATTESTED=false` sind unabhängige Kill-Switches.

## Einschränkung der Garantie

CAPITAL-AI kann aus dem API-Key allein nicht kryptografisch feststellen, ob Google Billing am zugehörigen Projekt aktiviert hat. Die Zero-Cost-Garantie ist deshalb eine kombinierte technische und operative Invariante:

1. Free-Tier-only Factory;
2. gepinntes Free-Tier-Modell;
3. lokales Quota-Cap;
4. Billing-freies Google-Projekt;
5. explizite Operator-Attestation.

## Referenzen

- ADR-0087
- ADR-0088
- `server/researchEvidence/geminiResearchFreeTierRuntime.ts`
- `server/researchEvidence/index.ts`
- `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`
- Google Gemini Developer API Pricing/Billing/Rate Limits, Stand 2026-08-19
