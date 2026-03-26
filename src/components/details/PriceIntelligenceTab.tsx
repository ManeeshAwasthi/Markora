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

function InsightBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.insightBox}>
      <p style={styles.insightLabel}>WHAT THIS MEANS</p>
      <p style={styles.insightText}>{children}</p>
    </div>
  );
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
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export default function PriceIntelligenceTab({ data, meta }: PriceIntelligenceTabProps) {
  const rsiColor = data.rsiLabel === 'Overbought' ? C.RED : data.rsiLabel === 'Oversold' ? C.GREEN : C.NEUTRAL;
  const clamp52 = Math.min(100, Math.max(0, data.weekRange52Position));

  const summaryParts: string[] = [];
  summaryParts.push(`RSI is ${data.rsi} (${data.rsiLabel.toLowerCase()}).`);
  summaryParts.push(`Price is ${data.ma200Label.toLowerCase()} the 200-day MA by ${Math.abs(data.ma200PercentDiff)}%.`);
  if (data.crossSignal !== 'None') summaryParts.push(`${data.crossSignal} detected recently.`);
  summaryParts.push(`Bollinger position: ${data.bollingerPosition.toLowerCase()}.`);
  summaryParts.push(`Volume trend is ${data.volumeTrend.toLowerCase()}.`);

  const xInterval = Math.floor((data.rsiHistory.length - 1) / 5);

  return (
    <div style={{ fontFamily: T.BODY, color: C.TEXT }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '12px' }}>
          EQUITY_REPORT // {new Date().getFullYear()}.Q{Math.ceil((new Date().getMonth() + 1) / 3)}
        </p>
        <h2 style={{ ...TYPE.DISPLAY_LG, color: C.TEXT, marginBottom: '4px' }}>
          {meta.companyName}
        </h2>
        <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '20px' }}>
          PRICE INTELLIGENCE // TECHNICAL SIGNALS
        </p>

        {/* Summary prose */}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>PRICE INTELLIGENCE SUMMARY</p>
          <p style={{ ...TYPE.PROSE_MD, color: C.TEXT2 }}>
            {summaryParts.join(' ')} The 52-week range position is at the{' '}
            <span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>{data.weekRange52Position.toFixed(0)}th</span> percentile.
            ATR is{' '}
            <span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>
              {meta.currencySymbol}{data.atr.toFixed(2)} ({data.atrPercent.toFixed(1)}%)
            </span>{' '}
            of current price.
          </p>
        </div>

        {/* 5-stat strip */}
        <div style={{ display: 'flex', gap: '1px', background: C.BORDER_FAINT, marginTop: '1px', flexWrap: 'wrap' }}>
          {[
            { label: 'RSI',          value: String(data.rsi),           color: rsiColor },
            { label: 'MA200',        value: data.ma200Label,            color: data.ma200Label === 'Above' ? C.GREEN : C.RED },
            { label: 'BOLLINGER',    value: data.bollingerPosition,     color: data.bollingerPosition.includes('Upper') ? C.RED : data.bollingerPosition.includes('Lower') ? C.GREEN : C.NEUTRAL },
            { label: 'VOLUME',       value: data.volumeTrend,           color: data.volumeTrend === 'Increasing' ? C.GREEN : data.volumeTrend === 'Decreasing' ? C.RED : C.NEUTRAL },
            { label: '52W POSITION', value: `${data.weekRange52Position.toFixed(0)}th %ile`, color: C.CYAN },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.ELEVATED, padding: '12px 16px', flex: 1, minWidth: '120px' }}>
              <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>{label}</p>
              <p style={{ ...TYPE.DATA_SM, color, fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 1. RSI */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>RSI — Relative Strength Index</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ ...TYPE.DATA_HERO, fontSize: '3.5rem', color: rsiColor }}>{data.rsi}</span>
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
                <CartesianGrid stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={xInterval} />
                <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown) => [(v as number).toFixed(1), 'RSI']} />
                <ReferenceLine y={70} stroke={`${C.RED}60`} strokeDasharray="4 3" />
                <ReferenceLine y={30} stroke={`${C.GREEN}60`} strokeDasharray="4 3" />
                <Area type="monotone" dataKey="value" stroke={rsiColor} strokeWidth={2} fill="url(#rsiGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <InsightBox>
          {data.rsi > 70
            ? `RSI at ${data.rsi} suggests ${meta.companyName} may be overbought. Momentum is stretched — watch for a pullback or consolidation before adding positions.`
            : data.rsi < 30
            ? `RSI at ${data.rsi} suggests ${meta.companyName} may be oversold. Selling pressure may be exhausted — this zone can precede a bounce, but confirm with price action.`
            : `RSI at ${data.rsi} is in neutral territory. Neither overbought nor oversold — momentum is balanced and no extreme signal is present.`}
        </InsightBox>
        <Collapsible label="How RSI works">
          RSI (Relative Strength Index) measures the speed and magnitude of recent price changes on a 0–100 scale. It compares average gains vs average losses over 14 trading days. Readings above 70 suggest overbought conditions (strong upward momentum, potential for reversal), while readings below 30 suggest oversold conditions (heavy selling, potential for bounce). RSI works best in ranging markets and should be combined with trend analysis.
        </Collapsible>
      </div>

      {/* 2. Moving Averages */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Moving Averages</p>
        <div style={{ display: 'flex', gap: '1px', marginBottom: '20px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <div style={{ background: C.ELEVATED, padding: '16px 20px', minWidth: '140px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>MA 50</p>
            <p style={{ ...TYPE.DATA_LG, color: C.GOLD }}>
              {meta.currencySymbol}{data.ma50.toFixed(2)}
            </p>
          </div>
          <div style={{ background: C.ELEVATED, padding: '16px 20px', minWidth: '140px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>MA 200</p>
            <p style={{ ...TYPE.DATA_LG, color: C.ORANGE }}>
              {meta.currencySymbol}{data.ma200.toFixed(2)}
            </p>
          </div>
          <div style={{ background: C.ELEVATED, padding: '16px 20px', minWidth: '160px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>Price vs MA200</p>
            <p style={{ ...TYPE.DATA_MD, color: data.ma200Label === 'Above' ? C.GREEN : C.RED }}>
              {data.ma200Label} ({data.ma200PercentDiff > 0 ? '+' : ''}{data.ma200PercentDiff.toFixed(1)}%)
            </p>
          </div>
          {data.crossSignal !== 'None' && (
            <div style={{ background: C.ELEVATED, padding: '16px 20px', minWidth: '140px' }}>
              <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>Cross Signal</p>
              <span style={styles.badge(data.crossSignal === 'Golden Cross' ? C.GOLD : C.RED)}>{data.crossSignal}</span>
            </div>
          )}
        </div>
        {data.maHistory.length > 0 && (
          <div style={{ background: C.SURFACE, padding: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              {([[C.CYAN, 'Price'], [C.GOLD, 'MA50'], [C.ORANGE, 'MA200']] as [string, string][]).map(([c, l]) => (
                <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '16px', height: '2px', background: c, display: 'inline-block' }} />
                  <span style={{ ...TYPE.LABEL_SM, color: C.TEXT2 }}>{l}</span>
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.maHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.maHistory.length / 6)} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${meta.currencySymbol}${v.toFixed(0)}`} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [`${meta.currencySymbol}${(v as number).toFixed(2)}`, name as string]} />
                <Line type="monotone" dataKey="price" stroke={C.CYAN} strokeWidth={1.5} dot={false} isAnimationActive={false} name="Price" />
                <Line type="monotone" dataKey="ma50" stroke={C.GOLD} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls name="MA50" />
                <Line type="monotone" dataKey="ma200" stroke={C.ORANGE} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls name="MA200" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <InsightBox>
          {meta.companyName}&apos;s price is {data.ma200Label.toLowerCase()} the 200-day moving average by {Math.abs(data.ma200PercentDiff)}%.{' '}
          {data.ma200Label === 'Above'
            ? 'This confirms a long-term uptrend — prices staying above MA200 is a sign of structural strength.'
            : 'Prices below the 200-day MA indicate long-term bearish pressure. A sustained reclaim of MA200 would be bullish.'}
          {data.crossSignal === 'Golden Cross' && ' A Golden Cross recently formed — the 50-day MA crossed above the 200-day, historically a bullish signal.'}
          {data.crossSignal === 'Death Cross' && ' A Death Cross recently formed — the 50-day MA crossed below the 200-day, historically a bearish signal.'}
        </InsightBox>
        <Collapsible label="How Moving Averages work">
          Moving averages smooth price data to reveal trends. The MA50 tracks the average closing price over 50 days (medium-term trend), while MA200 covers 200 days (long-term trend). When MA50 crosses above MA200, it&apos;s called a Golden Cross — historically bullish. The reverse (Death Cross) is bearish. Price above MA200 typically signals an uptrend; below signals a downtrend. Traders use these as dynamic support/resistance levels.
        </Collapsible>
      </div>

      {/* 3. Bollinger Bands */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Bollinger Bands</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ ...TYPE.DATA_SM, color: C.TEXT2 }}>Position:</span>
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
                <CartesianGrid stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.bollingerBands.length / 6)} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${meta.currencySymbol}${v.toFixed(0)}`} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [`${meta.currencySymbol}${(v as number).toFixed(2)}`, name as string]} />
                <Area type="monotone" dataKey="upper" stroke={C.VIOLET} strokeWidth={1} fill="url(#bbBand)" dot={false} isAnimationActive={false} name="Upper" />
                <Area type="monotone" dataKey="lower" stroke={C.VIOLET} strokeWidth={1} fill={`${C.BG}80`} dot={false} isAnimationActive={false} name="Lower" />
                <Line type="monotone" dataKey="middle" stroke={C.VIOLET} strokeWidth={1} strokeDasharray="4 4" dot={false} isAnimationActive={false} name="Middle" />
                <Line type="monotone" dataKey="price" stroke={C.CYAN} strokeWidth={2} dot={false} isAnimationActive={false} name="Price" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <InsightBox>
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
        </InsightBox>
        <Collapsible label="How Bollinger Bands work">
          Bollinger Bands consist of three lines: a 20-day moving average (middle), and upper/lower bands set 2 standard deviations above/below. About 95% of price action occurs within the bands. When price touches the upper band, the stock is considered statistically extended (not necessarily overbought). When it touches the lower band, it&apos;s extended to the downside. Band width indicates volatility — wider bands mean higher volatility, narrower bands mean low volatility (often before a breakout).
        </Collapsible>
      </div>

      {/* 4. Volume Analysis */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Volume Analysis</p>
        <div style={{ display: 'flex', gap: '1px', marginBottom: '20px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <div style={{ background: C.ELEVATED, padding: '14px 18px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>Latest Volume</p>
            <p style={{ ...TYPE.DATA_LG, color: C.TEXT }}>{fmtVol(data.latestVolume)}</p>
          </div>
          <div style={{ background: C.ELEVATED, padding: '14px 18px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>Avg Volume (30d)</p>
            <p style={{ ...TYPE.DATA_LG, color: C.TEXT }}>{fmtVol(data.avgVolume30d)}</p>
          </div>
          <div style={{ background: C.ELEVATED, padding: '14px 18px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>Trend</p>
            <span style={styles.badge(
              data.volumeTrend === 'Increasing' ? C.GREEN : data.volumeTrend === 'Decreasing' ? C.RED : C.NEUTRAL
            )}>{data.volumeTrend}</span>
          </div>
        </div>
        {data.volumeHistory.length > 0 && (
          <div style={{ background: C.SURFACE, padding: '16px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={data.volumeHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={Math.floor(data.volumeHistory.length / 6)} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} tickFormatter={fmtVol} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [fmtVol(v as number), name as string]} />
                <Bar dataKey="volume" fill={`${C.CYAN}99`} name="Volume" isAnimationActive={false} />
                <Line type="monotone" dataKey="avgVolume" stroke={C.ORANGE} strokeWidth={2} dot={false} isAnimationActive={false} name="Avg Volume" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <InsightBox>
          Volume is {data.volumeTrend.toLowerCase()} compared to recent averages.{' '}
          {data.volumeTrend === 'Increasing'
            ? 'Rising volume confirms the trend — price moves backed by high volume are more reliable and sustainable.'
            : data.volumeTrend === 'Decreasing'
            ? 'Falling volume can signal weakening conviction. Trend moves on low volume are less reliable and more prone to reversal.'
            : 'Volume is stable — no strong directional signal from participation levels.'}
          {' '}The 30-day average is {fmtVol(data.avgVolume30d)} shares/day.
        </InsightBox>
        <Collapsible label="How volume analysis works">
          Volume shows how many shares were traded in a period. High volume during a price move confirms conviction — buyers or sellers are actively engaged. Low volume on a breakout is suspicious. Volume divergence (price rising but volume falling) can signal a weakening trend. The 20-day moving average of volume provides a baseline — days above average indicate heightened interest.
        </Collapsible>
      </div>

      {/* 5. Support & Resistance */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Support &amp; Resistance Levels</p>
        {data.supportResistance.length === 0 ? (
          <p style={{ ...TYPE.DATA_SM, color: C.TEXT2 }}>No clear levels detected in recent 90-day range.</p>
        ) : (
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', background: C.ELEVATED, padding: '10px 16px', borderBottom: `1px solid ${C.BORDER}` }}>
              {(['TYPE', 'LEVEL', 'STRENGTH'] as const).map((h, i) => (
                <span key={h} style={{ ...TYPE.LABEL_SM, color: C.TEXT3, textAlign: i === 2 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
            {[...data.supportResistance].sort((a, b) => b.level - a.level).map((lvl, i) => {
              const color = lvl.type === 'resistance' ? C.RED : C.GREEN;
              const pctAway = ((Math.abs(lvl.level - meta.currentPrice) / meta.currentPrice) * 100).toFixed(1);
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', background: C.SURFACE, padding: '11px 16px', borderBottom: i < data.supportResistance.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none' }}>
                  <span style={{ ...TYPE.LABEL_LG, color, textTransform: 'uppercase' }}>{lvl.type}</span>
                  <span style={{ ...TYPE.DATA_MD, color, fontWeight: 700 }}>{meta.currencySymbol}{lvl.level.toFixed(2)}</span>
                  <span style={{ ...TYPE.LABEL_SM, color: C.TEXT2, textAlign: 'right' }}>
                    {lvl.strength} · {pctAway}% away
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <InsightBox>
          Support levels are price zones where buying historically emerged (green). Resistance levels are where sellers historically appeared (red). The closer and stronger a level, the more likely the stock pauses or reverses near it.{' '}
          {data.supportResistance.filter(l => l.type === 'support').length > 0
            ? `Nearest support is at ${meta.currencySymbol}${Math.max(...data.supportResistance.filter(l => l.type === 'support').map(l => l.level)).toFixed(2)}.`
            : ''}{' '}
          {data.supportResistance.filter(l => l.type === 'resistance').length > 0
            ? `Nearest resistance is at ${meta.currencySymbol}${Math.min(...data.supportResistance.filter(l => l.type === 'resistance').map(l => l.level)).toFixed(2)}.`
            : ''}
        </InsightBox>
        <Collapsible label="How support &amp; resistance works">
          Support and resistance are price zones where supply and demand have historically balanced. Support forms where buyers stepped in repeatedly — the price bounced off this level multiple times. Resistance forms where sellers appeared repeatedly. These levels act as price magnets. &quot;Strong&quot; levels have more touches and are more significant. When price breaks through a resistance level, that resistance often becomes new support (role reversal).
        </Collapsible>
      </div>

      {/* 6. 52-Week Range */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>52-Week Range</p>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', height: '6px', background: `linear-gradient(to right, ${C.RED}40, ${C.GOLD}40, ${C.GREEN}40)`, margin: '16px 0 10px' }}>
            <div style={{ position: 'absolute', left: `${clamp52}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '14px', height: '14px', background: C.CYAN, borderRadius: '50%', boxShadow: `0 0 8px ${C.CYAN}80` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...TYPE.LABEL_SM, color: C.RED }}>L {meta.currencySymbol}{data.low52.toFixed(2)}</span>
            <span style={{ ...TYPE.LABEL_SM, color: C.CYAN }}>{clamp52.toFixed(0)}th percentile</span>
            <span style={{ ...TYPE.LABEL_SM, color: C.GREEN }}>H {meta.currencySymbol}{data.high52.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <div style={{ background: C.ELEVATED, padding: '14px 18px', flex: 1, minWidth: '120px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>Distance from High</p>
            <p style={{ ...TYPE.DATA_LG, color: C.RED }}>
              -{((data.high52 - meta.currentPrice) / data.high52 * 100).toFixed(1)}%
            </p>
          </div>
          <div style={{ background: C.ELEVATED, padding: '14px 18px', flex: 1, minWidth: '120px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>Distance from Low</p>
            <p style={{ ...TYPE.DATA_LG, color: C.GREEN }}>
              +{((meta.currentPrice - data.low52) / data.low52 * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <InsightBox>
          At the {clamp52.toFixed(0)}th percentile of its 52-week range, {meta.companyName} is{' '}
          {clamp52 > 75 ? 'trading near its yearly highs — strong recent performance but watch for resistance near the top.' :
           clamp52 < 25 ? 'trading near its yearly lows — weak recent performance. May be undervalued or facing headwinds.' :
           'in the middle of its yearly range — no extreme position.'}
        </InsightBox>
        <Collapsible label="How 52-week range works">
          The 52-week range shows the highest and lowest prices over the past year. Position within this range tells you where current price sits relative to its recent history. Near the high suggests strong momentum but potential resistance. Near the low suggests weakness but potential value. The percentile position (0–100) normalizes this: 100 = at the 52-week high, 0 = at the 52-week low.
        </Collapsible>
      </div>

      {/* 7. ATR & Volatility */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>ATR &amp; Daily Volatility</p>
        <div style={{ display: 'flex', gap: '1px', marginBottom: '20px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <div style={{ background: C.ELEVATED, padding: '20px 24px', flex: 1, minWidth: '160px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '8px' }}>ATR (14-day)</p>
            <p style={{ ...TYPE.DATA_HERO, fontSize: '3rem', color: C.TEXT }}>
              {meta.currencySymbol}{data.atr.toFixed(2)}
            </p>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginTop: '8px' }}>
              {data.atrPercent.toFixed(1)}% of price per day
            </p>
          </div>
          <div style={{ background: C.ELEVATED, padding: '20px 24px', flex: 1, minWidth: '200px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '8px' }}>Risk Sizing Helper</p>
            <p style={{ ...TYPE.PROSE_MD, color: C.TEXT2 }}>
              1x ATR stop: {meta.currencySymbol}{(meta.currentPrice - data.atr).toFixed(2)}<br />
              2x ATR stop: {meta.currencySymbol}{(meta.currentPrice - 2 * data.atr).toFixed(2)}<br />
              <span style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>Risk {data.atrPercent.toFixed(1)}% — {(data.atrPercent * 2).toFixed(1)}% per trade</span>
            </p>
          </div>
        </div>
        <InsightBox>
          {meta.companyName} moves an average of {meta.currencySymbol}{data.atr.toFixed(2)} ({data.atrPercent.toFixed(1)}%) per trading day.{' '}
          {data.atrPercent > 5
            ? 'This is high daily volatility — the stock makes large moves regularly. Wider stops are needed and position sizing should be smaller.'
            : data.atrPercent > 2
            ? 'This is moderate daily volatility — typical for growth stocks. Use ATR to set stop-loss distances.'
            : 'This is low daily volatility — the stock moves slowly. More suitable for conservative strategies.'}
        </InsightBox>
        <Collapsible label="How ATR works">
          Average True Range (ATR) measures the average daily price range over 14 days, accounting for overnight gaps. It quantifies volatility in absolute terms (not percentage). Traders use ATR to set stop-loss levels: a 1×ATR stop is tight, 2×ATR is standard, 3×ATR is wide. Higher ATR = more volatile stock = wider stops needed = smaller position size for the same dollar risk. ATR doesn&apos;t indicate direction, only magnitude of movement.
        </Collapsible>
      </div>
    </div>
  );
}
