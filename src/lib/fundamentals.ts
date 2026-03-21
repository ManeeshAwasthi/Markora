import YahooFinance from 'yahoo-finance2';
import { resolveTickerFromName } from './resolveTicker';
import { FundamentalSnapshot } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

// Shape of the quoteSummary result we care about
type FundamentalsRaw = {
  summaryDetail?: {
    trailingPE?: number | null;
    forwardPE?: number | null;
    dividendYield?: number | null;
  } | null;
  defaultKeyStatistics?: {
    pegRatio?: number | null;
  } | null;
  financialData?: {
    revenueGrowth?: number | null;
    grossMargins?: number | null;
    debtToEquity?: number | null;
    currentRatio?: number | null;
    returnOnEquity?: number | null;
  } | null;
  assetProfile?: {
    sector?: string | null;
    industry?: string | null;
  } | null;
};

const FALLBACK: FundamentalSnapshot = {
  peRatio: null,
  forwardPE: null,
  pegRatio: null,
  revenueGrowth: null,
  grossMargins: null,
  debtToEquity: null,
  currentRatio: null,
  returnOnEquity: null,
  dividendYield: null,
  sector: null,
  industry: null,
};

export async function fetchFundamentals(companyName: string): Promise<FundamentalSnapshot> {
  try {
    const ticker = await resolveTickerFromName(companyName);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await (yahooFinance as any).quoteSummary(
      ticker,
      { modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile'] },
      { validateResult: false }
    ) as FundamentalsRaw;

    const n = (v: number | null | undefined): number | null =>
      v !== null && v !== undefined && isFinite(v) ? v : null;

    return {
      peRatio: n(raw.summaryDetail?.trailingPE),
      forwardPE: n(raw.summaryDetail?.forwardPE),
      pegRatio: n(raw.defaultKeyStatistics?.pegRatio),
      revenueGrowth: n(raw.financialData?.revenueGrowth),
      grossMargins: n(raw.financialData?.grossMargins),
      debtToEquity: n(raw.financialData?.debtToEquity),
      currentRatio: n(raw.financialData?.currentRatio),
      returnOnEquity: n(raw.financialData?.returnOnEquity),
      dividendYield: n(raw.summaryDetail?.dividendYield),
      sector: raw.assetProfile?.sector ?? null,
      industry: raw.assetProfile?.industry ?? null,
    };
  } catch {
    return FALLBACK;
  }
}
