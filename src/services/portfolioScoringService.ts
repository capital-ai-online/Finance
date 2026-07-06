/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PortfolioAllocationItem {
  symbol: string;
  weight: number; // percentage, e.g., 40 for 40%
  type: string;   // stock, crypto, commodity, etc.
}

export interface PortfolioScoringInput {
  allocation: PortfolioAllocationItem[];
  metrics1Y?: { strategyReturn: number; maxDrawdown: number; sharpeRatio: number };
  metrics3Y?: { strategyReturn: number; maxDrawdown: number; sharpeRatio: number };
  metrics5Y?: { strategyReturn: number; maxDrawdown: number; sharpeRatio: number };
}

export interface PortfolioScoreResult {
  overallScore: number;       // 0-100
  diversificationScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
  riskDescription: string;
  optimizationSuggestions: string[];
}

export class PortfolioScoringService {
  /**
   * Evaluates the risk and performance metrics of a portfolio allocation,
   * returning deterministic scoring metrics, risk classifications, and optimizations.
   */
  public static scorePortfolio(input: PortfolioScoringInput): PortfolioScoreResult {
    const allocation = input.allocation || [];
    if (allocation.length === 0) {
      return {
        overallScore: 50,
        diversificationScore: 0,
        riskLevel: 'Medium',
        riskDescription: 'Keine Allokation vorhanden.',
        optimizationSuggestions: ['Fügen Sie Vermögenswerte zur Allokation hinzu, um die Analyse zu starten.']
      };
    }

    // 1. Calculate diversification score based on asset variety and weight concentration
    const types = new Set(allocation.map(a => a.type));
    const typeCount = types.size;
    
    // Herfindahl-Hirschman Index (HHI) for weight concentration
    // HHI closer to 10000 means highly concentrated. Closer to 0 means perfectly diversified.
    let sumSquares = 0;
    let totalWeight = 0;
    let cryptoWeight = 0;
    let commodityWeight = 0;
    let stockWeight = 0;

    for (const item of allocation) {
      const w = item.weight || 0;
      sumSquares += w * w;
      totalWeight += w;
      if (item.type === 'crypto') cryptoWeight += w;
      if (item.type === 'commodity') commodityWeight += w;
      if (item.type === 'stock') stockWeight += w;
    }

    // Normalize weights if they don't sum up to 100
    const concentrationIndex = totalWeight > 0 ? (sumSquares / (totalWeight * totalWeight)) * 10000 : 10000;
    
    // Diversification score from 0 to 100
    // Penalize high concentration (high HHI) and reward multiple asset classes
    let diversificationScore = 100 - (concentrationIndex / 100);
    if (typeCount === 1) diversificationScore -= 15;
    if (typeCount >= 3) diversificationScore += 10;
    diversificationScore = Math.min(100, Math.max(10, diversificationScore));

    // 2. Determine Risk Level based on assets (e.g. crypto exposure) and metrics
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
    let riskDescription = '';
    
    if (cryptoWeight > 30 || input.metrics3Y?.maxDrawdown > 25) {
      riskLevel = 'High';
      riskDescription = 'Hohes Risiko durch signifikante Krypto-Allokation oder historische Drawdowns.';
    } else if (cryptoWeight < 5 && stockWeight < 40 && input.metrics3Y?.maxDrawdown < 10) {
      riskLevel = 'Low';
      riskDescription = 'Geringes Risiko durch konservative Ausrichtung und stabilen maximalen Drawdown.';
    } else {
      riskLevel = 'Medium';
      riskDescription = 'Ausgewogenes Risiko-Rendite-Verhältnis mit moderater Volatilität.';
    }

    // 3. Generate structured optimization recommendations
    const suggestions: string[] = [];
    if (cryptoWeight > 25) {
      suggestions.push('Reduzieren Sie den Krypto-Anteil auf unter 15%, um das Drawdown-Risiko bei Markt-Korrekturen zu dämpfen.');
    }
    if (commodityWeight === 0) {
      suggestions.push('Fügen Sie Gold oder andere Rohstoffe (ca. 5-10%) als unkorrelierten sicheren Hafen hinzu.');
    }
    if (concentrationIndex > 3000) {
      suggestions.push('Die Allokation ist stark konzentriert. Verteilen Sie das Kapital gleichmäßiger auf verschiedene Sektoren oder Assetklassen.');
    }
    if (input.metrics1Y && input.metrics1Y.sharpeRatio < 1.0) {
      suggestions.push('Die Sharpe-Ratio im 1-Jahres-Trend ist unterdurchschnittlich. Erhöhen Sie defensive Blue-Chip-Aktien oder Indizes.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Ihr Portfolio zeigt ein exzellentes Sharpe-Ratio und gute Diversifikation. Keine akuten Anpassungen notwendig.');
    }

    // 4. Overall Portfolio Score calculation
    let overallScore = 60;
    // Boost score if Sharpe ratio is high
    if (input.metrics3Y && input.metrics3Y.sharpeRatio > 1.5) {
      overallScore += 20;
    } else if (input.metrics3Y && input.metrics3Y.sharpeRatio > 1.0) {
      overallScore += 10;
    } else if (input.metrics3Y && input.metrics3Y.sharpeRatio < 0.5) {
      overallScore -= 15;
    }
    
    // Adjust based on diversification
    overallScore += (diversificationScore - 50) * 0.25;
    overallScore = Math.min(100, Math.max(10, Math.round(overallScore)));

    return {
      overallScore,
      diversificationScore: Math.round(diversificationScore),
      riskLevel,
      riskDescription,
      optimizationSuggestions: suggestions
    };
  }
}
