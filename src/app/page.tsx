'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult } from '@/types';

const TIMEFRAMES = [
  { value: 7,  label: '7D',  tooltip: 'Analyzes sentiment and price movement over the past 7 days.' },
  { value: 30, label: '30D', tooltip: 'Analyzes sentiment and price movement over the past 30 days.' },
  { value: 90, label: '90D', tooltip: 'Analyzes sentiment and price movement over the past 90 days.' },
] as const;

const TICKER_TAPE = [
  'AAPL · Aligned', 'TSLA · Mild Optimism', 'MSFT · Overconfidence',
  'NVDA · Hidden Strength', 'META · Aligned', 'AMZN · Mild Pessimism',
  'GOOG · Aligned', 'NFLX · Mild Optimism', 'AMD · Hidden Strength',
  'BABA · Mild Pessimism', 'SPY · Aligned', 'QQQ · Mild Optimism',
];

const SIGNAL_PILLS = [
  { ticker: 'AAPL', signal: 'Aligned',        change: '+2.1%', color: '#00ff88' },
  { ticker: 'NVDA', signal: 'Hidden Strength', change: '-1.4%', color: '#00e5ff' },
  { ticker: 'TSLA', signal: 'Overconfidence',  change: '+8.3%', color: '#ef4444' },
  { ticker: 'META', signal: 'Mild Pessimism',  change: '+0.6%', color: '#f97316' },
];

