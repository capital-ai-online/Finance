# SC-2 — Gemini Free-Tier-only / Zero-Cost Hardening — 2026-08-19

## Scope

Diese Änderung baut auf `agent/gemini-research-evidence-adapter` auf und setzt die Owner-Vorgabe um, dass der Gemini Research Shadow ausschließlich kostenlos genutzt werden darf.

Branch: `agent/gemini-free-tier-only`  
Authority: ADR-0089 + SC-MD-SPT-0001

## Externer Vertragscheck

Am 2026-08-19 wurde die offizielle Google-Dokumentation geprüft.

Für `gemini-2.5-flash` dokumentiert Google im Free Tier:

- Input: kostenlos;
- Output: kostenlos;
- URL Context: kostenlos;
- Google Search Grounding: bis zu 500 RPD kostenlos, geteilt mit Flash-Lite;
- Interactions API unterstützt `gemini-2.5-flash`;
- Free Tier ist in EWR/EU verfügbar.

Wichtig: Ein billing-enabled Projekt kann dieselbe API/Modell-ID als Paid Tier verwenden. Ein API-Key selbst enthält keinen lokal vertrauenswürdigen Billing-Status.

## Implementierte technische Gates

### Kanonischer Factory

`server/researchEvidence/geminiResearchFreeTierRuntime.ts`

Eigenschaften:

- pinnt `gemini-2.5-flash`;
- `freeTierOnly=true`;
- `paidBillingPermitted=false`;
- erzwingt Input-/Output-/Search-Unit-Cost lokal auf 0;
- ignoriert Modell-/Paid-Preis-Overrides im kanonischen Pfad;
- verlangt `GEMINI_RESEARCH_FREE_TIER_ATTESTED=true`, wenn Shadow aktiviert wird;
- deckelt Requests/Tag hart auf 100;
- dokumentiert 500 RPD als externen, zeitabhängigen Google-Free-Tier-Wert.

### Kanonischer Server-Export

`server/researchEvidence/index.ts` exponiert als Runtime-Factory nur `createGeminiResearchFreeTierRuntime()`.

Der generische Low-Level-Transport bleibt per explizitem Implementierungspfad für Tests/Low-Level-Arbeit erreichbar, ist aber nicht der package-level Runtime-Entry-Point.

### Render / Environment

`render.yaml`:

- `GEMINI_RESEARCH_SHADOW_ENABLED=false`;
- `GEMINI_RESEARCH_FREE_TIER_ONLY=true`;
- `GEMINI_RESEARCH_FREE_TIER_ATTESTED=false`;
- 50 Requests/Tag Default;
- keine Modell-/Paid-Preis-/USD-Budget-Konfiguration mehr im Blueprint.

`.env.example` dokumentiert, dass der Key aus einem Projekt ohne Billing stammen muss.

`GEMINI_API_KEY` bleibt unverändert ausschließlich in der kanonischen `finance-secrets.env`-Secret-Verwaltung. Im Repo befindet sich kein echter Key.

## Regressionstests

`tests/unit/geminiResearchFreeTierRuntime.test.ts` deckt ab:

- default-off;
- gepinntes Free-Tier-Modell;
- Attestation fail-closed;
- Paid-Mode-Versuch fail-closed;
- Modell-/Paid-Preis-Overrides werden ignoriert;
- lokale Unit-Costs bleiben 0;
- tägliche Requests werden auf 100 gedeckelt und bleiben damit unter dem aktuell dokumentierten 500-RPD-Search-Wert.

## Unveränderte fachliche Grenzen

- kein öffentlicher Gemini-Endpunkt;
- kein Startup-Traffic;
- kein Scoring-/Ranking-/Eligibility-Impact;
- `AI_DISCOVERED_EVIDENCE` bleibt `scoreEligible=false`;
- provider-owned Citation-Bindung bleibt Pflicht;
- keine automatische Evidence-Promotion.

## Operative Zero-Cost-Regel

Die Runtime darf nur aktiviert werden, wenn das Google/Gemini-Projekt **keine Billing-Verknüpfung** besitzt.

Vor Aktivierung:

1. Google AI Studio / Projekt prüfen;
2. sicherstellen, dass keine Abrechnung aktiviert ist;
3. aktuelle Pricing-/Rate-Limit-Dokumentation prüfen;
4. erst danach `GEMINI_RESEARCH_FREE_TIER_ATTESTED=true` setzen;
5. Shadow-Flag separat aktivieren.

Wenn Billing später aktiviert oder der Status unklar wird, Attestation sofort auf `false` setzen.

## Validierungsstand

- Neue Policy-/Testdateien wurden in GitHub angelegt.
- Vollständiger `vitest`-/`tsc`-Run steht weiterhin auf **PENDING CI**, solange kein geeigneter Actions-Trigger/PR existiert.
- Es wird kein vollständiger Test-PASS behauptet.

## Vorher / Nachher

| Dimension | Vorher A.6 | Free-Tier-only Hardening |
|---|---|---|
| Modell | runtime-konfigurierbar | `gemini-2.5-flash` gepinnt |
| Paid Mode | über Preis-/Budget-Konfig theoretisch möglich | verboten |
| Preisparameter | Runtime-Konfiguration | im kanonischen Factory fest 0 |
| Billing-Schutz | USD-Budget | Free-Tier-Projekt + Attestation |
| Tagesrequests | 50 Default, bis 10k konfigurierbar | 50 Default, hart max. 100 |
| Google Search | kostenbewusst | Free-Tier-only, unter aktuellem 500-RPD-Wert |
| Zero-Cost-Gate | nicht garantiert | technisch + operativ fail-closed |
