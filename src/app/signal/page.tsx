'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { AnalyzeResponse, ApiError, SignalType, TrendDirection, EntryExitLabel } from '@/types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";

const SIGNAL_COLORS: Record<SignalType, string> = {
  Overconfidence: '#ef4444',
  'Mild Optimism': '#f97316',
  Aligned: '#00ff88',
  'Mild Pessimism': '#f97316',
  'Hidden Strength': '#00e5ff',
};

const SIGNAL_SUBTEXTS: Record<SignalType, string> = {
  Overconfidence: 'Crowd more bullish than price justifies',
  'Mild Optimism': 'Sentiment slightly ahead of price',
  Aligned: 'Sentiment and price are in sync',
  'Mild Pessimism': 'Price outpacing negative sentiment',
  'Hidden Strength': 'Price rising despite bearish crowd',
};

const TREND_COLORS: Record<TrendDirection, string> = {
  Rising: '#00ff88',
  Falling: '#ef4444',
  Stable: '#888',
};

const TREND_ARROWS: Record<TrendDirection, string> = {
  Rising: '↑',
  Falling: '↓',
  Stable: '→',
};

const BADGE_BG: Record<EntryExitLabel, string> = {
  'Potential Entry Zone': '#00ff88',
  'Caution — Consider Exit': '#ef4444',
  'Watch — Momentum Building': '#f97316',
  'Hold — No Strong Signal': '#333',
};

const BADGE_TEXT: Record<EntryExitLabel, string> = {
  'Potential Entry Zone': '#0a0a0a',
  'Caution — Consider Exit': '#0a0a0a',
  'Watch — Momentum Building': '#0a0a0a',
  'Hold — No Strong Signal': '#e8e8f0',
};

