export interface Headline {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

export interface SentimentResult {
  overall: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  headlines: Headline[];
  marketOutlook: string;
  analyzedAt: string;
}

export interface NewsApiResponse {
  headlines: Headline[];
  query: string;
  totalResults: number;
}

export interface AnalysisRequest {
  query: string;
}
