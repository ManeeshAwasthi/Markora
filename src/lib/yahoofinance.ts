import YahooFinance from 'yahoo-finance2';
import { resolveTickerFromName } from './resolveTicker';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

interface PriceDataResult {
  priceChangePercent: number;
  chartData: Array<{ date: string; price: number }>;
}

/**
 * Fetches historical daily close prices for a company over the given timeframe.
 * Resolves the company name to a ticker internally — the ticker never leaves this file.
 */
export async function fetchPriceData(
  companyName: string,
  timeframe: number
): Promise<PriceDataResult> {
  const ticker = await resolveTickerFromName(companyName);

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
      `Could not fetch price data for ${companyName}. Check that the company name is valid. (${String(err)})`
    );
  }

  const valid = quotes.filter(
    (q): q is { date: string | Date; close: number } => q.close !== null && q.close !== undefined
  );

  if (valid.length < 2) {
    throw new Error(`No price data available for ${companyName}`);
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
