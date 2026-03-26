'use client';

import React from 'react';
import {
  AreaChart, Area, LineChart, Line, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { C, T, styles } from '@/lib/designTokens';

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

const sectionStyle = { marginBottom: '40px' };
const sectionTitleStyle = {
  fontSize: '10px', fontFamily: T.MONO, color: C.TEXT3,
  letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '20px',
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

  const rsiColor = data.rsiLabel === 'Overbought' ? C.RED : data.rsiLabel === 'Oversold' ? C.GREEN : C.NEUTRAL;
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
    <div style={{ fontFamily: T.BODY }}>
      {/* Summary */}
      <div style={{ ...styles.card, marginBottom: '40px' }}>
        <p style={styles.insightLabel}>Price Intelligence Summary</p>
        <p style={{ fontFamily: T.BODY, fontSize: '14px', color: C.TEXT2, lineHeight: 1.7 }}>
          {summaryParts.join(' ')} The 52-week range position is at the{' '}
          <span style={{ color: C.CYAN, fontFamily: T.MONO }}>{data.weekRange52Position.toFixed(0)}th</span> percentile.
          ATR is{' '}
          <span style={{ color: C.CYAN, fontFamily: T.MONO }}>
            {meta.currencySymbol}{data.atr.toFixed(2)} ({data.atrPercent.toFixed(1)}%)
          </span>{' '}
          of current price.
        </p>
      </div>

      {/* 1. RSI */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>RSI — Relative Strength Index</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.MONO, fontSize: '2.5rem', fontWeight: 700, color: rsiColor }}>{data.rsi}</span>
          <span style={styles.badge(rsiColor)}>{data.rsiLabel}</span>
        </div>
        {data.rsiHistory.length > 0 && (
          <div style={{ background: C.SURFACE, padding: '16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.rsiHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={rsiColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={rsiColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={xInterval} />
                <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown) => [(v as number).toFixed(1), 'RSI']} />
                <ReferenceLine y={70} stroke={C.RED + '60'} strokeDasharray="4 3" />
                <ReferenceLine y={30} stroke={C.GREEN + '60'} strokeDasharray="4 3" />
                <Area type="monotone" dataKey="value" stroke={rsiColor} strokeWidth={2} fill="url(#rsiGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.rsi > 70
              ? `RSI at ${data.rsi} suggests ${meta.companyName} may be overbought. Momentum is stretched — watch for a pullback or consolidation before adding positions.`
              : data.rsi < 30
              ? `RSI at ${data.rsi} suggests ${meta.companyName} may be oversold. Selling pressure may be exhausted — this zone can precede a bounce, but confirm with price action.`
              : `RSI at ${data.rsi} is in neutral territory. Neither overbought nor oversold — momentum is balanced and no extreme signal is present.`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowRsiLearn(v => !v)}>
          {showRsiLearn ? '▲' : '▼'} How RSI works
        </button>
        {showRsiLearn && (
          <div style={styles.collapsibleContent}>
            RSI (Relative Strength Index) measures the speed and magnitude of recent price changes on a 0–100 scale. It compares average gains vs average losses over 14 trading days. Readings above 70 suggest overbought conditions (strong upward momentum, potential for reversal), while readings below 30 suggest oversold conditions (heavy selling, potential for bounce). RSI works best in ranging markets and should be combined with trend analysis.
          </div>
        )}
      </div>

      {/* 2. Moving Averages */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Moving Averages</p>
        <div style={{ display: 'flex', gap: '1px', marginBottom: '20px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <div style={{ background: C.SURFACE, padding: '16px 20px', minWidth: '140px' }}>
            <p style={styles.metricLabel}>MA 50</p>
            <p style={{ fontFamily: T.MONO, fontSize: '1.4rem', color: C.GOLD, fontWeight: 600 }}>
              {meta.currencySymbol}{data.ma50.toFixed(2)}
            </p>
          </div>
          <div style={{ background: C.SURFACE, padding: '16px 20px', minWidth: '140px' }}>
            <p style={styles.metricLabel}>MA 200</p>
            <p style={{ fontFamily: T.MONO, fontSize: '1.4rem', color: C.ORANGE, fontWeight: 600 }}>
              {meta.currencySymbol}{data.ma200.toFixed(2)}
            </p>
          </div>
          <div style={{ background: C.SURFACE, padding: '16px 20px', minWidth: '160px' }}>
            <p style={styles.metricLabel}>Price vs MA200</p>
            <p style={{ fontFamily: T.MONO, fontSize: '1.1rem', color: data.ma200Label === 'Above' ? C.GREEN : C.RED, fontWeight: 600 }}>
              {data.ma200Label} ({data.ma200PercentDiff > 0 ? '+' : ''}{data.ma200PercentDiff.toFixed(1)}%)
            </p>
          </div>
          {data.crossSignal !== 'None' && (
            <div style={{ background: C.SURFACE, padding: '16px 20px', minWidth: '140px' }}>
              <p style={styles.metricLabel}>Cross Signal</p>
              <span style={styles.badge(data.crossSignal === 'Golden Cross' ? C.GOLD : C.RED)}>{data.crossSignal}</span>
            </div>
          )}
        </div>
        {data.maHistory.length > 0 && (
          <div style={{ background: C.SURFACE, padding: '16px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.maHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.maHistory.length / 6)} />
                <YAxis tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${meta.currencySymbol}${v.toFixed(0)}`} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [`${meta.currencySymbol}${(v as number).toFixed(2)}`, name as string]} />
                <Legend content={() => (
                  <div style={{ paddingTop: '12px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    {[[C.CYAN, 'Price'], [C.GOLD, 'MA50'], [C.ORANGE, 'MA200']].map(([c, l]) => (
                      <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, display: 'inline-block' }} />
                        <span style={{ color: C.TEXT2, fontSize: '11px', fontFamily: T.MONO }}>{l}</span>
                      </span>
                    ))}
                  </div>
                )} />
                <Line type="monotone" dataKey="price" stroke={C.CYAN} strokeWidth={1.5} dot={false} isAnimationActive={false} name="Price" />
                <Line type="monotone" dataKey="ma50" stroke={C.GOLD} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls name="MA50" />
                <Line type="monotone" dataKey="ma200" stroke={C.ORANGE} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls name="MA200" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {meta.companyName}&apos;s price is {data.ma200Label.toLowerCase()} the 200-day moving average by {Math.abs(data.ma200PercentDiff)}%.{' '}
            {data.ma200Label === 'Above'
              ? 'This confirms a long-term uptrend — prices staying above MA200 is a sign of structural strength.'
              : 'Prices below the 200-day MA indicate long-term bearish pressure. A sustained reclaim of MA200 would be bullish.'}
            {data.crossSignal === 'Golden Cross' && ' A Golden Cross recently formed — the 50-day MA crossed above the 200-day, historically a bullish signal.'}
            {data.crossSignal === 'Death Cross' && ' A Death Cross recently formed — the 50-day MA crossed below the 200-day, historically a bearish signal.'}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowMALearn(v => !v)}>
          {showMALearn ? '▲' : '▼'} How Moving Averages work
        </button>
        {showMALearn && (
          <div style={styles.collapsibleContent}>
            Moving averages smooth price data to reveal trends. The MA50 tracks the average closing price over 50 days (medium-term trend), while MA200 covers 200 days (long-term trend). When MA50 crosses above MA200, it&apos;s called a Golden Cross — historically bullish. The reverse (Death Cross) is bearish. Price above MA200 typically signals an uptrend; below signals a downtrend. Traders use these as dynamic support/resistance levels.
          </div>
        )}
      </div>

      {/* 3. Bollinger Bands */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Bollinger Bands</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.MONO, fontSize: '13px', color: C.TEXT2 }}>Position:</span>
          <span style={styles.badge(
            data.bollingerPosition.includes('Upper') ? C.RED : data.bollingerPosition.includes('Lower') ? C.GREEN : C.NEUTRAL
          )}>{data.bollingerPosition}</span>
        </div>
        {data.bollingerBands.length > 0 && (
          <div style={{ background: C.SURFACE, padding: '16px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.bollingerBands} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="bbBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.VIOLET} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.VIOLET} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.bollingerBands.length / 6)} />
                <YAxis tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${meta.currencySymbol}${v.toFixed(0)}`} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [`${meta.currencySymbol}${(v as number).toFixed(2)}`, name as string]} />
                <Area type="monotone" dataKey="upper" stroke={C.VIOLET} strokeWidth={1} fill="url(#bbBand)" dot={false} isAnimationActive={false} name="Upper" />
                <Area type="monotone" dataKey="lower" stroke={C.VIOLET} strokeWidth={1} fill={C.BG + '80'} dot={false} isAnimationActive={false} name="Lower" />
                <Line type="monotone" dataKey="middle" stroke={C.VIOLET} strokeWidth={1} strokeDasharray="4 4" dot={false} isAnimationActive={false} name="Middle" />
                <Line type="monotone" dataKey="price" stroke={C.CYAN} strokeWidth={2} dot={false} isAnimationActive={false} name="Price" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
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
        <button style={styles.collapsibleBtn} onClick={() => setShowBBLearn(v => !v)}>
          {showBBLearn ? '▲' : '▼'} How Bollinger Bands work
        </button>
        {showBBLearn && (
          <div style={styles.collapsibleContent}>
            Bollinger Bands consist of three lines: a 20-day moving average (middle), and upper/lower bands set 2 standard deviations above/below. About 95% of price action occurs within the bands. When price touches the upper band, the stock is considered statistically extended (not necessarily overbought). When it touches the lower band, it&apos;s extended to the downside. Band width indicates volatility — wider bands mean higher volatility, narrower bands mean low volatility (often before a breakout).
          </div>
        )}
      </div>

      {/* 4. Volume Analysis */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Volume Analysis</p>
        <div style={{ display: 'flex', gap: '1px', marginBottom: '20px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <div style={{ background: C.SURFACE, padding: '14px 18px' }}>
            <p style={styles.metricLabel}>Latest Volume</p>
            <p style={{ fontFamily: T.MONO, fontSize: '1.3rem', color: C.TEXT, fontWeight: 600 }}>{formatVolume(data.latestVolume)}</p>
          </div>
          <div style={{ background: C.SURFACE, padding: '14px 18px' }}>
            <p style={styles.metricLabel}>Avg Volume (30d)</p>
            <p style={{ fontFamily: T.MONO, fontSize: '1.3rem', color: C.TEXT, fontWeight: 600 }}>{formatVolume(data.avgVolume30d)}</p>
          </div>
          <div style={{ background: C.SURFACE, padding: '14px 18px' }}>
            <p style={styles.metricLabel}>Trend</p>
            <span style={styles.badge(
              data.volumeTrend === 'Increasing' ? C.GREEN : data.volumeTrend === 'Decreasing' ? C.RED : C.NEUTRAL
            )}>{data.volumeTrend}</span>
          </div>
        </div>
        {data.volumeHistory.length > 0 && (
          <div style={{ background: C.SURFACE, padding: '16px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={data.volumeHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.volumeHistory.length / 6)} />
                <YAxis tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} tickFormatter={formatVolume} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [formatVolume(v as number), name as string]} />
                <Bar dataKey="volume" fill={C.CYAN + '99'} name="Volume" isAnimationActive={false} />
                <Line type="monotone" dataKey="avgVolume" stroke={C.ORANGE} strokeWidth={2} dot={false} isAnimationActive={false} name="Avg Volume" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            Volume is {data.volumeTrend.toLowerCase()} compared to recent averages.{' '}
            {data.volumeTrend === 'Increasing'
              ? 'Rising volume confirms the trend — price moves backed by high volume are more reliable and sustainable.'
              : data.volumeTrend === 'Decreasing'
              ? 'Falling volume can signal weakening conviction. Trend moves on low volume are less reliable and more prone to reversal.'
              : 'Volume is stable — no strong directional signal from participation levels.'}
            {' '}The 30-day average is {formatVolume(data.avgVolume30d)} shares/day.
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowVolLearn(v => !v)}>
          {showVolLearn ? '▲' : '▼'} How volume analysis works
        </button>
        {showVolLearn && (
          <div style={styles.collapsibleContent}>
            Volume shows how many shares were traded in a period. High volume during a price move confirms conviction — buyers or sellers are actively engaged. Low volume on a breakout is suspicious. Volume divergence (price rising but volume falling) can signal a weakening trend. The 20-day moving average of volume provides a baseline — days above average indicate heightened interest.
          </div>
        )}
      </div>

      {/* 5. Support & Resistance */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Support &amp; Resistance Levels</p>
        {data.supportResistance.length === 0 ? (
          <p style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '13px' }}>No clear levels detected in recent 90-day range.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.BORDER_FAINT }}>
            {[...data.supportResistance].sort((a, b) => b.level - a.level).map((lvl, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: lvl.type === 'resistance' ? C.RED + '08' : C.GREEN + '08',
                borderLeft: `3px solid ${lvl.type === 'resistance' ? C.RED + '50' : C.GREEN + '50'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '15px', fontFamily: T.MONO, fontWeight: 600, color: lvl.type === 'resistance' ? C.RED : C.GREEN }}>
                    {meta.currencySymbol}{lvl.level.toFixed(2)}
                  </span>
                  <span style={styles.badge(lvl.type === 'resistance' ? C.RED : C.GREEN)}>{lvl.type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={styles.badge(lvl.strength === 'strong' ? C.GOLD : lvl.strength === 'moderate' ? C.NEUTRAL : C.TEXT2)}>{lvl.strength}</span>
                  <span style={{ fontSize: '12px', color: C.TEXT2, fontFamily: T.MONO }}>
                    {((Math.abs(lvl.level - meta.currentPrice) / meta.currentPrice) * 100).toFixed(1)}% away
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            Support levels are price zones where buying historically emerged (green). Resistance levels are where sellers historically appeared (red). The closer and stronger a level, the more likely the stock pauses or reverses near it.{' '}
            {data.supportResistance.filter(l => l.type === 'support').length > 0
              ? `Nearest support is at ${meta.currencySymbol}${Math.max(...data.supportResistance.filter(l => l.type === 'support').map(l => l.level)).toFixed(2)}.`
              : ''}{' '}
            {data.supportResistance.filter(l => l.type === 'resistance').length > 0
              ? `Nearest resistance is at ${meta.currencySymbol}${Math.min(...data.supportResistance.filter(l => l.type === 'resistance').map(l => l.level)).toFixed(2)}.`
              : ''}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowSRLearn(v => !v)}>
          {showSRLearn ? '▲' : '▼'} How support &amp; resistance works
        </button>
        {showSRLearn && (
          <div style={styles.collapsibleContent}>
            Support and resistance are price zones where supply and demand have historically balanced. Support forms where buyers stepped in repeatedly — the price bounced off this level multiple times. Resistance forms where sellers appeared repeatedly. These levels act as price magnets. &quot;Strong&quot; levels have more touches and are more significant. When price breaks through a resistance level, that resistance often becomes new support (role reversal).
          </div>
        )}
      </div>

      {/* 6. 52-Week Range */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>52-Week Range</p>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', height: '6px', background: `linear-gradient(to right, ${C.RED}40, ${C.GOLD}40, ${C.GREEN}40)`, margin: '16px 0 10px' }}>
            <div style={{ position: 'absolute', left: `${clamp52}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '14px', height: '14px', background: C.CYAN, borderRadius: '50%', boxShadow: `0 0 8px ${C.CYAN}80` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: T.MONO }}>
            <span style={{ color: C.RED }}>L {meta.currencySymbol}{data.low52.toFixed(2)}</span>
            <span style={{ color: C.CYAN }}>{clamp52.toFixed(0)}th percentile</span>
            <span style={{ color: C.GREEN }}>H {meta.currencySymbol}{data.high52.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <div style={{ background: C.SURFACE, padding: '14px 18px', flex: 1, minWidth: '120px' }}>
            <p style={styles.metricLabel}>Distance from High</p>
            <p style={{ fontFamily: T.MONO, fontSize: '1.2rem', color: C.RED, fontWeight: 600 }}>
              -{((data.high52 - meta.currentPrice) / data.high52 * 100).toFixed(1)}%
            </p>
          </div>
          <div style={{ background: C.SURFACE, padding: '14px 18px', flex: 1, minWidth: '120px' }}>
            <p style={styles.metricLabel}>Distance from Low</p>
            <p style={{ fontFamily: T.MONO, fontSize: '1.2rem', color: C.GREEN, fontWeight: 600 }}>
              +{((meta.currentPrice - data.low52) / data.low52 * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            At the {clamp52.toFixed(0)}th percentile of its 52-week range, {meta.companyName} is{' '}
            {clamp52 > 75 ? 'trading near its yearly highs — strong recent performance but watch for resistance near the top.' :
             clamp52 < 25 ? 'trading near its yearly lows — weak recent performance. May be undervalued or facing headwinds.' :
             'in the middle of its yearly range — no extreme position.'}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShow52Learn(v => !v)}>
          {show52Learn ? '▲' : '▼'} How 52-week range works
        </button>
        {show52Learn && (
          <div style={styles.collapsibleContent}>
            The 52-week range shows the highest and lowest prices over the past year. Position within this range tells you where current price sits relative to its recent history. Near the high suggests strong momentum but potential resistance. Near the low suggests weakness but potential value. The percentile position (0–100) normalizes this: 100 = at the 52-week high, 0 = at the 52-week low.
          </div>
        )}
      </div>

      {/* 7. ATR & Volatility */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>ATR &amp; Daily Volatility</p>
        <div style={{ display: 'flex', gap: '1px', marginBottom: '20px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <div style={{ background: C.SURFACE, padding: '20px 24px', flex: 1, minWidth: '160px' }}>
            <p style={styles.metricLabel}>ATR (14-day)</p>
            <p style={{ fontFamily: T.MONO, fontSize: '2rem', color: C.TEXT, fontWeight: 600, lineHeight: 1 }}>
              {meta.currencySymbol}{data.atr.toFixed(2)}
            </p>
            <p style={{ fontFamily: T.MONO, fontSize: '12px', color: C.TEXT3, marginTop: '8px' }}>
              {data.atrPercent.toFixed(1)}% of price per day
            </p>
          </div>
          <div style={{ background: C.SURFACE, padding: '20px 24px', flex: 1, minWidth: '200px' }}>
            <p style={styles.metricLabel}>Risk Sizing Helper</p>
            <p style={{ fontFamily: T.MONO, fontSize: '13px', color: C.TEXT2, lineHeight: 1.6 }}>
              1x ATR stop: {meta.currencySymbol}{(meta.currentPrice - data.atr).toFixed(2)}<br />
              2x ATR stop: {meta.currencySymbol}{(meta.currentPrice - 2 * data.atr).toFixed(2)}<br />
              <span style={{ color: C.TEXT3, fontSize: '11px' }}>Risk {data.atrPercent.toFixed(1)}% — {(data.atrPercent * 2).toFixed(1)}% per trade</span>
            </p>
          </div>
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {meta.companyName} moves an average of {meta.currencySymbol}{data.atr.toFixed(2)} ({data.atrPercent.toFixed(1)}%) per trading day.{' '}
            {data.atrPercent > 5
              ? 'This is high daily volatility — the stock makes large moves regularly. Wider stops are needed and position sizing should be smaller.'
              : data.atrPercent > 2
              ? 'This is moderate daily volatility — typical for growth stocks. Use ATR to set stop-loss distances.'
              : 'This is low daily volatility — the stock moves slowly. More suitable for conservative strategies.'}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowATRLearn(v => !v)}>
          {showATRLearn ? '▲' : '▼'} How ATR works
        </button>
        {showATRLearn && (
          <div style={styles.collapsibleContent}>
            Average True Range (ATR) measures the average daily price range over 14 days, accounting for overnight gaps. It quantifies volatility in absolute terms (not percentage). Traders use ATR to set stop-loss levels: a 1×ATR stop is tight, 2×ATR is standard, 3×ATR is wide. Higher ATR = more volatile stock = wider stops needed = smaller position size for the same dollar risk. ATR doesn&apos;t indicate direction, only magnitude of movement.
          </div>
        )}
      </div>
    </div>
  );
}
