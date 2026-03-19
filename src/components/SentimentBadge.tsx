const COLORS: Record<'bullish' | 'bearish' | 'neutral', string> = {
  bullish: '#00ff88',
  bearish: '#ff4444',
  neutral: '#888888',
};

interface SentimentBadgeProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export default function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const color = COLORS[sentiment];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
        background: `${color}26`, // ~15% opacity
        border: `1px solid ${color}`,
      }}
    >
      {sentiment}
    </span>
  );
}
