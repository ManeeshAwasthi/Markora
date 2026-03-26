'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AreaChart, Area, LineChart, Line, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { C, T, styles } from '@/lib/designTokens';

interface RSIPoint { date: string; value: number }
interface MAPoint { date: string; ma50: number | null; ma200: number | null; price: number }
interface VolumePoint { date: string; volume: number; avgVolume: number }
interface BollingerPoint { date: string; upper: number; middle: number; lower: number; price: number }
interface SupportResistance { level: number; type: 'support' | 'resistance'; strength: 'strong' | 'moderate' | 'weak' }

interface PriceIntelligenceDetail {
  ticker: string;
  companyName: string;
  currencySymbol: string;
  currentPrice: number;
  timeframe: number;
  rsi: number;
  rsiLabel: string;
  rsiHistory: RSIPoint[];
  ma50: number;
  ma200: number;
  ma200Label: string;
  ma200PercentDiff: number;
  maHistory: MAPoint[];
  atr: number;
  atrPercent: number;
  high52: number;
  low52: number;
  weekRange52Position: number;
  crossSignal: string;
  bollingerBands: BollingerPoint[];
  bollingerPosition: string;
  volumeHistory: VolumePoint[];
  volumeTrend: string;
  avgVolume30d: number;
  latestVolume: number;
  supportResistance: SupportResistance[];
  vwap: number | null;
}

function fmtVol(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.sectionLabel}>
      {children}
    </div>
  );
}

function InsightBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.insightBox}>
      <div style={styles.insightLabel}>What this means</div>
      <div style={styles.insightText}>{children}</div>
    </div>
  );
}

function Collapsible({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: '12px' }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...styles.collapsibleBtn }}>
        <span style={{ color: C.CYAN }}>{open ? '▾' : '▸'}</span> {label}
      </button>
      {open && (
        <div style={styles.collapsibleContent}>
          {children}
        </div>
      )}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={styles.badge(color)}>
      {label}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.card}>
      {children}
    </div>
  );
}

