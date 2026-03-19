'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AnalyzeResponse, ApiError, SignalType, TrendDirection } from '@/types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const SIGNAL_COLORS: Record<SignalType, string> = {
  Overconfidence: '#ef4444',
  'Mild Optimism': '#f97316',
  Aligned: '#00ff88',
  'Mild Pessimism': '#f97316',
  'Hidden Strength': '#00e5ff',
};

const TREND_COLORS: Record<TrendDirection, string> = {
  Rising: '#00ff88',
  Falling: '#ef4444',
  Stable: '#4a4a6a',
};

const TREND_ARROWS: Record<TrendDirection, string> = {
  Rising: '↑',
  Falling: '↓',
  Stable: '→',
};

const TOOLTIPS = {
  divergence: 'How far apart crowd sentiment is from actual price movement. A large positive number means people are more optimistic than the price justifies. A large negative number means the price is rising faster than people expect.',
  signal: 'A label that summarizes the divergence. Ranges from Overconfidence (crowd too bullish) to Hidden Strength (crowd too bearish).',
  sentiment: 'A number from 0–100 measuring how bullish recent news headlines are. 50 is neutral, above 50 is optimistic, below 50 is pessimistic.',
  price: 'How much the stock\'s price moved over the selected period, shown as a percentage.',
  trend: 'How much public interest in this stock has changed over the selected period, based on search volume data. Rising interest often precedes price movement.',
};

const TICKER_TAPE_ITEMS = [
  'AAPL · Aligned', 'TSLA · Mild Optimism', 'MSFT · Overconfidence',
  'NVDA · Hidden Strength', 'META · Aligned', 'AMZN · Mild Pessimism',
  'GOOG · Aligned', 'NFLX · Mild Optimism', 'AMD · Hidden Strength',
];

