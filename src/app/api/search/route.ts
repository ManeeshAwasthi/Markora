import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { SearchResult } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

export async function GET(request: NextRequest): Promise<NextResponse<SearchResult[]>> {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  try {
    const raw = await yahooFinance.search(q, {}, { validateResult: false });
    const results = raw as { quotes?: unknown[] };
    const quotes = (results.quotes ?? []) as Array<{
      symbol?: string;
      longname?: string;
      shortname?: string;
      exchDisp?: string;
      exchange?: string;
      quoteType?: string;
    }>;

    const suggestions: SearchResult[] = quotes
      .filter(
        (r) =>
          (r.quoteType === 'EQUITY' || r.quoteType === 'ETF' || r.quoteType === 'FUND') &&
          r.symbol
      )
      .slice(0, 6)
      .map((r) => ({
        ticker: r.symbol!,
        name: r.longname ?? r.shortname ?? r.symbol!,
        exchange: r.exchDisp ?? r.exchange ?? '',
      }));

    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]);
  }
}
