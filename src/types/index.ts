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
  companyName: string;
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

// ── Layer 6 — Price Intelligence ──────────────────────────────────────────────

export interface PriceIntelligence {
  rsi: number;
  rsiLabel: 'Overbought' | 'Oversold' | 'Neutral';
  ma200: number;
  ma200Label: 'Above' | 'Below';
  ma200PercentDiff: number;
  high52: number;
  low52: number;
  weekRange52Position: number;
  crossSignal: 'Golden Cross' | 'Death Cross' | 'None';
  atr: number;
}

// ── Layer 7 — Fundamental Snapshot ───────────────────────────────────────────

export interface FundamentalSnapshot {
  peRatio: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  revenueGrowth: number | null;
  grossMargins: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  returnOnEquity: number | null;
  dividendYield: number | null;
  sector: string | null;
  industry: string | null;
}

// ── Layer 8 — Momentum and Flow ───────────────────────────────────────────────

export interface MomentumFlow {
  institutionalOwnershipPercent: number | null;
  insiderBuys: number;
  insiderSells: number;
  insiderSentiment: 'Buying' | 'Selling' | 'Neutral';
  shortPercentOfFloat: number | null;
  shortRatio: number | null;
  shortLabel: 'High' | 'Elevated' | 'Normal';
}

// ── Layer 9 — Risk Profile ────────────────────────────────────────────────────

export interface RiskProfile {
  beta: number | null;
  betaLabel: 'Low' | 'Moderate' | 'High' | 'Very High';
  realizedVolatility: number;
  volatilityLabel: 'Low' | 'Moderate' | 'High' | 'Very High';
  maxDrawdown: number;
  sharpeRatio: number | null;
}

// ── Layer 10 — Peer Comparison ────────────────────────────────────────────────

export interface PeerSnapshot {
  companyName: string;
  priceChangePercent: number;
  peRatio: number | null;
  relativeStrength: number;
}

export interface PeerComparison {
  peers: PeerSnapshot[];
}

// ── Analyze response (all layers combined) ────────────────────────────────────

export interface AnalyzeResponse {
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
  // New layers
  priceIntelligence: PriceIntelligence;
  fundamentals: FundamentalSnapshot;
  momentumFlow: MomentumFlow;
  riskProfile: RiskProfile;
  peerComparison: PeerComparison;
}

export interface ApiError {
  error: string;
  code: 'INVALID_COMPANY' | 'NO_NEWS' | 'API_FAILURE' | 'RATE_LIMIT' | 'UNKNOWN';
}
