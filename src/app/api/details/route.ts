import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { resolveTickerFromName } from '@/lib/resolveTicker';
import { fetchFundamentals } from '@/lib/fundamentals';
import { fetchMomentumAndFlow } from '@/lib/momentum';
import { fetchPeerComparison } from '@/lib/peerComparison';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

interface OHLCQuote {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const companyName = request.nextUrl.searchParams.get('company')?.trim();
    const timeframe = Number(request.nextUrl.searchParams.get('timeframe') ?? '30') || 30;

    if (!companyName) {
      return NextResponse.json({ error: 'company param required' }, { status: 400 });
    }

    const resolved = await resolveTickerFromName(companyName);
    const { ticker, currencySymbol, exchange, country, currency } = resolved;

    // ── Fetch 365 days of OHLCV ──────────────────────────────────────────
    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period1.getDate() - 365);

    const chartResult = await yahooFinance.chart(ticker, { period1, period2, interval: '1d' });
    const rawQuotes = (chartResult.quotes ?? []) as Array<{
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

    // ── RSI History (rolling 14-day) ─────────────────────────────────────
    const rsiHistory: Array<{ date: string; value: number }> = [];
    for (let i = 14; i < quotes.length; i++) {
      const window = closes.slice(i - 14, i + 1);
      const changes: number[] = [];
      for (let j = 1; j < window.length; j++) changes.push(window[j] - window[j - 1]);
      const gains = changes.map(c => c > 0 ? c : 0);
      const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
      const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
      const rsiVal = avgLoss === 0 ? 100 : Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 10) / 10;
      rsiHistory.push({ date: new Date(quotes[i].date).toISOString().slice(0, 10), value: rsiVal });
    }
    const currentRSI = rsiHistory.length > 0 ? rsiHistory[rsiHistory.length - 1].value : 50;
    const rsiLabel = currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral';

    // ── MA50 + MA200 History ─────────────────────────────────────────────
    const maHistory: Array<{ date: string; ma50: number | null; ma200: number | null; price: number }> = [];
    for (let i = 0; i < quotes.length; i++) {
      const ma50v = i >= 49 ? Math.round((closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50) * 100) / 100 : null;
      const ma200v = i >= 199 ? Math.round((closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0) / 200) * 100) / 100 : null;
      maHistory.push({ date: new Date(quotes[i].date).toISOString().slice(0, 10), ma50: ma50v, ma200: ma200v, price: quotes[i].close });
    }
    const lastMA = maHistory[maHistory.length - 1];
    const ma50 = lastMA.ma50 ?? 0;
    const ma200 = lastMA.ma200 ?? 0;
    const ma200Label = currentPrice > ma200 ? 'Above' : 'Below';
    const ma200PercentDiff = ma200 !== 0 ? Math.round(((currentPrice - ma200) / ma200) * 100 * 100) / 100 : 0;

    // ── ATR ──────────────────────────────────────────────────────────────
    const atrWindow = quotes.slice(-15);
    const trueRanges: number[] = [];
    for (let i = 1; i < atrWindow.length; i++) {
      const { high, low } = atrWindow[i];
      const prevClose = atrWindow[i - 1].close;
      trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    }
    const atr = Math.round((trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length) * 100) / 100;
    const atrPercent = Math.round((atr / currentPrice) * 100 * 100) / 100;

    // ── 52-Week Range ────────────────────────────────────────────────────
    const high52 = Math.round(Math.max(...closes) * 100) / 100;
    const low52 = Math.round(Math.min(...closes) * 100) / 100;
    const weekRange52Position = high52 !== low52 ? Math.round(((currentPrice - low52) / (high52 - low52)) * 100 * 10) / 10 : 50;

    // ── Cross Signal ─────────────────────────────────────────────────────
    let crossSignal = 'None';
    const nn = closes.length;
    if (nn >= 211) {
      let prevAbove: boolean | null = null;
      for (let i = nn - 11; i < nn; i++) {
        if (i < 199) continue;
        const m50 = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50;
        const m200v = closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0) / 200;
        const curAbove = m50 > m200v;
        if (prevAbove !== null && curAbove !== prevAbove) crossSignal = curAbove ? 'Golden Cross' : 'Death Cross';
        prevAbove = curAbove;
      }
    }

    // ── Bollinger Bands (20-day, 2 std dev) ──────────────────────────────
    const bollingerBands: Array<{ date: string; upper: number; middle: number; lower: number; price: number }> = [];
    for (let i = 19; i < quotes.length; i++) {
      const w = closes.slice(i - 19, i + 1);
      const mean = w.reduce((a, b) => a + b, 0) / 20;
      const variance = w.reduce((a, b) => a + (b - mean) ** 2, 0) / 20;
      const sd = Math.sqrt(variance);
      bollingerBands.push({
        date: new Date(quotes[i].date).toISOString().slice(0, 10),
        upper: Math.round((mean + 2 * sd) * 100) / 100,
        middle: Math.round(mean * 100) / 100,
        lower: Math.round((mean - 2 * sd) * 100) / 100,
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

    // ── Volume ───────────────────────────────────────────────────────────
    const volumes = quotes.map(q => q.volume);
    const volumeHistory: Array<{ date: string; volume: number; avgVolume: number }> = [];
    for (let i = 0; i < quotes.length; i++) {
      const ws = Math.max(0, i - 19);
      const vw = volumes.slice(ws, i + 1);
      volumeHistory.push({ date: new Date(quotes[i].date).toISOString().slice(0, 10), volume: quotes[i].volume, avgVolume: Math.round(vw.reduce((a, b) => a + b, 0) / vw.length) });
    }
    const last10Vol = volumes.slice(-10);
    const prev10Vol = volumes.slice(-20, -10);
    const avgL10 = last10Vol.reduce((a, b) => a + b, 0) / last10Vol.length;
    const avgP10 = prev10Vol.length > 0 ? prev10Vol.reduce((a, b) => a + b, 0) / prev10Vol.length : avgL10;
    const volumeTrend = avgL10 > avgP10 * 1.15 ? 'Increasing' : avgL10 < avgP10 * 0.85 ? 'Decreasing' : 'Stable';
    const avgVolume30d = Math.round(volumes.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, volumes.length));

    // ── Support / Resistance ─────────────────────────────────────────────
    const recent = quotes.slice(-90);
    const levels: Array<{ level: number; type: 'support' | 'resistance'; strength: 'strong' | 'moderate' | 'weak' }> = [];
    for (let i = 2; i < recent.length - 2; i++) {
      const h = recent[i].high;
      const l = recent[i].low;
      if (h > recent[i-1].high && h > recent[i-2].high && h > recent[i+1].high && h > recent[i+2].high) {
        const touches = recent.filter(q => Math.abs(q.high - h) / h < 0.01).length;
        levels.push({ level: Math.round(h * 100) / 100, type: 'resistance', strength: touches >= 3 ? 'strong' : touches >= 2 ? 'moderate' : 'weak' });
      }
      if (l < recent[i-1].low && l < recent[i-2].low && l < recent[i+1].low && l < recent[i+2].low) {
        const touches = recent.filter(q => Math.abs(q.low - l) / l < 0.01).length;
        levels.push({ level: Math.round(l * 100) / 100, type: 'support', strength: touches >= 3 ? 'strong' : touches >= 2 ? 'moderate' : 'weak' });
      }
    }
    const dedupedLevels: typeof levels = [];
    for (const lvl of levels.sort((a, b) => a.level - b.level)) {
      if (!dedupedLevels.some(d => Math.abs(d.level - lvl.level) / lvl.level < 0.015)) dedupedLevels.push(lvl);
    }
    const supports = dedupedLevels.filter(l => l.type === 'support' && l.level < currentPrice).slice(-3);
    const resistances = dedupedLevels.filter(l => l.type === 'resistance' && l.level > currentPrice).slice(0, 3);

    // ── Risk Profile ─────────────────────────────────────────────────────

    // Beta from quoteSummary
    let beta: number | null = null;
    try {
      const summaryRaw = await (yahooFinance as any).quoteSummary(ticker, { modules: ['summaryDetail'] }, { validateResult: false }) as any;
      const betaRaw = summaryRaw?.summaryDetail?.beta;
      if (betaRaw !== null && betaRaw !== undefined && isFinite(betaRaw)) beta = betaRaw;
    } catch { /* ignore */ }

    // Realized volatility (30-day annualized)
    const last31 = closes.slice(-31);
    const logReturns: number[] = [];
    for (let i = 1; i < last31.length; i++) logReturns.push(Math.log(last31[i] / last31[i - 1]));
    const lrMean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const lrVariance = logReturns.reduce((a, b) => a + (b - lrMean) ** 2, 0) / (logReturns.length - 1);
    const realizedVolatility = Math.round(Math.sqrt(lrVariance) * Math.sqrt(252) * 100 * 100) / 100;

    // Max drawdown
    let peak = closes[0];
    let maxDrawdown = 0;
    for (const price of closes) {
      if (price > peak) peak = price;
      const dd = ((price - peak) / peak) * 100;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }
    maxDrawdown = Math.round(maxDrawdown * 100) / 100;

    // Sharpe ratio
    const dailyReturns: number[] = [];
    for (let i = 1; i < closes.length; i++) dailyReturns.push((closes[i] - closes[i-1]) / closes[i-1]);
    let sharpeRatio: number | null = null;
    const retMean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const retStd = Math.sqrt(dailyReturns.reduce((a, b) => a + (b - retMean) ** 2, 0) / (dailyReturns.length - 1));
    if (retStd > 0) sharpeRatio = Math.round((retMean / retStd) * Math.sqrt(252) * 100) / 100;

    // Drawdown history for chart
    const drawdownHistory: Array<{ date: string; drawdown: number }> = [];
    let runningPeak = closes[0];
    for (let i = 0; i < quotes.length; i++) {
      if (closes[i] > runningPeak) runningPeak = closes[i];
      drawdownHistory.push({ date: new Date(quotes[i].date).toISOString().slice(0, 10), drawdown: Math.round(((closes[i] - runningPeak) / runningPeak) * 100 * 100) / 100 });
    }

    // Daily returns distribution
    const bucketSize = 2;
    const buckets = new Map<string, number>();
    for (const r of dailyReturns) {
      const pct = r * 100;
      const bucketKey = Math.floor(pct / bucketSize) * bucketSize;
      const label = `${bucketKey}%`;
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
    const returnDistribution: Array<{ range: string; count: number }> = Array.from(buckets.entries())
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([range, count]) => ({ range, count }));

    // ── Fetch existing lib data in parallel ──────────────────────────────
    const [fundamentals, momentumFlow, peerComparison] = await Promise.all([
      fetchFundamentals(resolved),
      fetchMomentumAndFlow(resolved),
      fetchPeerComparison(resolved, timeframe),
    ]);

    // ── Earnings history ─────────────────────────────────────────────────
    let earningsHistory: Array<{ quarter: string; epsActual: number | null; epsEstimate: number | null }> = [];
    try {
      const ehRaw = await (yahooFinance as any).quoteSummary(ticker, { modules: ['earningsHistory'] }, { validateResult: false }) as any;
      const history = ehRaw?.earningsHistory?.history ?? [];
      earningsHistory = history.slice(0, 8).map((h: any) => ({
        quarter: h.quarter ? new Date(h.quarter).toISOString().slice(0, 7) : h.period ?? '',
        epsActual: h.epsActual ?? null,
        epsEstimate: h.epsEstimate ?? null,
      }));
    } catch { /* ignore */ }

    // ── Revenue history ──────────────────────────────────────────────────
    let revenueHistory: Array<{ period: string; revenue: number | null }> = [];
    try {
      const isRaw = await (yahooFinance as any).quoteSummary(ticker, { modules: ['incomeStatementHistoryQuarterly'] }, { validateResult: false }) as any;
      const stmts = isRaw?.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? [];
      revenueHistory = stmts.slice(0, 8).map((s: any) => ({
        period: s.endDate ? new Date(s.endDate).toISOString().slice(0, 7) : '',
        revenue: s.totalRevenue ?? null,
      })).reverse();
    } catch { /* ignore */ }

    // ── Build response ───────────────────────────────────────────────────
    const response = {
      meta: { ticker, companyName, currencySymbol, exchange, country, currency, currentPrice: Math.round(currentPrice * 100) / 100, timeframe },
      priceIntelligence: {
        rsi: currentRSI, rsiLabel,
        rsiHistory: rsiHistory.slice(-timeframe),
        ma50, ma200, ma200Label, ma200PercentDiff,
        maHistory: maHistory.slice(-Math.max(timeframe, 200)),
        atr, atrPercent,
        high52, low52, weekRange52Position,
        crossSignal,
        bollingerBands: bollingerBands.slice(-timeframe),
        bollingerPosition,
        volumeHistory: volumeHistory.slice(-timeframe),
        volumeTrend, avgVolume30d,
        latestVolume: volumes[volumes.length - 1],
        supportResistance: [...supports, ...resistances],
      },
      fundamentals: { ...fundamentals, earningsHistory, revenueHistory },
      momentumFlow: { ...momentumFlow },
      riskProfile: {
        beta,
        betaLabel: beta === null ? 'Moderate' : beta < 0.8 ? 'Low' : beta <= 1.2 ? 'Moderate' : beta <= 1.8 ? 'High' : 'Very High',
        realizedVolatility,
        volatilityLabel: realizedVolatility < 20 ? 'Low' : realizedVolatility <= 40 ? 'Moderate' : realizedVolatility <= 60 ? 'High' : 'Very High',
        maxDrawdown,
        sharpeRatio,
        drawdownHistory: drawdownHistory.slice(-timeframe),
        returnDistribution,
        currencySymbol,
      },
      peerComparison: { ...peerComparison },
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
