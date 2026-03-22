import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { resolveTickerFromName } from '@/lib/resolveTicker';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

interface OHLCQuote {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface RSIPoint { date: string; value: number }
interface MAPoint { date: string; ma50: number | null; ma200: number | null; price: number }
interface VolumePoint { date: string; volume: number; avgVolume: number }
interface BollingerPoint { date: string; upper: number; middle: number; lower: number; price: number }
interface SupportResistance { level: number; type: 'support' | 'resistance'; strength: 'strong' | 'moderate' | 'weak' }

interface PriceIntelligenceDetail {
  ticker: string;
  companyName: string;
  currencySymbol: string;
  currentPrice: number;
  timeframe: number;
  rsi: number;
  rsiLabel: string;
  rsiHistory: RSIPoint[];
  ma50: number;
  ma200: number;
  ma200Label: string;
  ma200PercentDiff: number;
  maHistory: MAPoint[];
  atr: number;
  atrPercent: number;
  high52: number;
  low52: number;
  weekRange52Position: number;
  crossSignal: string;
  bollingerBands: BollingerPoint[];
  bollingerPosition: string;
  volumeHistory: VolumePoint[];
  volumeTrend: string;
  avgVolume30d: number;
  latestVolume: number;
  supportResistance: SupportResistance[];
  vwap: number | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyName = request.nextUrl.searchParams.get('company')?.trim();
    const timeframe = Number(request.nextUrl.searchParams.get('timeframe') ?? '30') || 30;

    if (!companyName) {
      return NextResponse.json({ error: 'company param required' }, { status: 400 });
    }

    const resolved = await resolveTickerFromName(companyName);
    const { ticker, currencySymbol } = resolved;

    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period1.getDate() - 365);

    const result = await yahooFinance.chart(ticker, { period1, period2, interval: '1d' });
    const rawQuotes = (result.quotes ?? []) as Array<{
      date: string | Date; open: number | null; high: number | null;
      low: number | null; close: number | null; volume: number | null;
    }>;

    const quotes: OHLCQuote[] = rawQuotes
      .filter((q): q is OHLCQuote =>
        q.close !== null && q.high !== null && q.low !== null &&
        q.open !== null && q.volume !== null
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (quotes.length < 15) {
      return NextResponse.json({ error: 'Insufficient price data' }, { status: 400 });
    }

    const closes = quotes.map(q => q.close);
    const currentPrice = closes[closes.length - 1];

    // RSI History
    const rsiHistory: RSIPoint[] = [];
    for (let i = 14; i < quotes.length; i++) {
      const window = closes.slice(i - 14, i + 1);
      const changes: number[] = [];
      for (let j = 1; j < window.length; j++) changes.push(window[j] - window[j - 1]);
      const gains = changes.map(c => c > 0 ? c : 0);
      const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
      const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
      const rsiVal = avgLoss === 0 ? 100 : Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 10) / 10;
      rsiHistory.push({
        date: new Date(quotes[i].date).toISOString().slice(0, 10),
        value: rsiVal,
      });
    }
    const currentRSI = rsiHistory.length > 0 ? rsiHistory[rsiHistory.length - 1].value : 50;
    const rsiLabel = currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral';

