import YahooFinance from 'yahoo-finance2';

// yahoo-finance2 v3 requires explicit instantiation.
// suppressNotices: historical() is deprecated and mapped internally to chart();
// we call chart() directly to avoid null close values on the current trading day.
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

interface PriceDataResult {
  priceChangePercent: number;
  chartData: Array<{ date: string; price: number }>;
}

/**
 * Fetches historical daily close prices for a ticker over the given timeframe.
 * Returns the total price-change percent and a sorted array of date/price points.
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

  // Filter out bars where close is null (e.g. the current in-progress trading day)
  const valid = quotes.filter(
    (q): q is { date: string | Date; close: number } => q.close !== null && q.close !== undefined
  );

  if (valid.length < 2) {
    throw new Error(`Invalid ticker or no price data available for ${ticker}`);
  }

  // Sort ascending by date
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
