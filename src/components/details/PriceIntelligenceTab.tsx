/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { C, T, TYPE, styles } from '@/lib/designTokens';

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

function Collapsible({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={styles.collapsibleBtn}>
        <span style={{ color: C.CYAN }}>{open ? '▾' : '▸'}</span> {label}
      </button>
      {open && <div style={styles.collapsibleContent}>{children}</div>}
    </div>
  );
}

function fmtVol(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export default function PriceIntelligenceTab({ data, meta }: PriceIntelligenceTabProps) {
  const rsiColor = data.rsiLabel === 'Overbought' ? C.RED
                 : data.rsiLabel === 'Oversold'   ? C.GREEN
                 : C.NEUTRAL;

  const bollingerColor = data.bollingerPosition.includes('Upper') ? C.RED
                       : data.bollingerPosition.includes('Lower') ? C.GREEN
                       : C.NEUTRAL;

  const volumeColor = data.volumeTrend === 'Increasing' ? C.GREEN
                    : data.volumeTrend === 'Decreasing' ? C.RED
                    : C.NEUTRAL;

  const clamp52   = Math.min(100, Math.max(0, data.weekRange52Position));
  const xInterval = Math.max(1, Math.floor((data.rsiHistory.length - 1) / 5));
  const volVsAvg  = data.avgVolume30d > 0
    ? ((data.latestVolume - data.avgVolume30d) / data.avgVolume30d * 100)
    : 0;

  return (
    <div style={{ fontFamily: T.BODY, color: C.TEXT }}>

      {/* ── BREADCRUMB ── */}
      <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '8px' }}>
        PRICE INTELLIGENCE // {meta.companyName.toUpperCase()}
      </p>

      {/* ── H2 ── */}
      <h2 style={{ ...TYPE.DISPLAY_MD, color: C.TEXT, marginBottom: '20px' }}>
        Technical Overview
      </h2>

      {/* ── PAGE SUMMARY ── */}
      <div style={styles.insightBox}>
        <p style={styles.insightText}>
          RSI at{' '}
          <span style={{ ...TYPE.DATA_SM, color: rsiColor }}>{data.rsi}</span> is{' '}
          <span style={{ color: rsiColor }}>{data.rsiLabel.toLowerCase()}</span>. Price is{' '}
          <span style={{ color: data.ma200Label === 'Above' ? C.GREEN : C.RED }}>{data.ma200Label.toLowerCase()}</span>{' '}
          the 200-day MA by{' '}
          <span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>{Math.abs(data.ma200PercentDiff)}%</span>.{' '}
          {data.crossSignal !== 'None' && (
            <span style={{ color: data.crossSignal === 'Golden Cross' ? C.GOLD : C.RED }}>
              {data.crossSignal} detected.{' '}
            </span>
          )}
          Bollinger position:{' '}
          <span style={{ color: bollingerColor }}>{data.bollingerPosition.toLowerCase()}</span>.{' '}
          Volume trend is{' '}
          <span style={{ color: volumeColor }}>{data.volumeTrend.toLowerCase()}</span>.{' '}
          52-week range at the{' '}
          <span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>{data.weekRange52Position.toFixed(0)}th</span> percentile.
        </p>
      </div>

      {/* ── STAT STRIP ── */}
      <div style={{ display: 'flex', gap: '1px', background: C.BORDER_FAINT, margin: '24px 0 48px', flexWrap: 'wrap' }}>
        {([
          { label: 'RSI',          value: String(data.rsi),                                color: rsiColor },
          { label: 'MA200 STATUS', value: data.ma200Label,                                 color: data.ma200Label === 'Above' ? C.GREEN : C.RED },
          { label: 'BOLLINGER',    value: data.bollingerPosition,                          color: bollingerColor },
          { label: 'VOLUME TREND', value: data.volumeTrend,                                color: volumeColor },
          { label: '52W POSITION', value: `${data.weekRange52Position.toFixed(0)}th %ile`, color: C.CYAN },
        ] as { label: string; value: string; color: string }[]).map(({ label, value, color }) => (
          <div key={label} style={{ background: C.SURFACE, padding: '16px 20px', flex: '1 1 100px' }}>
            <p style={styles.metricLabel}>{label}</p>
            <p style={{ ...TYPE.DATA_LG, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 1 — RSI DEEP DIVE
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '48px' }}>
        <p style={styles.sectionLabel}>RSI — Relative Strength Index</p>

        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>

            {/* Left: value + badge + insight */}
            <div style={{ padding: '32px 28px', borderRight: `1px solid ${C.BORDER}` }}>
              <p style={{ ...TYPE.DATA_HERO, fontSize: '5rem', color: rsiColor, lineHeight: 1, marginBottom: '12px' }}>
                {data.rsi}
              </p>
              <span style={styles.badge(rsiColor)}>{data.rsiLabel}</span>
              <div style={{ ...styles.insightBox, marginTop: '20px' }}>
                <p style={styles.insightText}>
                  {data.rsi > 70
                    ? `Momentum is stretched at ${data.rsi}. Watch for a pullback or consolidation before adding positions.`
                    : data.rsi < 30
                    ? `Selling pressure may be exhausted at ${data.rsi}. This zone can precede a bounce — confirm with price action.`
                    : `Balanced momentum at ${data.rsi}. No extreme signal is present.`}
                </p>
              </div>
            </div>

            {/* Right: chart */}
            <div style={{ padding: '24px', background: C.BG }}>
              {data.rsiHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.rsiHistory} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={rsiColor} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={rsiColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={C.BORDER_FAINT} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={xInterval} />
                    <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                    <Tooltip {...styles.tooltipStyle} formatter={(v: unknown) => [(v as number).toFixed(1), 'RSI']} />
                    <ReferenceLine y={70} stroke={`${C.RED}60`}   strokeDasharray="4 3" />
                    <ReferenceLine y={30} stroke={`${C.GREEN}60`} strokeDasharray="4 3" />
                    <Area type="monotone" dataKey="value" stroke={rsiColor} strokeWidth={2} fill="url(#rsiGrad)" dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px' }}>
                  <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>NO RSI DATA</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Collapsible label="How RSI works">
          RSI (Relative Strength Index) measures the speed and magnitude of recent price changes on a 0–100 scale. It compares average gains vs average losses over 14 trading days. Readings above 70 suggest overbought conditions; below 30 suggest oversold conditions. RSI works best in ranging markets and should be combined with trend analysis.
        </Collapsible>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — MOVING AVERAGES
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '48px' }}>
        <p style={styles.sectionLabel}>Moving Averages</p>

        {/* Metric row */}
        <div style={{ display: 'flex', gap: '1px', background: C.BORDER_FAINT, marginBottom: '16px', flexWrap: 'wrap' }}>
          {([
            { label: 'CURRENT PRICE', value: `${meta.currencySymbol}${meta.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: C.TEXT },
            { label: 'MA 50',         value: `${meta.currencySymbol}${data.ma50.toFixed(2)}`,  color: C.GOLD },
            { label: 'MA 200',        value: `${meta.currencySymbol}${data.ma200.toFixed(2)}`, color: C.ORANGE },
            { label: 'VS MA200',      value: `${data.ma200PercentDiff > 0 ? '+' : ''}${data.ma200PercentDiff.toFixed(1)}%`, color: data.ma200Label === 'Above' ? C.GREEN : C.RED },
          ] as { label: string; value: string; color: string }[]).map(({ label, value, color }) => (
            <div key={label} style={{ background: C.SURFACE, padding: '16px 20px', flex: '1 1 100px' }}>
              <p style={styles.metricLabel}>{label}</p>
              <p style={{ ...TYPE.DATA_MD, color }}>{value}</p>
            </div>
          ))}
          {data.crossSignal !== 'None' && (
            <div style={{ background: C.SURFACE, padding: '16px 20px', flex: '1 1 100px' }}>
              <p style={styles.metricLabel}>CROSS SIGNAL</p>
              <span style={styles.badge(data.crossSignal === 'Golden Cross' ? C.GOLD : C.RED)}>
                {data.crossSignal}
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        {data.maHistory.length > 0 && (
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {([[C.CYAN, 'Price'], [C.GOLD, 'MA50'], [C.ORANGE, 'MA200']] as [string, string][]).map(([c, l]) => (
                <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '16px', height: '2px', background: c, display: 'inline-block' }} />
                  <span style={{ ...TYPE.LABEL_SM, color: C.TEXT2 }}>{l}</span>
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.maHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.maHistory.length / 6)} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${meta.currencySymbol}${(v as number).toFixed(0)}`} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [`${meta.currencySymbol}${(v as number).toFixed(2)}`, name as string]} />
                <Line type="monotone" dataKey="price"  stroke={C.CYAN}   strokeWidth={1.5} dot={false} isAnimationActive={false} name="Price" />
                <Line type="monotone" dataKey="ma50"   stroke={C.GOLD}   strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls name="MA50" />
                <Line type="monotone" dataKey="ma200"  stroke={C.ORANGE} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls name="MA200" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={styles.insightBox}>
          <p style={styles.insightText}>
            {meta.companyName}{"'"}s price is{' '}
            <span style={{ color: data.ma200Label === 'Above' ? C.GREEN : C.RED }}>{data.ma200Label.toLowerCase()}</span>{' '}
            the 200-day MA by {Math.abs(data.ma200PercentDiff)}%.{' '}
            {data.ma200Label === 'Above'
              ? 'This confirms a long-term uptrend — structural strength.'
              : 'Prices below MA200 indicate long-term bearish pressure.'}
            {data.crossSignal === 'Golden Cross' && ' A Golden Cross recently formed — historically bullish.'}
            {data.crossSignal === 'Death Cross'  && ' A Death Cross recently formed — historically bearish.'}
          </p>
        </div>

        <Collapsible label="How Moving Averages work">
          The MA50 tracks the average closing price over 50 days (medium-term trend), MA200 over 200 days (long-term trend). A Golden Cross (MA50 above MA200) is historically bullish; a Death Cross is bearish. Price above MA200 signals an uptrend; below signals a downtrend. Traders use these as dynamic support and resistance levels.
        </Collapsible>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — BOLLINGER BANDS
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '48px' }}>
        <p style={styles.sectionLabel}>Bollinger Bands</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h3 style={{ ...TYPE.DISPLAY_SM, color: C.TEXT, margin: 0 }}>Position</h3>
          <span style={styles.badge(bollingerColor)}>{data.bollingerPosition}</span>
        </div>

        {data.bollingerBands.length > 0 && (
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '24px', marginBottom: '16px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.bollingerBands} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="bbBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.VIOLET} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.VIOLET} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.bollingerBands.length / 6)} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${meta.currencySymbol}${(v as number).toFixed(0)}`} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [`${meta.currencySymbol}${(v as number).toFixed(2)}`, name as string]} />
                <Area type="monotone" dataKey="upper"  stroke={C.VIOLET} strokeWidth={1} fill="url(#bbBand)"    dot={false} isAnimationActive={false} name="Upper" />
                <Area type="monotone" dataKey="lower"  stroke={C.VIOLET} strokeWidth={1} fill={`${C.BG}80`}    dot={false} isAnimationActive={false} name="Lower" />
                <Line type="monotone" dataKey="middle" stroke={C.VIOLET} strokeWidth={1} strokeDasharray="4 4" dot={false} isAnimationActive={false} name="Middle" />
                <Line type="monotone" dataKey="price"  stroke={C.CYAN}   strokeWidth={2}                       dot={false} isAnimationActive={false} name="Price" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={styles.insightBox}>
          <p style={styles.insightText}>
            Price is currently{' '}
            <span style={{ color: bollingerColor }}>{data.bollingerPosition.toLowerCase()}</span>.{' '}
            {data.bollingerPosition === 'Above Upper Band' ? 'Strong momentum, but statistically extended. Watch for mean reversion.'
             : data.bollingerPosition === 'Near Upper Band'  ? 'Approaching the upper band — momentum strong but may face resistance here.'
             : data.bollingerPosition === 'Below Lower Band' ? 'Selling pressure is intense. Could signal panic or a reversal setup.'
             : data.bollingerPosition === 'Near Lower Band'  ? 'Near the lower band — oversold pressure building. May bounce toward the middle.'
             : 'Within the bands in normal range. No extreme volatility signal.'}
          </p>
        </div>

        <Collapsible label="How Bollinger Bands work">
          Bollinger Bands consist of a 20-day moving average (middle) and upper/lower bands set 2 standard deviations away. About 95% of price action occurs within the bands. Band width indicates volatility — wider bands mean higher volatility, narrower bands often precede a breakout.
        </Collapsible>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — VOLUME ANALYSIS
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '48px' }}>
        <p style={styles.sectionLabel}>Volume Analysis</p>

        {/* Metric row */}
        <div style={{ display: 'flex', gap: '1px', background: C.BORDER_FAINT, marginBottom: '16px', flexWrap: 'wrap' }}>
          {([
            { label: 'LATEST VOLUME', value: fmtVol(data.latestVolume),                                          color: C.TEXT },
            { label: '30D AVG',       value: fmtVol(data.avgVolume30d),                                          color: C.TEXT2 },
            { label: 'VS AVERAGE',    value: `${volVsAvg >= 0 ? '+' : ''}${volVsAvg.toFixed(1)}%`,              color: volVsAvg >= 0 ? C.GREEN : C.RED },
            { label: 'TREND',         value: data.volumeTrend,                                                    color: volumeColor },
          ] as { label: string; value: string; color: string }[]).map(({ label, value, color }) => (
            <div key={label} style={{ background: C.SURFACE, padding: '16px 20px', flex: '1 1 100px' }}>
              <p style={styles.metricLabel}>{label}</p>
              <p style={{ ...TYPE.DATA_MD, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {data.volumeHistory.length > 0 && (
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '24px', marginBottom: '16px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={data.volumeHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.volumeHistory.length / 6)} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} tickFormatter={fmtVol} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [fmtVol(v as number), name as string]} />
                <Bar  dataKey="volume"    fill={`${C.CYAN}99`} name="Volume"     isAnimationActive={false} />
                <Line dataKey="avgVolume" stroke={C.ORANGE} strokeWidth={2} dot={false} isAnimationActive={false} name="Avg Volume" type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={styles.insightBox}>
          <p style={styles.insightText}>
            Volume is{' '}
            <span style={{ color: volumeColor }}>{data.volumeTrend.toLowerCase()}</span>{' '}
            compared to recent averages.{' '}
            {data.volumeTrend === 'Increasing'
              ? 'Rising volume confirms the trend — price moves backed by high volume are more reliable.'
              : data.volumeTrend === 'Decreasing'
              ? 'Falling volume signals weakening conviction. Low-volume moves are more prone to reversal.'
              : 'Volume is stable — no strong directional signal from participation levels.'}
            {' '}30-day average: {fmtVol(data.avgVolume30d)} shares/day.
          </p>
        </div>

        <Collapsible label="How volume analysis works">
          Volume shows how many shares were traded in a period. High volume during a price move confirms conviction — buyers or sellers are actively engaged. Volume divergence (price rising but volume falling) can signal a weakening trend. The 30-day moving average provides a baseline — days above average indicate heightened interest.
        </Collapsible>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 5 — SUPPORT & RESISTANCE
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '48px' }}>
        <p style={styles.sectionLabel}>Support &amp; Resistance Levels</p>

        {data.supportResistance.length === 0 ? (
          <p style={{ ...TYPE.DATA_SM, color: C.TEXT2, marginBottom: '16px' }}>
            No clear levels detected in recent 90-day range.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.BORDER_FAINT, marginBottom: '16px' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', background: C.ELEVATED, padding: '10px 20px' }}>
              {(['TYPE', 'LEVEL', 'STRENGTH', 'DIST.'] as const).map((h, i) => (
                <span key={h} style={{ ...TYPE.LABEL_SM, color: C.TEXT3, textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>

            {/* Current price marker */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr',
              background: C.CYAN + '08', padding: '12px 20px',
              borderLeft: `3px solid ${C.CYAN}`,
            }}>
              <span style={{ ...TYPE.LABEL_SM, color: C.CYAN }}>CURRENT</span>
              <span style={{ ...TYPE.DATA_MD, color: C.CYAN, textAlign: 'right' }}>
                {meta.currencySymbol}{meta.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span style={{ ...TYPE.LABEL_SM, color: C.CYAN, textAlign: 'right' }}>—</span>
              <span style={{ ...TYPE.LABEL_SM, color: C.CYAN, textAlign: 'right' }}>—</span>
            </div>

            {/* Level rows */}
            {[...data.supportResistance].sort((a, b) => b.level - a.level).map((lvl, i) => {
              const color   = lvl.type === 'resistance' ? C.RED : C.GREEN;
              const pctAway = ((Math.abs(lvl.level - meta.currentPrice) / meta.currentPrice) * 100).toFixed(1);
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', background: C.SURFACE, padding: '12px 20px' }}>
                  <span><span style={styles.badge(color)}>{lvl.type.toUpperCase()}</span></span>
                  <span style={{ ...TYPE.DATA_MD, color, textAlign: 'right' }}>
                    {meta.currencySymbol}{lvl.level.toFixed(2)}
                  </span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={styles.badge(C.TEXT3)}>{lvl.strength}</span>
                  </span>
                  <span style={{ ...TYPE.LABEL_SM, color: C.TEXT2, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {pctAway}% away
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={styles.insightBox}>
          <p style={styles.insightText}>
            Support levels (green) are zones where buying historically emerged; resistance (red) where sellers appeared. The closer and stronger a level, the more likely the stock pauses or reverses near it.{' '}
            {data.supportResistance.filter(l => l.type === 'support').length > 0 &&
              `Nearest support: ${meta.currencySymbol}${Math.max(...data.supportResistance.filter(l => l.type === 'support').map(l => l.level)).toFixed(2)}. `}
            {data.supportResistance.filter(l => l.type === 'resistance').length > 0 &&
              `Nearest resistance: ${meta.currencySymbol}${Math.min(...data.supportResistance.filter(l => l.type === 'resistance').map(l => l.level)).toFixed(2)}.`}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 6 — 52-WEEK RANGE
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '48px' }}>
        <p style={styles.sectionLabel}>52-Week Range</p>

        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px', marginBottom: '16px' }}>
          {/* Gradient bar */}
          <div style={{ position: 'relative', height: '6px', background: `linear-gradient(to right, ${C.RED}40, ${C.GOLD}40, ${C.GREEN}40)`, margin: '8px 0 12px' }}>
            <div style={{
              position: 'absolute', left: `${clamp52}%`, top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '14px', height: '14px',
              background: C.CYAN, borderRadius: '50%',
              boxShadow: `0 0 8px ${C.CYAN}80`,
            }} />
          </div>
          {/* From / to labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ ...TYPE.LABEL_SM, color: C.RED   }}>52W LOW  {meta.currencySymbol}{data.low52.toFixed(2)}</span>
            <span style={{ ...TYPE.LABEL_SM, color: C.CYAN  }}>{clamp52.toFixed(0)}TH PERCENTILE</span>
            <span style={{ ...TYPE.LABEL_SM, color: C.GREEN }}>52W HIGH {meta.currencySymbol}{data.high52.toFixed(2)}</span>
          </div>
          {/* Stat boxes */}
          <div style={{ display: 'flex', gap: '1px', background: C.BORDER_FAINT }}>
            <div style={{ background: C.ELEVATED, padding: '16px 20px', flex: 1 }}>
              <p style={styles.metricLabel}>DISTANCE FROM HIGH</p>
              <p style={{ ...TYPE.DATA_MD, color: C.RED }}>
                -{((data.high52 - meta.currentPrice) / data.high52 * 100).toFixed(1)}%
              </p>
            </div>
            <div style={{ background: C.ELEVATED, padding: '16px 20px', flex: 1 }}>
              <p style={styles.metricLabel}>DISTANCE FROM LOW</p>
              <p style={{ ...TYPE.DATA_MD, color: C.GREEN }}>
                +{((meta.currentPrice - data.low52) / data.low52 * 100).toFixed(1)}%
              </p>
            </div>
            <div style={{ background: C.ELEVATED, padding: '16px 20px', flex: 1 }}>
              <p style={styles.metricLabel}>RANGE POSITION</p>
              <p style={{ ...TYPE.DATA_MD, color: C.CYAN }}>
                {clamp52.toFixed(0)}th %ile
              </p>
            </div>
          </div>
        </div>

        <div style={styles.insightBox}>
          <p style={styles.insightText}>
            At the{' '}
            <span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>{clamp52.toFixed(0)}th</span> percentile of its 52-week range,{' '}
            {meta.companyName} is{' '}
            {clamp52 > 75
              ? 'trading near its yearly highs — strong recent performance but watch for resistance near the top.'
              : clamp52 < 25
              ? 'trading near its yearly lows — weak recent performance. May be undervalued or facing headwinds.'
              : 'in the middle of its yearly range — no extreme position.'}
          </p>
        </div>

        <Collapsible label="How 52-week range works">
          The 52-week range shows the highest and lowest prices over the past year. The percentile position normalises this: 100 = at the 52-week high, 0 = at the 52-week low. Near the high suggests strong momentum but potential resistance; near the low suggests weakness or potential value.
        </Collapsible>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 7 — ATR & DAILY VOLATILITY
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '48px' }}>
        <p style={styles.sectionLabel}>ATR &amp; Daily Volatility</p>

        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, overflow: 'hidden', marginBottom: '16px' }}>
          {/* Two panels */}
          <div style={{ display: 'flex', gap: '1px', background: C.BORDER_FAINT }}>
            {/* Left: ATR value */}
            <div style={{ background: C.ELEVATED, padding: '32px 28px', flex: 1 }}>
              <p style={styles.metricLabel}>ATR (14-DAY)</p>
              <p style={{ ...TYPE.DATA_XL, color: C.GOLD, lineHeight: 1, marginBottom: '8px' }}>
                {meta.currencySymbol}{data.atr.toFixed(2)}
              </p>
              <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>
                {data.atrPercent.toFixed(1)}% OF PRICE PER DAY
              </p>
            </div>
            {/* Right: risk sizing */}
            <div style={{ background: C.ELEVATED, padding: '32px 28px', flex: 2 }}>
              <p style={styles.metricLabel}>RISK SIZING HELPER</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                {([
                  { label: '1× ATR stop', stop: meta.currentPrice - data.atr,         risk: data.atrPercent },
                  { label: '2× ATR stop', stop: meta.currentPrice - 2 * data.atr,     risk: data.atrPercent * 2 },
                  { label: '3× ATR stop', stop: meta.currentPrice - 3 * data.atr,     risk: data.atrPercent * 3 },
                ]).map(({ label, stop, risk }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '8px', borderBottom: `1px solid ${C.BORDER_FAINT}` }}>
                    <span style={{ ...TYPE.DATA_SM, color: C.TEXT3 }}>{label}</span>
                    <span style={{ ...TYPE.DATA_SM, color: C.TEXT, fontWeight: 600 }}>
                      {meta.currencySymbol}{stop.toFixed(2)}{' '}
                      <span style={{ color: C.TEXT3 }}>({risk.toFixed(1)}% risk)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insight inside the card */}
          <div style={{ padding: '24px 28px', borderTop: `1px solid ${C.BORDER}` }}>
            <div style={styles.insightBox}>
              <p style={styles.insightText}>
                {meta.companyName} moves an average of{' '}
                <span style={{ ...TYPE.DATA_SM, color: C.GOLD }}>
                  {meta.currencySymbol}{data.atr.toFixed(2)}
                </span>{' '}
                ({data.atrPercent.toFixed(1)}%) per trading day.{' '}
                {data.atrPercent > 5
                  ? 'High daily volatility — wider stops needed, position sizing should be smaller.'
                  : data.atrPercent > 2
                  ? 'Moderate daily volatility — typical for growth stocks. Use ATR to set stop-loss distances.'
                  : 'Low daily volatility — the stock moves slowly. More suitable for conservative strategies.'}
              </p>
            </div>
          </div>
        </div>

        <Collapsible label="How ATR works">
          Average True Range measures the average daily price range over 14 days, accounting for overnight gaps. It quantifies volatility in absolute terms. Traders use ATR to set stops: 1×ATR is tight, 2×ATR is standard, 3×ATR is wide. Higher ATR = more volatile = wider stops = smaller position size for the same dollar risk. ATR does not indicate direction, only the magnitude of movement.
        </Collapsible>
      </div>

    </div>
  );
}
