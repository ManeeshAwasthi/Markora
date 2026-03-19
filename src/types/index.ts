// Shared TypeScript types for Markora

export interface Headline {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface SentimentResult {
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
