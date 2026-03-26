import { C, styles } from '@/lib/designTokens';

const COLORS: Record<'bullish' | 'bearish' | 'neutral', string> = {
  bullish: C.GREEN,
  bearish: C.RED,
  neutral: C.NEUTRAL,
};

interface SentimentBadgeProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export default function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const color = COLORS[sentiment];

  return (
    <span style={styles.badge(color)}>
      {sentiment}
    </span>
  );
}
