import YahooFinance from 'yahoo-finance2';
import { resolveTickerFromName } from './resolveTicker';
import { RiskProfile } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

type SummaryDetailRaw = {
  summaryDetail?: {
    beta?: number | null;
  } | null;
};

const FALLBACK: RiskProfile = {
  beta: null,
  betaLabel: 'Moderate',
  realizedVolatility: 0,
  volatilityLabel: 'Low',
  maxDrawdown: 0,
  sharpeRatio: null,
};

function betaLabel(beta: number | null): RiskProfile['betaLabel'] {
  if (beta === null) return 'Moderate';
  if (beta < 0.8) return 'Low';
  if (beta <= 1.2) return 'Moderate';
  if (beta <= 1.8) return 'High';
  return 'Very High';
}

function volatilityLabel(vol: number): RiskProfile['volatilityLabel'] {
  if (vol < 20) return 'Low';
  if (vol <= 40) return 'Moderate';
  if (vol <= 60) return 'High';
  return 'Very High';
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export async function computeRiskProfile(
  companyName: string,
  timeframe: number
): Promise<RiskProfile> {
  try {
    const ticker = await resolveTickerFromName(companyName);

    // ── Beta from quoteSummary ─────────────────────────────────────────────────
    const summaryRaw = await (yahooFinance as any).quoteSummary(
      ticker,
      { modules: ['summaryDetail'] },
      { validateResult: false }
    ) as SummaryDetailRaw;

    const betaRaw = summaryRaw.summaryDetail?.beta;
    const beta =
      betaRaw !== null && betaRaw !== undefined && isFinite(betaRaw) ? betaRaw : null;

    // ── Price history for volatility, drawdown, sharpe ────────────────────────
    // Fetch at least 30 days (for realized vol) or the full timeframe
    const historyDays = Math.max(timeframe, 32);
    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period1.getDate() - historyDays);

    const chartResult = await yahooFinance.chart(ticker, {
      period1,
      period2,
      interval: '1d',
    });

    const rawQuotes = (chartResult.quotes ?? []) as Array<{
      date: string | Date;
      close: number | null;
    }>;

    const closes = rawQuotes
      .filter((q): q is { date: string | Date; close: number } => q.close !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((q) => q.close);

    if (closes.length < 2) {
      return { ...FALLBACK, beta, betaLabel: betaLabel(beta) };
    }

    // ── Realized volatility (30-day annualized) ───────────────────────────────
    const last30 = closes.slice(-31); // 31 closes → 30 log returns
    const logReturns: number[] = [];
    for (let i = 1; i < last30.length; i++) {
      logReturns.push(Math.log(last30[i] / last30[i - 1]));
    }
    const dailyStd = stdDev(logReturns);
    const realizedVolatility = Math.round(dailyStd * Math.sqrt(252) * 100 * 100) / 100;

    // ── Maximum drawdown over the full timeframe ──────────────────────────────
    let peak = closes[0];
    let maxDrawdown = 0;
    for (const price of closes) {
      if (price > peak) peak = price;
      const drawdown = ((price - peak) / peak) * 100;
      if (drawdown < maxDrawdown) maxDrawdown = drawdown;
    }
    maxDrawdown = Math.round(maxDrawdown * 100) / 100;

    // ── Sharpe-like ratio ─────────────────────────────────────────────────────
    const dailyReturns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    let sharpeRatio: number | null = null;
    const retStd = stdDev(dailyReturns);
    if (retStd > 0 && dailyReturns.length > 0) {
      const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      sharpeRatio = Math.round((meanReturn / retStd) * Math.sqrt(252) * 100) / 100;
    }

    return {
      beta,
      betaLabel: betaLabel(beta),
      realizedVolatility,
      volatilityLabel: volatilityLabel(realizedVolatility),
      maxDrawdown,
      sharpeRatio,
    };
  } catch {
    return FALLBACK;
  }
}
