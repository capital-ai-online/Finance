# CAPITAL-AI Orchestration & Scoring Engine System Specification
**System Version:** 0.5.4 (Beta-Phase)  
**Standard Compliance:** Auditable, Deterministic, Zero-Breach Data Integrity

---

## 1. System Overview

The CAPITAL-AI platform evaluates financial assets and physical commodities utilizing a decoupled, model-independent **Multi-Agent Orchestrator** pattern. 

To prevent code bloat ("Programm Überschwemmungen") and keep the system lean ("schlank"), the architecture operates under a strict hierarchy:
1. **Specialized Weighting and Evaluation Orchestrators** are queried first whenever an asset matches a specialized domain (e.g., Raw Materials/Commodities, Bluechip Cryptocurrencies, or High-Velocity Meme-Coins).
2. **The Universal/Fallback Score Engine** is strictly restricted to assets for which no specialized orchestrator exists (e.g., general indexes, standard stocks, and forex).

```
                      +-----------------------------+
                      |    Inbound Asset Query      |
                      +--------------+--------------+
                                     |
                                     v
                       Is there a Specialized Engine?
                       /                           \
                     YES                           NO
                     /                               \
                    v                                 v
      +-----------------------------+   +-----------------------------+
      | Specialized Scoring Service |   |  Universal Fallback Engine  |
      |   (Raw Materials, Crypto,   |   | (Standard Stock/Forex/Index)|
      |         Meme Coins)         |   +-----------------------------+
      +-----------------------------+
```

---

## 2. The Three Specialized Orchestrators & Multi-Agent Pipelines

All specialized orchestrators utilize high-concurrency multi-agent prompts powered by the `@google/genai` TypeScript SDK (model: `gemini-2.5-flash`), combined with hard, deterministic scoring services.

### A. Raw Materials (Commodity) Orchestrator
* **Location:** `/src/orchestrator/rawMaterialsOrchestrator.ts`
* **Agents Involved:**
  * **Classification Agent:** Categorizes into Main Class (`Metal`, `Energy`, `Agriculture`, `Industrial`, `Recycling`, `Unknown`) and identifies precise sub-classes.
  * **Fundamentals Agent:** Assesses ore grades, tonnage, substitution potential, and recyclability.
  * **Risk Agent:** Audits geopolitical, supply-chain, regulatory, ESG risks, and volatility.
  * **Valuation Agent:** Identifies military and industrial criticality.
* **Scoring Engine:** `RawMaterialsScoringService.scoreMaterial`

### B. Enterprise Cryptocurrency Orchestrator
* **Location:** `/src/orchestrator/cryptoOrchestrator.ts`
* **Agents Involved:**
  * **Crypto Classification Agent:** Segregates assets by Tier (L1, L2, DeFi, Oracle, Web3).
  * **Crypto On-Chain Agent:** Examines address growth velocity, transaction frequency, and smart money/whale wallet accumulation.
  * **Crypto Sentiment Agent:** Quantifies global news flow, social media mention speeds, and narrative strength.
  * **Crypto Risk Agent:** Analyzes wash-trading risks and custody centralisation risks.
* **Scoring Engine:** `CryptoScoringService.scoreCrypto`

### C. Meme-Coin Scoring (kein Orchestrator)
* **Scoring Engine:** `MemeCoinScoringService.scoreMemeCoin` — `/src/services/memeCoinScoringService.ts`
* **Aufrufpfad:** direkt aus `server.ts` (`/api/crypto-score`, `/api/meme-score`), ohne vorgelagerten Orchestrator.
* **Agents Involved:** keine.

> **Korrektur (Audit ARCH-AUDIT-0002, 2026-07-31):** Dieser Abschnitt beschrieb zuvor einen
> „Meme-Coin Master Orchestrator" unter `/src/orchestrator/memeCoinOrchestrator.ts` mit zwei
> Agenten (Meme Sentiment Agent, Meme Risk Agent). Weder die Orchestrator-Datei noch die beiden
> Agenten existieren in dieser Codebasis. Die Meme-Coin-Bewertung erfolgt ausschliesslich ueber
> die oben genannte Scoring-Engine. Der korrespondierende Falscheintrag in
> `/api/admin/orchestrators/status` (`server/systemEvents.ts`) wurde im selben Zug entfernt.

---

## 3. Mathematical Foundations & Equations

### I. Raw Materials (Commodities) Scoring Engine
Aggregates geological, commercial, and physical parameters. Each sub-dimension is compiled using equal-weighted parameter averages (0–100 scale):

1. **Liquidity ($L_{score}$):**
   $$L_{score} = \frac{\text{market\_liquidity} + \text{trading\_volume}}{2}$$
