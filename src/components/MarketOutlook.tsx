import { C, T, styles } from '@/lib/designTokens';

const COLORS: Record<'bullish' | 'bearish' | 'neutral', string> = {
  bullish: C.GREEN,
  bearish: C.RED,
  neutral: C.NEUTRAL,
};

interface MarketOutlookProps {
  outlook: string;
  overall: 'bullish' | 'bearish' | 'neutral';
}

export default function MarketOutlook({ outlook, overall }: MarketOutlookProps) {
  const color = COLORS[overall];

  return (
    <div style={{ ...styles.insightBox, borderLeft: `3px solid ${color}` }}>
      <p style={styles.insightLabel}>AI Market Outlook</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {outlook.split('\n').map((line, i) => (
          <p key={i} style={{ ...styles.insightText, margin: 0 }}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
