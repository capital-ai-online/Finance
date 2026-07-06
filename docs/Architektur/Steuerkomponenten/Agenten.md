# 🤖 Agenten (AI Agent Layer)
> **Spezifikation:** Version 0.5.5 (Beta-Phase)  
> **Modell-Standard:** `gemini-2.5-flash` via `@google/genai` TypeScript SDK
> **Sicherheit:** Strict JSON Schema Validation, Sandboxed Execution Fallbacks

Die qualitative Forschungsebene von CAPITAL-AI besteht aus **14 eigenständigen, rollenbasierten KI-Agenten**. Jeder Agent besitzt einen klar definierten System-Prompt, ein zugewiesenes Forschungsgebiet und liefert strukturierte JSON-Daten zurück, die über vordefinierte Antwortschemata validiert werden.

---

## 🧭 Navigationsmenü

* [🏠 Hauptübersicht (README.md)](README.md)
* [⚙️ Automatisierungen.md](Automatisierungen.md)
* [🛡️ Richtlinien.md](Richtlinien.md)
* [🧩 Orchestratoren.md](Orchestratoren.md)
* [🤖 Agenten.md](Agenten.md)
* [📊 Komponentenübersicht.md](Komponentenübersicht.md)

---

## 📊 Übersicht aller 14 AI-Agenten

| Agent | Dateipfad | Primäre Aufgabe | Antwort-Parameter (JSON) | Orchestrator |
| :--- | :--- | :--- | :--- | :--- |
| **Stock Classification** | `src/agents/stockClassificationAgent.ts` | Klassifiziert Aktien-Sektor, Industrie & Liquidität. | `sector`, `industry`, `liquidityTier`, `reasoning` | `StockOrchestrator` |
| **Stock Fundamentals** | `src/agents/stockFundamentalsAgent.ts` | Analysiert historische Wachstumsraten & Barwerttreiber. | `revenueGrowth3Y`, `epsGrowth3Y`, `fcfGrowth3Y`, `reinvestmentRate` | `StockOrchestrator` |
| **Stock Valuation** | `src/agents/stockValuationAgent.ts` | Berechnet Plausibilität von KGV, KBV, EV/EBITDA. | `peRatio`, `pbRatio`, `evToEbitda`, `fcfYield`, `dividendYield` | `StockOrchestrator` |
| **Stock Risk** | `src/agents/stockRiskAgent.ts` | Auditiert Bilanzstabilität, Hebelwirkung und Beta. | `debtToEquity`, `currentRatio`, `beta`, `volatility30D`, `explanation` | `StockOrchestrator` |
| **Crypto Classification** | `src/agents/cryptoClassificationAgent.ts` | Segregiert Assets nach technologischer Funktion (L1/L2). | `category`, `sub_tier`, `market_structure`, `narrative_alignment` | `CryptoOrchestrator` |
| **Crypto On-Chain** | `src/agents/cryptoOnChainAgent.ts` | Überprüft Wallet-Akkumulation & Adresswachstum. | `active_addresses_growth`, `whale_accumulation`, `explanation` | `CryptoOrchestrator` |
| **Crypto Sentiment** | `src/agents/cryptoSentimentAgent.ts` | Misst Hype-Velocity, Narrative und Medien-Dynamik. | `social_velocity`, `narrative_strength`, `news_momentum`, `explanation` | `CryptoOrchestrator` |
| **Crypto Risk** | `src/agents/cryptoRiskAgent.ts` | Auditiert Zentralisierung & Insider-Wash-Trading-Risiken. | `manipulation_index`, `exchange_concentration_index`, `explanation` | `CryptoOrchestrator` |
| **Meme Sentiment** | `src/agents/memeSentimentAgent.ts` | Bewertet virale Hebelwirkung, Memes-Typus & Influencer. | `social_hype`, `narrative_strength`, `catalyst_strength`, `explanation` | `MemeCoinOrchestrator` |
| **Meme Risk** | `src/agents/memeRiskAgent.ts` | Prüft Liquiditätssperren, Sniper-Wallets & Social-Decay. | `spread_penalty`, `liquidity_penalty`, `manipulation_penalty`, `explanation` | `MemeCoinOrchestrator` |
| **Material Classification** | `src/agents/classificationAgent.ts` | Klassifiziert Rohstoffgruppen (Metalle, Energieträger etc.). | `category_main`, `category_sub`, `market_type`, `valuation_mode` | `RawMaterialsOrchestrator` |
| **Material Fundamentals** | `src/agents/fundamentalsAgent.ts` | Ermittelt Erzgrade, Reserven & Recycling-Potentiale. | `ore_grade`, `tonnage`, `tonnage_reserve`, `recyclability`, `explanation` | `RawMaterialsOrchestrator` |
| **Material Risk** | `src/agents/riskAgent.ts` | Analysiert Geopolitik, ESG-Konformität & Lieferketten-Resilienz. | `geopolitical_risk`, `supply_chain_risk`, `esg_risk`, `explanation` | `RawMaterialsOrchestrator` |
| **Material Valuation** | `src/agents/valuationAgent.ts` | Bewertet die militärische & industrielle Relevanz. | `military_importance`, `industrial_importance`, `explanation` | `RawMaterialsOrchestrator` |