2. **Fundamentals ($F_{score}$):**
   $$F_{score} = \frac{\text{ore\_grade} + \frac{\text{tonnage} + \text{tonnage\_reserve}}{2} + \text{substitution\_potential} + \text{recyclability}}{4}$$
3. **Processing ($P_{score}$):**
   $$P_{score} = \frac{(100 - \text{processing\_complexity}) + \text{infrastructure} + (100 - \text{extraction\_costs})}{3}$$
4. **Risk Penalty ($R_{score}$):**
   $$R_{score} = \frac{\text{geopolitical} + \text{supply\_chain} + \text{regulatory} + \text{esg} + \text{producer\_concentration} + \text{volatility}}{6}$$
5. **Strategic Importance ($S_{score}$):**
   $$S_{score} = \frac{\text{military\_importance} + \text{industrial\_importance}}{2}$$

**Final Aggregate Formulation:**
$$\text{FinalScore} = \text{Clamp}\left(0, 100, (F_{score} \times w_f) + ((100 - R_{score}) \times w_r) + (L_{score} \times w_l) + (P_{score} \times w_p) + (S_{score} \times w_s)\right)$$
*Weights are set based on active versioning parameters.*

---

### II. Enterprise Cryptocurrency Scoring Engine
Operates with **Positive Indicators** (total max points: 111) and **Negative Risks** (total max points: 28), which normalize dynamically into an 80-point base scale, a 15-point penalty scale, and a 20-point macro bonus.

1. **Positive Components ($P_{sum}$):**
   $$P_{sum} = \sum (\text{Trend} \times 14, \text{Momentum} \times 12, \text{VolQuality} \times 10, \text{Breakout} \times 8, \text{RSI} \times 8, \text{Volume} \times 10, \text{Orderbook} \times 8, \text{OnChain} \times 5, \text{Flows} \times 5, \text{Whales} \times 5, \text{Tokenomics} \times 4, \text{SocialVelocity} \times 6, \text{Narrative} \times 5, \text{News} \times 5, \text{Community} \times 4, \text{AIConfidence} \times 2)$$
   $$\text{BaseScore} = \left(\frac{P_{sum}}{111}\right) \times 80$$

2. **Negative Risk Penalty ($N_{sum}$):**
   $$N_{sum} = \sum (\text{Spread} \times 8, \text{Slippage} \times 6, \text{WashTrading} \times 5, \text{Centralisation} \times 4, \text{RugpullRisk} \times 3, \text{OracleRisk} \times 2)$$
   $$\text{RiskPenalty} = \left(\frac{N_{sum}}{28}\right) \times 15$$

3. **Regime Bonus ($B_{regime}$):**
   $$B_{regime} = \text{Clamp}(\text{regime\_bonus}) \times 20$$

**Final Aggregate Formulation:**
$$\text{FinalScore} = \text{Clamp}\left(0.0, 100.0, \text{BaseScore} - \text{RiskPenalty} + B_{regime}\right)$$

---

### III. High-Velocity Meme-Coin Scoring Engine
Focuses purely on viral hype speed and structural traps. 

1. **Base Hype Score ($H_{base}$):**
   $$H_{base} = (\text{Liquidity} \times 0.15 + \text{VolumeTrend} \times 0.10 + \text{TrendStructure} \times 0.15 + \text{Momentum} \times 0.10 + \text{VolQuality} \times 0.10 + \text{SocialSentiment} \times 0.15 + \text{Narrative} \times 0.10 + \text{Catalyst} \times 0.10) \times 100$$
2. **Speculative Penalty ($P_{spec}$):**
   $$P_{spec} = (\text{SpreadPenalty} + \text{LiquidityPenalty} + \text{ManipulationPenalty} + \text{RugpullPenalty} + \text{DecayPenalty}) \times 100$$
3. **AI Confidence Contribution ($C_{ai}$):**
   $$C_{ai} = \text{Clamp}(\text{ai\_confidence\_bonus}, 0.0, 0.05) \times 100$$

**Final Aggregate Formulation:**
$$\text{FinalScore} = \text{Clamp}\left(0.0, 100.0, H_{base} - P_{spec} + C_{ai}\right)$$

---

## 4. Architectural Safety Benefits

1. **Flexible Deployment:** All scoring algorithms are implemented as static class methods in the `/src/services` folder, permitting deterministic execution on both the server (Express API) and client (interactive charts and simulations) with zero state drift.
2. **Defensive API Contracts:** All parameters are clamped inside $[0.0, 1.0]$, preventing buffer overflows or out-of-bounds calculations in external audits.
3. **Absolute Transparency:** Clear split between upside multipliers and safety penalties makes every rating fully explainable and auditable.
