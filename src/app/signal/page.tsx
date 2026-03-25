'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AnalyzeResponse, ApiError, SignalType, TrendDirection, EntryExitLabel, SearchResult } from '@/types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const MONO = "var(--font-space-mono), 'Courier New', monospace";
const SERIF = "var(--font-playfair), Georgia, serif";
const BODY = "var(--font-space-grotesk), system-ui, sans-serif";

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
  Stable: '#555',
};

const TREND_ARROWS: Record<TrendDirection, string> = {
  Rising: '↑',
  Falling: '↓',
  Stable: '→',
};

const SECTION_LABEL: CSSProperties = {
  fontSize: '10px',
  fontFamily: MONO,
  color: '#4a4a6a',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  marginBottom: '16px',
};

const TICKER_TAPE_ITEMS = [
  'AAPL · Aligned', 'TSLA · Mild Optimism', 'MSFT · Overconfidence',
  'NVDA · Hidden Strength', 'META · Aligned', 'AMZN · Mild Pessimism',
  'GOOG · Aligned', 'NFLX · Mild Optimism', 'AMD · Hidden Strength',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number | null | undefined, decimals = 2, suffix = ''): string =>
  v !== null && v !== undefined ? `${v.toFixed(decimals)}${suffix}` : '—';

const fmtPct = (v: number | null | undefined, isAlreadyPct = false): string =>
  v !== null && v !== undefined
    ? `${(isAlreadyPct ? v : v * 100).toFixed(1)}%`
    : '—';

// ── Badge style per entry/exit label ─────────────────────────────────────────
function getBadgeStyle(label: EntryExitLabel): CSSProperties {
  const base: CSSProperties = {
    fontFamily: MONO,
    fontSize: '11px',
    borderRadius: '0',
    padding: '6px 16px',
    display: 'inline-block',
    letterSpacing: '0.1em',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
  };
  if (label === 'Hold — No Strong Signal') {
    return { ...base, border: '1px solid #252535', background: 'transparent', color: '#555' };
  }
  if (label === 'Potential Entry Zone') {
    return { ...base, border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.05)', color: '#00ff88' };
  }
  if (label === 'Caution — Consider Exit') {
    return { ...base, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: '#ef4444' };
  }
  return { ...base, border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.05)', color: '#f97316' };
}

