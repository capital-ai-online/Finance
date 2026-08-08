# ADR-0038 — Binance Spot als Datenquelle der öffentlichen AI-Kurzanalyse

**Status:** ACCEPTED  
**Implementation-Status:** 🟡 IN PROGRESS  
**Datum:** 2026-08-03  
**Scope:** Landingpage, Market Data, AI Provider Routing, No Demo Data Policy

## Kontext

Die öffentliche CAPITAL-AI Landingpage soll eine kurze, nachvollziehbare Krypto-Marktanalyse anbieten. Die Analyse darf gemäß der No-Demo-Data-Policy keine simulierten Kurse verwenden und soll gleichzeitig keinen privaten Börsen-Account oder Trading-Key benötigen.

Binance stellt öffentliche Spot-Marktdaten über einen dedizierten Market-Data-Endpunkt bereit. Für Ticker- und Kline-Daten ist deshalb keine Speicherung eines Binance API Secrets erforderlich.

## Entscheidung

1. Öffentliche Binance-Spot-Marktdaten werden ausschließlich serverseitig über `https://data-api.binance.vision` gelesen.
2. Die Landingpage ruft ausschließlich den CAPITAL-AI-Endpunkt `POST /api/landing/quick-analysis` auf und kommuniziert nicht direkt mit Binance.
3. Der Endpoint akzeptiert kompakte Asset-Symbole wie `BTC`, `ETH` oder `SOL` und normalisiert diese standardmäßig auf das Binance-USDT-Spot-Paar.
4. Als Marktevidenz werden mindestens 24h-Ticker und 24 stündliche Schlusskurse verwendet.
5. Die bestehende Provider-Kette Anthropic → OpenAI → Gemini erzeugt die sprachliche Kurzanalyse ausschließlich aus den gelieferten Binance-Werten.
6. Falls kein AI-Provider verfügbar ist oder die Provider-Kette fehlschlägt, liefert der Endpoint eine deterministische quantitative Zusammenfassung statt Demo- oder erfundener Daten.
7. Der öffentliche Endpoint ist separat pro IP rate-limitiert, um AI-Kosten und Missbrauch zu begrenzen.
8. Die Antwort nennt die Quelle `Binance Spot`, den Datenzeitpunkt und enthält keine Kauf- oder Verkaufsempfehlung.

## Sicherheits- und Compliance-Eigenschaften

- Kein Binance API Key im Browser oder Repository.
- Kein Trading-, Order- oder Account-Zugriff.
- Eingabesymbole werden per Allowlist-Regex normalisiert; freie URLs oder beliebige Upstream-Ziele sind ausgeschlossen.
- Upstream-Requests besitzen ein festes Timeout.
- Die AI erhält ausschließlich serialisierte Marktmetriken; Nutzerinput wird nicht als Systemanweisung übernommen.
- No Demo Data: Upstream-Ausfall führt zu einem Fehler und niemals zu erfundenen Marktdaten.
- Öffentliche AI-Nutzung wird zusätzlich zur globalen Serverbegrenzung endpoint-spezifisch limitiert.

## Implementierung

- `server/binanceLandingQuickAnalysis.ts`
- `server/ai.ts`
- `src/components/LandingBinanceQuickAnalysis.tsx`
- `src/components/CapitalAiLogo.tsx`

Der bestehende 120px-Landing-Hero des `CapitalAiLogo` ist aktuell die einzige Verwendung dieser Variantenkombination und dient als eng begrenzter Integrationspunkt für das neue Landing-Widget. Eine spätere Zerlegung der großen `LandingPage.tsx` in eigenständige Hero-/Auth-Sektionen kann diesen Integrationspunkt expliziter machen, ohne den API-Vertrag zu ändern.

## Folgen

### Positiv

