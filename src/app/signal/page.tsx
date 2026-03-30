'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import React from 'react';
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
import { C, T, styles as DT } from '@/lib/designTokens';
const MONO = T.MONO;
const SERIF = T.SERIF;
const BODY = T.BODY;

const SIGNAL_COLORS: Record<SignalType, string> = {
  Overconfidence: C.RED,
  'Mild Optimism': C.ORANGE,
  Aligned: C.GREEN,
  'Mild Pessimism': C.ORANGE,
  'Hidden Strength': C.CYAN,
};

const SIGNAL_SUBTEXTS: Record<SignalType, string> = {
  Overconfidence: 'Crowd more bullish than price justifies',
  'Mild Optimism': 'Sentiment slightly ahead of price',
  Aligned: 'Sentiment and price are in sync',
  'Mild Pessimism': 'Price outpacing negative sentiment',
  'Hidden Strength': 'Price rising despite bearish crowd',
};

const TREND_COLORS: Record<TrendDirection, string> = {
  Rising: C.GREEN,
  Falling: C.RED,
  Stable: C.NEUTRAL,
};

const TREND_ARROWS: Record<TrendDirection, string> = {
  Rising: '↑',
  Falling: '↓',
  Stable: '→',
};

const SECTION_LABEL: CSSProperties = {
  fontSize: '10px',
  fontFamily: MONO,
  color: C.TEXT3,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  marginBottom: '16px',
};


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
    return { ...base, border: `1px solid ${C.BORDER}`, background: 'transparent', color: C.NEUTRAL };
  }
  if (label === 'Potential Entry Zone') {
    return { ...base, border: `1px solid ${C.GREEN}4d`, background: C.GREEN + '0d', color: C.GREEN };
  }
  if (label === 'Caution — Consider Exit') {
    return { ...base, border: `1px solid ${C.RED}4d`, background: C.RED + '0d', color: C.RED };
  }
  return { ...base, border: `1px solid ${C.ORANGE}4d`, background: C.ORANGE + '0d', color: C.ORANGE };
}

// ── Top Nav ───────────────────────────────────────────────────────────────────
function TopNav({ company = '', timeframe = 30 }: { company?: string; timeframe?: number }) {
  const navLink: React.CSSProperties = { fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' as const, textDecoration: 'none', color: C.TEXT2 };
  const activeLink: React.CSSProperties = { ...navLink, color: C.GREEN, borderBottom: `1px solid ${C.GREEN}`, paddingBottom: '2px' };
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '48px',
      background: C.BG, borderBottom: `1px solid ${C.BORDER_FAINT}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 32px', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 700, letterSpacing: '0.2em', color: C.TEXT }}>MARKORA</span>
        </Link>
        <div style={{ display: 'flex', gap: '32px' }}>
          <span style={activeLink}>SIGNALS</span>
          {company && (
            <Link href={`/signal/details?company=${encodeURIComponent(company)}&timeframe=${timeframe}`} style={navLink}>DEEP ANALYSIS</Link>
          )}
          <Link href="/markets" style={navLink}>MARKETS</Link>
          <Link href="/methodology" style={navLink}>METHODOLOGY</Link>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.GREEN, animation: 'pulse 2s infinite' }} />
        <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>LIVE_FEED</span>
      </div>
    </nav>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, valueColor, index = 0,
}: {
  label: string; value: string; sub?: string; valueColor?: string; index?: number;
}) {
  const fontSize = value.length > 14 ? '1.05rem' : value.length > 10 ? '1.35rem' : value.length > 7 ? '1.7rem' : '2.1rem';
  return (
    <div style={{
      minWidth: 0, background: C.SURFACE, padding: '24px 24px 20px',
      borderBottom: `2px solid ${valueColor ? valueColor + '30' : C.BORDER_FAINT}`,
      animation: 'fadeSlideUp 400ms ease forwards',
      animationDelay: `${index * 80}ms`,
      opacity: 0,
    }}>
      <p style={{ color: C.TEXT3, fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase', fontFamily: MONO, marginBottom: '18px' }}>
        {label}
      </p>
      <p style={{ color: valueColor ?? C.TEXT, fontSize, fontWeight: 700, fontFamily: MONO, lineHeight: 1.1, marginBottom: sub ? '10px' : 0, wordBreak: 'break-word', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && <p style={{ color: C.TEXT2, fontSize: '12px', fontFamily: BODY, lineHeight: 1.5, marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({ label, hint, value, color }: { label: string; hint?: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${C.BORDER_FAINT}`, gap: '16px' }}>
      <div>
        <span style={{ color: C.TEXT2, fontSize: '13px', fontFamily: MONO }}>{label}</span>
        {hint && <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginTop: '2px' }}>{hint}</p>}
      </div>
      <span style={{ color: color ?? C.TEXT, fontSize: '13px', fontFamily: MONO, fontWeight: 500, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// ── Small badge ───────────────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: '10px', padding: '3px 10px', color, background: bg, letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderRadius: '0' }}>
      {label}
    </span>
  );
}