// ── Top Nav ───────────────────────────────────────────────────────────────────
function TopNav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '48px',
      background: '#020204', borderBottom: '1px solid #0f1118',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 32px', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 700, letterSpacing: '0.2em', color: '#e5e1e8' }}>MARKORA</span>
        </Link>
        <div style={{ display: 'flex', gap: '32px' }}>
          <a href="#" style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: '#00ff88', borderBottom: '1px solid #00ff88', paddingBottom: '2px' }}>SIGNALS</a>
          <a href="#" style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: '#4a4a6a' }}>MARKETS</a>
          <a href="#" style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: '#4a4a6a' }}>METHODOLOGY</a>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', animation: 'pulse 2s infinite' }} />
        <span style={{ fontFamily: MONO, fontSize: '9px', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.15em' }}>LIVE_FEED</span>
      </div>
    </nav>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, valueColor,
}: {
  label: string; value: string; sub?: string; valueColor?: string;
}) {
  const fontSize = value.length > 14 ? '1.1rem' : value.length > 10 ? '1.4rem' : value.length > 7 ? '1.75rem' : '2.2rem';
  return (
    <div style={{ minWidth: 0, background: '#020204', border: '1px solid #1c1c26', padding: '24px 24px 20px' }}>
      <p style={{ color: '#4a4a6a', fontSize: '9px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: MONO, marginBottom: '16px' }}>
        {label}
      </p>
      <p style={{ color: valueColor ?? '#e5e1e8', fontSize, fontWeight: 700, fontFamily: MONO, lineHeight: 1.1, marginBottom: sub ? '10px' : 0, wordBreak: 'break-word', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && <p style={{ color: '#4a4a6a', fontSize: '11px', fontFamily: BODY, lineHeight: 1.4 }}>{sub}</p>}
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({ label, hint, value, color }: { label: string; hint?: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #0f1118', gap: '16px' }}>
      <div>
        <span style={{ color: '#4a4a6a', fontSize: '12px', fontFamily: MONO }}>{label}</span>
        {hint && <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginTop: '2px' }}>{hint}</p>}
      </div>
      <span style={{ color: color ?? '#e5e1e8', fontSize: '12px', fontFamily: MONO, fontWeight: 500, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// ── Small badge ───────────────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: '10px', padding: '3px 10px', color, background: bg, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
      {label}
    </span>
  );
}

// ── Ticker tape ───────────────────────────────────────────────────────────────
function TickerTape() {
  const items = [...TICKER_TAPE_ITEMS, ...TICKER_TAPE_ITEMS];
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '32px', background: '#020204', borderTop: '1px solid #0f1118', overflow: 'hidden', zIndex: 40 }}>
      <div style={{ display: 'flex', gap: '48px', alignItems: 'center', height: '100%', width: 'max-content', animation: 'tickerScroll 40s linear infinite', paddingLeft: '100%' }}>
        {items.map((item, i) => {
          const [symbol, signal] = item.split(' · ');
          const color = SIGNAL_COLORS[signal as SignalType] ?? '#555';
          return (
            <span key={i} style={{ whiteSpace: 'nowrap', fontFamily: MONO, fontSize: '11px' }}>
              <span style={{ color: '#e5e1e8' }}>{symbol}</span>
              <span style={{ color: '#2a2a3a', margin: '0 6px' }}>·</span>
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
      <div style={{ display: 'flex', overflow: 'hidden', height: '6px', background: '#1c1c26', marginBottom: '16px' }}>
        <div style={{ width: `${bullish}%`, background: '#00ff88' }} />
        <div style={{ width: `${neutral}%`, background: '#2a2a3a' }} />
        <div style={{ width: `${bearish}%`, background: '#ef4444' }} />
      </div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <span style={{ color: '#00ff88', fontSize: '11px', fontFamily: MONO, fontWeight: 700 }}>BULLISH {bullish}%</span>
        <span style={{ color: '#4a4a6a', fontSize: '11px', fontFamily: MONO }}>NEUTRAL {neutral}%</span>
        <span style={{ color: '#ef4444', fontSize: '11px', fontFamily: MONO, fontWeight: 700 }}>BEARISH {bearish}%</span>
      </div>
    </div>
  );
}

// ── Chart legend dot ──────────────────────────────────────────────────────────
function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginRight: '24px' }}>
      <span style={{ width: '16px', height: '2px', background: dashed ? 'transparent' : color, display: 'inline-block', borderTop: dashed ? `2px dashed ${color}` : 'none' }} />
      <span style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>{label}</span>
    </span>
  );
}

// ── 52-week range bar ─────────────────────────────────────────────────────────
function WeekRangeBar({ position, low, high, currencySymbol }: { position: number; low: number; high: number; currencySymbol: string }) {
  const clamp = Math.min(100, Math.max(0, position));
  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ position: 'relative', height: '4px', background: '#1c1c26', margin: '12px 0 10px' }}>
        <div style={{ position: 'absolute', left: `${clamp}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', background: '#00e5ff' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#4a4a6a', fontFamily: MONO }}>
        <span>L {currencySymbol}{low.toFixed(2)}</span>
        <span style={{ color: '#2a2a3a' }}>{clamp.toFixed(0)}th percentile</span>
        <span>H {currencySymbol}{high.toFixed(2)}</span>
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
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          body: JSON.stringify({ companyName: rawTicker, timeframe }),
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

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.trim().length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data: SearchResult[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleAnalyze = () => {
    const t = inputTicker.trim();
    if (!t) return;
    router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${selectedTimeframe}`);
  };

  const NAV_SECTIONS = [
    { id: 'price-intelligence', label: 'Price Intelligence' },
    { id: 'fundamentals', label: 'Fundamentals' },
    { id: 'momentum', label: 'Momentum & Flow' },
    { id: 'risk-profile', label: 'Risk Profile' },
    { id: 'peer-comparison', label: 'Peer Comparison' },
  ];

  const [activeSection, setActiveSection] = useState('price-intelligence');

  if (!rawTicker) {
    return (
      <>
        <TopNav />
        <div style={{ textAlign: 'center', padding: '120px 24px', fontFamily: BODY, marginTop: '48px' }}>
          <p style={{ color: '#4a4a6a', fontFamily: MONO, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>No ticker selected</p>
          <Link href="/" style={{ color: '#00e5ff', fontSize: '12px', fontFamily: MONO, textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>← Return to terminal</Link>
        </div>
      </>
    );
  }

  const chartData = data?.chartData.map((p) => ({
    date: p.date,
    'Sentiment Score': Math.round(p.sentimentScore * 10) / 10,
    'Norm. Price': Math.round(p.normalizedPrice * 10) / 10,
    'Search Trend': p.trendScore,
  }));

  const hasTrendLine = chartData?.some(p => p['Search Trend'] !== undefined) ?? false;
  const hasTrendCard = data !== null && data.trendScore !== undefined && data.trendDirection !== undefined && !(data.trendScore === 50 && data.trendDirection === 'Stable');
  const xInterval = chartData ? Math.floor(chartData.length / 6) : 0;

  const rsiColor = !data ? '#555' :
    data.priceIntelligence.rsiLabel === 'Overbought' ? '#ef4444' :
    data.priceIntelligence.rsiLabel === 'Oversold' ? '#00ff88' : '#555';

  const betaColors: Record<string, string> = { Low: '#00ff88', Moderate: '#555', High: '#f97316', 'Very High': '#ef4444' };
  const volColors: Record<string, string> = { Low: '#00ff88', Moderate: '#555', High: '#f97316', 'Very High': '#ef4444' };
  const shortColors: Record<string, string> = { Normal: '#00ff88', Elevated: '#f97316', High: '#ef4444' };
  const insiderColors: Record<string, string> = { Buying: '#00ff88', Selling: '#ef4444', Neutral: '#555' };

  return (
    <div style={{ background: '#020204', minHeight: '100vh', fontFamily: BODY }}>

      {/* ── FIXED TOP NAV ────────────────────────────────────────────────── */}
      <TopNav />

      {/* ── FIXED LEFT SIDEBAR ───────────────────────────────────────────── */}
      {data && (
        <aside style={{
          position: 'fixed', left: 0, top: '48px',
          height: 'calc(100vh - 48px - 32px)',
          width: '220px',
          background: '#020204',
          borderRight: '1px solid #0f1118',
          display: 'flex', flexDirection: 'column',
          paddingTop: '24px',
          overflowY: 'auto',
          zIndex: 40,
        }}>
          <div style={{ padding: '0 24px', marginBottom: '40px' }}>
            <p style={{ fontFamily: MONO, fontSize: '10px', color: '#00ff88', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '4px' }}>TERMINAL_V1.04</p>
            <p style={{ fontFamily: MONO, fontSize: '9px', color: '#2a2a3a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SIGNAL_BOARD</p>
          </div>
          <p style={{ fontFamily: MONO, fontSize: '9px', color: '#2a2a3a', letterSpacing: '0.3em', textTransform: 'uppercase', padding: '0 24px', marginBottom: '16px' }}>Navigation</p>
          {NAV_SECTIONS.map(sec => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              onClick={() => setActiveSection(sec.id)}
              style={{
                display: 'block',
                padding: '14px 24px',
                fontFamily: MONO,
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: activeSection === sec.id ? '#00e5ff' : '#4a4a6a',
                background: activeSection === sec.id ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
                borderLeft: activeSection === sec.id ? '3px solid #00e5ff' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (activeSection !== sec.id) (e.currentTarget as HTMLElement).style.color = '#a0a0b8'; }}
              onMouseLeave={e => { if (activeSection !== sec.id) (e.currentTarget as HTMLElement).style.color = '#4a4a6a'; }}
            >
              {sec.label}
            </a>
          ))}
        </aside>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main style={{
        marginLeft: data ? '220px' : '0',
        marginTop: '48px',
        padding: '40px 40px 80px',
        minHeight: 'calc(100vh - 48px)',
        background: '#020204',
      }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '24px', marginBottom: '40px', paddingBottom: '32px',
          borderBottom: '1px solid #0f1118', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', fontWeight: 700, color: '#e5e1e8', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {data?.companyName ?? rawTicker}
            </h1>
            {data && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: MONO, fontSize: '1.3rem', fontWeight: 500, color: '#e5e1e8' }}>
                  {data.currencySymbol}{data.priceIntelligence?.ma200?.toFixed(2) ?? '—'}
                </span>
                <span style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: data.priceChangePercent >= 0 ? '#00ff88' : '#ef4444' }}>
                  {data.priceChangePercent >= 0 ? '+' : ''}{data.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {data && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '9px', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Signal Status</span>
                  <span style={{
                    padding: '4px 12px',
                    background: `${SIGNAL_COLORS[data.signal]}10`,
                    border: `1px solid ${SIGNAL_COLORS[data.signal]}40`,
                    color: SIGNAL_COLORS[data.signal],
                    fontFamily: MONO, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                  }}>
                    {data.signal}
                  </span>
                </div>
                <div style={{ width: '1px', height: '40px', background: '#0f1118' }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  {data.fundamentals.sector && (
                    <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c26', fontFamily: MONO, fontSize: '9px', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {data.fundamentals.sector}
                    </span>
                  )}
                  {data.fundamentals.industry && (
                    <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c26', fontFamily: MONO, fontSize: '9px', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {data.fundamentals.industry}
                    </span>
                  )}
                </div>
              </>
            )}
            <Link href="/" style={{ color: '#4a4a6a', fontFamily: MONO, fontSize: '10px', textDecoration: 'none', border: '1px solid #1c1c26', padding: '8px 16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#e5e1e8'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#252535'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#4a4a6a'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1c1c26'; }}
            >
              ← Home
            </Link>
          </div>
        </header>

        {/* ── CONTROLS BAR ───────────────────────────────────────────────── */}
        <section style={{
          border: '1px solid #1c1c26',
          padding: '6px',
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          background: '#020204',
        }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              value={inputTicker}
              onChange={e => {
                const val = e.target.value;
                setInputTicker(val);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') { setShowDropdown(false); handleAnalyze(); }
                if (e.key === 'Escape') setShowDropdown(false);
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onFocus={() => inputTicker.trim().length > 0 && suggestions.length > 0 && setShowDropdown(true)}
              placeholder="SEARCH EQUITY TICKER..."
              style={{
                width: '100%',
                background: '#07080d',
                border: '1px solid transparent',
                color: '#e5e1e8',
                fontFamily: MONO,
                fontSize: '10px',
                height: '40px',
                padding: '0 16px',
                outline: 'none',
                letterSpacing: '0.1em',
                boxSizing: 'border-box' as const,
              }}
              onFocusCapture={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#00e5ff'; }}
              onBlurCapture={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'transparent'; }}
            />
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#07080d',
                border: '1px solid #1c1c26',
                overflow: 'hidden',
                zIndex: 50,
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => { setInputTicker(s.name); setShowDropdown(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '10px 16px',
                      background: 'transparent', border: 'none',
                      borderBottom: i < suggestions.length - 1 ? '1px solid #0f1118' : 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#0c0d14'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: '11px', color: '#00e5ff', minWidth: '55px' }}>{s.ticker}</span>
                    <span style={{ color: '#e5e1e8', fontSize: '12px', fontFamily: BODY, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    {s.exchange && (
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a', background: '#1c1c26', padding: '2px 6px' }}>{s.exchange}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', background: '#07080d', padding: '2px' }}>
            {([7, 30, 90] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                style={{
                  padding: '6px 20px',
                  fontFamily: MONO, fontSize: '10px', letterSpacing: '0.1em',
                  cursor: 'pointer', border: 'none',
                  background: selectedTimeframe === tf ? '#020204' : 'transparent',
                  color: selectedTimeframe === tf ? '#00ff88' : '#4a4a6a',
                  ...(selectedTimeframe === tf ? { border: '1px solid #1c1c26' } : {}),
                }}
              >
                {tf}D
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '28px', background: '#1c1c26', margin: '0 4px' }} />

          <button
            onClick={handleAnalyze}
            style={{
              marginLeft: 'auto',
              padding: '10px 40px',
              background: '#00ff88',
              color: '#020204',
              fontFamily: MONO,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#00e5ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#00ff88'; }}
          >
            EXECUTE ANALYSIS
          </button>
        </section>

        {/* ── LOADING ────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #1c1c26', borderTop: '2px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#4a4a6a', fontSize: '11px', fontFamily: MONO, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Fetching data and running analysis…</p>
          </div>
        )}

        {/* ── ERROR ──────────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', padding: '16px 20px', color: '#ef4444', fontSize: '13px', fontFamily: MONO, marginBottom: '24px', letterSpacing: '0.05em' }}>
            ERROR: {error}
          </div>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────────── */}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* Metric cards grid */}
            <section style={{ display: 'grid', gridTemplateColumns: hasTrendCard ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', marginBottom: '40px' }}>
              <MetricCard
                label="Divergence"
                value={data.divergenceScore > 0 ? `+${data.divergenceScore}` : String(data.divergenceScore)}
                valueColor={SIGNAL_COLORS[data.signal]}
              />
              <MetricCard label="Signal Class" value={data.signal} valueColor={SIGNAL_COLORS[data.signal]} sub={SIGNAL_SUBTEXTS[data.signal]} />
              <MetricCard
                label="Sentiment"
                value={`${Math.round(data.sentiment.score)}/100`}
                valueColor="#7c3aed"
              />
              <MetricCard
                label="Price Change"
                value={`${data.priceChangePercent > 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%`}
                sub={`Over ${data.timeframe} days`}
                valueColor={data.priceChangePercent >= 0 ? '#00ff88' : '#ef4444'}
              />
              {hasTrendCard && (
                <MetricCard
                  label="Search Trend"
                  value={`${data.trendScore}${TREND_ARROWS[data.trendDirection]}`}
                  sub={data.trendDirection}
                  valueColor={TREND_COLORS[data.trendDirection]}
                />
              )}
            </section>

            {/* Main workspace: chart + sidebar */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: '3fr 1fr',
              border: '1px solid #1c1c26',
              marginBottom: '40px',
              gap: '1px',
              background: '#1c1c26',
            }}>
              {/* Chart area */}
              <div style={{ background: '#020204', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h3 style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                    Conv. Model // Normalised_Delta
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <LegendDot color="#00e5ff" label="Norm. Price" />
                    <LegendDot color="#7c3aed" label="Sentiment Score" dashed />
                    {hasTrendLine && <LegendDot color="#f97316" label="Search Trend" />}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillSentiment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f1118" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#4a4a6a', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} interval={xInterval} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#4a4a6a', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0c0d14', border: '1px solid #252535', borderRadius: 0, fontSize: 11, fontFamily: MONO }}
                      labelStyle={{ color: '#4a4a6a', marginBottom: '4px' }}
                      cursor={{ stroke: 'rgba(124,58,237,0.3)' }}
                    />
                    <Legend content={() => null} />
                    <ReferenceLine y={50} stroke="#1c1c26" strokeDasharray="4 3" strokeWidth={1} />
                    <Area type="monotone" dataKey="Norm. Price" stroke="#00e5ff" strokeWidth={2} fill="url(#fillPrice)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                    <Area type="monotone" dataKey="Sentiment Score" stroke="#7c3aed" strokeWidth={2} strokeDasharray="5 3" fill="url(#fillSentiment)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                    {hasTrendLine && (
                      <Area type="monotone" dataKey="Search Trend" stroke="#f97316" strokeWidth={2} fill="url(#fillTrend)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Sidebar info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#1c1c26' }}>
                {/* Sentiment mix */}
                <div style={{ background: '#020204', padding: '32px', flex: 1 }}>
                  <p style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px' }}>Sentiment Mix</p>
                  <div style={{ height: '6px', display: 'flex', background: '#1c1c26', marginBottom: '24px' }}>
                    <div style={{ width: `${data.sentiment.bullish}%`, background: '#00ff88' }} />
                    <div style={{ width: `${data.sentiment.neutral}%`, background: '#2a2a3a' }} />
                    <div style={{ width: `${data.sentiment.bearish}%`, background: '#ef4444' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a' }}>BULLISH</span>
                      <span style={{ fontFamily: MONO, fontSize: '11px', color: '#00ff88', fontWeight: 700 }}>{data.sentiment.bullish}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a' }}>NEUTRAL</span>
                      <span style={{ fontFamily: MONO, fontSize: '11px', color: '#4a4a6a', fontWeight: 700 }}>{data.sentiment.neutral}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a' }}>BEARISH</span>
                      <span style={{ fontFamily: MONO, fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>{data.sentiment.bearish}%</span>
                    </div>
                  </div>
                </div>

                {/* System insight */}
                <div style={{ background: '#020204', padding: '32px', flex: 1, borderTop: '1px solid #1c1c26' }}>
                  <p style={{ fontFamily: MONO, fontSize: '10px', color: '#00e5ff', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 700 }}>SYSTEM_INSIGHT</p>
                  <p style={{ fontFamily: BODY, fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>{data.insight}</p>
                </div>
              </div>
            </section>

            {/* Entry/Exit panel */}
            {data.entryExitLabel && (
              <section style={{
                background: '#020204',
                border: '1px solid rgba(0,255,136,0.3)',
                padding: '32px',
                marginBottom: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '32px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={getBadgeStyle(data.entryExitLabel)}>{data.entryExitLabel}</span>
                  <p style={{ fontFamily: BODY, color: '#6b7280', fontSize: '13px', lineHeight: 1.6, maxWidth: '60ch' }}>{data.entryExitExplanation}</p>
                </div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: '#2a2a3a', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.15em', lineHeight: 2 }}>
                  QUANTITATIVE ANALYSIS ONLY<br />
                  NOT FINANCIAL ADVICE
                </div>
              </section>
            )}

            {/* ── PRICE INTELLIGENCE ─────────────────────────────────────── */}
            <div id="price-intelligence" style={{ background: '#020204', border: '1px solid #1c1c26', padding: '24px', marginBottom: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Price Intelligence</p>
                <a
                  href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=price-intelligence`}
                  style={{ color: '#2a2a3a', fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00e5ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#2a2a3a'; }}
                >
                  View Details →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: '#0f1118', marginBottom: '1px' }}>
                {/* RSI */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>RSI (14-day)</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>Momentum · 0=oversold, 100=overbought</p>
                  <p style={{ color: rsiColor, fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.priceIntelligence.rsi}
                  </p>
                  <Badge label={data.priceIntelligence.rsiLabel} color={rsiColor} bg={rsiColor + '18'} />
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO, marginTop: '10px' }}>
                    {data.priceIntelligence.rsi < 30 ? 'May be oversold — potential bounce zone' : data.priceIntelligence.rsi > 70 ? 'May be overbought — pullback risk' : 'Neutral — no momentum extreme'}
                  </p>
                </div>
                {/* 200 MA */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>200-Day MA</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>Long-term trend average price</p>
                  <p style={{ color: '#e5e1e8', fontSize: '1.5rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.currencySymbol}{data.priceIntelligence.ma200.toFixed(2)}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <Badge
                      label={data.priceIntelligence.ma200Label}
                      color={data.priceIntelligence.ma200Label === 'Above' ? '#00ff88' : '#ef4444'}
                      bg={data.priceIntelligence.ma200Label === 'Above' ? '#00ff8818' : '#ef444418'}
                    />
                    <span style={{ color: '#4a4a6a', fontSize: '11px', fontFamily: MONO }}>
                      {data.priceIntelligence.ma200PercentDiff > 0 ? '+' : ''}{data.priceIntelligence.ma200PercentDiff.toFixed(1)}%
                    </span>
                  </div>
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO }}>
                    {data.priceIntelligence.ma200Label === 'Above' ? 'Price above trend — long-term uptrend intact' : 'Price below trend — long-term pressure remains'}
                  </p>
                </div>
                {/* ATR */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>ATR (14-day)</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>Avg daily price swing over 14 days</p>
                  <p style={{ color: '#e5e1e8', fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.currencySymbol}{data.priceIntelligence.atr.toFixed(2)}
                  </p>
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO }}>
                    Moves ~{data.currencySymbol}{data.priceIntelligence.atr.toFixed(2)} per trading day
                  </p>
                </div>
                {/* MA Cross */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>MA Cross Signal</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>50-day vs 200-day crossover</p>
                  <div style={{ marginBottom: '10px' }}>
                    <Badge
                      label={data.priceIntelligence.crossSignal === 'None' ? 'No recent cross' : data.priceIntelligence.crossSignal}
                      color={data.priceIntelligence.crossSignal === 'Golden Cross' ? '#fbbf24' : data.priceIntelligence.crossSignal === 'Death Cross' ? '#ef4444' : '#4a4a6a'}
                      bg={data.priceIntelligence.crossSignal === 'Golden Cross' ? '#fbbf2418' : data.priceIntelligence.crossSignal === 'Death Cross' ? '#ef444418' : '#1c1c26'}
                    />
                  </div>
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO }}>
                    {data.priceIntelligence.crossSignal === 'Golden Cross' ? 'Bullish crossover — 50MA rose above 200MA' : data.priceIntelligence.crossSignal === 'Death Cross' ? 'Bearish crossover — 50MA fell below 200MA' : 'No crossover detected in last 10 trading days'}
                  </p>
                </div>
              </div>
              {/* 52-week range */}
              <div style={{ background: '#020204', border: '1px solid #0f1118', padding: '16px', marginTop: '1px' }}>
                <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>52-Week Range</p>
                <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '4px' }}>Where current price sits within its yearly range</p>
                <WeekRangeBar
                  position={data.priceIntelligence.weekRange52Position}
                  low={data.priceIntelligence.low52}
                  high={data.priceIntelligence.high52}
                  currencySymbol={data.currencySymbol}
                />
              </div>
            </div>

            {/* ── FUNDAMENTALS ───────────────────────────────────────────── */}
            <div id="fundamentals" style={{ background: '#020204', border: '1px solid #1c1c26', borderTop: 'none', padding: '24px', marginBottom: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Fundamentals</p>
                <a
                  href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=fundamentals`}
                  style={{ color: '#2a2a3a', fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00e5ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#2a2a3a'; }}
                >
                  View Details →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
                <div>
                  <StatRow label="P/E Ratio (trailing)" hint="Stock price ÷ earnings" value={fmt(data.fundamentals.peRatio, 1)} />
                  <StatRow label="Forward P/E" hint="P/E using next year's expected earnings" value={fmt(data.fundamentals.forwardPE, 1)} />
                  <StatRow label="PEG Ratio" hint="P/E adjusted for growth" value={fmt(data.fundamentals.pegRatio, 2)} />
                  <StatRow label="Revenue Growth (YoY)" value={fmtPct(data.fundamentals.revenueGrowth)} color={data.fundamentals.revenueGrowth !== null ? (data.fundamentals.revenueGrowth >= 0 ? '#00ff88' : '#ef4444') : undefined} />
                  <StatRow label="Gross Margins" value={fmtPct(data.fundamentals.grossMargins)} />
                </div>
                <div>
                  <StatRow label="Return on Equity" value={fmtPct(data.fundamentals.returnOnEquity)} color={data.fundamentals.returnOnEquity !== null ? (data.fundamentals.returnOnEquity >= 0 ? '#00ff88' : '#ef4444') : undefined} />
                  <StatRow label="Debt / Equity" value={fmt(data.fundamentals.debtToEquity, 2)} />
                  <StatRow label="Current Ratio" value={fmt(data.fundamentals.currentRatio, 2)} />
                  <StatRow label="Dividend Yield" value={fmtPct(data.fundamentals.dividendYield)} />
                  <StatRow label="Sector" value={data.fundamentals.sector ?? '—'} />
                </div>
              </div>
            </div>

            {/* ── MOMENTUM & FLOW ────────────────────────────────────────── */}
            <div id="momentum" style={{ background: '#020204', border: '1px solid #1c1c26', borderTop: 'none', padding: '24px', marginBottom: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Momentum &amp; Flow</p>
                <a
                  href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=momentum`}
                  style={{ color: '#2a2a3a', fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00e5ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#2a2a3a'; }}
                >
                  View Details →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: '#0f1118' }}>
                {/* Institutional */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Institutional Ownership</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>% shares held by funds & institutions</p>
                  <p style={{ color: '#e5e1e8', fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.momentumFlow.institutionalOwnershipPercent !== null ? `${data.momentumFlow.institutionalOwnershipPercent.toFixed(1)}%` : '—'}
                  </p>
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO }}>
                    {data.momentumFlow.institutionalOwnershipPercent === null ? 'Data unavailable' : data.momentumFlow.institutionalOwnershipPercent > 70 ? 'Strong institutional backing' : data.momentumFlow.institutionalOwnershipPercent > 30 ? 'Moderate institutional interest' : 'Light institutional presence'}
                  </p>
                </div>
                {/* Insider */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Insider Activity (90 days)</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>Trades by executives & directors</p>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', marginBottom: '10px' }}>
                    <span style={{ color: '#00ff88', fontSize: '1.3rem', fontFamily: MONO, fontWeight: 700 }}>{data.momentumFlow.insiderBuys}↑</span>
                    <span style={{ color: '#ef4444', fontSize: '1.3rem', fontFamily: MONO, fontWeight: 700 }}>{data.momentumFlow.insiderSells}↓</span>
                  </div>
                  <Badge label={data.momentumFlow.insiderSentiment} color={insiderColors[data.momentumFlow.insiderSentiment]} bg={insiderColors[data.momentumFlow.insiderSentiment] + '18'} />
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO, marginTop: '10px' }}>
                    {data.momentumFlow.insiderSentiment === 'Buying' ? 'Insiders accumulating — vote of confidence' : data.momentumFlow.insiderSentiment === 'Selling' ? 'Insiders reducing holdings — worth monitoring' : 'No clear directional signal from insiders'}
                  </p>
                </div>
                {/* Short interest */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Short Interest</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>% shares borrowed to bet against stock</p>
                  <p style={{ color: '#e5e1e8', fontSize: '1.5rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.momentumFlow.shortPercentOfFloat !== null ? `${(data.momentumFlow.shortPercentOfFloat * 100).toFixed(1)}%` : '—'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <Badge label={data.momentumFlow.shortLabel} color={shortColors[data.momentumFlow.shortLabel]} bg={shortColors[data.momentumFlow.shortLabel] + '18'} />
                    {data.momentumFlow.shortRatio !== null && (
                      <span style={{ color: '#4a4a6a', fontSize: '11px', fontFamily: MONO }}>{data.momentumFlow.shortRatio.toFixed(1)}d to cover</span>
                    )}
                  </div>
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO }}>
                    {data.momentumFlow.shortLabel === 'High' ? 'Heavily shorted — high short squeeze potential' : data.momentumFlow.shortLabel === 'Elevated' ? 'Elevated short pressure on the stock' : 'Low short pressure — normal trading activity'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── RISK PROFILE ───────────────────────────────────────────── */}
            <div id="risk-profile" style={{ background: '#020204', border: '1px solid #1c1c26', borderTop: 'none', padding: '24px', marginBottom: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Risk Profile</p>
                <a
                  href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=risk-profile`}
                  style={{ color: '#2a2a3a', fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00e5ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#2a2a3a'; }}
                >
                  View Details →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: '#0f1118' }}>
                {/* Beta */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Beta</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>Volatility vs market · 1.0 = moves with market</p>
                  <p style={{ color: '#e5e1e8', fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.riskProfile.beta !== null ? data.riskProfile.beta.toFixed(2) : '—'}
                  </p>
                  <Badge label={data.riskProfile.betaLabel} color={betaColors[data.riskProfile.betaLabel]} bg={betaColors[data.riskProfile.betaLabel] + '18'} />
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO, marginTop: '10px' }}>
                    {data.riskProfile.betaLabel === 'Low' ? 'Moves less than the market — more defensive' : data.riskProfile.betaLabel === 'Moderate' ? 'Roughly in line with the broader market' : data.riskProfile.betaLabel === 'High' ? 'More volatile than the market' : 'Significantly more volatile — high risk/reward'}
                  </p>
                </div>
                {/* Realized vol */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Realized Volatility</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>Annualized price swing — last 30 days</p>
                  <p style={{ color: volColors[data.riskProfile.volatilityLabel], fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.riskProfile.realizedVolatility.toFixed(1)}%
                  </p>
                  <Badge label={data.riskProfile.volatilityLabel} color={volColors[data.riskProfile.volatilityLabel]} bg={volColors[data.riskProfile.volatilityLabel] + '18'} />
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO, marginTop: '10px' }}>
                    {data.riskProfile.volatilityLabel === 'Low' ? 'Calm price action — relatively stable' : data.riskProfile.volatilityLabel === 'Moderate' ? 'Normal price variation for most stocks' : data.riskProfile.volatilityLabel === 'High' ? 'Elevated swings — expect larger daily moves' : 'Extreme volatility — very high risk profile'}
                  </p>
                </div>
                {/* Max drawdown */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Max Drawdown</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>Worst peak-to-trough decline in period</p>
                  <p style={{ color: '#ef4444', fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.riskProfile.maxDrawdown.toFixed(1)}%
                  </p>
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO }}>
                    Worst loss from peak: {Math.abs(data.riskProfile.maxDrawdown).toFixed(1)}%
                  </p>
                </div>
                {/* Sharpe */}
                <div style={{ background: '#020204', padding: '16px' }}>
                  <p style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Sharpe Ratio</p>
                  <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: MONO, marginBottom: '12px' }}>Return per unit of risk · above 1 = good</p>
                  <p style={{
                    color: data.riskProfile.sharpeRatio === null ? '#4a4a6a' : data.riskProfile.sharpeRatio >= 1 ? '#00ff88' : data.riskProfile.sharpeRatio >= 0 ? '#555' : '#ef4444',
                    fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em'
                  }}>
                    {data.riskProfile.sharpeRatio !== null ? data.riskProfile.sharpeRatio.toFixed(2) : '—'}
                  </p>
                  <p style={{ color: '#4a4a6a', fontSize: '10px', fontFamily: MONO }}>
                    {data.riskProfile.sharpeRatio === null ? 'Insufficient data' : data.riskProfile.sharpeRatio >= 1 ? 'Strong risk-adjusted performance' : data.riskProfile.sharpeRatio >= 0 ? 'Modest compensation for risk' : "Returns haven't justified the volatility"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── PEER COMPARISON ────────────────────────────────────────── */}
            {data.peerComparison.peers.length > 0 && (
              <div id="peer-comparison" style={{ background: '#020204', border: '1px solid #1c1c26', borderTop: 'none', padding: '24px', marginBottom: '1px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Peer Comparison</p>
                  <a
                    href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=peer-comparison`}
                    style={{ color: '#2a2a3a', fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00e5ff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#2a2a3a'; }}
                  >
                    View Details →
                  </a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '0 0 12px', borderBottom: '1px solid #1c1c26', marginBottom: '4px' }}>
                  <span style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Company</span>
                  <span style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'right' }}>Price Chg</span>
                  <span style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'right' }}>P/E</span>
                  <span style={{ color: '#4a4a6a', fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'right' }}>vs Target</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '12px 8px', background: 'rgba(0,229,255,0.03)', borderBottom: '1px solid #0f1118', marginBottom: '2px' }}>
                  <span style={{ color: '#e5e1e8', fontSize: '12px', fontFamily: BODY }}>
                    {data.companyName}
                    <span style={{ marginLeft: '8px', color: '#00e5ff', fontSize: '9px', fontFamily: MONO, background: 'rgba(0,229,255,0.1)', padding: '1px 6px', letterSpacing: '0.1em' }}>TARGET</span>
                  </span>
                  <span style={{ color: data.priceChangePercent >= 0 ? '#00ff88' : '#ef4444', fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>
                    {data.priceChangePercent >= 0 ? '+' : ''}{data.priceChangePercent.toFixed(2)}%
                  </span>
                  <span style={{ color: '#e5e1e8', fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>{fmt(data.fundamentals.peRatio, 1)}</span>
                  <span style={{ color: '#4a4a6a', fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>—</span>
                </div>
                {data.peerComparison.peers.map((peer, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '12px 0', borderBottom: i < data.peerComparison.peers.length - 1 ? '1px solid #0f1118' : 'none' }}>
                    <span style={{ color: '#6b7280', fontSize: '12px', fontFamily: BODY }}>{peer.companyName}</span>
                    <span style={{ color: peer.priceChangePercent >= 0 ? '#00ff88' : '#ef4444', fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>
                      {peer.priceChangePercent >= 0 ? '+' : ''}{peer.priceChangePercent.toFixed(2)}%
                    </span>
                    <span style={{ color: '#e5e1e8', fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>
                      {peer.peRatio !== null ? peer.peRatio.toFixed(1) : '—'}
                    </span>
                    <span style={{ color: peer.relativeStrength >= 0 ? '#00ff88' : '#ef4444', fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>
                      {peer.relativeStrength >= 0 ? '+' : ''}{peer.relativeStrength.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── HEADLINES ──────────────────────────────────────────────── */}
            <div style={{ background: '#020204', border: '1px solid #1c1c26', borderTop: 'none', overflow: 'hidden' }}>
              <button
                onClick={() => setHeadlinesExpanded(!headlinesExpanded)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '18px 24px',
                  background: 'rgba(255,255,255,0.01)', border: 'none', cursor: 'pointer',
                  borderBottom: headlinesExpanded ? '1px solid #0f1118' : 'none',
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                  Signal Context / Headlines ({data.headlines.length})
                </span>
                <span style={{ color: '#4a4a6a', fontSize: '12px', fontFamily: MONO }}>{headlinesExpanded ? '▲' : '▼'}</span>
              </button>
              {headlinesExpanded && (
                <div>
                  {data.headlines.map((h, i) => (
                    <div key={i} style={{
                      padding: '14px 24px',
                      borderBottom: i < data.headlines.length - 1 ? '1px solid #0f1118' : 'none',
                      color: '#4a4a6a', fontSize: '13px', fontFamily: BODY, lineHeight: 1.6,
                    }}>
                      {h}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      <TickerTape />
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
export default function SignalPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#020204' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #1c1c26', borderTop: '2px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: '10px', color: '#4a4a6a', letterSpacing: '0.2em', textTransform: 'uppercase' }}>INITIALIZING</span>
        </div>
      </div>
    }>
      <SignalContent />
    </Suspense>
  );
}
