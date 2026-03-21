import YahooFinance from 'yahoo-finance2';
import { resolveTickerFromName } from './resolveTicker';
import { PriceIntelligence } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

type OHLCQuote = {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
};

const FALLBACK: PriceIntelligence = {
  rsi: 50,
  rsiLabel: 'Neutral',
  ma200: 0,
  ma200Label: 'Below',
  ma200PercentDiff: 0,
  high52: 0,
  low52: 0,
  weekRange52Position: 50,
  crossSignal: 'None',
  atr: 0,
};

export async function computePriceIntelligence(
  companyName: string,
  // timeframe intentionally unused here — all indicators use fixed windows
  _timeframe: number
): Promise<PriceIntelligence> {
  try {
    const ticker = await resolveTickerFromName(companyName);

    // Fetch 365 days of OHLC — enough for all computations
    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period1.getDate() - 365);

    const result = await yahooFinance.chart(ticker, {
      period1,
      period2,
      interval: '1d',
    });

    const rawQuotes = (result.quotes ?? []) as Array<{
      date: string | Date;
      open: number | null;
      high: number | null;
      low: number | null;
      close: number | null;
    }>;

    // Keep only fully valid OHLC rows; sort ascending
    const quotes: OHLCQuote[] = rawQuotes
      .filter(
        (q): q is OHLCQuote =>
          q.close !== null &&
          q.close !== undefined &&
          q.high !== null &&
          q.high !== undefined &&
          q.low !== null &&
          q.low !== undefined &&
          q.open !== null &&
          q.open !== undefined
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (quotes.length < 15) return FALLBACK;

    const closes = quotes.map((q) => q.close);
    const currentPrice = closes[closes.length - 1];

    // ── RSI (14-day) ──────────────────────────────────────────────────────────
    let rsi = 50;
    let rsiLabel: PriceIntelligence['rsiLabel'] = 'Neutral';
    if (closes.length >= 15) {
      const last15 = closes.slice(-15);
      const changes: number[] = [];
      for (let i = 1; i < last15.length; i++) {
        changes.push(last15[i] - last15[i - 1]);
      }
      const gains = changes.map((c) => (c > 0 ? c : 0));
      const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));
      const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
      if (avgLoss === 0) {
        rsi = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi = Math.round((100 - 100 / (1 + rs)) * 10) / 10;
      }
      rsiLabel = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
    }

    // ── 200-day MA ────────────────────────────────────────────────────────────
    let ma200 = 0;
    let ma200Label: PriceIntelligence['ma200Label'] = 'Below';
    let ma200PercentDiff = 0;
    {
      const window = closes.length >= 200 ? closes.slice(-200) : closes;
      ma200 = Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 100) / 100;
      ma200Label = currentPrice > ma200 ? 'Above' : 'Below';
      ma200PercentDiff =
        ma200 !== 0
          ? Math.round(((currentPrice - ma200) / ma200) * 100 * 100) / 100
          : 0;
    }

    // ── 52-week high / low ────────────────────────────────────────────────────
    const high52 = Math.round(Math.max(...closes) * 100) / 100;
    const low52 = Math.round(Math.min(...closes) * 100) / 100;
    let weekRange52Position = 50;
    if (high52 !== low52) {
      weekRange52Position =
        Math.round(((currentPrice - low52) / (high52 - low52)) * 100 * 10) / 10;
    }

    // ── Golden Cross / Death Cross detection (last 10 trading days) ──────────
    let crossSignal: PriceIntelligence['crossSignal'] = 'None';
    const n = closes.length;
    if (n >= 211) {
      let prevAbove: boolean | null = null;
      // Examine the 11-point window ending at today to detect crossings
      for (let i = n - 11; i < n; i++) {
        if (i < 199) continue; // need 200 points for MA200
        const ma50 = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50;
        const ma200val = closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0) / 200;
        const currentAbove = ma50 > ma200val;
        if (prevAbove !== null && currentAbove !== prevAbove) {
          crossSignal = currentAbove ? 'Golden Cross' : 'Death Cross';
        }
        prevAbove = currentAbove;
      }
    }

    // ── ATR (14-day Average True Range) ──────────────────────────────────────
    let atr = 0;
    if (quotes.length >= 15) {
      const last15 = quotes.slice(-15);
      const trueRanges: number[] = [];
      for (let i = 1; i < last15.length; i++) {
        const { high, low } = last15[i];
        const prevClose = last15[i - 1].close;
        trueRanges.push(
          Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose))
        );
      }
      atr = Math.round((trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length) * 100) / 100;
    }

    return {
      rsi,
      rsiLabel,
      ma200,
      ma200Label,
      ma200PercentDiff,
      high52,
      low52,
      weekRange52Position,
      crossSignal,
      atr,
    };
  } catch {
    return FALLBACK;
  }
}