// ── Sentiment bar ─────────────────────────────────────────────────────────────
function SentimentBar({ bullish, neutral, bearish }: { bullish: number; neutral: number; bearish: number }) {
  return (
    <div>
      <div style={{ display: 'flex', overflow: 'hidden', height: '6px', background: C.BORDER, marginBottom: '16px' }}>
        <div style={{ width: `${bullish}%`, background: C.GREEN }} />
        <div style={{ width: `${neutral}%`, background: C.TEXT3 }} />
        <div style={{ width: `${bearish}%`, background: C.RED }} />
      </div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <span style={{ color: C.GREEN, fontSize: '11px', fontFamily: MONO, fontWeight: 700 }}>BULLISH {bullish}%</span>
        <span style={{ color: C.TEXT2, fontSize: '11px', fontFamily: MONO }}>NEUTRAL {neutral}%</span>
        <span style={{ color: C.RED, fontSize: '11px', fontFamily: MONO, fontWeight: 700 }}>BEARISH {bearish}%</span>
      </div>
    </div>
  );
}

// ── Chart legend dot ──────────────────────────────────────────────────────────
function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginRight: '24px' }}>
      <span style={{ width: '16px', height: '2px', background: dashed ? 'transparent' : color, display: 'inline-block', borderTop: dashed ? `2px dashed ${color}` : 'none' }} />
      <span style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>{label}</span>
    </span>
  );
}

