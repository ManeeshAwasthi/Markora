'use client';

import type { CSSProperties } from 'react';
import {
  AreaChart, Area, LineChart, Line, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";

interface PriceIntelligenceTabProps {
  data: {
    rsi: number;
    rsiLabel: string;
    rsiHistory: Array<{ date: string; value: number }>;
    ma50: number;
    ma200: number;
    ma200Label: string;
    ma200PercentDiff: number;
    maHistory: Array<{ date: string; ma50: number | null; ma200: number | null; price: number }>;
    atr: number;
    atrPercent: number;
    high52: number;
    low52: number;
    weekRange52Position: number;
    crossSignal: string;
    bollingerBands: Array<{ date: string; upper: number; middle: number; lower: number; price: number }>;
    bollingerPosition: string;
    volumeHistory: Array<{ date: string; volume: number; avgVolume: number }>;
    volumeTrend: string;
    avgVolume30d: number;
    latestVolume: number;
    supportResistance: Array<{ level: number; type: 'support' | 'resistance'; strength: 'strong' | 'moderate' | 'weak' }>;
  };
  meta: {
    companyName: string;
    currencySymbol: string;
    currentPrice: number;
  };
}

const sectionStyle: CSSProperties = {
  marginBottom: '40px',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: '13px',
  fontFamily: MONO,
  color: '#a0a0b8',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '20px',
  fontWeight: 600,
};

const insightBoxStyle: CSSProperties = {
  background: '#0a0a12',
  borderLeft: '3px solid #00e5ff',
  borderRadius: '8px',
  padding: '20px 24px',
  marginTop: '20px',
};

const insightLabelStyle: CSSProperties = {
  fontSize: '11px',
  fontFamily: MONO,
  color: '#4a4a6a',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '8px',
};

const insightTextStyle: CSSProperties = {
  fontSize: '14px',
  color: '#c0c0d0',
  lineHeight: 1.65,
  fontFamily: FONT,
};

const collapsibleBtnStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#4a4a6a',
  fontFamily: MONO,
  fontSize: '11px',
  letterSpacing: '0.08em',
  cursor: 'pointer',
  padding: '12px 0 0',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const collapsibleContentStyle: CSSProperties = {
  marginTop: '12px',
  padding: '16px 20px',
  background: '#0d0d14',
  border: '1px solid #1c1c26',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#666',
  lineHeight: 1.7,
  fontFamily: FONT,
};

const tooltipStyle = {
  contentStyle: { background: '#0a0a12', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 11, fontFamily: MONO },
  labelStyle: { color: '#555', marginBottom: '4px' },
  cursor: { stroke: '#2a2a3a' },
};

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export default function PriceIntelligenceTab({ data, meta }: PriceIntelligenceTabProps) {
  const [showRsiLearn, setShowRsiLearn] = React.useState(false);
  const [showMALearn, setShowMALearn] = React.useState(false);
  const [showBBLearn, setShowBBLearn] = React.useState(false);
  const [showVolLearn, setShowVolLearn] = React.useState(false);
  const [showSRLearn, setShowSRLearn] = React.useState(false);
  const [show52Learn, setShow52Learn] = React.useState(false);
  const [showATRLearn, setShowATRLearn] = React.useState(false);

  const rsiColor = data.rsiLabel === 'Overbought' ? '#ef4444' : data.rsiLabel === 'Oversold' ? '#00ff88' : '#888';
  const clamp52 = Math.min(100, Math.max(0, data.weekRange52Position));

  // Summary text
  const summaryParts: string[] = [];
  summaryParts.push(`RSI is ${data.rsi} (${data.rsiLabel.toLowerCase()}).`);
  summaryParts.push(`Price is ${data.ma200Label.toLowerCase()} the 200-day MA by ${Math.abs(data.ma200PercentDiff)}%.`);
  if (data.crossSignal !== 'None') summaryParts.push(`${data.crossSignal} detected recently.`);
  summaryParts.push(`Bollinger position: ${data.bollingerPosition.toLowerCase()}.`);
  summaryParts.push(`Volume trend is ${data.volumeTrend.toLowerCase()}.`);

  const xInterval = Math.floor((data.rsiHistory.length - 1) / 5);

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Summary */}
      <div style={{ background: '#0a0a12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '24px 28px', marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Price Intelligence Summary
        </p>
        <p style={{ fontSize: '15px', color: '#c0c0d0', lineHeight: 1.7 }}>
          {summaryParts.join(' ')} The 52-week range position is at the{' '}
          <span style={{ color: '#00e5ff', fontFamily: MONO }}>{data.weekRange52Position.toFixed(0)}th</span> percentile.
          ATR is{' '}
          <span style={{ color: '#00e5ff', fontFamily: MONO }}>
            {meta.currencySymbol}{data.atr.toFixed(2)} ({data.atrPercent.toFixed(1)}%)
          </span>{' '}
          of current price.
        </p>
      </div>

      {/* 1. RSI */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>RSI — Relative Strength Index</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: '2.5rem', fontWeight: 700, color: rsiColor }}>{data.rsi}</span>
          <span style={{
            fontFamily: MONO, fontSize: '11px', padding: '4px 12px', borderRadius: '4px',
            color: rsiColor, background: rsiColor + '18', letterSpacing: '0.06em',
          }}>{data.rsiLabel}</span>
        </div>
        {data.rsiHistory.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.rsiHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={rsiColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={rsiColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} interval={xInterval} />
              <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => [(v as number).toFixed(1), 'RSI']} />
              <ReferenceLine y={70} stroke="#ef444460" strokeDasharray="4 3" />
              <ReferenceLine y={30} stroke="#00ff8860" strokeDasharray="4 3" />
              <Area type="monotone" dataKey="value" stroke={rsiColor} strokeWidth={2} fill="url(#rsiGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {data.rsi > 70
              ? `RSI at ${data.rsi} suggests ${meta.companyName} may be overbought. Momentum is stretched — watch for a pullback or consolidation before adding positions.`
              : data.rsi < 30
              ? `RSI at ${data.rsi} suggests ${meta.companyName} may be oversold. Selling pressure may be exhausted — this zone can precede a bounce, but confirm with price action.`
              : `RSI at ${data.rsi} is in neutral territory. Neither overbought nor oversold — momentum is balanced and no extreme signal is present.`}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowRsiLearn(v => !v)}>
          {showRsiLearn ? '▲' : '▼'} How RSI works
        </button>
        {showRsiLearn && (
          <div style={collapsibleContentStyle}>
            RSI (Relative Strength Index) measures the speed and magnitude of recent price changes on a 0–100 scale. It compares average gains vs average losses over 14 trading days. Readings above 70 suggest overbought conditions (strong upward momentum, potential for reversal), while readings below 30 suggest oversold conditions (heavy selling, potential for bounce). RSI works best in ranging markets and should be combined with trend analysis.
          </div>
        )}
      </div>

      {/* 2. Moving Averages */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Moving Averages</p>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '16px 20px', minWidth: '140px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '6px' }}>MA 50</p>
            <p style={{ fontSize: '1.4rem', fontFamily: MONO, color: '#fbbf24', fontWeight: 600 }}>
              {meta.currencySymbol}{data.ma50.toFixed(2)}
            </p>
          </div>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '16px 20px', minWidth: '140px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '6px' }}>MA 200</p>
            <p style={{ fontSize: '1.4rem', fontFamily: MONO, color: '#f97316', fontWeight: 600 }}>
              {meta.currencySymbol}{data.ma200.toFixed(2)}
            </p>
          </div>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '16px 20px', minWidth: '160px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '6px' }}>Price vs MA200</p>
            <p style={{ fontSize: '1.1rem', fontFamily: MONO, color: data.ma200Label === 'Above' ? '#00ff88' : '#ef4444', fontWeight: 600 }}>
              {data.ma200Label} ({data.ma200PercentDiff > 0 ? '+' : ''}{data.ma200PercentDiff.toFixed(1)}%)
            </p>
          </div>
          {data.crossSignal !== 'None' && (
            <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '16px 20px', minWidth: '140px' }}>
              <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '6px' }}>Cross Signal</p>
              <span style={{
                fontFamily: MONO, fontSize: '12px', padding: '4px 10px', borderRadius: '4px',
                color: data.crossSignal === 'Golden Cross' ? '#fbbf24' : '#ef4444',
                background: data.crossSignal === 'Golden Cross' ? '#fbbf2418' : '#ef444418',
              }}>{data.crossSignal}</span>
            </div>
          )}
        </div>
        {data.maHistory.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.maHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.maHistory.length / 6)} />
              <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${meta.currencySymbol}${v.toFixed(0)}`} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown, name: unknown) => [`${meta.currencySymbol}${(v as number).toFixed(2)}`, name as string]} />
              <Legend content={() => (
                <div style={{ paddingTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  {[['#00e5ff', 'Price'], ['#fbbf24', 'MA50'], ['#f97316', 'MA200']].map(([c, l]) => (
                    <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, display: 'inline-block' }} />
                      <span style={{ color: '#555', fontSize: '11px', fontFamily: MONO }}>{l}</span>
                    </span>
                  ))}
                </div>
              )} />
              <Line type="monotone" dataKey="price" stroke="#00e5ff" strokeWidth={1.5} dot={false} isAnimationActive={false} name="Price" />
              <Line type="monotone" dataKey="ma50" stroke="#fbbf24" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls name="MA50" />
              <Line type="monotone" dataKey="ma200" stroke="#f97316" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls name="MA200" />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {meta.companyName}&apos;s price is {data.ma200Label.toLowerCase()} the 200-day moving average by {Math.abs(data.ma200PercentDiff)}%.{' '}
            {data.ma200Label === 'Above'
              ? 'This confirms a long-term uptrend — prices staying above MA200 is a sign of structural strength.'
              : 'Prices below the 200-day MA indicate long-term bearish pressure. A sustained reclaim of MA200 would be bullish.'}
            {data.crossSignal === 'Golden Cross' && ' A Golden Cross recently formed — the 50-day MA crossed above the 200-day, historically a bullish signal.'}
            {data.crossSignal === 'Death Cross' && ' A Death Cross recently formed — the 50-day MA crossed below the 200-day, historically a bearish signal.'}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowMALearn(v => !v)}>
          {showMALearn ? '▲' : '▼'} How Moving Averages work
        </button>
        {showMALearn && (
          <div style={collapsibleContentStyle}>
            Moving averages smooth price data to reveal trends. The MA50 tracks the average closing price over 50 days (medium-term trend), while MA200 covers 200 days (long-term trend). When MA50 crosses above MA200, it&apos;s called a Golden Cross — historically bullish. The reverse (Death Cross) is bearish. Price above MA200 typically signals an uptrend; below signals a downtrend. Traders use these as dynamic support/resistance levels.
          </div>
        )}
      </div>

      {/* 3. Bollinger Bands */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Bollinger Bands</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: '13px', color: '#a0a0b8' }}>Position:</span>
          <span style={{
            fontFamily: MONO, fontSize: '12px', padding: '4px 12px', borderRadius: '4px',
            color: data.bollingerPosition.includes('Upper') ? '#ef4444' : data.bollingerPosition.includes('Lower') ? '#00ff88' : '#888',
            background: data.bollingerPosition.includes('Upper') ? '#ef444418' : data.bollingerPosition.includes('Lower') ? '#00ff8818' : '#1c1c26',
          }}>{data.bollingerPosition}</span>
        </div>
        {data.bollingerBands.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.bollingerBands} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="bbBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.bollingerBands.length / 6)} />
              <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${meta.currencySymbol}${v.toFixed(0)}`} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown, name: unknown) => [`${meta.currencySymbol}${(v as number).toFixed(2)}`, name as string]} />
              <Area type="monotone" dataKey="upper" stroke="#7c3aed" strokeWidth={1} fill="url(#bbBand)" dot={false} isAnimationActive={false} name="Upper" />
              <Area type="monotone" dataKey="lower" stroke="#7c3aed" strokeWidth={1} fill="#06060880" dot={false} isAnimationActive={false} name="Lower" />
              <Line type="monotone" dataKey="middle" stroke="#7c3aed" strokeWidth={1} strokeDasharray="4 4" dot={false} isAnimationActive={false} name="Middle" />
              <Line type="monotone" dataKey="price" stroke="#00e5ff" strokeWidth={2} dot={false} isAnimationActive={false} name="Price" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            Price is currently {data.bollingerPosition.toLowerCase()}.{' '}
            {data.bollingerPosition === 'Above Upper Band'
              ? 'Price has broken above the upper band — strong momentum, but statistically extended. Watch for mean reversion.'
              : data.bollingerPosition === 'Near Upper Band'
              ? 'Price is approaching the upper band — momentum is strong but may face resistance here.'
              : data.bollingerPosition === 'Below Lower Band'
              ? 'Price has broken below the lower band — selling pressure is intense. Could signal panic or a reversal setup.'
              : data.bollingerPosition === 'Near Lower Band'
              ? 'Price is near the lower band — oversold pressure building. May bounce toward the middle band.'
              : 'Price is within the bands in normal range. No extreme volatility signal currently.'}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowBBLearn(v => !v)}>
          {showBBLearn ? '▲' : '▼'} How Bollinger Bands work
        </button>
        {showBBLearn && (
          <div style={collapsibleContentStyle}>
            Bollinger Bands consist of three lines: a 20-day moving average (middle), and upper/lower bands set 2 standard deviations above/below. About 95% of price action occurs within the bands. When price touches the upper band, the stock is considered statistically extended (not necessarily overbought). When it touches the lower band, it&apos;s extended to the downside. Band width indicates volatility — wider bands mean higher volatility, narrower bands mean low volatility (often before a breakout).
          </div>
        )}
      </div>

      {/* 4. Volume Analysis */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Volume Analysis</p>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '14px 18px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '4px' }}>Latest Volume</p>
            <p style={{ fontSize: '1.3rem', fontFamily: MONO, color: '#e8e8f0', fontWeight: 600 }}>{formatVolume(data.latestVolume)}</p>
          </div>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '14px 18px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '4px' }}>Avg Volume (30d)</p>
            <p style={{ fontSize: '1.3rem', fontFamily: MONO, color: '#e8e8f0', fontWeight: 600 }}>{formatVolume(data.avgVolume30d)}</p>
          </div>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '14px 18px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '4px' }}>Trend</p>
            <span style={{
              fontFamily: MONO, fontSize: '12px', padding: '4px 10px', borderRadius: '4px',
              color: data.volumeTrend === 'Increasing' ? '#00ff88' : data.volumeTrend === 'Decreasing' ? '#ef4444' : '#888',
              background: data.volumeTrend === 'Increasing' ? '#00ff8818' : data.volumeTrend === 'Decreasing' ? '#ef444418' : '#1c1c26',
            }}>{data.volumeTrend}</span>
          </div>
        </div>
        {data.volumeHistory.length > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={data.volumeHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.volumeHistory.length / 6)} />
              <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} tickFormatter={formatVolume} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown, name: unknown) => [formatVolume(v as number), name as string]} />
              <Bar dataKey="volume" fill="#00e5ff99" name="Volume" isAnimationActive={false} />
              <Line type="monotone" dataKey="avgVolume" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} name="Avg Volume" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            Volume is {data.volumeTrend.toLowerCase()} compared to recent averages.{' '}
            {data.volumeTrend === 'Increasing'
              ? 'Rising volume confirms the trend — price moves backed by high volume are more reliable and sustainable.'
              : data.volumeTrend === 'Decreasing'
              ? 'Falling volume can signal weakening conviction. Trend moves on low volume are less reliable and more prone to reversal.'
              : 'Volume is stable — no strong directional signal from participation levels.'}
            {' '}The 30-day average is {formatVolume(data.avgVolume30d)} shares/day.
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowVolLearn(v => !v)}>
          {showVolLearn ? '▲' : '▼'} How volume analysis works
        </button>
        {showVolLearn && (
          <div style={collapsibleContentStyle}>
            Volume shows how many shares were traded in a period. High volume during a price move confirms conviction — buyers or sellers are actively engaged. Low volume on a breakout is suspicious. Volume divergence (price rising but volume falling) can signal a weakening trend. The 20-day moving average of volume provides a baseline — days above average indicate heightened interest.
          </div>
        )}
      </div>

      {/* 5. Support & Resistance */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Support & Resistance Levels</p>
        {data.supportResistance.length === 0 ? (
          <p style={{ color: '#555', fontFamily: MONO, fontSize: '13px' }}>No clear levels detected in recent 90-day range.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...data.supportResistance].sort((a, b) => b.level - a.level).map((lvl, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '8px',
                background: lvl.type === 'resistance' ? '#ef444408' : '#00ff8808',
                border: `1px solid ${lvl.type === 'resistance' ? '#ef444430' : '#00ff8830'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px', fontFamily: MONO, fontWeight: 600, color: lvl.type === 'resistance' ? '#ef4444' : '#00ff88' }}>
                    {meta.currencySymbol}{lvl.level.toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: '10px', fontFamily: MONO, padding: '2px 8px', borderRadius: '3px',
                    color: lvl.type === 'resistance' ? '#ef4444' : '#00ff88',
                    background: lvl.type === 'resistance' ? '#ef444418' : '#00ff8818',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{lvl.type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px', fontFamily: MONO, padding: '2px 8px', borderRadius: '3px',
                    color: lvl.strength === 'strong' ? '#fbbf24' : lvl.strength === 'moderate' ? '#888' : '#555',
                    background: '#1c1c26',
                  }}>{lvl.strength}</span>
                  <span style={{ fontSize: '12px', color: '#555', fontFamily: MONO }}>
                    {((Math.abs(lvl.level - meta.currentPrice) / meta.currentPrice) * 100).toFixed(1)}% away
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            Support levels are price zones where buying historically emerged (green). Resistance levels are where sellers historically appeared (red). The closer and stronger a level, the more likely the stock pauses or reverses near it.{' '}
            {data.supportResistance.filter(l => l.type === 'support').length > 0
              ? `Nearest support is at ${meta.currencySymbol}${Math.max(...data.supportResistance.filter(l => l.type === 'support').map(l => l.level)).toFixed(2)}.`
              : ''}{' '}
            {data.supportResistance.filter(l => l.type === 'resistance').length > 0
              ? `Nearest resistance is at ${meta.currencySymbol}${Math.min(...data.supportResistance.filter(l => l.type === 'resistance').map(l => l.level)).toFixed(2)}.`
              : ''}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowSRLearn(v => !v)}>
          {showSRLearn ? '▲' : '▼'} How support & resistance works
        </button>
        {showSRLearn && (
          <div style={collapsibleContentStyle}>
            Support and resistance are price zones where supply and demand have historically balanced. Support forms where buyers stepped in repeatedly — the price bounced off this level multiple times. Resistance forms where sellers appeared repeatedly. These levels act as price magnets. &quot;Strong&quot; levels have more touches and are more significant. When price breaks through a resistance level, that resistance often becomes new support (role reversal).
          </div>
        )}
      </div>

      {/* 6. 52-Week Range */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>52-Week Range</p>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', height: '8px', background: 'linear-gradient(to right, #ef444440, #fbbf2440, #00ff8840)', borderRadius: '4px', margin: '16px 0 10px' }}>
            <div style={{ position: 'absolute', left: `${clamp52}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '16px', height: '16px', background: '#00e5ff', borderRadius: '50%', boxShadow: '0 0 8px #00e5ff80' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', fontFamily: MONO }}>
            <span style={{ color: '#ef4444' }}>L {meta.currencySymbol}{data.low52.toFixed(2)}</span>
            <span style={{ color: '#00e5ff' }}>{clamp52.toFixed(0)}th percentile</span>
            <span style={{ color: '#00ff88' }}>H {meta.currencySymbol}{data.high52.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '14px 18px', flex: 1, minWidth: '120px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '4px' }}>Distance from High</p>
            <p style={{ fontSize: '1.2rem', fontFamily: MONO, color: '#ef4444', fontWeight: 600 }}>
              -{((data.high52 - meta.currentPrice) / data.high52 * 100).toFixed(1)}%
            </p>
          </div>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '14px 18px', flex: 1, minWidth: '120px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '4px' }}>Distance from Low</p>
            <p style={{ fontSize: '1.2rem', fontFamily: MONO, color: '#00ff88', fontWeight: 600 }}>
              +{((meta.currentPrice - data.low52) / data.low52 * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            At the {clamp52.toFixed(0)}th percentile of its 52-week range, {meta.companyName} is{' '}
            {clamp52 > 75 ? 'trading near its yearly highs — strong recent performance but watch for resistance near the top.' :
             clamp52 < 25 ? 'trading near its yearly lows — weak recent performance. May be undervalued or facing headwinds.' :
             'in the middle of its yearly range — no extreme position.'}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShow52Learn(v => !v)}>
          {show52Learn ? '▲' : '▼'} How 52-week range works
        </button>
        {show52Learn && (
          <div style={collapsibleContentStyle}>
            The 52-week range shows the highest and lowest prices over the past year. Position within this range tells you where current price sits relative to its recent history. Near the high suggests strong momentum but potential resistance. Near the low suggests weakness but potential value. The percentile position (0–100) normalizes this: 100 = at the 52-week high, 0 = at the 52-week low.
          </div>
        )}
      </div>

      {/* 7. ATR & Volatility */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>ATR & Daily Volatility</p>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '20px 24px', flex: 1, minWidth: '160px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '8px' }}>ATR (14-day)</p>
            <p style={{ fontSize: '2rem', fontFamily: MONO, color: '#e8e8f0', fontWeight: 600, lineHeight: 1 }}>
              {meta.currencySymbol}{data.atr.toFixed(2)}
            </p>
            <p style={{ fontSize: '12px', fontFamily: MONO, color: '#4a4a6a', marginTop: '8px' }}>
              {data.atrPercent.toFixed(1)}% of price per day
            </p>
          </div>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '8px', padding: '20px 24px', flex: 1, minWidth: '200px' }}>
            <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '8px' }}>Risk Sizing Helper</p>
            <p style={{ fontSize: '13px', fontFamily: MONO, color: '#a0a0b8', lineHeight: 1.6 }}>
              1x ATR stop: {meta.currencySymbol}{(meta.currentPrice - data.atr).toFixed(2)}<br />
              2x ATR stop: {meta.currencySymbol}{(meta.currentPrice - 2 * data.atr).toFixed(2)}<br />
              <span style={{ color: '#4a4a6a', fontSize: '11px' }}>Risk {data.atrPercent.toFixed(1)}% — {(data.atrPercent * 2).toFixed(1)}% per trade</span>
            </p>
          </div>
        </div>
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {meta.companyName} moves an average of {meta.currencySymbol}{data.atr.toFixed(2)} ({data.atrPercent.toFixed(1)}%) per trading day.{' '}
            {data.atrPercent > 5
              ? 'This is high daily volatility — the stock makes large moves regularly. Wider stops are needed and position sizing should be smaller.'
              : data.atrPercent > 2
              ? 'This is moderate daily volatility — typical for growth stocks. Use ATR to set stop-loss distances.'
              : 'This is low daily volatility — the stock moves slowly. More suitable for conservative strategies.'}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowATRLearn(v => !v)}>
          {showATRLearn ? '▲' : '▼'} How ATR works
        </button>
        {showATRLearn && (
          <div style={collapsibleContentStyle}>
            Average True Range (ATR) measures the average daily price range over 14 days, accounting for overnight gaps. It quantifies volatility in absolute terms (not percentage). Traders use ATR to set stop-loss levels: a 1×ATR stop is tight, 2×ATR is standard, 3×ATR is wide. Higher ATR = more volatile stock = wider stops needed = smaller position size for the same dollar risk. ATR doesn&apos;t indicate direction, only magnitude of movement.
          </div>
        )}
      </div>
    </div>
  );
}

// React import needed for useState
import React from 'react';
