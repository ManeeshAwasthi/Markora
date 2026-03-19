import { NextRequest, NextResponse } from 'next/server';
import { fetchHeadlines } from '@/lib/newsApi';
import { fetchPriceData } from '@/lib/yahoofinance';
import { analyzeSentiment } from '@/lib/gemini';
import {
  normalizePriceChange,
  computeDivergenceScore,
} from '@/lib/normalize';
import { getSignal } from '@/lib/divergence';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiError,
  ChartDataPoint,
} from '@/types';

const VALID_TIMEFRAMES = new Set([7, 30, 90]);

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse | ApiError>> {
  try {
    // ── Step 1: Parse and validate ─────────────────────────────────────────
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

    const ticker = raw.ticker.trim().toUpperCase();

    if (ticker.length > 10) {
      return NextResponse.json<ApiError>(
        { error: 'ticker must be 10 characters or fewer', code: 'INVALID_TICKER' },
        { status: 400 }
      );
    }

    if (!VALID_TIMEFRAMES.has(Number(raw.timeframe))) {
      return NextResponse.json<ApiError>(
        { error: 'timeframe must be exactly 7, 30, or 90', code: 'INVALID_TICKER' },
        { status: 400 }
      );
    }

    const timeframe = Number(raw.timeframe) as AnalyzeRequest['timeframe'];

    // ── Step 2: Fetch headlines + price data in parallel ───────────────────
    const [headlines, priceData] = await Promise.all([
      fetchHeadlines(ticker, timeframe),
      fetchPriceData(ticker, timeframe),
    ]);

    // ── Step 3: Sentiment analysis (after parallel fetch) ──────────────────
    const { sentiment, insight } = await analyzeSentiment(headlines, ticker);

    // ── Step 4: Compute scores ─────────────────────────────────────────────
    const normalizedPrice = normalizePriceChange(priceData.priceChangePercent);
    const divergenceScore = computeDivergenceScore(sentiment.score, normalizedPrice);
    const signal = getSignal(divergenceScore);

    // ── Step 5: Build chart data ───────────────────────────────────────────
    // Each point gets a constant sentimentScore line plus a rolling normalised price.
    const firstPrice = priceData.chartData[0].price;

    const chartData: ChartDataPoint[] = priceData.chartData.map((point) => {
      const rollingChange = ((point.price - firstPrice) / firstPrice) * 100;
      return {
        date: point.date,
        sentimentScore: sentiment.score,
        normalizedPrice: normalizePriceChange(rollingChange),
      };
    });

    // ── Step 6: Return ─────────────────────────────────────────────────────
    const response: AnalyzeResponse = {
      ticker,
      timeframe,
      divergenceScore,
      signal,
      sentiment,
      normalizedPrice,
      priceChangePercent: priceData.priceChangePercent,
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