- Reale, aktuelle Krypto-Marktdaten bereits vor der Anmeldung.
- Keine zusätzlichen Secrets oder Binance-Kontoabhängigkeiten.
- Wiederverwendung des bestehenden Multi-LLM-Routings.
- Sauberer Fallback ohne Verstoß gegen die No-Demo-Data-Policy.

### Risiken

- Binance-Verfügbarkeit beeinflusst die öffentliche Kurzanalyse.
- Öffentliche AI-Aufrufe erzeugen Providerkosten; Rate-Limits bleiben verpflichtend.
- USDT-Normalisierung deckt absichtlich nicht alle möglichen Binance-Handelspaare ab.

## Nachtrag 2026-08-08 — Wiederverwendung im Enterprise Scorer

Die Kernlogik (Binance-Marktdaten laden + AI-Kurzanalyse erzeugen) wurde aus dem Route-Handler
in eine geteilte Funktion `computeBinanceQuickAnalysis()` (`server/binanceLandingQuickAnalysis.ts`)
extrahiert und zusätzlich zum bestehenden öffentlichen Endpunkt von einem zweiten,
**authentifizierten** Endpunkt verwendet: `POST /api/registry/assets/:symbol/quick-analysis`
(`src/features/registry/registryRoutes.ts`), konsumiert von der neuen Komponente
`src/components/EnterpriseBinanceQuickAnalysis.tsx`. Sie ersetzt die vormals im Enterprise
Scorer (`EnterpriseAnalysisPanels.tsx`) gezeigte, ausschließlich auf bereits verifizierten
internen Scoring-Fakten basierende "AI Kurzanalyse" (kein Live-Marktdaten-Zugriff) durch eine
Live-Binance-Marktdaten-Variante, positioniert als erste Komponente des Enterprise Scorers,
oberhalb der Asset-Suche, angetrieben vom dort bereits ausgewählten Symbol (kein eigenes
Suchfeld).

Diese Erweiterung ändert die ursprünglichen Entscheidungen 1–8 nicht, ergänzt sie aber:

- Der öffentliche Landing-Endpunkt (`/api/landing/quick-analysis`) bleibt unverändert bestehen,
  weiterhin ohne Login erreichbar, weiterhin separat per IP rate-limitiert
  (`landing-binance-ai:<ip>`, 6/min) und weiterhin die einzige Instanz im nicht angemeldeten
  Landing-Hero — die Verifikationsaussage "Landing-Widget erscheint ausschließlich im
  öffentlichen Landing-Hero" bezieht sich unverändert auf `LandingBinanceQuickAnalysis.tsx`
  und bleibt zutreffend.
- Der neue authentifizierte Endpunkt nutzt einen eigenen Rate-Limit-Namespace
  (`registry-binance-ai:<ip>`, ebenfalls 6/min) und eine eigene Prompt-Registry-ID
  (`enterprise-binance-quick-analysis`), damit Kosten/Nutzung beider Aufrufkontexte getrennt
  auswertbar bleiben und keiner der beiden Kontexte den Rate-Limit-Kontingent des anderen
  verbraucht.
- Fail-Closed-/No-Demo-Data-Eigenschaften (Punkte 5–8 der ursprünglichen Entscheidung) gelten
  identisch für beide Aufrufkontexte, da beide dieselbe Kernfunktion verwenden.

## Verifikation vor `resolved/`

- TypeScript-/Vite-Build erfolgreich.
- Endpoint liefert für mindestens BTC, ETH und SOL reale Binance-Daten.
- Ungültige Symbole liefern 4xx ohne AI-Aufruf.
- Binance-Ausfall/Timeout erzeugt 502 und keine Demo-Daten.
- Rate-Limit erzeugt 429.
- Landing-Widget erscheint ausschließlich im öffentlichen Landing-Hero.
- CI vollständig grün.

Erst nach diesen Nachweisen darf `Implementation-Status` auf `✅ COMPLETE` gesetzt und der ADR nach `docs/adr/resolved/` verschoben werden.