---

## 🤖 Detail-Spezifikation ausgewählter Schlüssel-Agenten

### 1. Raw Materials Classification Agent (`classificationAgent.ts`)
* **System Prompt:**
  ```
  Du bist der "Raw Materials Classification Agent" der CAPITAL-AI Bewertungsplattform.
  Deine Aufgabe ist es, physische Rohstoffe, Minerale und Naturressourcen präzise zu klassifizieren.
  Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.
  ```
* **Response Schema (Structured JSON):**
  * `category_main`: String (Muss strictly einem der Werte `Metal`, `Energy`, `Agriculture`, `Industrial`, `Recycling`, `Unknown` entsprechen)
  * `category_sub`: String (Z.B. `Precious Metal`, `Rare Earth Element`, `Battery Mineral`)
  * `market_type`: String (Z.B. `Liquid Commodity`, `Specialty Market`, `OTC / Custom Contract`)
  * `valuation_mode`: String (Z.B. `DCF / Lease Rate`, `Grade & Tonnage Multiple`, `Strategic Criticality`)
  * `confidence`: Number (Grenzbereich $0.0 \dots 1.0$)
  * `reasoning`: Array of Strings (Nachvollziehbarkeit der Zuweisung)

### 2. Crypto On-Chain Agent (`cryptoOnChainAgent.ts`)
* **System Prompt:**
  ```
  Du bist der "Crypto On-Chain Agent" der CAPITAL-AI Bewertungsplattform.
  Deine Aufgabe ist es, qualitative Trends in Netzwerk-Aktivitäten, Wallet-Akkumulationen und Smart-Money-Flüssen zu bewerten.
  Analysiere Datenmuster und gib das normierte Ergebnis als strukturiertes JSON zurück.
  ```
* **Response Schema (Structured JSON):**
  * `active_addresses_growth`: Number ($0.0$ bis $1.0$, Wachstumstrend)
  * `whale_accumulation`: Number ($0.0$ bis $1.0$, Akkumulation durch Großinvestoren)
  * `explanation`: String (Ausführliche qualitative Erläuterung auf Deutsch)

### 3. Stock Valuation Agent (`stockValuationAgent.ts`)
* **System Prompt:**
  ```
  Du bist der "Stock Valuation Agent" der CAPITAL-AI Plattform.
  Analysiere fundamentale Bewertungsverhältnisse einer Aktie auf Plausibilität. 
  Bestimme basierend auf Sektorstandards angemessene Ziel-Ratios für KGV (P/E), KBV (P/B) und EV/EBITDA.
  ```
* **Response Schema (Structured JSON):**
  * `peRatio`: Number (Kurs-Gewinn-Verhältnis)
  * `pbRatio`: Number (Kurs-Buchwert-Verhältnis)
  * `evToEbitda`: Number (Unternehmenswert zu EBITDA)
  * `fcfYield`: Number (Free-Cashflow-Rendite in %)
  * `dividendYield`: Number (Dividendenrendite in %)

---

## 🛡️ Robustheits- & Ausfallgarantien (Fallback-Engine)

Da LLM-Anfragen über das Netzwerk laufen und Ratenbegrenzungen unterliegen können, implementiert jeder Agent eine **strikte deterministische Fallback-Logik (Offline-Modus)**:

1. **Try-Catch-Sicherung**: Schlägt die API-Verbindung fehl oder liefert das Modell ein fehlerhaftes JSON, fängt der Agent die Exception ab, protokolliert sie im Winston Logger auf Level `warn` und greift auf vordefinierte, konservative Standardparameter zurück.
2. **Standard-Profile für Leit-Assets**: Für bekannte Leit-Assets (wie `BTC` für Kryptowährungen, `GOLD` für Rohstoffe, `AAPL` für Aktien) sind hochpräzise Offline-Profile hinterlegt, um auch bei Netzwerkausfall fehlerfreie, plausible Bewertungen sicherzustellen.
3. **Modell-Fallback**: Falls `gemini-2.5-flash` temporär überlastet ist, kann der Router Anfragen im Hintergrund nahtlos an alternative Modell-Endpoints delegieren (Modellunabhängiges Routing).