// ── 52-week range bar ─────────────────────────────────────────────────────────
function WeekRangeBar({ position, low, high, currencySymbol }: { position: number; low: number; high: number; currencySymbol: string }) {
  const clamp = Math.min(100, Math.max(0, position));
  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ position: 'relative', height: '4px', background: C.BORDER, margin: '12px 0 10px' }}>
        <div style={{ position: 'absolute', left: `${clamp}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', background: C.CYAN, boxShadow: `0 0 8px ${C.CYAN}80` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.TEXT2, fontFamily: MONO }}>
        <span>L {currencySymbol}{low.toFixed(2)}</span>
        <span style={{ color: C.TEXT3 }}>{clamp.toFixed(0)}th percentile</span>
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

    const CACHE_KEY = `markora_signal_${rawTicker}_${timeframe}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const run = async () => {
      // Check sessionStorage cache first
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedData, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) {
              setData(cachedData as AnalyzeResponse);
              setLoading(false);
            }
            return;
          }
        }
      } catch { /* ignore storage errors */ }

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
          if (!res.ok) {
            setError((json as ApiError).error ?? 'Analysis failed');
          } else {
            setData(json as AnalyzeResponse);
            try {
              sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: json, ts: Date.now() }));
            } catch { /* ignore storage errors */ }
          }
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

  if (!rawTicker) {
    return (
      <>
        <TopNav />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 48px)', padding: '24px', marginTop: '48px' }}>
          <p style={{ color: C.TEXT3, fontFamily: MONO, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '24px' }}>NO TICKER SELECTED</p>
          <p style={{ color: C.TEXT2, fontFamily: BODY, fontSize: '15px', lineHeight: 1.7, maxWidth: '360px', textAlign: 'center', marginBottom: '32px' }}>
            Enter a company name or ticker symbol on the terminal to run a divergence analysis.
          </p>
          <Link href="/" style={{ color: C.TEXT, fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase', border: `1px solid ${C.BORDER}`, padding: '12px 28px', background: C.SURFACE }}>← RETURN TO TERMINAL</Link>
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

  const rsiColor = !data ? C.NEUTRAL :
    data.priceIntelligence.rsiLabel === 'Overbought' ? C.RED :
    data.priceIntelligence.rsiLabel === 'Oversold' ? C.GREEN : C.NEUTRAL;

  const betaColors: Record<string, string> = { Low: C.GREEN, Moderate: C.NEUTRAL, High: C.ORANGE, 'Very High': C.RED };
  const volColors: Record<string, string> = { Low: C.GREEN, Moderate: C.NEUTRAL, High: C.ORANGE, 'Very High': C.RED };
  const shortColors: Record<string, string> = { Normal: C.GREEN, Elevated: C.ORANGE, High: C.RED };
  const insiderColors: Record<string, string> = { Buying: C.GREEN, Selling: C.RED, Neutral: C.NEUTRAL };

  return (
    <div style={{ background: C.BG, minHeight: '100vh', fontFamily: BODY }}>

      {/* ── FIXED TOP NAV ────────────────────────────────────────────────── */}
      <TopNav company={data?.companyName ?? rawTicker} timeframe={timeframe} />

      {/* ── FIXED LEFT SIDEBAR ───────────────────────────────────────────── */}
      {data && (
        <aside style={{
          position: 'fixed',
          left: 0,
          top: '48px',
          height: 'calc(100vh - 48px - 32px)',
          width: '220px',
          flexShrink: 0,
          background: C.BG,
          borderRight: `1px solid ${C.BORDER_FAINT}`,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '24px',
          overflowY: 'auto',
          zIndex: 40,
        }}>
          {/* Title block */}
          <div style={{ padding: '0 24px', marginBottom: '20px' }}>
            <p style={{
              fontFamily: T.MONO,
              fontSize: '10px',
              color: C.GREEN,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>TERMINAL_V1.04</p>
            <p style={{
              fontFamily: T.MONO,
              fontSize: '9px',
              color: C.TEXT3,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>SIGNAL_BOARD</p>
          </div>

          {/* Page indicator chip */}
          <div style={{ padding: '0 24px', marginBottom: '28px' }}>
            <span style={{
              fontFamily: T.MONO,
              fontSize: '9px',
              color: C.CYAN,
              background: C.CYAN + '18',
              border: `1px solid ${C.CYAN}30`,
              padding: '3px 10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>VIEW: SIGNAL_BOARD</span>
          </div>

          {/* Sections label */}
          <p style={{
            fontFamily: T.MONO,
            fontSize: '9px',
            color: C.TEXT3,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            padding: '0 24px',
            marginBottom: '16px',
          }}>SECTIONS</p>

          {/* Deep analysis nav links */}
          {NAV_SECTIONS.map(section => {
            if (section.id === 'peer-comparison' && !(data.peerComparison?.peers?.length > 0)) return null;
            return (
              <a
                key={section.id}
                href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=${section.id}`}
                style={DT.navItem(false)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.TEXT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.TEXT2; }}
              >
                {section.label.toUpperCase()}
              </a>
            );
          })}
        </aside>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main style={{
        marginLeft: data ? '220px' : '0',
        marginTop: '48px',
        padding: '40px 40px 48px',
        minHeight: 'calc(100vh - 48px)',
        background: C.BG,
      }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '24px', marginBottom: '40px', paddingBottom: '32px',
          borderBottom: `1px solid ${C.BORDER_FAINT}`, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: '2.8rem', fontWeight: 800, color: C.TEXT, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {data?.companyName ?? rawTicker}
            </h1>
            {data && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: MONO, fontSize: '1.8rem', fontWeight: 700, color: C.TEXT }}>
                  {data.currencySymbol}{data.priceIntelligence?.ma200?.toFixed(2) ?? '—'}
                </span>
                <span style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: data.priceChangePercent >= 0 ? C.GREEN : C.RED }}>
                  {data.priceChangePercent >= 0 ? '+' : ''}{data.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {data && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Signal Status</span>
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
                <div style={{ width: '1px', height: '40px', background: C.BORDER_FAINT }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  {data.fundamentals.sector && (
                    <span style={{ padding: '4px 10px', background: C.ELEVATED, border: `1px solid ${C.BORDER}`, fontFamily: MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {data.fundamentals.sector}
                    </span>
                  )}
                  {data.fundamentals.industry && (
                    <span style={{ padding: '4px 10px', background: C.ELEVATED, border: `1px solid ${C.BORDER}`, fontFamily: MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {data.fundamentals.industry}
                    </span>
                  )}
                </div>
              </>
            )}
            <Link href="/" style={{ color: C.TEXT2, fontFamily: MONO, fontSize: '10px', textDecoration: 'none', border: `1px solid ${C.BORDER}`, padding: '8px 16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT; (e.currentTarget as HTMLAnchorElement).style.borderColor = C.BORDER; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT2; (e.currentTarget as HTMLAnchorElement).style.borderColor = C.BORDER; }}
            >
              ← Home
            </Link>
          </div>
        </header>

        {/* ── CONTROLS BAR ───────────────────────────────────────────────── */}
        <section style={{
          border: `1px solid ${C.BORDER}`,
          padding: '6px',
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          background: C.BG,
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
              placeholder="SEARCH COMPANY..."
              style={{
                width: '100%',
                background: C.SURFACE,
                border: `1px solid ${C.BORDER}`,
                color: C.TEXT,
                fontFamily: MONO,
                fontSize: '10px',
                height: '40px',
                padding: '0 16px',
                outline: 'none',
                letterSpacing: '0.1em',
                boxSizing: 'border-box' as const,
              }}
              onFocusCapture={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.CYAN; }}
              onBlurCapture={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.BORDER; }}
            />
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: C.SURFACE,
                border: `1px solid ${C.BORDER}`,
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
                      borderBottom: i < suggestions.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.ELEVATED; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span style={{ color: C.TEXT, fontSize: '12px', fontFamily: BODY, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    {s.exchange && (
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT2, background: C.ELEVATED, padding: '2px 6px' }}>{s.exchange}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', background: C.SURFACE, padding: '2px' }}>
            {([7, 30, 90] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                style={{
                  padding: '6px 20px',
                  fontFamily: MONO, fontSize: '10px', letterSpacing: '0.1em',
                  cursor: 'pointer', border: 'none',
                  background: selectedTimeframe === tf ? C.CYAN : 'transparent',
                  color: selectedTimeframe === tf ? C.BG : C.TEXT2,
                  ...(selectedTimeframe === tf ? { border: 'none' } : {}),
                }}
              >
                {tf}D
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '28px', background: C.BORDER, margin: '0 4px' }} />

          <button
            onClick={handleAnalyze}
            style={{
              marginLeft: 'auto',
              padding: '10px 40px',
              background: C.SURFACE,
              color: C.TEXT,
              fontFamily: MONO,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              border: `1px solid ${C.BORDER}`,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.CYAN; (e.currentTarget as HTMLButtonElement).style.color = C.CYAN; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.BORDER; (e.currentTarget as HTMLButtonElement).style.color = C.TEXT; }}
          >
            ANALYZE
          </button>
        </section>

        {/* ── LOADING ────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '100px 0' }}>
            <div style={{ position: 'relative', width: '40px', height: '40px' }}>
              <div style={{ position: 'absolute', inset: 0, border: `1px solid ${C.BORDER}`, borderTop: `1px solid ${C.CYAN}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
              <div style={{ position: 'absolute', inset: '8px', border: `1px solid ${C.BORDER_FAINT}`, borderBottom: `1px solid ${C.VIOLET}`, borderRadius: '50%', animation: 'spin 1.4s linear infinite reverse' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: C.TEXT2, fontSize: '10px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>RUNNING ANALYSIS</p>
              <p style={{ color: C.TEXT3, fontSize: '10px', fontFamily: MONO, letterSpacing: '0.1em' }}>Fetching market data &amp; scoring divergence…</p>
            </div>
          </div>
        )}

        {/* ── ERROR ──────────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background: C.RED + '0a', border: `1px solid ${C.RED}33`, borderLeft: `3px solid ${C.RED}`, padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ color: C.RED, fontFamily: MONO, fontSize: '12px', fontWeight: 700, flexShrink: 0, letterSpacing: '0.1em' }}>ERR</span>
            <div>
              <p style={{ color: C.RED, fontSize: '12px', fontFamily: MONO, letterSpacing: '0.08em', marginBottom: '4px', fontWeight: 600 }}>{error}</p>
              <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY }}>Check the ticker symbol and try again, or return to the terminal.</p>
            </div>
          </div>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────────── */}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* Metric cards grid */}
            <section style={{ display: 'grid', gridTemplateColumns: hasTrendCard ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', marginBottom: '40px', gap: '1px', background: C.BORDER_FAINT }}>
              <MetricCard
                index={0}
                label="Divergence"
                value={data.divergenceScore > 0 ? `+${data.divergenceScore}` : String(data.divergenceScore)}
                valueColor={SIGNAL_COLORS[data.signal]}
              />
              <MetricCard index={1} label="Signal Class" value={data.signal} valueColor={SIGNAL_COLORS[data.signal]} sub={SIGNAL_SUBTEXTS[data.signal]} />
              <MetricCard
                index={2}
                label="Sentiment"
                value={`${Math.round(data.sentiment.score)}/100`}
                valueColor={C.VIOLET}
              />
              <MetricCard
                index={3}
                label="Price Change"
                value={`${data.priceChangePercent > 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%`}
                sub={`Over ${data.timeframe} days`}
                valueColor={data.priceChangePercent >= 0 ? C.GREEN : C.RED}
              />
              {hasTrendCard && (
                <MetricCard
                  index={4}
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
              border: `1px solid ${C.BORDER}`,
              marginBottom: '40px',
              gap: '1px',
              background: C.BORDER,
            }}>
              {/* Chart area */}
              <div style={{ background: C.BG, padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h3 style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT2, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER_FAINT} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} interval={xInterval} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: C.ELEVATED, border: `1px solid ${C.BORDER}`, borderRadius: 0, fontSize: 11, fontFamily: MONO, color: C.TEXT }}
                      labelStyle={{ color: C.TEXT2, marginBottom: '4px' }}
                      cursor={{ stroke: C.BORDER }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.BORDER }}>
                {/* Sentiment mix */}
                <div style={{ background: C.BG, padding: '32px', flex: 1 }}>
                  <p style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT2, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px' }}>Sentiment Mix</p>
                  <div style={{ height: '4px', display: 'flex', background: C.BORDER, marginBottom: '24px' }}>
                    <div style={{ width: `${data.sentiment.bullish}%`, background: C.GREEN }} />
                    <div style={{ width: `${data.sentiment.neutral}%`, background: C.TEXT3 }} />
                    <div style={{ width: `${data.sentiment.bearish}%`, background: C.RED }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT2 }}>BULLISH</span>
                      <span style={{ fontFamily: MONO, fontSize: '11px', color: C.GREEN, fontWeight: 700 }}>{data.sentiment.bullish}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT2 }}>NEUTRAL</span>
                      <span style={{ fontFamily: MONO, fontSize: '11px', color: C.TEXT2, fontWeight: 700 }}>{data.sentiment.neutral}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT2 }}>BEARISH</span>
                      <span style={{ fontFamily: MONO, fontSize: '11px', color: C.RED, fontWeight: 700 }}>{data.sentiment.bearish}%</span>
                    </div>
                  </div>
                </div>

                {/* System insight */}
                <div style={{ background: C.BG, padding: '32px', flex: 1, borderTop: `1px solid ${C.BORDER}` }}>
                  <p style={{ fontFamily: MONO, fontSize: '10px', color: C.CYAN, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 700 }}>SYSTEM_INSIGHT</p>
                  <p style={{ fontFamily: BODY, fontSize: '14px', color: C.TEXT2, lineHeight: 1.7 }}>{data.insight}</p>
                </div>
              </div>
            </section>

            {/* Entry/Exit panel */}
            {data.entryExitLabel && (
              <section style={{
                background: C.SURFACE,
                border: `1px solid ${C.BORDER}`,
                borderLeft: `3px solid ${SIGNAL_COLORS[data.signal]}`,
                padding: '32px',
                marginBottom: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '32px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={getBadgeStyle(data.entryExitLabel)}>{data.entryExitLabel}</span>
                  <p style={{ fontFamily: BODY, color: C.TEXT2, fontSize: '14px', lineHeight: 1.6, maxWidth: '60ch' }}>{data.entryExitExplanation}</p>
                </div>
                <div style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.15em', lineHeight: 2 }}>
                  QUANTITATIVE ANALYSIS ONLY<br />
                  NOT FINANCIAL ADVICE
                </div>
              </section>
            )}

            {/* ── PRICE INTELLIGENCE ─────────────────────────────────────── */}
            <div id="price-intelligence" style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '24px', marginBottom: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Price Intelligence</p>
                <a
                  href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=price-intelligence`}
                  style={{ color: C.TEXT3, fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.CYAN; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT3; }}
                >
                  View Details →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: C.BORDER_FAINT, marginBottom: '1px' }}>
                {/* RSI */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>RSI (14-day)</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>Momentum · 0=oversold, 100=overbought</p>
                  <p style={{ color: rsiColor, fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.priceIntelligence.rsi}
                  </p>
                  <Badge label={data.priceIntelligence.rsiLabel} color={rsiColor} bg={rsiColor + '18'} />
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY, marginTop: '10px' }}>
                    {data.priceIntelligence.rsi < 30 ? 'May be oversold — potential bounce zone' : data.priceIntelligence.rsi > 70 ? 'May be overbought — pullback risk' : 'Neutral — no momentum extreme'}
                  </p>
                </div>
                {/* 200 MA */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>200-Day MA</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>Long-term trend average price</p>
                  <p style={{ color: C.TEXT, fontSize: '1.5rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.currencySymbol}{data.priceIntelligence.ma200.toFixed(2)}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <Badge
                      label={data.priceIntelligence.ma200Label}
                      color={data.priceIntelligence.ma200Label === 'Above' ? C.GREEN : C.RED}
                      bg={data.priceIntelligence.ma200Label === 'Above' ? C.GREEN + '18' : C.RED + '18'}
                    />
                    <span style={{ color: C.TEXT2, fontSize: '11px', fontFamily: MONO }}>
                      {data.priceIntelligence.ma200PercentDiff > 0 ? '+' : ''}{data.priceIntelligence.ma200PercentDiff.toFixed(1)}%
                    </span>
                  </div>
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY }}>
                    {data.priceIntelligence.ma200Label === 'Above' ? 'Price above trend — long-term uptrend intact' : 'Price below trend — long-term pressure remains'}
                  </p>
                </div>
                {/* ATR */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>ATR (14-day)</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>Avg daily price swing over 14 days</p>
                  <p style={{ color: C.TEXT, fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.currencySymbol}{data.priceIntelligence.atr.toFixed(2)}
                  </p>
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY }}>
                    Moves ~{data.currencySymbol}{data.priceIntelligence.atr.toFixed(2)} per trading day
                  </p>
                </div>
                {/* MA Cross */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>MA Cross Signal</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>50-day vs 200-day crossover</p>
                  <div style={{ marginBottom: '10px' }}>
                    <Badge
                      label={data.priceIntelligence.crossSignal === 'None' ? 'No recent cross' : data.priceIntelligence.crossSignal}
                      color={data.priceIntelligence.crossSignal === 'Golden Cross' ? C.GOLD : data.priceIntelligence.crossSignal === 'Death Cross' ? C.RED : C.NEUTRAL}
                      bg={data.priceIntelligence.crossSignal === 'Golden Cross' ? C.GOLD + '18' : data.priceIntelligence.crossSignal === 'Death Cross' ? C.RED + '18' : C.BORDER}
                    />
                  </div>
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY }}>
                    {data.priceIntelligence.crossSignal === 'Golden Cross' ? 'Bullish crossover — 50MA rose above 200MA' : data.priceIntelligence.crossSignal === 'Death Cross' ? 'Bearish crossover — 50MA fell below 200MA' : 'No crossover detected in last 10 trading days'}
                  </p>
                </div>
              </div>
              {/* 52-week range */}
              <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER_FAINT}`, padding: '16px', marginTop: '1px' }}>
                <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>52-Week Range</p>
                <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '4px' }}>Where current price sits within its yearly range</p>
                <WeekRangeBar
                  position={data.priceIntelligence.weekRange52Position}
                  low={data.priceIntelligence.low52}
                  high={data.priceIntelligence.high52}
                  currencySymbol={data.currencySymbol}
                />
              </div>
            </div>

            {/* ── FUNDAMENTALS ───────────────────────────────────────────── */}
            <div id="fundamentals" style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, borderTop: 'none', padding: '24px', marginBottom: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Fundamentals</p>
                <a
                  href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=fundamentals`}
                  style={{ color: C.TEXT3, fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.CYAN; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT3; }}
                >
                  View Details →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
                <div>
                  <StatRow label="P/E Ratio (trailing)" hint="Stock price ÷ earnings" value={fmt(data.fundamentals.peRatio, 1)} />
                  <StatRow label="Forward P/E" hint="P/E using next year's expected earnings" value={fmt(data.fundamentals.forwardPE, 1)} />
                  <StatRow label="PEG Ratio" hint="P/E adjusted for growth" value={fmt(data.fundamentals.pegRatio, 2)} />
                  <StatRow label="Revenue Growth (YoY)" value={fmtPct(data.fundamentals.revenueGrowth)} color={data.fundamentals.revenueGrowth !== null ? (data.fundamentals.revenueGrowth >= 0 ? C.GREEN : C.RED) : undefined} />
                  <StatRow label="Gross Margins" value={fmtPct(data.fundamentals.grossMargins)} />
                </div>
                <div>
                  <StatRow label="Return on Equity" value={fmtPct(data.fundamentals.returnOnEquity)} color={data.fundamentals.returnOnEquity !== null ? (data.fundamentals.returnOnEquity >= 0 ? C.GREEN : C.RED) : undefined} />
                  <StatRow label="Debt / Equity" value={fmt(data.fundamentals.debtToEquity, 2)} />
                  <StatRow label="Current Ratio" value={fmt(data.fundamentals.currentRatio, 2)} />
                  <StatRow label="Dividend Yield" value={fmtPct(data.fundamentals.dividendYield)} />
                  <StatRow label="Sector" value={data.fundamentals.sector ?? '—'} />
                </div>
              </div>
            </div>

            {/* ── MOMENTUM & FLOW ────────────────────────────────────────── */}
            <div id="momentum" style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, borderTop: 'none', padding: '24px', marginBottom: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Momentum &amp; Flow</p>
                <a
                  href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=momentum`}
                  style={{ color: C.TEXT3, fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.CYAN; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT3; }}
                >
                  View Details →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: C.BORDER_FAINT }}>
                {/* Institutional */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Institutional Ownership</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>% shares held by funds &amp; institutions</p>
                  <p style={{ color: C.TEXT, fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.momentumFlow.institutionalOwnershipPercent !== null ? `${data.momentumFlow.institutionalOwnershipPercent.toFixed(1)}%` : '—'}
                  </p>
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY }}>
                    {data.momentumFlow.institutionalOwnershipPercent === null ? 'Data unavailable' : data.momentumFlow.institutionalOwnershipPercent > 70 ? 'Strong institutional backing' : data.momentumFlow.institutionalOwnershipPercent > 30 ? 'Moderate institutional interest' : 'Light institutional presence'}
                  </p>
                </div>
                {/* Insider */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Insider Activity (90 days)</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>Trades by executives &amp; directors</p>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', marginBottom: '10px' }}>
                    <span style={{ color: C.GREEN, fontSize: '1.3rem', fontFamily: MONO, fontWeight: 700 }}>{data.momentumFlow.insiderBuys}↑</span>
                    <span style={{ color: C.RED, fontSize: '1.3rem', fontFamily: MONO, fontWeight: 700 }}>{data.momentumFlow.insiderSells}↓</span>
                  </div>
                  <Badge label={data.momentumFlow.insiderSentiment} color={insiderColors[data.momentumFlow.insiderSentiment]} bg={insiderColors[data.momentumFlow.insiderSentiment] + '18'} />
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY, marginTop: '10px' }}>
                    {data.momentumFlow.insiderSentiment === 'Buying' ? 'Insiders accumulating — vote of confidence' : data.momentumFlow.insiderSentiment === 'Selling' ? 'Insiders reducing holdings — worth monitoring' : 'No clear directional signal from insiders'}
                  </p>
                </div>
                {/* Short interest */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Short Interest</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>% shares borrowed to bet against stock</p>
                  <p style={{ color: C.TEXT, fontSize: '1.5rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.momentumFlow.shortPercentOfFloat !== null ? `${(data.momentumFlow.shortPercentOfFloat * 100).toFixed(1)}%` : '—'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <Badge label={data.momentumFlow.shortLabel} color={shortColors[data.momentumFlow.shortLabel]} bg={shortColors[data.momentumFlow.shortLabel] + '18'} />
                    {data.momentumFlow.shortRatio !== null && (
                      <span style={{ color: C.TEXT2, fontSize: '11px', fontFamily: MONO }}>{data.momentumFlow.shortRatio.toFixed(1)}d to cover</span>
                    )}
                  </div>
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY }}>
                    {data.momentumFlow.shortLabel === 'High' ? 'Heavily shorted — high short squeeze potential' : data.momentumFlow.shortLabel === 'Elevated' ? 'Elevated short pressure on the stock' : 'Low short pressure — normal trading activity'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── RISK PROFILE ───────────────────────────────────────────── */}
            <div id="risk-profile" style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, borderTop: 'none', padding: '24px', marginBottom: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Risk Profile</p>
                <a
                  href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=risk-profile`}
                  style={{ color: C.TEXT3, fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.CYAN; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT3; }}
                >
                  View Details →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: C.BORDER_FAINT }}>
                {/* Beta */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Beta</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>Volatility vs market · 1.0 = moves with market</p>
                  <p style={{ color: C.TEXT, fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.riskProfile.beta !== null ? data.riskProfile.beta.toFixed(2) : '—'}
                  </p>
                  <Badge label={data.riskProfile.betaLabel} color={betaColors[data.riskProfile.betaLabel]} bg={betaColors[data.riskProfile.betaLabel] + '18'} />
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY, marginTop: '10px' }}>
                    {data.riskProfile.betaLabel === 'Low' ? 'Moves less than the market — more defensive' : data.riskProfile.betaLabel === 'Moderate' ? 'Roughly in line with the broader market' : data.riskProfile.betaLabel === 'High' ? 'More volatile than the market' : 'Significantly more volatile — high risk/reward'}
                  </p>
                </div>
                {/* Realized vol */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Realized Volatility</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>Annualized price swing — last 30 days</p>
                  <p style={{ color: volColors[data.riskProfile.volatilityLabel], fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.riskProfile.realizedVolatility.toFixed(1)}%
                  </p>
                  <Badge label={data.riskProfile.volatilityLabel} color={volColors[data.riskProfile.volatilityLabel]} bg={volColors[data.riskProfile.volatilityLabel] + '18'} />
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY, marginTop: '10px' }}>
                    {data.riskProfile.volatilityLabel === 'Low' ? 'Calm price action — relatively stable' : data.riskProfile.volatilityLabel === 'Moderate' ? 'Normal price variation for most stocks' : data.riskProfile.volatilityLabel === 'High' ? 'Elevated swings — expect larger daily moves' : 'Extreme volatility — very high risk profile'}
                  </p>
                </div>
                {/* Max drawdown */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Max Drawdown</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>Worst peak-to-trough decline in period</p>
                  <p style={{ color: C.RED, fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                    {data.riskProfile.maxDrawdown.toFixed(1)}%
                  </p>
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY }}>
                    Worst loss from peak: {Math.abs(data.riskProfile.maxDrawdown).toFixed(1)}%
                  </p>
                </div>
                {/* Sharpe */}
                <div style={{ background: C.SURFACE, padding: '16px' }}>
                  <p style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Sharpe Ratio</p>
                  <p style={{ color: C.TEXT3, fontSize: '11px', fontFamily: BODY, marginBottom: '12px' }}>Return per unit of risk · above 1 = good</p>
                  <p style={{
                    color: data.riskProfile.sharpeRatio === null ? C.TEXT2 : data.riskProfile.sharpeRatio >= 1 ? C.GREEN : data.riskProfile.sharpeRatio >= 0 ? C.NEUTRAL : C.RED,
                    fontSize: '1.9rem', fontFamily: MONO, fontWeight: 700, lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.02em'
                  }}>
                    {data.riskProfile.sharpeRatio !== null ? data.riskProfile.sharpeRatio.toFixed(2) : '—'}
                  </p>
                  <p style={{ color: C.TEXT2, fontSize: '11px', fontFamily: BODY }}>
                    {data.riskProfile.sharpeRatio === null ? 'Insufficient data' : data.riskProfile.sharpeRatio >= 1 ? 'Strong risk-adjusted performance' : data.riskProfile.sharpeRatio >= 0 ? 'Modest compensation for risk' : "Returns haven't justified the volatility"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── PEER COMPARISON ────────────────────────────────────────── */}
            {data.peerComparison.peers.length > 0 && (
              <div id="peer-comparison" style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, borderTop: 'none', padding: '24px', marginBottom: '1px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <p style={{ ...SECTION_LABEL, marginBottom: 0 }}>Peer Comparison</p>
                  <a
                    href={`/signal/details?company=${encodeURIComponent(data.companyName)}&timeframe=${data.timeframe}&tab=peer-comparison`}
                    style={{ color: C.TEXT3, fontFamily: MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.CYAN; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT3; }}
                  >
                    View Details →
                  </a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '0 0 12px', borderBottom: `1px solid ${C.BORDER}`, marginBottom: '4px' }}>
                  <span style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Company</span>
                  <span style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'right' }}>Price Chg</span>
                  <span style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'right' }}>P/E</span>
                  <span style={{ color: C.TEXT2, fontSize: '9px', fontFamily: MONO, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'right' }}>vs Target</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '12px 8px', background: C.CYAN + '08', borderBottom: `1px solid ${C.BORDER_FAINT}`, marginBottom: '2px' }}>
                  <span style={{ color: C.TEXT, fontSize: '12px', fontFamily: BODY }}>
                    {data.companyName}
                    <span style={{ marginLeft: '8px', color: C.CYAN, fontSize: '9px', fontFamily: MONO, background: C.CYAN + '1a', padding: '1px 6px', letterSpacing: '0.1em', borderRadius: '0' }}>TARGET</span>
                  </span>
                  <span style={{ color: data.priceChangePercent >= 0 ? C.GREEN : C.RED, fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>
                    {data.priceChangePercent >= 0 ? '+' : ''}{data.priceChangePercent.toFixed(2)}%
                  </span>
                  <span style={{ color: C.TEXT, fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>{fmt(data.fundamentals.peRatio, 1)}</span>
                  <span style={{ color: C.TEXT2, fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>—</span>
                </div>
                {data.peerComparison.peers.map((peer, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', padding: '12px 0', borderBottom: i < data.peerComparison.peers.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none' }}>
                    <span style={{ color: C.TEXT2, fontSize: '12px', fontFamily: BODY }}>{peer.companyName}</span>
                    <span style={{ color: peer.priceChangePercent >= 0 ? C.GREEN : C.RED, fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>
                      {peer.priceChangePercent >= 0 ? '+' : ''}{peer.priceChangePercent.toFixed(2)}%
                    </span>
                    <span style={{ color: C.TEXT, fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>
                      {peer.peRatio !== null ? peer.peRatio.toFixed(1) : '—'}
                    </span>
                    <span style={{ color: peer.relativeStrength >= 0 ? C.GREEN : C.RED, fontSize: '12px', fontFamily: MONO, textAlign: 'right' }}>
                      {peer.relativeStrength >= 0 ? '+' : ''}{peer.relativeStrength.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── HEADLINES ──────────────────────────────────────────────── */}
            <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, borderTop: 'none', overflow: 'hidden' }}>
              <button
                onClick={() => setHeadlinesExpanded(!headlinesExpanded)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '18px 24px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: headlinesExpanded ? `1px solid ${C.BORDER_FAINT}` : 'none',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.ELEVATED; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT3, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                    Signal Context
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, background: C.ELEVATED, border: `1px solid ${C.BORDER}`, padding: '1px 8px', letterSpacing: '0.1em' }}>
                    {data.headlines.length} HEADLINES
                  </span>
                </div>
                <span style={{ color: C.TEXT3, fontSize: '10px', fontFamily: MONO, letterSpacing: '0.1em' }}>{headlinesExpanded ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
              </button>
              {headlinesExpanded && (
                <div>
                  {data.headlines.map((h, i) => (
                    <div key={i} style={{
                      padding: '13px 24px',
                      borderBottom: i < data.headlines.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                    }}>
                      <span style={{ color: C.TEXT3, fontFamily: MONO, fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ color: C.TEXT2, fontSize: '13px', fontFamily: BODY, lineHeight: 1.65 }}>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>

    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
export default function SignalPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.BG }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', border: `2px solid ${C.BORDER}`, borderTop: `2px solid ${C.CYAN}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontFamily: T.MONO, fontSize: '10px', color: C.TEXT2, letterSpacing: '0.2em', textTransform: 'uppercase' }}>INITIALIZING</span>
        </div>
      </div>
    }>
      <SignalContent />
    </Suspense>
  );
}