    // MA History
    const maHistory: MAPoint[] = [];
    for (let i = 0; i < quotes.length; i++) {
      const ma50 = i >= 49 ? closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50 : null;
      const ma200 = i >= 199 ? closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0) / 200 : null;
      maHistory.push({
        date: new Date(quotes[i].date).toISOString().slice(0, 10),
        ma50: ma50 !== null ? Math.round(ma50 * 100) / 100 : null,
        ma200: ma200 !== null ? Math.round(ma200 * 100) / 100 : null,
        price: quotes[i].close,
      });
    }
    const lastMA = maHistory[maHistory.length - 1];
    const ma50 = lastMA.ma50 ?? 0;
    const ma200 = lastMA.ma200 ?? 0;
    const ma200Label = currentPrice > ma200 ? 'Above' : 'Below';
    const ma200PercentDiff = ma200 !== 0 ? Math.round(((currentPrice - ma200) / ma200) * 100 * 100) / 100 : 0;

    // ATR
    const last15 = quotes.slice(-15);
    const trueRanges: number[] = [];
    for (let i = 1; i < last15.length; i++) {
      const { high, low } = last15[i];
      const prevClose = last15[i - 1].close;
      trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    }
    const atr = Math.round((trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length) * 100) / 100;
    const atrPercent = Math.round((atr / currentPrice) * 100 * 100) / 100;

    // 52-Week Range
    const high52 = Math.round(Math.max(...closes) * 100) / 100;
    const low52 = Math.round(Math.min(...closes) * 100) / 100;
    const weekRange52Position = high52 !== low52
      ? Math.round(((currentPrice - low52) / (high52 - low52)) * 100 * 10) / 10
      : 50;

    // Cross Signal
    let crossSignal = 'None';
    const n = closes.length;
    if (n >= 211) {
      let prevAbove: boolean | null = null;
      for (let i = n - 11; i < n; i++) {
        if (i < 199) continue;
        const m50 = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50;
        const m200 = closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0) / 200;
        const currentAbove = m50 > m200;
        if (prevAbove !== null && currentAbove !== prevAbove) {
          crossSignal = currentAbove ? 'Golden Cross' : 'Death Cross';
        }
        prevAbove = currentAbove;
      }
    }

    // Bollinger Bands
    const bollingerBands: BollingerPoint[] = [];
    for (let i = 19; i < quotes.length; i++) {
      const window = closes.slice(i - 19, i + 1);
      const mean = window.reduce((a, b) => a + b, 0) / 20;
      const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / 20;
      const stdDev = Math.sqrt(variance);
      bollingerBands.push({
        date: new Date(quotes[i].date).toISOString().slice(0, 10),
        upper: Math.round((mean + 2 * stdDev) * 100) / 100,
        middle: Math.round(mean * 100) / 100,
        lower: Math.round((mean - 2 * stdDev) * 100) / 100,
        price: quotes[i].close,
      });
    }
    const lastBB = bollingerBands[bollingerBands.length - 1];
    let bollingerPosition = 'Middle';
    if (lastBB) {
      if (currentPrice > lastBB.upper) bollingerPosition = 'Above Upper Band';
      else if (currentPrice > lastBB.upper - (lastBB.upper - lastBB.middle) * 0.2) bollingerPosition = 'Near Upper Band';
      else if (currentPrice < lastBB.lower) bollingerPosition = 'Below Lower Band';
      else if (currentPrice < lastBB.lower + (lastBB.middle - lastBB.lower) * 0.2) bollingerPosition = 'Near Lower Band';
    }

    // Volume History
    const volumes = quotes.map(q => q.volume);
    const volumeHistory: VolumePoint[] = [];
    for (let i = 0; i < quotes.length; i++) {
      const windowStart = Math.max(0, i - 19);
      const volWindow = volumes.slice(windowStart, i + 1);
      const avgVol = Math.round(volWindow.reduce((a, b) => a + b, 0) / volWindow.length);
      volumeHistory.push({
        date: new Date(quotes[i].date).toISOString().slice(0, 10),
        volume: quotes[i].volume,
        avgVolume: avgVol,
      });
    }
    const last10Vol = volumes.slice(-10);
    const prev10Vol = volumes.slice(-20, -10);
    const avgLast10 = last10Vol.reduce((a, b) => a + b, 0) / last10Vol.length;
    const avgPrev10 = prev10Vol.length > 0 ? prev10Vol.reduce((a, b) => a + b, 0) / prev10Vol.length : avgLast10;
    const volumeTrend = avgLast10 > avgPrev10 * 1.15 ? 'Increasing' : avgLast10 < avgPrev10 * 0.85 ? 'Decreasing' : 'Stable';
    const avgVolume30d = Math.round(volumes.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, volumes.length));
    const latestVolume = volumes[volumes.length - 1];

    // Support / Resistance
    const recent = quotes.slice(-90);
    const levels: SupportResistance[] = [];
    for (let i = 2; i < recent.length - 2; i++) {
      const h = recent[i].high;
      const l = recent[i].low;
      if (h > recent[i - 1].high && h > recent[i - 2].high && h > recent[i + 1].high && h > recent[i + 2].high) {
        const touches = recent.filter(q => Math.abs(q.high - h) / h < 0.01).length;
        levels.push({ level: Math.round(h * 100) / 100, type: 'resistance', strength: touches >= 3 ? 'strong' : touches >= 2 ? 'moderate' : 'weak' });
      }
      if (l < recent[i - 1].low && l < recent[i - 2].low && l < recent[i + 1].low && l < recent[i + 2].low) {
        const touches = recent.filter(q => Math.abs(q.low - l) / l < 0.01).length;
        levels.push({ level: Math.round(l * 100) / 100, type: 'support', strength: touches >= 3 ? 'strong' : touches >= 2 ? 'moderate' : 'weak' });
      }
    }
    const deduped: SupportResistance[] = [];
    for (const lvl of levels.sort((a, b) => a.level - b.level)) {
      if (!deduped.some(d => Math.abs(d.level - lvl.level) / lvl.level < 0.015)) {
        deduped.push(lvl);
      }
    }
    const supports = deduped.filter(l => l.type === 'support' && l.level < currentPrice).slice(-3);
    const resistances = deduped.filter(l => l.type === 'resistance' && l.level > currentPrice).slice(0, 3);
    const supportResistance = [...supports, ...resistances];

    // VWAP
    const lastDay = quotes[quotes.length - 1];
    const vwap = lastDay.volume > 0
      ? Math.round(((lastDay.high + lastDay.low + lastDay.close) / 3) * 100) / 100
      : null;

    const response: PriceIntelligenceDetail = {
      ticker,
      companyName,
      currencySymbol,
      currentPrice: Math.round(currentPrice * 100) / 100,
      timeframe,
      rsi: currentRSI,
      rsiLabel,
      rsiHistory: rsiHistory.slice(-timeframe),
      ma50,
      ma200,
      ma200Label,
      ma200PercentDiff,
      maHistory: maHistory.slice(-Math.max(timeframe, 200)),
      atr,
      atrPercent,
      high52,
      low52,
      weekRange52Position,
      crossSignal,
      bollingerBands: bollingerBands.slice(-timeframe),
      bollingerPosition,
      volumeHistory: volumeHistory.slice(-timeframe),
      volumeTrend,
      avgVolume30d,
      latestVolume,
      supportResistance,
      vwap,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
