'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult } from '@/types';

const TIMEFRAMES = [
  { value: 7, label: '7D · Last Week', tooltip: 'Analyzes sentiment and price movement over the past 7 days.' },
  { value: 30, label: '30D · Last Month', tooltip: 'Analyzes sentiment and price movement over the past 30 days.' },
  { value: 90, label: '90D · Last Quarter', tooltip: 'Analyzes sentiment and price movement over the past 90 days.' },
] as const;

const TICKER_TAPE = [
  'AAPL · Aligned', 'TSLA · Mild Optimism', 'MSFT · Overconfidence',
  'NVDA · Hidden Strength', 'META · Aligned', 'AMZN · Mild Pessimism',
  'GOOG · Aligned', 'NFLX · Mild Optimism', 'AMD · Hidden Strength',
  'BABA · Mild Pessimism', 'SPY · Aligned', 'QQQ · Mild Optimism',
];

function TickerTape() {
  const items = [...TICKER_TAPE, ...TICKER_TAPE];
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
          const color =
            signal === 'Overconfidence' ? '#ef4444' :
            signal === 'Mild Optimism' ? '#f97316' :
            signal === 'Aligned' ? '#00ff88' :
            signal === 'Mild Pessimism' ? '#f97316' :
            '#00e5ff';
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

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hoveredTf, setHoveredTf] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('markora_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

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

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 280);
  };

  const handleSelect = (s: SearchResult) => {
    setQuery(s.ticker);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleAnalyze = () => {
    const t = query.trim();
    if (!t) return;
    try {
      const prev = JSON.parse(localStorage.getItem('markora_recent_searches') ?? '[]') as string[];
      const updated = [t.toUpperCase(), ...prev.filter((x) => x !== t.toUpperCase())].slice(0, 5);
      localStorage.setItem('markora_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch { /* ignore */ }
    router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${timeframe}`);
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 80px' }}>
      {/* Logo + tagline */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <h1 style={{
          fontFamily: 'var(--font-dm-serif)',
          fontSize: 'clamp(3rem, 8vw, 5.5rem)',
          color: '#e8e8f0',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: '16px',
        }}>
          MARKORA
        </h1>
        <p style={{
          fontFamily: 'var(--font-outfit)',
          fontSize: '1.05rem',
          color: '#4a4a6a',
          letterSpacing: '0.02em',
        }}>
          Where sentiment meets reality.
        </p>
      </div>

      {/* Input card */}
      <div style={{ width: '100%', maxWidth: '580px' }}>
        {/* Search input with autocomplete */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setShowDropdown(false); handleAnalyze(); }
              if (e.key === 'Escape') setShowDropdown(false);
            }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onFocus={() => query.trim().length > 0 && suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Company name or ticker symbol"
            style={{
              width: '100%',
              background: '#0d0d12',
              border: '1px solid #1c1c26',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#e8e8f0',
              fontSize: '1.05rem',
              fontFamily: 'var(--font-outfit)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocusCapture={(e) => { (e.target as HTMLInputElement).style.borderColor = '#00e5ff44'; }}
            onBlurCapture={(e) => { (e.target as HTMLInputElement).style.borderColor = '#1c1c26'; }}
          />

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#0d0d12',
              border: '1px solid #1c1c26',
              borderRadius: '10px',
              overflow: 'hidden',
              zIndex: 50,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => handleSelect(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: i < suggestions.length - 1 ? '1px solid #1c1c26' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#13131f'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.88rem', color: '#00e5ff', minWidth: '60px' }}>
                    {s.ticker}
                  </span>
                  <span style={{ color: '#e8e8f0', fontSize: '0.9rem', flex: 1 }}>{s.name}</span>
                  {s.exchange && (
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.72rem', color: '#4a4a6a', background: '#1c1c26', borderRadius: '4px', padding: '2px 6px' }}>
                      {s.exchange}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hint text */}
        <p style={{ color: '#4a4a6a', fontSize: '0.8rem', marginBottom: '24px', paddingLeft: '4px' }}>
          Try &quot;Apple&quot;, &quot;Tesla&quot;, or &quot;RELIANCE.NS&quot;
        </p>

        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {TIMEFRAMES.map(({ value, label, tooltip }) => (
            <div key={value} style={{ position: 'relative', flex: 1 }}>
              <button
                onClick={() => setTimeframe(value)}
                onMouseEnter={() => setHoveredTf(value)}
                onMouseLeave={() => setHoveredTf(null)}
                style={{
                  width: '100%',
                  padding: '10px 8px',
                  background: timeframe === value ? '#00e5ff11' : '#0d0d12',
                  border: `1px solid ${timeframe === value ? '#00e5ff44' : '#1c1c26'}`,
                  borderRadius: '8px',
                  color: timeframe === value ? '#00e5ff' : '#4a4a6a',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-dm-mono)',
                  fontWeight: timeframe === value ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
              {hoveredTf === value && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#0d0d18',
                  border: '1px solid #1c1c26',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.76rem',
                  color: '#a0a0b8',
                  width: '200px',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  zIndex: 20,
                  whiteSpace: 'normal',
                  animation: 'tooltipFade 0.15s ease forwards',
                  pointerEvents: 'none',
                }}>
                  {tooltip}
                </div>
              )}
            </div>
          ))}
        </div>
        <p style={{ color: '#4a4a6a', fontSize: '0.78rem', marginBottom: '28px', paddingLeft: '4px' }}>
          Choose how far back Markora looks when analyzing headlines and price data.
        </p>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!query.trim()}
          style={{
            width: '100%',
            padding: '16px',
            background: query.trim() ? '#00e5ff' : '#0d0d12',
            border: `1px solid ${query.trim() ? '#00e5ff' : '#1c1c26'}`,
            borderRadius: '12px',
            color: query.trim() ? '#060608' : '#4a4a6a',
            fontSize: '1rem',
            fontWeight: 700,
            fontFamily: 'var(--font-dm-mono)',
            letterSpacing: '0.04em',
            cursor: query.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          ANALYZE
        </button>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div style={{ marginTop: '28px' }}>
            <p style={{ color: '#4a4a6a', fontSize: '0.72rem', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Recent
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {recentSearches.map((t) => (
                <button
                  key={t}
                  onClick={() => { setQuery(t); router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${timeframe}`); }}
                  style={{
                    background: '#0d0d12',
                    border: '1px solid #1c1c26',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#a0a0b8',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-dm-mono)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#00e5ff33'; (e.currentTarget as HTMLButtonElement).style.color = '#00e5ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1c1c26'; (e.currentTarget as HTMLButtonElement).style.color = '#a0a0b8'; }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <TickerTape />
    </div>
  );
}
