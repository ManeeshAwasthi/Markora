import { computeSentimentScore } from '@/lib/normalize';
import { SentimentResult, TrendDirection } from '@/types';

export type HeadlineSentiment = 'bullish' | 'bearish' | 'neutral';

const BULLISH_TERMS = [
  'beat expectations',
  'beats expectations',
  'record revenue',
  'record profit',
  'raises guidance',
  'raised guidance',
  'upgrade',
  'upgraded',
  'outperform',
  'buyback',
  'dividend increase',
  'strong demand',
  'market share gain',
  'growth',
  'profit rises',
  'revenue rises',
  'surge',
  'rally',
  'gain',
  'expansion',
  'launch',
  'approval',
  'partnership',
] as const;

const BEARISH_TERMS = [
  'misses expectations',
  'missed expectations',
  'cuts guidance',
  'cut guidance',
  'downgrade',
  'downgraded',
  'underperform',
  'profit warning',
  'revenue decline',
  'profit falls',
  'revenue falls',
  'weak demand',
  'market share loss',
  'layoff',
  'lawsuit',
  'investigation',
  'recall',
  'decline',
  'slump',
  'plunge',
  'drop',
  'loss',
  'risk',
  'warning',
] as const;

function termScore(headline: string, terms: readonly string[]): number {
  const normalized = headline.toLowerCase().replace(/[^a-z0-9%]+/g, ' ');
  return terms.reduce((score, term) => score + (normalized.includes(term) ? 1 : 0), 0);
}

export function classifyHeadline(headline: string): HeadlineSentiment {
  const bullishScore = termScore(headline, BULLISH_TERMS);
  const bearishScore = termScore(headline, BEARISH_TERMS);

  if (bullishScore > bearishScore) return 'bullish';
  if (bearishScore > bullishScore) return 'bearish';
  return 'neutral';
}

export function fallbackSentimentAnalysis(
  headlines: string[],
  companyName: string,
  trendDirection: TrendDirection
): { sentiment: SentimentResult; insight: string; labels: HeadlineSentiment[] } {
  const labels = headlines.map(classifyHeadline);
  const total = Math.max(labels.length, 1);
  const bullishCount = labels.filter((label) => label === 'bullish').length;
  const bearishCount = labels.filter((label) => label === 'bearish').length;
  const bullish = Math.round((bullishCount / total) * 100);
  const bearish = Math.round((bearishCount / total) * 100);
  const neutral = Math.max(0, 100 - bullish - bearish);
  const score = computeSentimentScore(bullish, bearish);

  const dominant =
    bullish > bearish && bullish > neutral
      ? 'bullish'
      : bearish > bullish && bearish > neutral
        ? 'bearish'
        : neutral >= bullish && neutral >= bearish
          ? 'mostly neutral'
          : 'mixed';

  const trendText = trendDirection.toLowerCase();
  const insight = `Recent headline language around ${companyName} is ${dominant}, with ${bullish}% bullish, ${bearish}% bearish, and ${neutral}% neutral signals in the current sample. Public search interest is ${trendText}; this rules-based reading should be treated as directional context and checked against the source headlines.`;

  return {
    sentiment: { bullish, bearish, neutral, score },
    insight,
    labels,
  };
}