// ── Tooltip component ─────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ position: 'relative', display: 'inline-block', cursor: 'help', marginLeft: '5px', verticalAlign: 'middle' }}
    >
      <span style={{ color: '#4a4a6a', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono)' }}>ⓘ</span>
      {visible && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0d0d18',
          border: '1px solid #1c1c26',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.76rem',
          color: '#a0a0b8',
          width: '280px',
          lineHeight: 1.55,
          zIndex: 100,
          whiteSpace: 'normal',
          pointerEvents: 'none',
          animation: 'tooltipFade 0.15s ease forwards',
          fontFamily: 'var(--font-outfit)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  valueColor,
  tooltip,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  tooltip: string;
  delay: number;
}) {
  return (
    <div style={{
      background: '#0d0d12',
      border: '1px solid #1c1c26',
      borderRadius: '12px',
      padding: '20px 22px',
      flex: '1 1 150px',
      animation: `cardIn 0.5s ease forwards`,
      animationDelay: `${delay}ms`,
      opacity: 0,
    }}>
      <p style={{
        color: '#4a4a6a',
        fontSize: '0.7rem',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-dm-mono)',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {label}
        <InfoTooltip text={tooltip} />
      </p>
      <p style={{
        color: valueColor ?? '#e8e8f0',
        fontSize: '1.65rem',
        fontWeight: 500,
        fontFamily: 'var(--font-dm-mono)',
        lineHeight: 1,
        animation: 'numberGlow 1.2s ease forwards',
        animationDelay: `${delay + 300}ms`,
        marginBottom: sub ? '6px' : 0,
      }}>
        {value}
      </p>
      {sub && <p style={{ color: '#4a4a6a', fontSize: '0.76rem', fontFamily: 'var(--font-outfit)' }}>{sub}</p>}
    </div>
  );
}

// ── Ticker tape ───────────────────────────────────────────────────────────────
function TickerTape() {
  const items = [...TICKER_TAPE_ITEMS, ...TICKER_TAPE_ITEMS];
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '36px',
      background: '#0d0d12',
      borderTop: '1px solid #1c1c26',
      overflow: 'hidden',
      zIndex: 10,
    }}>
      <div style={{
        display: 'flex',
        gap: '48px',
        alignItems: 'center',
        height: '100%',
        width: 'max-content',
        animation: 'tickerScroll 40s linear infinite',
        paddingLeft: '100%',
      }}>
        {items.map((item, i) => {
          const [symbol, signal] = item.split(' · ');
          const color = SIGNAL_COLORS[signal as SignalType] ?? '#4a4a6a';
          return (
            <span key={i} style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-dm-mono)', fontSize: '0.72rem' }}>
              <span style={{ color: '#e8e8f0' }}>{symbol}</span>
              <span style={{ color: '#4a4a6a', margin: '0 6px' }}>·</span>
              <span style={{ color }}>{signal}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Percentage bar ────────────────────────────────────────────────────────────
function SentimentBar({ bullish, neutral, bearish }: { bullish: number; neutral: number; bearish: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 300); return () => clearTimeout(t); }, []);
  return (
    <div>
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '10px', background: '#1c1c26', marginBottom: '14px' }}>
        <div style={{ width: mounted ? `${bullish}%` : '0%', background: '#00ff88', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        <div style={{ width: mounted ? `${neutral}%` : '0%', background: '#2a2a3a', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1) 0.1s' }} />
        <div style={{ width: mounted ? `${bearish}%` : '0%', background: '#ef4444', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1) 0.2s' }} />
      </div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <span style={{ color: '#00ff88', fontSize: '0.85rem', fontFamily: 'var(--font-dm-mono)' }}>▲ Bullish {bullish}%</span>
        <span style={{ color: '#4a4a6a', fontSize: '0.85rem', fontFamily: 'var(--font-dm-mono)' }}>● Neutral {neutral}%</span>
        <span style={{ color: '#ef4444', fontSize: '0.85rem', fontFamily: 'var(--font-dm-mono)' }}>▼ Bearish {bearish}%</span>
      </div>
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
function SignalContent() {
  const searchParams = useSearchParams();
  const rawTicker = searchParams.get('ticker') ?? '';
  const timeframe = (Number(searchParams.get('timeframe') ?? '30') || 30) as 7 | 30 | 90;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [headlinesExpanded, setHeadlinesExpanded] = useState(false);

  useEffect(() => {
    if (!rawTicker) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ticker: rawTicker, timeframe }),
        });
        const json = await res.json();
        if (!cancelled) {
          if (!res.ok) setError((json as ApiError).error ?? 'Analysis failed');
          else setData(json as AnalyzeResponse);
        }
      } catch {
        if (!cancelled) setError('Network error — please try again');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [rawTicker, timeframe]);

  if (!rawTicker) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ color: '#4a4a6a', marginBottom: '16px' }}>No ticker selected.</p>
        <Link href="/" style={{ color: '#00e5ff', fontSize: '0.9rem' }}>← Back to home</Link>
      </div>
    );
  }

  const chartData = data?.chartData.map((p) => ({
    date: p.date,
    'Sentiment Score': Math.round(p.sentimentScore * 10) / 10,
    'Norm. Price': Math.round(p.normalizedPrice * 10) / 10,
    'Search Trend': p.trendScore,
  }));

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          {data ? (
            <>
              <h1 style={{
                fontFamily: 'var(--font-dm-serif)',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                color: '#e8e8f0',
                lineHeight: 1.1,
                marginBottom: '8px',
              }}>
                {data.companyName}
              </h1>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.88rem', color: '#00e5ff', background: '#00e5ff11', border: '1px solid #00e5ff33', borderRadius: '6px', padding: '3px 10px' }}>
                  {data.ticker}
                </span>
                {data.exchange && (
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.72rem', color: '#4a4a6a', background: '#1c1c26', borderRadius: '6px', padding: '3px 8px' }}>
                    {data.exchange}
                  </span>
                )}
                <span style={{ color: '#4a4a6a', fontSize: '0.78rem' }}>
                  {timeframe}D analysis · {new Date(data.fetchedAt).toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : (
            <div>
              <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '2rem', color: '#e8e8f0' }}>
                {loading ? 'Analyzing…' : rawTicker.toUpperCase()}
              </h1>
            </div>
          )}
        </div>
        <Link href="/" style={{ color: '#4a4a6a', fontSize: '0.85rem', textDecoration: 'none', border: '1px solid #1c1c26', borderRadius: '8px', padding: '8px 14px', whiteSpace: 'nowrap', fontFamily: 'var(--font-outfit)' }}>
          ← Home
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #1c1c26', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#4a4a6a', fontSize: '0.85rem', fontFamily: 'var(--font-outfit)' }}>
            Fetching headlines, prices, trends, and running analysis…
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#180808', border: '1px solid #ef444444', borderRadius: '10px', padding: '16px 20px', color: '#ef4444', fontSize: '0.9rem', marginBottom: '24px', fontFamily: 'var(--font-outfit)' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metric cards */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <MetricCard
              label="Divergence Score"
              value={data.divergenceScore > 0 ? `+${data.divergenceScore}` : String(data.divergenceScore)}
              sub="Sentiment − Normalised Price"
              tooltip={TOOLTIPS.divergence}
              delay={0}
            />
            <MetricCard
              label="Signal"
              value={data.signal}
              valueColor={SIGNAL_COLORS[data.signal]}
              tooltip={TOOLTIPS.signal}
              delay={80}
            />
            <MetricCard
              label="Price Change"
              value={`${data.priceChangePercent > 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%`}
              sub={`Over ${data.timeframe} days`}
              valueColor={data.priceChangePercent >= 0 ? '#00ff88' : '#ef4444'}
              tooltip={TOOLTIPS.price}
              delay={160}
            />
            <MetricCard
              label="Sentiment Score"
              value={`${Math.round(data.sentiment.score)}`}
              sub={`${data.sentiment.bullish}% bull · ${data.sentiment.bearish}% bear`}
              tooltip={TOOLTIPS.sentiment}
              delay={240}
            />
            <MetricCard
              label="Search Trend"
              value={`${TREND_ARROWS[data.trendDirection]} ${data.trendDirection}`}
              sub={`Index: ${data.trendScore}/100`}
              valueColor={TREND_COLORS[data.trendDirection]}
              tooltip={TOOLTIPS.trend}
              delay={320}
            />
          </div>

          {/* Entry/Exit guidance */}
          <div style={{
            background: '#0d0d12',
            border: `1px solid ${data.entryExitColor}33`,
            borderLeft: `3px solid ${data.entryExitColor}`,
            borderRadius: '12px',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
            animation: 'cardIn 0.5s ease 420ms forwards',
            opacity: 0,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: data.entryExitColor,
                  background: `${data.entryExitColor}15`,
                  border: `1px solid ${data.entryExitColor}33`,
                  borderRadius: '6px',
                  padding: '3px 10px',
                }}>
                  {data.entryExitLabel}
                </span>
              </div>
              <p style={{ color: '#a0a0b8', fontSize: '0.88rem', lineHeight: 1.55, fontFamily: 'var(--font-outfit)' }}>
                {data.entryExitExplanation}
              </p>
            </div>
            <p style={{ color: '#4a4a6a', fontSize: '0.72rem', fontFamily: 'var(--font-outfit)', alignSelf: 'flex-end', minWidth: '200px' }}>
              Quantitative analysis only. Not financial advice.
            </p>
          </div>

          {/* Triple-line chart */}
          <div style={{
            background: '#0d0d12',
            border: '1px solid #1c1c26',
            borderRadius: '12px',
            padding: '24px',
            animation: 'cardIn 0.5s ease 500ms forwards',
            opacity: 0,
          }}>
            <p style={{ color: '#4a4a6a', fontSize: '0.7rem', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
              Sentiment vs Normalised Price vs Search Trend (0–100 scale)
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'var(--font-dm-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'var(--font-dm-mono)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#0d0d18', border: '1px solid #1c1c26', borderRadius: '8px', color: '#e8e8f0', fontSize: '0.8rem', fontFamily: 'var(--font-dm-mono)' }}
                  labelStyle={{ color: '#4a4a6a', marginBottom: '4px' }}
                  cursor={{ stroke: '#1c1c26' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '0.78rem', fontFamily: 'var(--font-dm-mono)', color: '#4a4a6a', paddingTop: '12px' }}
                />
                <ReferenceLine y={50} stroke="#1c1c26" strokeDasharray="6 4" />
                <Line
                  type="monotone"
                  dataKey="Sentiment Score"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="7 4"
                  isAnimationActive={true}
                  animationDuration={1400}
                />
                <Line
                  type="monotone"
                  dataKey="Norm. Price"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1600}
                />
                <Line
                  type="monotone"
                  dataKey="Search Trend"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment breakdown */}
          <div style={{
            background: '#0d0d12',
            border: '1px solid #1c1c26',
            borderRadius: '12px',
            padding: '22px 24px',
            animation: 'cardIn 0.5s ease 580ms forwards',
            opacity: 0,
          }}>
            <p style={{ color: '#4a4a6a', fontSize: '0.7rem', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Sentiment Breakdown
            </p>
            <SentimentBar
              bullish={data.sentiment.bullish}
              neutral={data.sentiment.neutral}
              bearish={data.sentiment.bearish}
            />
          </div>

          {/* AI Insight */}
          <div style={{
            background: '#0a1810',
            border: '1px solid #00e5ff22',
            borderLeft: '3px solid #00e5ff',
            borderRadius: '12px',
            padding: '22px 24px',
            animation: 'cardIn 0.5s ease 660ms forwards',
            opacity: 0,
          }}>
            <p style={{ color: '#00e5ff', fontSize: '0.7rem', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Analysis
            </p>
            <p style={{ color: '#c8c8d8', fontSize: '0.95rem', lineHeight: 1.75, fontFamily: 'var(--font-outfit)' }}>
              {data.insight}
            </p>
          </div>

          {/* Headlines */}
          <div style={{
            background: '#0d0d12',
            border: '1px solid #1c1c26',
            borderRadius: '12px',
            overflow: 'hidden',
            animation: 'cardIn 0.5s ease 740ms forwards',
            opacity: 0,
          }}>
            <button
              onClick={() => setHeadlinesExpanded(!headlinesExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '18px 24px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: '#4a4a6a', fontSize: '0.7rem', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Headlines used in analysis ({data.headlines.length})
              </span>
              <span style={{ color: '#4a4a6a', fontSize: '0.9rem', fontFamily: 'var(--font-dm-mono)', transition: 'transform 0.2s', transform: headlinesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ↓
              </span>
            </button>
            {headlinesExpanded && (
              <div style={{ borderTop: '1px solid #1c1c26' }}>
                {data.headlines.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 24px',
                      borderBottom: i < data.headlines.length - 1 ? '1px solid #13131f' : 'none',
                      color: '#a0a0b8',
                      fontSize: '0.86rem',
                      lineHeight: 1.55,
                      fontFamily: 'var(--font-outfit)',
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <TickerTape />
    </div>
  );
}

// ── Page wrapper (required for useSearchParams) ───────────────────────────────
export default function SignalPage() {
  return (
    <Suspense fallback={
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #1c1c26', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <SignalContent />
    </Suspense>
  );
}
