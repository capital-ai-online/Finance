/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  StockInput, 
  StockAnalysisPayload, 
  StockClassification, 
  StockFactorScores, 
  DCFValuationPayload, 
  PlaybookRecommendation, 
  PlaybookType,
  DCFScenarioResult
} from '../types/stock';
import { 
  STOCK_SCORING_VERSIONS, 
  ACTIVE_STOCK_VERSION, 
  findStockConfig 
} from '../config/stockConfig';

export class StockScoringService {
  /**
   * Main entry point to score and analyze a stock.
   * Leverages deterministic scoring models with optional fallback values.
   */
  public static scoreStock(input: StockInput, requestedVersion: string = ACTIVE_STOCK_VERSION): StockAnalysisPayload {
    const configVersion = STOCK_SCORING_VERSIONS[requestedVersion] || STOCK_SCORING_VERSIONS[ACTIVE_STOCK_VERSION];
    const weights = configVersion.weights;

    // 1. Resolve registered config for the stock
    const registered = findStockConfig(input.symbol || input.name);

    // 2. Merge inputs with registered database
    const merged: StockInput = {
      symbol: (input.symbol || registered?.symbol || 'UNKNOWN').toUpperCase(),
      name: input.name || registered?.name || 'Unknown Stock Asset',
      price: input.price ?? registered?.price ?? 100,
      
      peRatio: input.peRatio ?? registered?.peRatio,
      pbRatio: input.pbRatio ?? registered?.pbRatio,
      evToEbitda: input.evToEbitda ?? registered?.evToEbitda,
      fcfYield: input.fcfYield ?? registered?.fcfYield,
      dividendYield: input.dividendYield ?? registered?.dividendYield,
      
      debtToEquity: input.debtToEquity ?? registered?.debtToEquity,
      currentRatio: input.currentRatio ?? registered?.currentRatio,
      roe: input.roe ?? registered?.roe,
      roic: input.roic ?? registered?.roic,
      operatingMargin: input.operatingMargin ?? registered?.operatingMargin,
      
      revenueGrowth3Y: input.revenueGrowth3Y ?? registered?.revenueGrowth3Y,
      epsGrowth3Y: input.epsGrowth3Y ?? registered?.epsGrowth3Y,
      fcfGrowth3Y: input.fcfGrowth3Y ?? registered?.fcfGrowth3Y,
      reinvestmentRate: input.reinvestmentRate ?? registered?.reinvestmentRate,
      
      beta: input.beta ?? registered?.beta,
      volatility30D: input.volatility30D ?? registered?.volatility30D,
      momentum3M: input.momentum3M ?? registered?.momentum3M,
      momentum6M: input.momentum6M ?? registered?.momentum6M,
      momentum12M: input.momentum12M ?? registered?.momentum12M,
      rsi14: input.rsi14 ?? registered?.rsi14,
      trendStrength: input.trendStrength ?? registered?.trendStrength,
      
      sentimentScore: input.sentimentScore ?? registered?.sentimentScore,
      analystRating: input.analystRating ?? registered?.analystRating,
      
      fcf: input.fcf ?? registered?.fcf,
      discountRate: input.discountRate ?? registered?.discountRate,
      terminalGrowth: input.terminalGrowth ?? registered?.terminalGrowth,
      sharesOutstanding: input.sharesOutstanding ?? registered?.sharesOutstanding
    };

    const missingFields: string[] = [];

    // Helper to extract values and track missing data
    const getVal = (field: keyof Omit<StockInput, 'symbol' | 'name'>, fallback: number = 50): number => {
      const val = merged[field];
      if (val === undefined || val === null) {
        missingFields.push(String(field));
        return fallback;
      }
      return val;
    };

    // Calculate Data Quality Score
    const dcfFields = ['fcf', 'discountRate', 'terminalGrowth', 'sharesOutstanding'];
    const criticalFields = [
      'price', 'peRatio', 'pbRatio', 'evToEbitda', 'fcfYield',
      'debtToEquity', 'currentRatio', 'roe', 'roic', 'operatingMargin',
      'revenueGrowth3Y', 'epsGrowth3Y', 'beta', 'volatility30D',
      'momentum12M', 'rsi14', 'trendStrength'
    ];
    const allScoringFields = [...criticalFields, ...dcfFields];
    let fieldsPresent = 0;
    for (const f of allScoringFields) {
      if (merged[f as keyof StockInput] !== undefined && merged[f as keyof StockInput] !== null) {
        fieldsPresent++;
      }
    }
    const dataQualityScore = Math.round((fieldsPresent / allScoringFields.length) * 100);
    
    let dataQualityLevel: 'low' | 'medium' | 'high' | 'unknown' = 'high';
    if (dataQualityScore < 40) {
      dataQualityLevel = 'unknown';
    } else if (dataQualityScore < 60) {
      dataQualityLevel = 'low';
    } else if (dataQualityScore < 85) {
      dataQualityLevel = 'medium';
    }

    // --- FACTOR SCORING ---

    // 1. Value Scoring (V_score: 0-100)
    const pe = getVal('peRatio', 25);
    const pb = getVal('pbRatio', 4.0);
    const evEbitda = getVal('evToEbitda', 15);
    const fcfYld = getVal('fcfYield', 4.0);
    const divYld = getVal('dividendYield', 1.5);

    // Linear scoring functions (lower multiples = higher score, higher yields = higher score)
    const peScore = Math.max(0, Math.min(100, 100 - ((pe - 8) / 42) * 100)); // Optimal PE <= 8 is 100, PE >= 50 is 0
    const pbScore = Math.max(0, Math.min(100, 100 - ((pb - 1.0) / 14) * 100)); // Optimal PB <= 1.0 is 100, PB >= 15 is 0
    const evEbitdaScore = Math.max(0, Math.min(100, 100 - ((evEbitda - 6) / 24) * 100)); // EV/EBITDA <= 6 is 100, >= 30 is 0
    const fcfYieldScore = Math.max(0, Math.min(100, (fcfYld / 10) * 100)); // FCF Yield >= 10% is 100
    const divYieldScore = Math.max(0, Math.min(100, (divYld / 6) * 100)); // Dividend Yield >= 6% is 100
    
    const valueScore = Math.round((peScore * 0.3) + (pbScore * 0.15) + (evEbitdaScore * 0.25) + (fcfYieldScore * 0.2) + (divYieldScore * 0.1));

    // 2. Growth Scoring (G_score: 0-100)
    const revGr = getVal('revenueGrowth3Y', 8.0);
    const epsGr = getVal('epsGrowth3Y', 10.0);
    const fcfGr = getVal('fcfGrowth3Y', 9.0);
    const reinvestRate = getVal('reinvestmentRate', 40.0);

    const revGrScore = Math.max(0, Math.min(100, (revGr / 30) * 100)); // >= 30% is 100
    const epsGrScore = Math.max(0, Math.min(100, (epsGr / 35) * 100)); // >= 35% is 100
    const fcfGrScore = Math.max(0, Math.min(100, (fcfGr / 35) * 100)); // >= 35% is 100
    const reinvestScore = reinvestRate; // already 0-100 scale

    const growthScore = Math.round((revGrScore * 0.3) + (epsGrScore * 0.3) + (fcfGrScore * 0.25) + (reinvestScore * 0.15));

    // 3. Momentum Scoring (M_score: 0-100)
    const mom3 = getVal('momentum3M', 5.0);
    const mom6 = getVal('momentum6M', 10.0);
    const mom12 = getVal('momentum12M', 15.0);
    const rsi = getVal('rsi14', 55);
    const trendStr = getVal('trendStrength', 60);

    const mom3Score = Math.max(0, Math.min(100, ((mom3 + 10) / 30) * 100)); // -10% is 0, +20% is 100
    const mom6Score = Math.max(0, Math.min(100, ((mom6 + 15) / 50) * 100)); // -15% is 0, +35% is 100
    const mom12Score = Math.max(0, Math.min(100, ((mom12 + 20) / 70) * 100)); // -20% is 0, +50% is 100
    
    // RSI ideal range is 50-65 (Strong, not overbought). Below 30 is oversold (good for turnaround but poor momentum)
    let rsiScore = 50;
    if (rsi >= 50 && rsi <= 68) rsiScore = 100;
    else if (rsi > 68 && rsi <= 80) rsiScore = 100 - ((rsi - 68) / 12) * 40; // Overbought penalty
    else if (rsi > 80) rsiScore = 30;
    else if (rsi < 50 && rsi >= 35) rsiScore = ((rsi - 35) / 15) * 50 + 30;
    else if (rsi < 35) rsiScore = 20;

    const momentumScore = Math.round((mom3Score * 0.15) + (mom6Score * 0.2) + (mom12Score * 0.35) + (rsiScore * 0.1) + (trendStr * 0.2));

    // 4. Quality Scoring (Q_score: 0-100)
    const roe = getVal('roe', 15.0);
    const roic = getVal('roic', 12.0);
    const opMargin = getVal('operatingMargin', 15.0);
    const d2e = getVal('debtToEquity', 0.8);
    const curRatio = getVal('currentRatio', 1.3);

    const roeScore = Math.max(0, Math.min(100, (roe / 30) * 100)); // ROE >= 30% is 100
    const roicScore = Math.max(0, Math.min(100, (roic / 25) * 100)); // ROIC >= 25% is 100
    const opMarginScore = Math.max(0, Math.min(100, (opMargin / 35) * 100)); // Margin >= 35% is 100
    
    const debtScore = Math.max(0, Math.min(100, 100 - (d2e / 2.5) * 100)); // D/E <= 0 is 100, >= 2.5 is 0
    const currentRatioScore = Math.max(0, Math.min(100, ((curRatio - 0.5) / 1.5) * 100)); // Current Ratio >= 2.0 is 100, <= 0.5 is 0

    const qualityScore = Math.round((roeScore * 0.25) + (roicScore * 0.25) + (opMarginScore * 0.2) + (debtScore * 0.15) + (currentRatioScore * 0.15));

    // 5. Risk Penalty Scoring (Risk_score: 0-100, high score = high risk)
    const beta = getVal('beta', 1.1);
    const vol30 = getVal('volatility30D', 22.0);
    
    const betaRisk = Math.max(0, Math.min(100, ((beta - 0.5) / 1.5) * 100)); // Beta <= 0.5 is 0, Beta >= 2.0 is 100
    const volRisk = Math.max(0, Math.min(100, ((vol30 - 12) / 38) * 100)); // Vol <= 12% is 0, Vol >= 50% is 100
    const leverageRisk = Math.max(0, Math.min(100, (d2e / 3.0) * 100)); // Leverage risk

    const riskScore = Math.round((betaRisk * 0.4) + (volRisk * 0.4) + (leverageRisk * 0.2));

    // 6. Profitability and Balance Sheet Sub-Scores
    const profitabilityScore = Math.round((roeScore * 0.4) + (roicScore * 0.3) + (opMarginScore * 0.3));
    const balanceSheetScore = Math.round((debtScore * 0.6) + (currentRatioScore * 0.4));

    // 7. Catalysts & Sentiment Scores
    const sentScoreInput = getVal('sentimentScore', 6.0); // 0-10
    const sentimentScore = sentScoreInput * 10; // 0-100 scale
    
    const analystScoreInput = getVal('analystRating', 7.0); // 0-10
    const catalystsScore = Math.round((analystScoreInput * 10 * 0.6) + (growthScore * 0.4));

    // --- DCF MODEL ---
    // If we have sharesOutstanding, fcf, price, we run a complete DCF evaluation.
    let dcfValuation: DCFValuationPayload | null = null;
    let dcfFactorScore = 50; // default neutral if DCF parameters are missing

    const fcf = merged.fcf;
    const discountRate = merged.discountRate;
    const terminalGrowth = merged.terminalGrowth;
    const sharesOutstanding = merged.sharesOutstanding;
    const currentPrice = merged.price || 100;

    if (fcf && discountRate && terminalGrowth && sharesOutstanding && currentPrice) {
      const runDcfForGrowth = (gRate: number, dRate: number): number => {
        let projectedFcf = fcf;
        let sumPresentValues = 0;
        const years = 5;

        for (let t = 1; t <= years; t++) {
          projectedFcf = projectedFcf * (1 + gRate / 100);
          const pv = projectedFcf / Math.pow(1 + dRate / 100, t);
          sumPresentValues += pv;
        }

        // Terminal value calculation at year 5
        const fcfYear5 = projectedFcf;
        const terminalValue = (fcfYear5 * (1 + terminalGrowth / 100)) / ((dRate / 100) - (terminalGrowth / 100));
        const pvTerminal = terminalValue / Math.pow(1 + dRate / 100, years);
        const totalEquityValue = sumPresentValues + pvTerminal;
        
        return totalEquityValue / sharesOutstanding;
      };

      // Base Growth is derived from average growth indicators
      const baseGrowth = (revGr + epsGr + fcfGr) / 3;

      // Scenario 1: Neutral
      const neutralIntrinsicVal = runDcfForGrowth(baseGrowth, discountRate);
      const neutralGap = ((neutralIntrinsicVal - currentPrice) / currentPrice) * 100;

      // Scenario 2: Conservative (Growth - 25%, WACC + 1.5%)
      const conservativeIntrinsicVal = runDcfForGrowth(baseGrowth * 0.75, discountRate + 1.5);
      const conservativeGap = ((conservativeIntrinsicVal - currentPrice) / currentPrice) * 100;

      // Scenario 3: Optimistic (Growth + 20%, WACC - 1.0%)
      const optimisticIntrinsicVal = runDcfForGrowth(baseGrowth * 1.2, discountRate - 1.0);
      const optimisticGap = ((optimisticIntrinsicVal - currentPrice) / currentPrice) * 100;

      const scenarios: DCFScenarioResult[] = [
        {
          scenario: 'Conservative',
          intrinsicValue: Number(conservativeIntrinsicVal.toFixed(2)),
          upsideDownside: Number(conservativeGap.toFixed(1)),
          growthRate: Number((baseGrowth * 0.75).toFixed(2)),
          discountRate: Number((discountRate + 1.5).toFixed(2))
        },
        {
          scenario: 'Neutral',
          intrinsicValue: Number(neutralIntrinsicVal.toFixed(2)),
          upsideDownside: Number(neutralGap.toFixed(1)),
          growthRate: Number(baseGrowth.toFixed(2)),
          discountRate: Number(discountRate.toFixed(2))
        },
        {
          scenario: 'Optimistic',
          intrinsicValue: Number(optimisticIntrinsicVal.toFixed(2)),
          upsideDownside: Number(optimisticGap.toFixed(1)),
          growthRate: Number((baseGrowth * 1.2).toFixed(2)),
          discountRate: Number((discountRate - 1.0).toFixed(2))
        }
      ];

      dcfValuation = {
        intrinsicValue: Number(neutralIntrinsicVal.toFixed(2)),
        fairValueGap: Number(neutralGap.toFixed(1)),
        scenarios
      };

      // Map neutral fairValueGap to a 0-100 Score.
      // Gap of 0% = 50. Gap of +50% or more = 100. Gap of -50% or more = 0.
      dcfFactorScore = Math.max(0, Math.min(100, Math.round(50 + neutralGap)));
    } else {
      // Missing DCF fields: Fallback to EV/EBITDA multiple valuation score
      dcfFactorScore = peScore;
      missingFields.push('fcf', 'sharesOutstanding');
    }

    // --- SCREENING PLAYBOOKS & FIT SCORING ---

    const playbooks: PlaybookRecommendation[] = [];

    // Playbook 1: Long-Term Investing
    const ltRules = [
      { name: 'Beta < 1.3', met: beta < 1.3 },
      { name: 'Quality Score >= 60', met: qualityScore >= 60 },
      { name: 'Operating Margin >= 15%', met: opMargin >= 15 },
      { name: 'Debt to Equity < 1.5', met: d2e < 1.5 },
      { name: '3Y Revenue Growth > 4%', met: revGr > 4 }
    ];
    const ltRulesMetCount = ltRules.filter(r => r.met).length;
    const ltFitScore = Math.round((ltRulesMetCount / ltRules.length) * 100);
    playbooks.push({
      playbook: 'Long-Term Investing',
      fitScore: ltFitScore,
      priority: 2,
      isMatching: ltFitScore >= 70,
      rulesMet: ltRules.filter(r => r.met).map(r => r.name)
    });

    // Playbook 2: Swing Trading
    const swingRules = [
      { name: 'Volatility >= 15%', met: vol30 >= 15 },
      { name: 'RSI14 between 30 and 70', met: rsi >= 30 && rsi <= 70 },
      { name: 'Trend Strength >= 50', met: trendStr >= 50 },
      { name: '3M Momentum is positive', met: mom3 > 0 }
    ];
    const swingRulesMetCount = swingRules.filter(r => r.met).length;
    const swingFitScore = Math.round((swingRulesMetCount / swingRules.length) * 100);
    playbooks.push({
      playbook: 'Swing Trading',
      fitScore: swingFitScore,
      priority: 4,
      isMatching: swingFitScore >= 75,
      rulesMet: swingRules.filter(r => r.met).map(r => r.name)
    });

    // Playbook 3: Momentum Rotation
    const momRules = [
      { name: '12M Momentum >= 20%', met: mom12 >= 20 },
      { name: '6M Momentum >= 10%', met: mom6 >= 10 },
      { name: 'Trend Strength >= 75', met: trendStr >= 75 },
      { name: 'RSI14 >= 55', met: rsi >= 55 },
      { name: 'Beta >= 1.0', met: beta >= 1.0 }
    ];
    const momRulesMetCount = momRules.filter(r => r.met).length;
    const momFitScore = Math.round((momRulesMetCount / momRules.length) * 100);
    playbooks.push({
      playbook: 'Momentum Rotation',
      fitScore: momFitScore,
      priority: 3,
      isMatching: momFitScore >= 75,
      rulesMet: momRules.filter(r => r.met).map(r => r.name)
    });

    // Playbook 4: Deep Value
    const valueRules = [
      { name: 'PE Ratio <= 15', met: pe <= 15 },
      { name: 'PB Ratio <= 2.0', met: pb <= 2.0 },
      { name: 'Dividend Yield >= 2.0%', met: divYld >= 2.0 },
      { name: 'FCF Yield >= 6.0%', met: fcfYld >= 6.0 },
      { name: 'Operating Margin is positive', met: opMargin > 0 }
    ];
    const valRulesMetCount = valueRules.filter(r => r.met).length;
    const valFitScore = Math.round((valRulesMetCount / valueRules.length) * 100);
    playbooks.push({
      playbook: 'Deep Value',
      fitScore: valFitScore,
      priority: 5,
      isMatching: valFitScore >= 75,
      rulesMet: valueRules.filter(r => r.met).map(r => r.name)
    });

    // Playbook 5: DCF Quality Compounders
    const compRules = [
      { name: 'ROE >= 20%', met: roe >= 20 },
      { name: 'ROIC >= 15%', met: roic >= 15 },
      { name: 'Operating Margin >= 20%', met: opMargin >= 20 },
      { name: 'FCF Growth >= 8%', met: fcfGr >= 8 },
      { name: 'DCF Intrinsic Value upside exists', met: dcfValuation ? dcfValuation.fairValueGap > 0 : false }
    ];
    const compRulesMetCount = compRules.filter(r => r.met).length;
    const compFitScore = Math.round((compRulesMetCount / compRules.length) * 100);
    playbooks.push({
      playbook: 'DCF Quality Compounders',
      fitScore: compFitScore,
      priority: 1, // Highest ranking priority
      isMatching: compFitScore >= 70,
      rulesMet: compRules.filter(r => r.met).map(r => r.name)
    });

    // Sort playbooks based on priority and isMatching
    const activePlaybooks = playbooks.filter(p => p.isMatching);
    let primaryRecommendation: PlaybookRecommendation | null = null;
    if (activePlaybooks.length > 0) {
      // Sort first by fitScore descending, then by priority ascending (1 is highest priority)
      const sortedPlaybooks = [...activePlaybooks].sort((a, b) => {
        if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
        return a.priority - b.priority;
      });
      primaryRecommendation = sortedPlaybooks[0];
    } else {
      // If no playbook meets threshold, recommend the one with the highest fitScore
      const sortedAll = [...playbooks].sort((a, b) => b.fitScore - a.fitScore);
      primaryRecommendation = sortedAll[0];
    }

    // Screening Fit score represents the highest fit score among playbooks
    const screeningFitScore = Math.max(...playbooks.map(p => p.fitScore));

    // Compile factor scores payload
    const factorScores: StockFactorScores = {
      value: valueScore,
      growth: growthScore,
      momentum: momentumScore,
      quality: qualityScore,
      risk: riskScore,
      profitability: profitabilityScore,
      balanceSheet: balanceSheetScore,
      catalysts: catalystsScore,
      sentiment: sentimentScore,
      valuation: peScore,
      dcf: dcfFactorScore,
      screeningFit: screeningFitScore
    };

    // --- COMPOSITE SCORE CALCULATION ---
    // CompositeScore = (ValueScore * w_v) + (GrowthScore * w_g) + (MomentumScore * w_m) + (QualityScore * w_q) + (DCF_Score * w_dcf) + (ScreeningFit * w_sfit) - (Risk_Score * w_risk)
    const baseComposite = 
      (valueScore * weights.value) +
      (growthScore * weights.growth) +
      (momentumScore * weights.momentum) +
      (qualityScore * weights.quality) +
      (dcfFactorScore * weights.dcf) +
      (screeningFitScore * weights.screeningFit);

    const riskPenalty = riskScore * weights.risk;
    const compositeScore = Math.max(0, Math.min(100, Math.round(baseComposite - riskPenalty)));
    const final_score = compositeScore; // Synchronized final score

    // Confidence is derived from data quality score minus a penalty for high volatility/risk
    const confidence = Math.max(10, Math.round(dataQualityScore * 0.9 - (riskScore > 60 ? 10 : 0)));

    // Categorization normalization
    const classification: StockClassification = {
      category_main: registered?.category_main || 'Unknown',
      category_sub: registered?.category_sub || 'Standard Bluechip Equity Class',
      valuation_mode: registered?.valuation_mode || 'Ecosystem Multiple & Relative Value Check',
      confidence: confidence / 100,
      reasoning: [
        registered?.category_sub ? `Klassifiziert als ${registered.category_sub}.` : `Allgemeine Aktienklasse angewendet.`,
        `Faktor-Matrix und quantitative Bilanzen weisen auf ${registered?.category_main || 'unbekanntes'} Marktprofil hin.`,
        primaryRecommendation ? `Empfohlenes Anlage-Playbook: ${primaryRecommendation.playbook}.` : 'Kein klares Primär-Playbook identifiziert.'
      ]
    };

    // Dynamic analyst insights reasoning items
    const reasoningList: string[] = [];
    if (compositeScore >= 80) {
      reasoningList.push(`Überragendes Anlageprofil mit exzellentem Composite Score von ${compositeScore}/100.`);
      reasoningList.push(`Sehr starke Fundamentaldaten kombiniert mit hervorragender Bilanzeffizienz und hoher Qualität.`);
    } else if (compositeScore >= 65) {
      reasoningList.push(`Überdurchschnittliches Chancen-Risiko-Verhältnis (${compositeScore}/100) mit solider Balance.`);
      reasoningList.push(`Attraktive Teil-Scores für ${valueScore > 65 ? 'Value' : 'Wachstum'} untermauern die These.`);
    } else if (compositeScore >= 50) {
      reasoningList.push(`Neutrales Marktprofil mit durchschnittlicher Performance-Aussicht (${compositeScore}/100).`);
      reasoningList.push(`Volatilitäts- oder Margendruck bremst die dynamische Wertschöpfung.`);
    } else {
      reasoningList.push(`Erhöhtes Risiko- oder Schwächeprofil mit schwachem Composite Score von ${compositeScore}/100.`);
      reasoningList.push(`Schwache Rentabilität, hohe Verschuldung oder Abwärtstrend mindern die Qualität signifikant.`);
    }

    if (dcfValuation && dcfValuation.fairValueGap > 15) {
      reasoningList.push(`DCF-Modell zeigt eine signifikante Unterbewertung mit einem Upside von ${dcfValuation.fairValueGap}%.`);
    } else if (dcfValuation && dcfValuation.fairValueGap < -15) {
      reasoningList.push(`DCF-Modell warnt vor Überbewertung (Abstand zum Fair Value: ${dcfValuation.fairValueGap}%).`);
    }

    // Dynamic logging of analysis event to system log
    console.log(`[StockScoringService] Evaluated ${merged.symbol} - Final Score: ${final_score}, Version: ${requestedVersion}`);

    return {
      symbol: merged.symbol!,
      name: merged.name!,
      classification,
      factorScores,
      compositeScore,
      final_score,
      dcfValuation,
      playbookRecommendations: playbooks,
      primaryRecommendation,
      confidence,
      dataQuality: {
        level: dataQualityLevel,
        score: dataQualityScore,
        missingFields
      },
      reasoning: reasoningList,
      inputs: merged,
      metadata: {
        scoring_version: requestedVersion,
        timestamp: new Date().toISOString()
      }
    };
  }
}
