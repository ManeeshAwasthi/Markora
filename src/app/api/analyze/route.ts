import { NextRequest, NextResponse } from 'next/server';
import { fetchHeadlines } from '@/lib/newsApi';
import { fetchPriceData } from '@/lib/yahoofinance';
import { analyzeSentiment } from '@/lib/gemini';
import { fetchTrends } from '@/lib/trends';
import { normalizePriceChange, computeDivergenceScore } from '@/lib/normalize';
import { getSignal, getEntryExitSignal } from '@/lib/divergence';
import { computePriceIntelligence } from '@/lib/priceIntelligence';
import { fetchFundamentals } from '@/lib/fundamentals';
import { fetchMomentumAndFlow } from '@/lib/momentum';
import { computeRiskProfile } from '@/lib/riskProfile';
import { fetchPeerComparison } from '@/lib/peerComparison';
import { resolveTickerFromName } from '@/lib/resolveTicker';
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
      !('companyName' in body) ||
      !('timeframe' in body)
    ) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields: companyName and timeframe', code: 'INVALID_COMPANY' },
        { status: 400 }
      );
    }

    const raw = body as Record<string, unknown>;

    if (typeof raw.companyName !== 'string' || raw.companyName.trim().length === 0) {
      return NextResponse.json<ApiError>(
        { error: 'companyName must be a non-empty string', code: 'INVALID_COMPANY' },
        { status: 400 }
      );
    }

    if (raw.companyName.trim().length > 100) {
      return NextResponse.json<ApiError>(
        { error: 'companyName must be 100 characters or fewer', code: 'INVALID_COMPANY' },
        { status: 400 }
      );
    }

    if (!VALID_TIMEFRAMES.has(Number(raw.timeframe))) {
      return NextResponse.json<ApiError>(
        { error: 'timeframe must be exactly 7, 30, or 90', code: 'INVALID_COMPANY' },
        { status: 400 }
      );
    }

    const companyName = raw.companyName.trim();
    const timeframe = Number(raw.timeframe) as AnalyzeRequest['timeframe'];

    // ── 2. Resolve ticker once — flows through all lib functions ──────────────
    const resolved = await resolveTickerFromName(companyName);

    // ── 3. Fetch core data: headlines, price, trends (parallel) ──────────────
    const [headlines, priceData, trends] = await Promise.all([
      fetchHeadlines(companyName, timeframe, resolved.ticker),
      fetchPriceData(resolved, timeframe),
      fetchTrends(companyName, timeframe),
    ]);

    // ── 4. Sentiment analysis (needs trend context from step 3) ───────────────
    const { sentiment, insight } = await analyzeSentiment(
      headlines,
      companyName,
      trends.trendDirection,
      trends.trendScore,
      resolved
    );

    // ── 5. Compute divergence scores ──────────────────────────────────────────
    const normalizedPrice = normalizePriceChange(priceData.priceChangePercent);
    const divergenceScore = computeDivergenceScore(sentiment.score, normalizedPrice);
    const signal = getSignal(divergenceScore);
    const entryExit = getEntryExitSignal(signal, trends.trendDirection, priceData.priceChangePercent);

    // ── 6. Build chart data ───────────────────────────────────────────────────
    const sortedTrend = [...trends.trendData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstPrice = priceData.chartData[0].price;

    const chartData: ChartDataPoint[] = priceData.chartData.map((point) => {
      const pointDate = new Date(point.date).getTime();
      let trendValue = trends.trendScore;
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

    // ── 7. Fetch enrichment layers in parallel (each self-heals on failure) ───
    const [priceIntelligence, fundamentals, momentumFlow, riskProfile, peerComparison] =
      await Promise.all([
        computePriceIntelligence(resolved, timeframe),
        fetchFundamentals(resolved),
        fetchMomentumAndFlow(resolved),
        computeRiskProfile(resolved, timeframe),
        fetchPeerComparison(resolved, timeframe),
      ]);

    // ── 8. Return ─────────────────────────────────────────────────────────────
    const response: AnalyzeResponse = {
      companyName,
      exchange: resolved.exchange,
      country: resolved.country,
      currency: resolved.currency,
      currencySymbol: resolved.currencySymbol,
      currentPrice: priceData.currentPrice,
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
      priceIntelligence,
      fundamentals,
      momentumFlow,
      riskProfile,
      peerComparison,
    };

    return NextResponse.json<AnalyzeResponse>(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('NO_NEWS')) {
      return NextResponse.json<ApiError>(
        { error: `No recent news found for the requested company.`, code: 'NO_NEWS' },
        { status: 404 }
      );
    }

    if (message.includes('Company not found')) {
      return NextResponse.json<ApiError>(
        {
          error: `Could not find a listed company matching the provided name. Try using the full official company name.`,
          code: 'INVALID_COMPANY',
        },
        { status: 400 }
      );
    }

    if (
      message.includes('No price data') ||
      message.includes('symbol may be delisted') ||
      message.includes('No data found') ||
      message.includes('company name is valid')
    ) {
      return NextResponse.json<ApiError>(
        { error: message, code: 'INVALID_COMPANY' },
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
