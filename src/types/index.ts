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

// ── Phase-2 types ─────────────────────────────────────────────────────────────

export interface AnalyzeRequest {
  ticker: string;
  timeframe: 7 | 30 | 90;
}

export interface SentimentResult {
  bullish: number;   // percentage, 0–100
  bearish: number;   // percentage, 0–100
  neutral: number;   // percentage, 0–100
  score: number;     // composite 0–100
}

export interface ChartDataPoint {
  date: string;           // ISO date string
  sentimentScore: number;
  normalizedPrice: number;
}

export type SignalType =
  | 'Overconfidence'
  | 'Mild Optimism'
  | 'Aligned'
  | 'Mild Pessimism'
  | 'Hidden Strength';

export interface AnalyzeResponse {
  ticker: string;
  timeframe: number;
  divergenceScore: number;
  signal: SignalType;
  sentiment: SentimentResult;
  normalizedPrice: number;
  priceChangePercent: number;
  chartData: ChartDataPoint[];
  insight: string;
  headlines: string[];
  fetchedAt: string; // ISO timestamp
}

export interface ApiError {
  error: string;
  code: 'INVALID_TICKER' | 'NO_NEWS' | 'API_FAILURE' | 'RATE_LIMIT' | 'UNKNOWN';
}
