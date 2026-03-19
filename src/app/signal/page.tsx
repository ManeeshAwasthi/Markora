'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { AnalyzeResponse, ApiError, SignalType } from '@/types';

const SIGNAL_COLORS: Record<SignalType, string> = {
  Overconfidence: '#ff4444',
  'Mild Optimism': '#ffaa00',
  Aligned: '#00ff88',
  'Mild Pessimism': '#ff8800',
  'Hidden Strength': '#00aaff',
};

const TIMEFRAMES = [7, 30, 90] as const;

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #222222',
        borderRadius: '10px',
        padding: '20px 24px',
        flex: '1 1 160px',
      }}
    >
      <p style={{ color: '#555555', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
        {label}
      </p>
      <p style={{ color: '#ffffff', fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: '#555555', fontSize: '0.78rem', marginTop: '6px' }}>{sub}</p>}
    </div>
  );
}

function SignalCard({ signal }: { signal: SignalType }) {
  const color = SIGNAL_COLORS[signal];
  return (
    <div
      style={{
        background: '#111111',
        border: `1px solid ${color}44`,
        borderRadius: '10px',
        padding: '20px 24px',
        flex: '1 1 160px',
      }}
    >
      <p style={{ color: '#555555', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Signal
      </p>
      <p style={{ color, fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2 }}>{signal}</p>
    </div>
  );
}

export default function SignalPage() {
  const [ticker, setTicker] = useState('');
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  const analyze = async () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticker: t, timeframe }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError((json as ApiError).error ?? 'Analysis failed');
      } else {
        setData(json as AnalyzeResponse);
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const chartData = data?.chartData.map((p) => ({
    date: p.date.slice(0, 10),
    'Sentiment Score': Math.round(p.sentimentScore * 10) / 10,
    'Normalised Price': Math.round(p.normalizedPrice * 10) / 10,
  }));

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Signal Board
          </h1>
          <p style={{ color: '#555555', fontSize: '0.9rem' }}>Sentiment vs price divergence analysis</p>
        </div>
        <Link
          href="/"
          style={{
            color: '#555555',
            fontSize: '0.85rem',
            textDecoration: 'none',
            border: '1px solid #222222',
            borderRadius: '6px',
            padding: '8px 14px',
          }}
        >
          ← Home
        </Link>
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && analyze()}
          placeholder="Ticker — e.g. AAPL"
          style={{
            flex: '1 1 220px',
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#ffffff',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
        {/* Timeframe buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: timeframe === tf ? '#00ff88' : '#111111',
                color: timeframe === tf ? '#000000' : '#888888',
                border: '1px solid #222222',
                borderRadius: '8px',
                padding: '12px 18px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tf}D
            </button>
          ))}
        </div>
        <button
          onClick={analyze}
          disabled={loading || !ticker.trim()}
          style={{
            background: loading || !ticker.trim() ? '#111111' : '#00ff88',
            color: loading || !ticker.trim() ? '#555555' : '#000000',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 28px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: loading || !ticker.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #222222',
              borderTop: '3px solid #00ff88',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: '#1a0000',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            padding: '16px',
            color: '#ff4444',
            fontSize: '0.9rem',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <StatCard
              label="Divergence Score"
              value={data.divergenceScore > 0 ? `+${data.divergenceScore}` : String(data.divergenceScore)}
              sub="Sentiment − Normalised Price"
            />
            <SignalCard signal={data.signal} />
            <StatCard
              label="Price Change"
              value={`${data.priceChangePercent > 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%`}
              sub={`Over ${data.timeframe} days`}
            />
            <StatCard
              label="Sentiment Score"
              value={`${Math.round(data.sentiment.score)}/100`}
              sub={`${data.sentiment.bullish}% bull · ${data.sentiment.bearish}% bear`}
            />
          </div>

          {/* Chart */}
          <div
            style={{
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: '10px',
              padding: '24px',
            }}
          >
            <p style={{ color: '#888888', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px' }}>
              Sentiment vs Normalised Price (0–100 scale)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#555555', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#555555', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#111111', border: '1px solid #222222', borderRadius: '6px', color: '#ffffff', fontSize: '0.82rem' }}
                  labelStyle={{ color: '#888888' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.82rem', color: '#888888', paddingTop: '12px' }} />
                <ReferenceLine y={50} stroke="#333333" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="Sentiment Score"
                  stroke="#00ff88"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="6 3"
                />
                <Line
                  type="monotone"
                  dataKey="Normalised Price"
                  stroke="#00aaff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment breakdown */}
          <div
            style={{
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: '10px',
              padding: '24px',
            }}
          >
            <p style={{ color: '#888888', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Sentiment Breakdown
            </p>
            <div style={{ display: 'flex', gap: '0', borderRadius: '6px', overflow: 'hidden', height: '12px', marginBottom: '14px' }}>
              <div style={{ width: `${data.sentiment.bullish}%`, background: '#00ff88' }} />
              <div style={{ width: `${data.sentiment.neutral}%`, background: '#444444' }} />
              <div style={{ width: `${data.sentiment.bearish}%`, background: '#ff4444' }} />
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <span style={{ color: '#00ff88', fontSize: '0.85rem' }}>▲ Bullish {data.sentiment.bullish}%</span>
              <span style={{ color: '#888888', fontSize: '0.85rem' }}>● Neutral {data.sentiment.neutral}%</span>
              <span style={{ color: '#ff4444', fontSize: '0.85rem' }}>▼ Bearish {data.sentiment.bearish}%</span>
            </div>
          </div>

          {/* AI Insight */}
          <div
            style={{
              background: '#0d1a12',
              border: '1px solid #00ff8833',
              borderLeft: '3px solid #00ff88',
              borderRadius: '10px',
              padding: '20px 24px',
            }}
          >
            <p style={{ color: '#00ff88', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              AI Insight
            </p>
            <p style={{ color: '#cccccc', fontSize: '0.95rem', lineHeight: 1.7 }}>{data.insight}</p>
          </div>

          {/* Headlines */}
          <div>
            <p style={{ color: '#555555', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Headlines ({data.headlines.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.headlines.map((h, i) => (
                <div
                  key={i}
                  style={{
                    background: '#111111',
                    border: '1px solid #1a1a1a',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    color: '#cccccc',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>

          <p style={{ color: '#333333', fontSize: '0.75rem', textAlign: 'right' }}>
            Fetched at {new Date(data.fetchedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
