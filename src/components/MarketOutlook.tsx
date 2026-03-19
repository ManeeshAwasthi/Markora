const COLORS: Record<'bullish' | 'bearish' | 'neutral', string> = {
  bullish: '#00ff88',
  bearish: '#ff4444',
  neutral: '#888888',
};

interface MarketOutlookProps {
  outlook: string;
  overall: 'bullish' | 'bearish' | 'neutral';
}

export default function MarketOutlook({ outlook, overall }: MarketOutlookProps) {
  const color = COLORS[overall];

  return (
    <div
      style={{
        background: '#111111',
        borderRadius: '8px',
        padding: '20px',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <p
        style={{
          color: '#888888',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        AI Market Outlook
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {outlook.split('\n').map((line, i) => (
          <p key={i} style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