function PIContent() {
  const searchParams = useSearchParams();
  const company = searchParams.get('company') ?? '';
  const timeframe = Number(searchParams.get('timeframe') ?? '30') || 30;

  const [data, setData] = useState<PriceIntelligenceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) { setError('No company specified'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/price-intelligence?company=${encodeURIComponent(company)}&timeframe=${timeframe}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); } else { setData(d); }
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [company, timeframe]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ width: '40px', height: '40px', border: `3px solid ${C.BORDER}`, borderTop: `3px solid ${C.CYAN}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '13px' }}>Loading price intelligence...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: C.BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.RED, fontFamily: T.MONO, fontSize: '14px', background: C.RED + '11', border: `1px solid ${C.RED}33`, padding: '20px 32px' }}>
          {error ?? 'Failed to load data'}
        </div>
      </div>
    );
  }

  const { currencySymbol: cs } = data;

  // Big picture summary
  const pctFromHigh = Math.round(((data.currentPrice - data.high52) / data.high52) * 100 * 10) / 10;
  const pctFromLow = Math.round(((data.currentPrice - data.low52) / data.low52) * 100 * 10) / 10;
  const bigPicture = `${data.companyName} is currently trading at ${cs}${data.currentPrice.toFixed(2)}, which is ${Math.abs(data.ma200PercentDiff)}% ${data.ma200Label.toLowerCase()} its 200-day moving average — indicating ${data.ma200Label === 'Above' ? 'long-term upward momentum' : 'long-term downward pressure'}. The stock sits at the ${data.weekRange52Position.toFixed(0)}th percentile of its 52-week range (${cs}${data.low52} – ${cs}${data.high52}), ${pctFromHigh < 0 ? Math.abs(pctFromHigh) + '% below its yearly high' : 'at its yearly high'}. Momentum (RSI ${data.rsi}) is ${data.rsiLabel.toLowerCase()}, suggesting ${data.rsi > 70 ? 'potential overbought conditions — a pullback may be near' : data.rsi < 30 ? 'oversold conditions — a bounce may be possible' : 'no extreme buying or selling pressure'}. Daily price swings average ${cs}${data.atr.toFixed(2)}, which is ${data.atrPercent}% of the stock price.`;

  // RSI insight
  const rsiInsight = data.rsi < 30
    ? 'The stock is in oversold territory. This means sellers have been aggressively pushing the price down. Historically, stocks tend to bounce back from these levels — but oversold can stay oversold in a strong downtrend.'
    : data.rsi > 70
    ? 'The stock is overbought — buyers have been piling in. This doesn\'t mean it will crash, but the upward momentum may slow or reverse. Watch for confirmation from other signals.'
    : 'RSI is in the neutral zone — neither overbought nor oversold. There\'s no extreme momentum signal right now.';

  // MA insight
  const maInsight = data.currentPrice > data.ma200 && data.currentPrice > data.ma50
    ? 'The stock is trading above both its short-term and long-term trend lines — this is generally a bullish sign.'
    : data.currentPrice > data.ma200
    ? 'Mixed signal — the stock is above its long-term trend (MA200) but below the short-term trend (MA50). Watch for a recovery.'
    : data.currentPrice > data.ma50
    ? 'Mixed signal — above short-term trend but below long-term. The longer-term pressure remains.'
    : 'Price is below both trend lines — this suggests sustained downward pressure.';

  // Bollinger insight
  const bbInsight = data.bollingerPosition === 'Above Upper Band'
    ? 'Price has broken above the normal volatility range — could signal a breakout or an overextension that may correct.'
    : data.bollingerPosition === 'Near Upper Band'
    ? 'Price is approaching the upper boundary of its normal volatility range. Momentum is strong but watch for a pullback.'
    : data.bollingerPosition === 'Below Lower Band'
    ? 'Price has fallen below the normal volatility range — a potential buying opportunity, but also a sign of weakness. Confirm with RSI.'
    : data.bollingerPosition === 'Near Lower Band'
    ? 'Price is near the lower boundary of its normal range — could be a buying opportunity or a sign of continued weakness.'
    : 'Price is within its normal volatility range — no extreme reading from Bollinger Bands.';

  // Volume insight
  const latestClose = data.maHistory.length > 0 ? data.maHistory[data.maHistory.length - 1].price : data.currentPrice;
  const prevClose = data.maHistory.length > 1 ? data.maHistory[data.maHistory.length - 2].price : latestClose;
  const priceDirection = latestClose >= prevClose ? 'rising' : 'falling';
  const volumeInsight = data.volumeTrend === 'Increasing' && priceDirection === 'rising'
    ? 'Rising volume with rising price confirms the uptrend — buyers are active and the move has conviction.'
    : data.volumeTrend === 'Increasing' && priceDirection === 'falling'
    ? 'Rising volume with falling price is bearish — selling pressure is intensifying. This is a warning sign.'
    : data.volumeTrend === 'Decreasing'
    ? 'Volume is fading — recent price moves may lack conviction and could reverse.'
    : 'Volume is stable. No unusual buying or selling pressure detected.';

  // Tick formatting for charts
  const formatPrice = (v: number) => `${cs}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const formatDate = (d: string) => d.slice(5); // MM-DD

  return (
    <div style={{ minHeight: '100vh', background: C.BG, padding: '0 0 80px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${C.BORDER_FAINT}`, padding: '0 40px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.BG }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span style={{ fontFamily: T.MONO, fontSize: '13px', fontWeight: 700, letterSpacing: '0.2em', color: C.TEXT }}>MARKORA</span>
          <Link href={`/signal?ticker=${encodeURIComponent(company)}&timeframe=${timeframe}`} style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            ← SIGNAL BOARD
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: T.MONO, fontSize: '10px', color: C.TEXT2, background: C.ELEVATED, border: `1px solid ${C.BORDER}`, padding: '3px 8px', letterSpacing: '0.08em' }}>{data.ticker}</span>
          <span style={{ fontFamily: T.MONO, fontSize: '16px', fontWeight: 700, color: C.CYAN }}>{cs}{data.currentPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Page title section ── */}
      <div style={{ background: C.SURFACE, borderBottom: `1px solid ${C.BORDER_FAINT}`, padding: '32px 40px' }}>
        <p style={{ fontFamily: T.MONO, fontSize: '10px', color: C.TEXT3, letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>
          DEEP ANALYSIS // PRICE INTELLIGENCE · {timeframe}D
        </p>
        <h1 style={{ fontFamily: T.SERIF, fontStyle: 'italic', fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', color: C.TEXT, lineHeight: 1, margin: 0 }}>
          {data.companyName}
        </h1>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

        {/* ── Section 1: Big Picture ── */}
        <Card>
          <SectionLabel>The Big Picture</SectionLabel>
          <div style={{ borderLeft: `3px solid ${C.CYAN}`, paddingLeft: '18px' }}>
            <p style={{ color: C.TEXT, fontFamily: T.BODY, fontSize: '15px', lineHeight: 1.8, margin: 0 }}>{bigPicture}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1px', marginTop: '24px', background: C.BORDER_FAINT }}>
            {[
              { label: '52W HIGH', value: `${cs}${data.high52.toFixed(2)}`, sub: `${pctFromHigh}% from here`, color: C.GREEN },
              { label: '52W LOW', value: `${cs}${data.low52.toFixed(2)}`, sub: `+${pctFromLow}% from here`, color: C.RED },
              { label: 'MA200', value: `${cs}${data.ma200.toFixed(2)}`, sub: `${data.ma200Label} · ${Math.abs(data.ma200PercentDiff)}%`, color: C.ORANGE },
              { label: 'ATR 14D', value: `${cs}${data.atr.toFixed(2)}`, sub: `${data.atrPercent}% of price`, color: C.GOLD },
              { label: 'RSI 14D', value: String(data.rsi), sub: data.rsiLabel, color: data.rsi > 70 ? C.RED : data.rsi < 30 ? C.GREEN : C.TEXT2 },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ background: C.SURFACE, padding: '14px 16px' }}>
                <div style={styles.metricLabel}>{label}</div>
                <div style={{ color, fontFamily: T.MONO, fontSize: '18px', fontWeight: 600 }}>{value}</div>
                <div style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '11px', marginTop: '4px' }}>{sub}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Section 2: RSI ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <SectionLabel>RSI Deep Dive</SectionLabel>
            <Badge label={data.rsiLabel} color={data.rsi > 70 ? C.RED : data.rsi < 30 ? C.GREEN : C.TEXT2} />
            <span style={{ marginLeft: 'auto', fontFamily: T.MONO, fontSize: '22px', fontWeight: 700, color: data.rsi > 70 ? C.RED : data.rsi < 30 ? C.GREEN : C.CYAN }}>{data.rsi}</span>
          </div>
          {data.rsiHistory.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.rsiHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: C.TEXT2, fontSize: 11, fontFamily: T.MONO }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: C.TEXT2, fontSize: 11, fontFamily: T.MONO }} />
                <Tooltip contentStyle={{ background: C.ELEVATED, border: `1px solid ${C.BORDER}`, fontFamily: T.MONO, fontSize: '12px' }} labelStyle={{ color: C.TEXT2 }} itemStyle={{ color: C.CYAN }} />
                <ReferenceLine y={70} stroke={C.RED} strokeDasharray="4 2" label={{ value: 'OB 70', fill: C.RED, fontSize: 10, fontFamily: T.MONO }} />
                <ReferenceLine y={30} stroke={C.GREEN} strokeDasharray="4 2" label={{ value: 'OS 30', fill: C.GREEN, fontSize: 10, fontFamily: T.MONO }} />
                <Area type="monotone" dataKey="value" stroke={C.CYAN} fill={C.CYAN + '18'} strokeWidth={2} dot={false} name="RSI" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <InsightBox>{rsiInsight}</InsightBox>
          <Collapsible label="How RSI works">
            RSI (Relative Strength Index) measures the speed and size of recent price changes on a 0–100 scale. It compares average gains to average losses over the last 14 trading days. A reading above 70 suggests the stock may be overbought; below 30 suggests oversold conditions.
          </Collapsible>
        </Card>

        {/* ── Section 3: Moving Averages ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const, marginBottom: '20px' }}>
            <SectionLabel>Moving Averages</SectionLabel>
            {data.crossSignal !== 'None' && (
              <Badge label={data.crossSignal} color={data.crossSignal === 'Golden Cross' ? C.GREEN : C.RED} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap' as const, marginBottom: '20px', background: C.BORDER_FAINT }}>
            {[
              { label: 'Price', value: `${cs}${data.currentPrice.toFixed(2)}`, color: C.CYAN },
              { label: 'MA50', value: data.ma50 ? `${cs}${data.ma50.toFixed(2)}` : '—', color: C.GOLD },
              { label: 'MA200', value: data.ma200 ? `${cs}${data.ma200.toFixed(2)}` : '—', color: C.ORANGE },
              { label: 'vs MA200', value: `${data.ma200PercentDiff > 0 ? '+' : ''}${data.ma200PercentDiff}%`, color: data.ma200PercentDiff >= 0 ? C.GREEN : C.RED },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.SURFACE, padding: '10px 16px', minWidth: '100px' }}>
                <div style={styles.metricLabel}>{label}</div>
                <div style={{ color, fontFamily: T.MONO, fontSize: '16px', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          {data.maHistory.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                {[[C.CYAN, 'Price'], [C.GOLD, 'MA50'], [C.ORANGE, 'MA200']].map(([color, label]) => (
                  <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '16px', height: '2px', background: color, display: 'inline-block' }} />
                    <span style={{ fontFamily: T.MONO, fontSize: '10px', color: C.TEXT2, letterSpacing: '0.1em' }}>{label}</span>
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.maHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER_FAINT} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatPrice} tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} width={70} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: C.ELEVATED, border: `1px solid ${C.BORDER}`, fontFamily: T.MONO, fontSize: '11px', color: C.TEXT }} labelStyle={{ color: C.TEXT2 }} formatter={(v) => [`${cs}${(v as number)?.toFixed(2)}`, '']} cursor={{ stroke: C.BORDER }} />
                  <Line type="monotone" dataKey="price" stroke={C.CYAN} strokeWidth={2} dot={false} name="Price" isAnimationActive={false} />
                  <Line type="monotone" dataKey="ma50" stroke={C.GOLD} strokeWidth={1.5} dot={false} name="MA50" connectNulls isAnimationActive={false} />
                  <Line type="monotone" dataKey="ma200" stroke={C.ORANGE} strokeWidth={1.5} dot={false} name="MA200" connectNulls isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
          <InsightBox>{maInsight}</InsightBox>
          <Collapsible label="How Moving Averages work">
            A moving average smooths out price data by averaging the last N closing prices. MA50 tracks short-term momentum (50 days), MA200 tracks long-term trend (200 days). When MA50 crosses above MA200, it&apos;s called a Golden Cross — a bullish signal. The opposite is a Death Cross — bearish.
          </Collapsible>
        </Card>

        {/* ── Section 4: Bollinger Bands ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const, marginBottom: '20px' }}>
            <SectionLabel>Bollinger Bands</SectionLabel>
            <Badge label={data.bollingerPosition} color={data.bollingerPosition.includes('Above') ? C.RED : data.bollingerPosition.includes('Below') ? C.GREEN : C.TEXT2} />
          </div>
          {data.bollingerBands.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.bollingerBands} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: C.TEXT2, fontSize: 11, fontFamily: T.MONO }} interval="preserveStartEnd" />
                <YAxis tickFormatter={formatPrice} tick={{ fill: C.TEXT2, fontSize: 11, fontFamily: T.MONO }} width={70} />
                <Tooltip contentStyle={{ background: C.ELEVATED, border: `1px solid ${C.BORDER}`, fontFamily: T.MONO, fontSize: '12px' }} labelStyle={{ color: C.TEXT2 }} formatter={(v) => [`${cs}${(v as number)?.toFixed(2)}`, '']} />
                <Area type="monotone" dataKey="upper" stroke={C.VIOLET + '44'} fill="transparent" strokeWidth={1} dot={false} name="Upper Band" isAnimationActive={false} />
                <Area type="monotone" dataKey="lower" stroke={C.VIOLET + '44'} fill={C.VIOLET + '11'} strokeWidth={1} dot={false} name="Lower Band" isAnimationActive={false} />
                <Line type="monotone" dataKey="middle" stroke={C.VIOLET} strokeWidth={1} strokeDasharray="4 2" dot={false} name="Middle" isAnimationActive={false} />
                <Line type="monotone" dataKey="price" stroke={C.CYAN} strokeWidth={2} dot={false} name="Price" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <InsightBox>{bbInsight}</InsightBox>
          <Collapsible label="How Bollinger Bands work">
            Bollinger Bands plot two standard deviations above and below a 20-day moving average. When price is near the upper band, the stock may be overextended. Near the lower band, it may be undervalued. The bands also widen during high volatility and narrow during calm periods — a narrowing often precedes a big move.
          </Collapsible>
        </Card>

        {/* ── Section 5: Volume ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const, marginBottom: '16px' }}>
            <SectionLabel>Volume Analysis</SectionLabel>
            <Badge label={data.volumeTrend} color={data.volumeTrend === 'Increasing' ? C.GREEN : data.volumeTrend === 'Decreasing' ? C.RED : C.TEXT2} />
          </div>
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap' as const, marginBottom: '20px', background: C.BORDER_FAINT }}>
            {[
              { label: 'Latest Volume', value: fmtVol(data.latestVolume) },
              { label: '30D Avg Volume', value: fmtVol(data.avgVolume30d) },
              { label: 'vs Average', value: `${data.avgVolume30d > 0 ? ((data.latestVolume / data.avgVolume30d - 1) * 100).toFixed(0) : '0'}%`, color: data.latestVolume > data.avgVolume30d ? C.GREEN : C.RED },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.SURFACE, padding: '10px 16px', minWidth: '120px' }}>
                <div style={styles.metricLabel}>{label}</div>
                <div style={{ color: color ?? C.TEXT, fontFamily: T.MONO, fontSize: '16px', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          {data.volumeHistory.length > 0 && (
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={data.volumeHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: C.TEXT2, fontSize: 11, fontFamily: T.MONO }} interval="preserveStartEnd" />
                <YAxis tickFormatter={fmtVol} tick={{ fill: C.TEXT2, fontSize: 11, fontFamily: T.MONO }} width={55} />
                <Tooltip contentStyle={{ background: C.ELEVATED, border: `1px solid ${C.BORDER}`, fontFamily: T.MONO, fontSize: '12px' }} labelStyle={{ color: C.TEXT2 }} formatter={(v) => [fmtVol(v as number), '']} />
                <Bar dataKey="volume" fill={C.CYAN + '66'} name="Volume" isAnimationActive={false} />
                <Line type="monotone" dataKey="avgVolume" stroke={C.GOLD} strokeWidth={1.5} dot={false} name="20D Avg" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <InsightBox>{volumeInsight}</InsightBox>
        </Card>

        {/* ── Section 6: Support & Resistance ── */}
        <Card>
          <SectionLabel>Support &amp; Resistance Levels</SectionLabel>
          {data.supportResistance.length === 0 ? (
            <div style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '13px' }}>Not enough price history to identify clear levels.</div>
          ) : (
            <div style={{ position: 'relative' as const }}>
              {/* Visual levels */}
              {[...data.supportResistance].sort((a, b) => b.level - a.level).map((lvl, i) => {
                const isAbove = lvl.level > data.currentPrice;
                const pctDiff = ((lvl.level - data.currentPrice) / data.currentPrice * 100).toFixed(1);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${C.BORDER}` }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isAbove ? C.RED : C.GREEN, flexShrink: 0 }} />
                    <div style={{ fontFamily: T.MONO, fontSize: '15px', color: isAbove ? C.RED : C.GREEN, fontWeight: 600, minWidth: '80px' }}>{cs}{lvl.level.toFixed(2)}</div>
                    <Badge label={lvl.strength} color={lvl.strength === 'strong' ? (isAbove ? C.RED : C.GREEN) : C.TEXT2} />
                    <div style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '12px' }}>{isAbove ? 'Resistance' : 'Support'} · {isAbove ? '+' : ''}{pctDiff}% from price</div>
                  </div>
                );
              })}
              {/* Current price marker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${C.BORDER}` }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.CYAN, flexShrink: 0 }} />
                <div style={{ fontFamily: T.MONO, fontSize: '15px', color: C.CYAN, fontWeight: 600, minWidth: '80px' }}>{cs}{data.currentPrice.toFixed(2)}</div>
                <Badge label="Current Price" color={C.CYAN} />
              </div>
            </div>
          )}
          <InsightBox>
            Support levels are prices where buyers have historically stepped in and prevented further decline. Resistance levels are where sellers have taken control and capped upside. The more times a level has been tested, the stronger it is — and the more significant it becomes if broken.
          </InsightBox>
        </Card>

        {/* ── Section 7: 52-Week Range ── */}
        <Card>
          <SectionLabel>52-Week Range</SectionLabel>
          <div style={{ margin: '8px 0 24px' }}>
            <div style={{ position: 'relative' as const, height: '6px', background: C.BORDER, margin: '8px 0' }}>
              <div style={{ position: 'absolute' as const, left: 0, top: 0, height: '100%', width: `${data.weekRange52Position}%`, background: `linear-gradient(90deg, ${C.GREEN}44, ${C.CYAN})` }} />
              <div style={{ position: 'absolute' as const, left: `${data.weekRange52Position}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '14px', height: '14px', background: C.CYAN, borderRadius: '50%', border: `2px solid ${C.BG}` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontFamily: T.MONO, fontSize: '12px', color: C.TEXT2 }}>L {cs}{data.low52.toFixed(2)}</span>
              <span style={{ fontFamily: T.MONO, fontSize: '12px', color: C.TEXT2 }}>{data.weekRange52Position.toFixed(1)}th percentile</span>
              <span style={{ fontFamily: T.MONO, fontSize: '12px', color: C.TEXT2 }}>H {cs}{data.high52.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap' as const, background: C.BORDER_FAINT }}>
            <div style={{ background: C.SURFACE, padding: '12px 16px' }}>
              <div style={styles.metricLabel}>From 52W High</div>
              <div style={{ color: C.RED, fontFamily: T.MONO, fontSize: '16px', fontWeight: 600 }}>{pctFromHigh}%</div>
            </div>
            <div style={{ background: C.SURFACE, padding: '12px 16px' }}>
              <div style={styles.metricLabel}>From 52W Low</div>
              <div style={{ color: C.GREEN, fontFamily: T.MONO, fontSize: '16px', fontWeight: 600 }}>+{pctFromLow}%</div>
            </div>
          </div>
          <InsightBox>
            The 52-week range shows the highest and lowest prices over the past year. Stocks near their yearly high often have strong momentum; stocks near their yearly low may be oversold or in a downtrend. The position within the range gives you a quick sense of where sentiment currently stands.
          </InsightBox>
        </Card>

        {/* ── Section 8: ATR & Volatility ── */}
        <Card>
          <SectionLabel>ATR &amp; Daily Volatility</SectionLabel>
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap' as const, marginBottom: '20px', background: C.BORDER_FAINT }}>
            {[
              { label: 'ATR (14D)', value: `${cs}${data.atr.toFixed(2)}` },
              { label: 'ATR % of Price', value: `${data.atrPercent}%` },
              { label: 'VWAP (last day)', value: data.vwap ? `${cs}${data.vwap.toFixed(2)}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: C.SURFACE, padding: '12px 16px', minWidth: '130px' }}>
                <div style={styles.metricLabel}>{label}</div>
                <div style={{ color: C.GOLD, fontFamily: T.MONO, fontSize: '18px', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          <InsightBox>
            <div>On an average day, this stock moves about {cs}{data.atr.toFixed(2)} ({data.atrPercent}% of its price). If you invest {cs}10,000, expect daily swings of roughly {cs}{((10000 * data.atrPercent) / 100).toFixed(0)}.</div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.BORDER}` }}>
              <span style={{ color: C.TEXT2 }}>Risk sizing: </span>For a 2% risk tolerance, your stop-loss should be approximately {cs}{(data.atr * 2).toFixed(2)} away from your entry price.
            </div>
          </InsightBox>
          <Collapsible label="How ATR works">
            ATR (Average True Range) measures how much a stock typically moves in a day — including gaps. It captures volatility without caring about direction. Traders use ATR to set stop-losses proportional to the stock&apos;s normal behavior, rather than arbitrary fixed percentages.
          </Collapsible>
        </Card>

      </div>
    </div>
  );
}

export default function PriceIntelligencePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: C.BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${C.BORDER}`, borderTop: `3px solid ${C.CYAN}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PIContent />
    </Suspense>
  );
}
