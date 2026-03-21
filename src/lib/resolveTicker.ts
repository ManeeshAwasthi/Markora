import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

/**
 * Resolves a company name to a Yahoo Finance ticker symbol using search().
 * Takes the first EQUITY result. Throws if no match is found.
 * This is the single source of truth for name→ticker resolution used by all lib files.
 */
export async function resolveTickerFromName(companyName: string): Promise<string> {
  const raw = await yahooFinance.search(companyName, {}, { validateResult: false });
  const results = raw as { quotes?: unknown[] };
  const quotes = (results.quotes ?? []) as Array<{
    symbol?: string;
    quoteType?: string;
  }>;

  const match = quotes.find((q) => q.quoteType === 'EQUITY');

  if (match?.symbol) {
    return match.symbol;
  }

  throw new Error(`Company not found: ${companyName}`);
}
