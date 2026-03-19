// Shared TypeScript types for Markora

// ── Legacy Phase-1 types (used by Dashboard, HeadlineCard, /api/news) ────────

export interface Headline {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface LegacySentimentResult {
  overall: 'bullish' | 'bearish' | 'neutral';
  headlines: Headline[];
  outlook: string;
  analyzedAt: string;
}

export interface NewsAPIArticle {
  title: string;
  url: string;
  source: { name: string };
  publishedAt: string;
}

// ── Phase-2 / Phase-3 types ───────────────────────────────────────────────────

export interface AnalyzeRequest {
  ticker: string; // accepts ticker symbol OR company name
  timeframe: 7 | 30 | 90;
}

export interface SentimentResult {
  bullish: number; // percentage 0–100
  bearish: number;
  neutral: number;
  score: number; // composite 0–100
}

export type SignalType =
  | 'Overconfidence'
  | 'Mild Optimism'
  | 'Aligned'
  | 'Mild Pessimism'
  | 'Hidden Strength';

export type TrendDirection = 'Rising' | 'Falling' | 'Stable';

export type EntryExitLabel =
  | 'Potential Entry Zone'
  | 'Caution — Consider Exit'
  | 'Hold — No Strong Signal'
  | 'Watch — Momentum Building';

export interface ChartDataPoint {
  date: string;
  sentimentScore: number;
  normalizedPrice: number;
  trendScore: number;
}

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

export interface AnalyzeResponse {
  ticker: string;
  companyName: string;
  exchange: string;
  timeframe: number;
  divergenceScore: number;
  signal: SignalType;
  sentiment: SentimentResult;
  normalizedPrice: number;
  priceChangePercent: number;
  trendScore: number;
  trendDirection: TrendDirection;
  entryExitLabel: EntryExitLabel;
  entryExitExplanation: string;
  entryExitColor: string;
  chartData: ChartDataPoint[];
  insight: string;
  headlines: string[];
  fetchedAt: string;
}

export interface ApiError {
  error: string;
  code: 'INVALID_TICKER' | 'NO_NEWS' | 'API_FAILURE' | 'RATE_LIMIT' | 'UNKNOWN';
}
