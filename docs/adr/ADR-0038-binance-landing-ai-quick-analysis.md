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

## Verifikation vor `resolved/`

- TypeScript-/Vite-Build erfolgreich.
- Endpoint liefert für mindestens BTC, ETH und SOL reale Binance-Daten.
- Ungültige Symbole liefern 4xx ohne AI-Aufruf.
- Binance-Ausfall/Timeout erzeugt 502 und keine Demo-Daten.
- Rate-Limit erzeugt 429.
- Landing-Widget erscheint ausschließlich im öffentlichen Landing-Hero.
- CI vollständig grün.

Erst nach diesen Nachweisen darf `Implementation-Status` auf `✅ COMPLETE` gesetzt und der ADR nach `docs/adr/resolved/` verschoben werden.
