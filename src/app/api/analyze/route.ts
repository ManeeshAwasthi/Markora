import { NextRequest, NextResponse } from 'next/server';
import { fetchHeadlines } from '@/lib/newsApi';
import { fetchPriceData, resolveTicker } from '@/lib/yahoofinance';
import { analyzeSentiment } from '@/lib/gemini';
import { fetchTrends } from '@/lib/trends';
import { normalizePriceChange, computeDivergenceScore } from '@/lib/normalize';
import { getSignal, getEntryExitSignal } from '@/lib/divergence';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiError,
  ChartDataPoint,
} from '@/types';

const VALID_TIMEFRAMES = new Set([7, 30, 90]);

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalyzeResponse | ApiError>> {
  try {
    // ── 1. Parse and validate ─────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiError>(
        { error: 'Invalid JSON body', code: 'UNKNOWN' },
        { status: 400 }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('ticker' in body) ||
      !('timeframe' in body)
    ) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields: ticker and timeframe', code: 'INVALID_TICKER' },
        { status: 400 }
      );
    }

    const raw = body as Record<string, unknown>;

    if (typeof raw.ticker !== 'string' || raw.ticker.trim().length === 0) {
      return NextResponse.json<ApiError>(
        { error: 'ticker must be a non-empty string', code: 'INVALID_TICKER' },
        { status: 400 }
      );
    }

    if (raw.ticker.trim().length > 100) {
      return NextResponse.json<ApiError>(
        { error: 'ticker must be 100 characters or fewer', code: 'INVALID_TICKER' },
        { status: 400 }
      );
    }

    if (!VALID_TIMEFRAMES.has(Number(raw.timeframe))) {
      return NextResponse.json<ApiError>(
        { error: 'timeframe must be exactly 7, 30, or 90', code: 'INVALID_TICKER' },
        { status: 400 }
      );
    }

    const rawInput = raw.ticker.trim();
    const timeframe = Number(raw.timeframe) as AnalyzeRequest['timeframe'];

    // ── 2. Resolve ticker → canonical symbol + company name ───────────────────
    const { ticker, companyName, exchange } = await resolveTicker(rawInput);

    // ── 3. Fetch headlines, price data, and trends in parallel ────────────────
    const [headlines, priceData, trends] = await Promise.all([
      fetchHeadlines(ticker, timeframe),
      fetchPriceData(ticker, timeframe),
      fetchTrends(companyName, timeframe),
    ]);

    // ── 4. Sentiment analysis (after parallel fetch, needs trend context) ─────
    const { sentiment, insight } = await analyzeSentiment(
      headlines,
      ticker,
      companyName,
      trends.trendDirection,
      trends.trendScore
    );

    // ── 5. Compute divergence scores ──────────────────────────────────────────
    const normalizedPrice = normalizePriceChange(priceData.priceChangePercent);
    const divergenceScore = computeDivergenceScore(sentiment.score, normalizedPrice);
    const signal = getSignal(divergenceScore);
    const entryExit = getEntryExitSignal(signal, trends.trendDirection, priceData.priceChangePercent);

    // ── 6. Build chart data ───────────────────────────────────────────────────
    // Merge trend data (weekly) into price data (daily) via forward-fill.
    const sortedTrend = [...trends.trendData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstPrice = priceData.chartData[0].price;

    const chartData: ChartDataPoint[] = priceData.chartData.map((point) => {
      const pointDate = new Date(point.date).getTime();

      // Find most recent trend data point at or before this price date
      let trendValue = trends.trendScore; // default to average
      for (const td of sortedTrend) {
        if (new Date(td.date).getTime() <= pointDate) {
          trendValue = td.value;
        } else {
          break;
        }
      }

      const rollingChange = ((point.price - firstPrice) / firstPrice) * 100;
      return {
        date: point.date.slice(0, 10),
        sentimentScore: sentiment.score,
        normalizedPrice: normalizePriceChange(rollingChange),
        trendScore: trendValue,
      };
    });

    // ── 7. Return ─────────────────────────────────────────────────────────────
    const response: AnalyzeResponse = {
      ticker,
      companyName,
      exchange,
      timeframe,
      divergenceScore,
      signal,
      sentiment,
      normalizedPrice,
      priceChangePercent: priceData.priceChangePercent,
      trendScore: trends.trendScore,
      trendDirection: trends.trendDirection,
      entryExitLabel: entryExit.label,
      entryExitExplanation: entryExit.explanation,
      entryExitColor: entryExit.color,
      chartData,
      insight,
      headlines,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json<AnalyzeResponse>(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('NO_NEWS')) {
      return NextResponse.json<ApiError>(
        { error: message, code: 'NO_NEWS' },
        { status: 404 }
      );
    }

    if (
      message.includes('Invalid ticker') ||
      message.includes('no price data') ||
      message.includes('symbol may be delisted') ||
      message.includes('No data found') ||
      message.includes('ticker symbol is valid')
    ) {
      return NextResponse.json<ApiError>(
        { error: message, code: 'INVALID_TICKER' },
        { status: 400 }
      );
    }

    if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('api_key')) {
      return NextResponse.json<ApiError>(
        { error: message, code: 'API_FAILURE' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiError>(
      { error: message, code: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