function TickerTape() {
  const items = [...TICKER_TAPE, ...TICKER_TAPE];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '34px', background: '#080810',
      borderTop: '1px solid #13131e',
      overflow: 'hidden', zIndex: 10,
    }}>
      <div style={{
        display: 'flex', gap: '48px', alignItems: 'center',
        height: '100%', width: 'max-content',
        animation: 'tickerScroll 40s linear infinite',
        paddingLeft: '100%',
      }}>
        {items.map((item, i) => {
          const [symbol, signal] = item.split(' · ');
          const color =
            signal === 'Overconfidence'  ? '#ef4444' :
            signal === 'Mild Optimism'   ? '#f97316' :
            signal === 'Aligned'         ? '#00ff88' :
            signal === 'Mild Pessimism'  ? '#f97316' : '#00e5ff';
          return (
            <span key={i} style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>
              <span style={{ color: '#e8e8f0' }}>{symbol}</span>
              <span style={{ color: '#2a2a3a', margin: '0 6px' }}>·</span>
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
  const [inputFocused, setInputFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('markora_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.trim().length < 1) { setSuggestions([]); setShowDropdown(false); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data: SearchResult[] = await res.json();
      setSuggestions(data);
      setShowDropdown(data.length > 0);
    } catch { setSuggestions([]); }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 280);
  };

  const handleSelect = (s: SearchResult) => {
    setQuery(s.name);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleAnalyze = () => {
    const t = query.trim();
    if (!t) return;
    try {
      const prev = JSON.parse(localStorage.getItem('markora_recent_searches') ?? '[]') as string[];
      const updated = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
      localStorage.setItem('markora_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch { /* ignore */ }
    router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${timeframe}`);
  };

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="markora-grid-bg" />
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px 80px',
      }}>

        {/* ── Logo block ── */}
        <div style={{ textAlign: 'center', marginBottom: '48px', animation: 'heroIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards' }}>
          <h1 style={{
            fontFamily: 'var(--font-dm-serif)',
            fontSize: 'clamp(3.5rem, 9vw, 6rem)',
            color: '#e8e8f0',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontWeight: 400,
          }}>
            MARKORA
          </h1>
          <div style={{ width: '40px', height: '1px', background: '#1c1c26', margin: '18px auto' }} />
          <p style={{
            fontFamily: 'var(--font-outfit)', fontSize: '0.9rem',
            color: '#4a4a6a', letterSpacing: '0.04em',
          }}>
            Where sentiment meets reality.
          </p>
        </div>

        {/* ── Signal preview pills ── */}
        <div style={{
          display: 'flex', gap: '8px', justifyContent: 'center',
          flexWrap: 'wrap', marginBottom: '40px',
        }}>
          {SIGNAL_PILLS.map((pill, i) => (
            <div
              key={pill.ticker}
              style={{
                background: '#0d0d12', border: '1px solid #1c1c26',
                borderRadius: '100px', padding: '6px 14px',
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                animation: 'pillSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
                animationDelay: `${i * 100}ms`,
                opacity: 0,
              }}
            >
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#4a4a6a', letterSpacing: '0.1em' }}>
                {pill.ticker}
              </span>
              <span style={{ color: '#2a2a3a' }}>·</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: pill.color }}>
                {pill.signal}
              </span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: pill.color }}>
                {pill.change}
              </span>
            </div>
          ))}
        </div>

        {/* ── Input card ── */}
        <div style={{ width: '100%', maxWidth: '520px' }}>

          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { setShowDropdown(false); handleAnalyze(); }
                if (e.key === 'Escape') setShowDropdown(false);
              }}
              onBlur={() => { setInputFocused(false); setTimeout(() => setShowDropdown(false), 150); }}
              onFocus={() => { setInputFocused(true); if (query.trim().length > 0 && suggestions.length > 0) setShowDropdown(true); }}
              placeholder="Company name or ticker symbol"
              style={{
                width: '100%',
                background: '#0d0d12',
                border: `1px solid ${inputFocused ? '#00e5ff44' : '#1c1c26'}`,
                borderRadius: '10px',
                padding: '14px 18px',
                color: '#e8e8f0',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-outfit)',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: inputFocused ? '0 0 0 3px #00e5ff10' : 'none',
              }}
            />

            {/* Autocomplete dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#0d0d12', border: '1px solid #1c1c26',
                borderRadius: '10px', overflow: 'hidden', zIndex: 50,
                boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)',
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => handleSelect(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      width: '100%', padding: '10px 16px',
                      background: 'transparent', border: 'none',
                      borderBottom: i < suggestions.length - 1 ? '1px solid #13131e' : 'none',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#13131a'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: '#00e5ff', minWidth: '60px' }}>
                      {s.ticker}
                    </span>
                    <span style={{ color: '#e8e8f0', fontSize: '13px', fontFamily: 'var(--font-outfit)', flex: 1 }}>
                      {s.name}
                    </span>
                    {s.exchange && (
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#4a4a6a', background: '#1c1c26', borderRadius: '3px', padding: '3px 7px' }}>
                        {s.exchange}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe buttons */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {TIMEFRAMES.map(({ value, label }) => {
              const active = timeframe === value;
              return (
                <button
                  key={value}
                  onClick={() => setTimeframe(value)}
                  style={{
                    flex: 1, padding: '10px 8px',
                    background: active ? '#00e5ff09' : '#0d0d12',
                    border: `1px solid ${active ? '#00e5ff33' : '#1c1c26'}`,
                    borderRadius: '8px',
                    color: active ? '#00e5ff' : '#4a4a6a',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-dm-mono)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a3a';
                      (e.currentTarget as HTMLButtonElement).style.color = '#a0a0b8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#1c1c26';
                      (e.currentTarget as HTMLButtonElement).style.color = '#4a4a6a';
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p style={{ color: '#4a4a6a', fontSize: '0.78rem', fontFamily: 'var(--font-outfit)', marginBottom: '20px', paddingLeft: '2px' }}>
            Choose how far back Markora looks when analyzing headlines and price data.
          </p>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!hasQuery}
            style={{
              width: '100%', padding: '14px',
              background: hasQuery ? '#00e5ff' : '#0d0d12',
              border: `1px solid ${hasQuery ? '#00e5ff' : '#1c1c26'}`,
              borderRadius: '10px',
              color: hasQuery ? '#060608' : '#2a2a3a',
              fontSize: '0.9rem', fontWeight: 700,
              fontFamily: 'var(--font-dm-mono)',
              letterSpacing: '0.08em',
              cursor: hasQuery ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: hasQuery ? '0 0 24px #00e5ff30, 0 4px 12px #00e5ff20' : 'none',
            }}
            onMouseEnter={(e) => {
              if (hasQuery) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 32px #00e5ff50, 0 4px 16px #00e5ff30';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (hasQuery) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px #00e5ff30, 0 4px 12px #00e5ff20';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }
            }}
          >
            ANALYZE
          </button>

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              <p style={{ color: '#2a2a3a', fontSize: '10px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
                RECENT
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {recentSearches.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setQuery(t); router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${timeframe}`); }}
                    style={{
                      background: '#0d0d12', border: '1px solid #13131e',
                      borderRadius: '6px', padding: '5px 12px',
                      color: '#4a4a6a', fontSize: '12px',
                      fontFamily: 'var(--font-dm-mono)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#1c1c26';
                      (e.currentTarget as HTMLButtonElement).style.color = '#a0a0b8';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#13131e';
                      (e.currentTarget as HTMLButtonElement).style.color = '#4a4a6a';
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <TickerTape />
    </>
  );
}
