import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

interface PriceDataResult {
  priceChangePercent: number;
  chartData: Array<{ date: string; price: number }>;
}

export interface ResolvedTicker {
  ticker: string;
  companyName: string;
  exchange: string;
}

/**
 * Accepts a ticker symbol or company name and resolves it to a canonical
 * ticker, full company name, and exchange using yahoo-finance2 search.
 * Falls back gracefully to the raw input if resolution fails.
 */
export async function resolveTicker(input: string): Promise<ResolvedTicker> {
  try {
    const raw = await yahooFinance.search(input, {}, { validateResult: false });
    const results = raw as { quotes?: unknown[] };
    const quotes = (results.quotes ?? []) as Array<{
      symbol?: string;
      longname?: string;
      shortname?: string;
      exchDisp?: string;
      exchange?: string;
      quoteType?: string;
    }>;

    const match = quotes.find(
      (q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'FUND'
    );

    if (match?.symbol) {
      return {
        ticker: match.symbol,
        companyName: match.longname ?? match.shortname ?? match.symbol,
        exchange: match.exchDisp ?? match.exchange ?? '',
      };
    }
  } catch {
    // fall through
  }

  return { ticker: input.toUpperCase(), companyName: input, exchange: '' };
}

/**
 * Fetches historical daily close prices for a ticker over the given timeframe.
 */
export async function fetchPriceData(
  ticker: string,
  timeframe: number
): Promise<PriceDataResult> {
  const period2 = new Date();
  const period1 = new Date();
  period1.setDate(period1.getDate() - timeframe);

  let quotes: Array<{ date: string | Date; close: number | null }>;

  try {
    const result = await yahooFinance.chart(ticker, {
      period1,
      period2,
      interval: '1d',
    });
    quotes = (result.quotes ?? []) as Array<{ date: string | Date; close: number | null }>;
  } catch (err) {
    throw new Error(
      `Could not fetch price data for ${ticker}. Check that the ticker symbol is valid. (${String(err)})`
    );
  }

  const valid = quotes.filter(
    (q): q is { date: string | Date; close: number } => q.close !== null && q.close !== undefined
  );

  if (valid.length < 2) {
    throw new Error(`Invalid ticker or no price data available for ${ticker}`);
  }

  valid.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const firstClose = valid[0].close;
  const lastClose = valid[valid.length - 1].close;
  const priceChangePercent = ((lastClose - firstClose) / firstClose) * 100;

  const chartData = valid.map((point) => ({
    date: new Date(point.date).toISOString(),
    price: point.close,
  }));

  return { priceChangePercent, chartData };
}
