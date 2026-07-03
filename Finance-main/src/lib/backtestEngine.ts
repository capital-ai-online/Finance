// Server-side backtest engine.
// Mirrors the SMA-Crossover methodology already used client-side in
// src/components/BacktestEngine.tsx (calculateBacktestOnRealData), so
// report numbers generated here are consistent with what a user sees in
// the app's own Backtest tool. Operates ONLY on real historical closing
// prices supplied by the caller (see assetRegistry.getHistory) — this
// module performs no data fetching and no simulation of its own.

export interface HistoryPoint {
  date: string;
  close: number;
}

export interface BacktestParams {
  shortPeriod: number;
  longPeriod: number;
  transactionCostPct: number; // e.g. 0.1 = 0.1%
  initialCapital: number;
}

export interface BacktestTrade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
}

export interface BacktestResult {
  symbol: string;
  strategy: 'SMA_CROSS';
  params: BacktestParams;
  dataPoints: number;
  dateRange: { from: string; to: string };
  startPrice: number;
  endPrice: number;
  buyAndHoldReturnPct: number;
  strategyReturnPct: number;
  finalPortfolioValue: number;
  maxDrawdownPct: number;
  totalTrades: number;
  winRatePct: number;
  trades: BacktestTrade[];
}

const DEFAULT_PARAMS: BacktestParams = {
  shortPeriod: 20,
  longPeriod: 50,
  transactionCostPct: 0.1,
  initialCapital: 10000,
};

export function runSmaCrossBacktest(
  symbol: string,
  history: HistoryPoint[],
  paramsOverride: Partial<BacktestParams> = {}
): BacktestResult {
  const params: BacktestParams = { ...DEFAULT_PARAMS, ...paramsOverride };

  if (!history || history.length < params.longPeriod + 2) {
    throw new Error(`Zu wenige echte historische Datenpunkte für ${symbol} (benötigt mindestens ${params.longPeriod + 2}, vorhanden: ${history?.length || 0}).`);
  }

  const prices = history.map(h => h.close);
  const days = prices.length;

  const smaShortArr: number[] = [];
  const smaLongArr: number[] = [];
  for (let i = 0; i < days; i++) {
    smaShortArr.push(i >= params.shortPeriod
      ? prices.slice(i - params.shortPeriod, i).reduce((a, b) => a + b, 0) / params.shortPeriod
      : prices[i]);
    smaLongArr.push(i >= params.longPeriod
      ? prices.slice(i - params.longPeriod, i).reduce((a, b) => a + b, 0) / params.longPeriod
      : prices[i]);
  }

  let cash = params.initialCapital;
  let shares = 0;
  let peakValue = params.initialCapital;
  let maxDrawdownPct = 0;
  let completedTrades = 0;
  let winningTrades = 0;
  let lastBuyPrice = 0;
  const trades: BacktestTrade[] = [];

  for (let i = 0; i < days; i++) {
    const price = prices[i];
    const dateStr = history[i].date;
    const sShort = smaShortArr[i];
    const sLong = smaLongArr[i];
    const prevShort = i > 0 ? smaShortArr[i - 1] : sShort;
    const prevLong = i > 0 ? smaLongArr[i - 1] : sLong;

    const buySignal = prevShort <= prevLong && sShort > sLong;
    const sellSignal = prevShort >= prevLong && sShort < sLong;

    if (buySignal && cash > 0) {
      const fee = cash * (params.transactionCostPct / 100);
      const netCash = cash - fee;
      shares = netCash / price;
      cash = 0;
      lastBuyPrice = price;
      trades.push({ date: dateStr, type: 'BUY', price });
    } else if (sellSignal && shares > 0) {
      const gross = shares * price;
      const fee = gross * (params.transactionCostPct / 100);
      cash = gross - fee;
      shares = 0;
      completedTrades++;
      if (price > lastBuyPrice) winningTrades++;
      trades.push({ date: dateStr, type: 'SELL', price });
    }

    const portfolioValue = cash + shares * price;
    if (portfolioValue > peakValue) peakValue = portfolioValue;
    const drawdown = peakValue > 0 ? ((peakValue - portfolioValue) / peakValue) * 100 : 0;
    if (drawdown > maxDrawdownPct) maxDrawdownPct = drawdown;
  }

  const finalPrice = prices[days - 1];
  const finalPortfolioValue = cash + shares * finalPrice;
  const strategyReturnPct = ((finalPortfolioValue - params.initialCapital) / params.initialCapital) * 100;
  const buyAndHoldReturnPct = ((finalPrice - prices[0]) / prices[0]) * 100;
  const winRatePct = completedTrades > 0 ? (winningTrades / completedTrades) * 100 : 0;

  return {
    symbol,
    strategy: 'SMA_CROSS',
    params,
    dataPoints: days,
    dateRange: { from: history[0].date, to: history[days - 1].date },
    startPrice: prices[0],
    endPrice: finalPrice,
    buyAndHoldReturnPct: Number(buyAndHoldReturnPct.toFixed(2)),
    strategyReturnPct: Number(strategyReturnPct.toFixed(2)),
    finalPortfolioValue: Number(finalPortfolioValue.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    totalTrades: trades.length,
    winRatePct: Number(winRatePct.toFixed(1)),
    trades,
  };
}
