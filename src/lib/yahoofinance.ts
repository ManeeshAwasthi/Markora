import YahooFinance from 'yahoo-finance2';
import { ResolvedCompany } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

// NOTE: Indian stocks (NSE/BSE) trade in IST (Asia/Kolkata, UTC+5:30).
// Yahoo Finance normalizes all dates internally, so no manual timezone
// conversion is needed when working with their chart() or quoteSummary() APIs.

interface PriceDataResult {
  priceChangePercent: number;
  chartData: Array<{ date: string; price: number }>;
  currentPrice: number;
  currencySymbol: string;
}

/**
 * Fetches historical daily close prices for a company over the given timeframe.
 * Accepts a pre-resolved ResolvedCompany — the ticker is never re-resolved here.
 * Yahoo Finance returns prices in the stock's native currency automatically.
 */
export async function fetchPriceData(
  resolved: ResolvedCompany,
  timeframe: number
): Promise<PriceDataResult> {
  const { ticker, currencySymbol } = resolved;

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
      `Could not fetch price data for ${ticker}. Check that the company name is valid. (${String(err)})`
    );
  }

  const valid = quotes.filter(
    (q): q is { date: string | Date; close: number } => q.close !== null && q.close !== undefined
  );

  if (valid.length < 2) {
    throw new Error(`No price data available for ${ticker} on ${resolved.exchange}.`);
  }

  valid.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const firstClose = valid[0].close;
  const lastClose = valid[valid.length - 1].close;
  const priceChangePercent = ((lastClose - firstClose) / firstClose) * 100;

  const chartData = valid.map((point) => ({
    date: new Date(point.date).toISOString(),
    price: point.close,
  }));

  return { priceChangePercent, chartData, currentPrice: lastClose, currencySymbol };
}