const TICKER_TAPE_ITEMS = [
  'AAPL · Aligned', 'TSLA · Mild Optimism', 'MSFT · Overconfidence',
  'NVDA · Hidden Strength', 'META · Aligned', 'AMZN · Mild Pessimism',
  'GOOG · Aligned', 'NFLX · Mild Optimism', 'AMD · Hidden Strength',
];

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div style={{
      background: '#0d0d12',
      border: '1px solid #1c1c26',
      borderRadius: '8px',
      padding: '20px 24px',
      flex: '1 1 150px',
    }}>
      <p style={{
        color: '#555',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: MONO,
        marginBottom: '10px',
      }}>
        {label}
      </p>
      <p style={{
        color: valueColor ?? '#e8e8f0',
        fontSize: '1.65rem',
        fontWeight: 500,
        fontFamily: MONO,
        lineHeight: 1,
        marginBottom: sub ? '6px' : 0,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ color: '#555', fontSize: '13px', fontFamily: FONT }}>
          {sub}
        </p>
      )}
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
          const color = SIGNAL_COLORS[signal as SignalType] ?? '#555';
          return (
            <span key={i} style={{ whiteSpace: 'nowrap', fontFamily: MONO, fontSize: '12px' }}>
              <span style={{ color: '#e8e8f0' }}>{symbol}</span>
              <span style={{ color: '#555', margin: '0 6px' }}>·</span>
              <span style={{ color }}>{signal}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Sentiment bar ─────────────────────────────────────────────────────────────
function SentimentBar({ bullish, neutral, bearish }: { bullish: number; neutral: number; bearish: number }) {
  return (
    <div>
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '10px', background: '#1c1c26', marginBottom: '14px' }}>
        <div style={{ width: `${bullish}%`, background: '#00ff88' }} />
        <div style={{ width: `${neutral}%`, background: '#2a2a3a' }} />
        <div style={{ width: `${bearish}%`, background: '#ef4444' }} />
      </div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <span style={{ color: '#00ff88', fontSize: '13px', fontFamily: MONO }}>▲ Bullish {bullish}%</span>
        <span style={{ color: '#555', fontSize: '13px', fontFamily: MONO }}>● Neutral {neutral}%</span>
        <span style={{ color: '#ef4444', fontSize: '13px', fontFamily: MONO }}>▼ Bearish {bearish}%</span>
      </div>
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
function SignalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTicker = searchParams.get('ticker') ?? '';
  const timeframe = (Number(searchParams.get('timeframe') ?? '30') || 30) as 7 | 30 | 90;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [headlinesExpanded, setHeadlinesExpanded] = useState(false);

  const [inputTicker, setInputTicker] = useState(rawTicker);
  const [selectedTimeframe, setSelectedTimeframe] = useState<7 | 30 | 90>(timeframe);

  useEffect(() => {
    setInputTicker(rawTicker);
    setSelectedTimeframe(timeframe);
  }, [rawTicker, timeframe]);

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

  const handleAnalyze = () => {
    const t = inputTicker.trim();
    if (!t) return;
    router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${selectedTimeframe}`);
  };

  if (!rawTicker) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: FONT }}>
        <p style={{ color: '#555', marginBottom: '16px' }}>No ticker selected.</p>
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

  const hasTrendLine = chartData?.some(p => p['Search Trend'] !== undefined) ?? false;
  const xInterval = chartData ? Math.max(Math.floor(chartData.length / 5) - 1, 0) : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 80px', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: FONT,
            fontSize: '28px',
            fontWeight: 700,
            color: '#e8e8f0',
            lineHeight: 1.2,
            marginBottom: '6px',
          }}>
            {data?.companyName ?? 'Signal Board'}
          </h1>
          <p style={{ color: '#555', fontSize: '14px' }}>
            Sentiment vs price divergence analysis
          </p>
        </div>
        <Link href="/" style={{
          color: '#e8e8f0',
          fontSize: '14px',
          textDecoration: 'none',
          border: '1px solid #2a2a3a',
          borderRadius: '6px',
          padding: '8px 14px',
          whiteSpace: 'nowrap',
        }}>
          ← Home
        </Link>
      </div>

      {/* Re-analyze bar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={inputTicker}
          onChange={e => setInputTicker(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          placeholder="Ticker or company"
          style={{
            background: '#0d0d12',
            border: '1px solid #2a2a3a',
            borderRadius: '6px',
            color: '#e8e8f0',
            fontFamily: FONT,
            fontSize: '14px',
            height: '44px',
            padding: '0 14px',
            outline: 'none',
            minWidth: '160px',
          }}
        />
        {([7, 30, 90] as const).map(tf => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            style={{
              background: selectedTimeframe === tf ? '#00ff88' : '#0d0d12',
              border: '1px solid #2a2a3a',
              borderRadius: '6px',
              color: selectedTimeframe === tf ? '#0a0a0a' : '#e8e8f0',
              fontFamily: FONT,
              fontSize: '13px',
              height: '44px',
              padding: '0 16px',
              cursor: 'pointer',
            }}
          >
            {tf}D
          </button>
        ))}
        <button
          onClick={handleAnalyze}
          style={{
            background: '#0d0d12',
            border: '1px solid #2a2a3a',
            borderRadius: '6px',
            color: '#888',
            fontFamily: FONT,
            fontSize: '13px',
            height: '44px',
            padding: '0 20px',
            cursor: 'pointer',
          }}
        >
          Analyze
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #1c1c26', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#555', fontSize: '13px' }}>
            Fetching headlines, prices, trends, and running analysis…
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#180808', border: '1px solid #ef444444', borderRadius: '8px', padding: '16px 20px', color: '#ef4444', fontSize: '14px', marginBottom: '24px' }}>
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
              valueColor={SIGNAL_COLORS[data.signal]}
            />
            <MetricCard
              label="Signal"
              value={data.signal}
              valueColor={SIGNAL_COLORS[data.signal]}
              sub={SIGNAL_SUBTEXTS[data.signal]}
            />
            <MetricCard
              label="Price Change"
              value={`${data.priceChangePercent > 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%`}
              sub={`Over ${data.timeframe} days`}
              valueColor={data.priceChangePercent >= 0 ? '#00ff88' : '#ef4444'}
            />
            <MetricCard
              label="Sentiment Score"
              value={`${Math.round(data.sentiment.score)}/100`}
              sub={`${data.sentiment.bullish}% bull · ${data.sentiment.bearish}% bear`}
            />
            <MetricCard
              label="Search Trend"
              value={`${data.trendScore}${TREND_ARROWS[data.trendDirection]}`}
              sub={data.trendDirection}
              valueColor={TREND_COLORS[data.trendDirection]}
            />
          </div>

          {/* Entry/Exit panel */}
          {data.entryExitLabel && (
            <div style={{
              background: '#0d0d12',
              border: '1px solid #1c1c26',
              borderRadius: '8px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{
                    fontFamily: MONO,
                    fontSize: '13px',
                    fontWeight: 500,
                    color: BADGE_TEXT[data.entryExitLabel],
                    background: BADGE_BG[data.entryExitLabel],
                    borderRadius: '4px',
                    padding: '4px 10px',
                  }}>
                    {data.entryExitLabel}
                  </span>
                </div>
                <p style={{ color: '#a0a0b8', fontSize: '14px', lineHeight: 1.55 }}>
                  {data.entryExitExplanation}
                </p>
              </div>
              <p style={{ color: '#4a4a6a', fontSize: '11px', alignSelf: 'flex-end', minWidth: '200px' }}>
                Quantitative analysis only. Not financial advice.
              </p>
            </div>
          )}

          {/* Chart */}
          <div style={{
            background: '#0d0d12',
            border: '1px solid #1c1c26',
            borderRadius: '8px',
            padding: '24px',
          }}>
            <p style={{ color: '#555', fontSize: '11px', fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
              Sentiment vs Normalised Price (0–100 Scale)
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#555', fontSize: 11, fontFamily: MONO }}
                  tickLine={false}
                  axisLine={false}
                  interval={xInterval}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fill: '#555', fontSize: 11, fontFamily: MONO }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '6px', color: '#e8e8f0', fontSize: '12px', fontFamily: MONO }}
                  labelStyle={{ color: '#555', marginBottom: '4px' }}
                  cursor={{ stroke: '#2a2a3a' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontFamily: MONO, color: '#555', paddingTop: '12px' }}
                />
                <ReferenceLine y={50} stroke="#2a2a3a" strokeDasharray="6 4" />
                <Line
                  type="monotone"
                  dataKey="Norm. Price"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="Sentiment Score"
                  stroke="#00ff88"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 2"
                  isAnimationActive={false}
                />
                {hasTrendLine && (
                  <Line
                    type="monotone"
                    dataKey="Search Trend"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment breakdown */}
          <div style={{
            background: '#0d0d12',
            border: '1px solid #1c1c26',
            borderRadius: '8px',
            padding: '22px 24px',
          }}>
            <p style={{ color: '#555', fontSize: '11px', fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Sentiment Breakdown
            </p>
            <SentimentBar
              bullish={data.sentiment.bullish}
              neutral={data.sentiment.neutral}
              bearish={data.sentiment.bearish}
            />
          </div>

          {/* Analysis */}
          <div style={{
            background: '#0f0f18',
            border: '1px solid #1c1c26',
            borderLeft: '2px solid #00e5ff',
            borderRadius: '8px',
            padding: '20px 24px',
          }}>
            <p style={{ color: '#555', fontSize: '11px', fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Analysis
            </p>
            <p style={{ color: '#c8c8d8', fontSize: '15px', lineHeight: 1.7, maxWidth: '70ch' }}>
              {data.insight}
            </p>
          </div>

          {/* Headlines */}
          <div style={{
            background: '#0d0d12',
            border: '1px solid #1c1c26',
            borderRadius: '8px',
            overflow: 'hidden',
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
              <span style={{ color: '#555', fontSize: '11px', fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Headlines used in analysis ({data.headlines.length})
              </span>
              <span style={{ color: '#555', fontSize: '14px', fontFamily: MONO }}>
                {headlinesExpanded ? '▲' : '▼'}
              </span>
            </button>
            {headlinesExpanded && (
              <div style={{ borderTop: '1px solid #1c1c26' }}>
                {data.headlines.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 24px',
                      borderBottom: i < data.headlines.length - 1 ? '1px solid #1c1c26' : 'none',
                      color: '#666',
                      fontSize: '13px',
                      lineHeight: 1.55,
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #1c1c26', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <SignalContent />
    </Suspense>
  );
}
