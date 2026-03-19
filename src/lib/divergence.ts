import { SignalType, TrendDirection, EntryExitLabel } from '@/types';

export function getSignal(divergenceScore: number): SignalType {
  if (divergenceScore > 30) return 'Overconfidence';
  if (divergenceScore >= 10) return 'Mild Optimism';
  if (divergenceScore > -10) return 'Aligned';
  if (divergenceScore >= -30) return 'Mild Pessimism';
  return 'Hidden Strength';
}

export interface EntryExitResult {
  label: EntryExitLabel;
  color: string;
  explanation: string;
}

export function getEntryExitSignal(
  signal: SignalType,
  trendDirection: TrendDirection,
  priceChangePercent: number
): EntryExitResult {
  const priceRecovering = priceChangePercent > 0;

  if (signal === 'Hidden Strength' && trendDirection === 'Rising' && priceRecovering) {
    return {
      label: 'Potential Entry Zone',
      color: '#00ff88',
      explanation:
        'Price is recovering, crowd sentiment is still bearish, and search interest is rising — a classic early re-rating setup.',
    };
  }

  if (signal === 'Overconfidence' && trendDirection === 'Falling' && !priceRecovering) {
    return {
      label: 'Caution — Consider Exit',
      color: '#ef4444',
      explanation:
        'Crowd optimism is well ahead of price, search interest is fading, and momentum has stalled.',
    };
  }

  if (signal === 'Aligned' && trendDirection === 'Stable') {
    return {
      label: 'Hold — No Strong Signal',
      color: '#4a4a6a',
      explanation:
        'Sentiment and price are in sync, and search interest is stable. No notable edge in either direction.',
    };
  }

  if (trendDirection === 'Rising') {
    return {
      label: 'Watch — Momentum Building',
      color: '#f97316',
      explanation:
        'Search interest is rising. Increasing public attention often precedes price movement.',
    };
  }

  return {
    label: 'Hold — No Strong Signal',
    color: '#4a4a6a',
    explanation:
      'No compelling signal from the combination of sentiment, trend direction, and price movement.',
  };
}
