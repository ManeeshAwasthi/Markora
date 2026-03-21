import YahooFinance from 'yahoo-finance2';
import { ResolvedCompany } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

/**
 * Maps a Yahoo Finance exchange code to market metadata.
 */
function mapExchange(exchange: string | undefined): Omit<ResolvedCompany, 'ticker'> {
  if (!exchange) {
    return { exchange: 'UNKNOWN', country: 'United States', currency: 'USD', currencySymbol: '$' };
  }
  if (exchange === 'NSE') {
    return { exchange: 'NSE', country: 'India', currency: 'INR', currencySymbol: '₹' };
  }
  if (exchange === 'BSE') {
    return { exchange: 'BSE', country: 'India', currency: 'INR', currencySymbol: '₹' };
  }
  if (exchange === 'LSE') {
    return { exchange: 'LSE', country: 'United Kingdom', currency: 'GBP', currencySymbol: '£' };
  }
  if (exchange === 'TSX') {
    return { exchange: 'TSX', country: 'Canada', currency: 'CAD', currencySymbol: 'CA$' };
  }
  if (exchange === 'ASX') {
    return { exchange: 'ASX', country: 'Australia', currency: 'AUD', currencySymbol: 'A$' };
  }
  if (exchange === 'XETRA' || exchange === 'FRA' || exchange.includes('EUR')) {
    return { exchange, country: 'Germany', currency: 'EUR', currencySymbol: '€' };
  }
  if (exchange === 'TYO' || exchange === 'JPX') {
    return { exchange, country: 'Japan', currency: 'JPY', currencySymbol: '¥' };
  }
  // Default: US market
  return { exchange, country: 'United States', currency: 'USD', currencySymbol: '$' };
}

/**
 * Resolves a company name to a Yahoo Finance ticker plus full market metadata.
 * Prefers NSE over BSE when both exist for Indian companies.
 * This is the single source of truth for name→ticker resolution — called once per request.
 */
export async function resolveTickerFromName(companyName: string): Promise<ResolvedCompany> {
  const raw = await yahooFinance.search(companyName, {}, { validateResult: false });
  const results = raw as { quotes?: unknown[] };
  const quotes = (results.quotes ?? []) as Array<{
    symbol?: string;
    quoteType?: string;
    exchange?: string;
  }>;

  const equities = quotes.filter((q) => q.quoteType === 'EQUITY' && q.symbol);

  // Prefer NSE over BSE for Indian companies (higher liquidity, more complete data)
  const nse = equities.find((q) => q.exchange === 'NSE');
  const match = nse ?? equities[0];

  if (!match?.symbol) {
    throw new Error(`Company not found: ${companyName}`);
  }

  let ticker = match.symbol;
  const exch = match.exchange;

  // Ensure correct suffix for Indian stocks
  if (exch === 'NSE' && !ticker.endsWith('.NS')) ticker = `${ticker}.NS`;
  if (exch === 'BSE' && !ticker.endsWith('.BO')) ticker = `${ticker}.BO`;

  return { ticker, ...mapExchange(exch) };
}

/**
 * Returns the currency metadata for a given exchange code.
 * Used by peerComparison to classify peer exchanges.
 */
export function getCurrencyForExchange(exchange: string | undefined): Pick<ResolvedCompany, 'currency' | 'currencySymbol'> {
  const meta = mapExchange(exchange);
  return { currency: meta.currency, currencySymbol: meta.currencySymbol };
}

/**
 * Returns true if the given exchange is an Indian market (NSE or BSE).
 */
export function isIndianExchange(exchange: string | undefined): boolean {
  return exchange === 'NSE' || exchange === 'BSE';
}
