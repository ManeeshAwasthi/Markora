'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult } from '@/types';

const TIMEFRAMES = [
  { value: 7,  label: '7D · Week'    },
  { value: 30, label: '30D · Month'  },
  { value: 90, label: '90D · Quarter'},
] as const;

const TICKER_ITEMS = [
  { ticker: 'AAPL',        signal: 'Aligned',         color: '#00ff88', price: '+1.2%' },
  { ticker: 'TSLA',        signal: 'Mild Optimism',   color: '#f97316', price: '+3.4%' },
  { ticker: 'MSFT',        signal: 'Overconfidence',  color: '#ef4444', price: '-0.8%' },
  { ticker: 'NVDA',        signal: 'Hidden Strength', color: '#00e5ff', price: '+5.1%' },
  { ticker: 'META',        signal: 'Aligned',         color: '#00ff88', price: '+0.6%' },
  { ticker: 'AMZN',        signal: 'Mild Pessimism',  color: '#f97316', price: '-1.9%' },
  { ticker: 'RELIANCE.NS', signal: 'Hidden Strength', color: '#00e5ff', price: '+2.3%' },
  { ticker: 'GOOG',        signal: 'Aligned',         color: '#00ff88', price: '+0.9%' },
];

const SIGNAL_ROWS = [
  { ticker: 'AAPL',     barWidth: '62%', signal: 'Aligned',     color: '#00ff88', price: '+1.2%' },
  { ticker: 'NVDA',     barWidth: '88%', signal: 'Hidden Str.', color: '#00e5ff', price: '+5.1%' },
  { ticker: 'TSLA',     barWidth: '71%', signal: 'Mild Opt.',   color: '#f97316', price: '+3.4%' },
  { ticker: 'MSFT',     barWidth: '40%', signal: 'Overconf.',   color: '#ef4444', price: '-0.8%' },
  { ticker: 'META',     barWidth: '58%', signal: 'Aligned',     color: '#00ff88', price: '+0.6%' },
  { ticker: 'AMZN',     barWidth: '28%', signal: 'Mild Pess.',  color: '#f97316', price: '-1.9%' },
  { ticker: 'RELIANCE', barWidth: '80%', signal: 'Hidden Str.', color: '#00e5ff', price: '+2.3%' },
];

const SIGNALS = [
  { name: 'Overconfidence', color: '#ef4444', desc: 'Crowd bullish. Price disagrees. Pullback risk elevated.'         },
  { name: 'Mild Optimism',  color: '#f97316', desc: 'Sentiment slightly ahead of price. Watch momentum.'             },
  { name: 'Aligned',        color: '#00ff88', desc: 'Sentiment and price in sync. No divergence edge.'               },
  { name: 'Mild Pessimism', color: '#f97316', desc: 'Price outrunning bearish crowd. Monitor for reversal.'          },
  { name: 'Hidden Strength',color: '#00e5ff', desc: 'Price rising despite bearish narrative. Rare. Actionable.'      },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Headline Sentiment',  desc: 'Aggregates from Finnhub and Marketaux. Gemini scores each headline for bullish / bearish signal without opinion.' },
  { step: '02', title: 'Price Normalisation', desc: 'Maps raw percentage price change to a 0–100 scale. A 50% move = 100. Flat = 50. Comparable across any stock.'    },
  { step: '03', title: 'Divergence Score',    desc: 'Sentiment score minus normalised price. Positive = crowd ahead of price. Negative = price ahead of crowd.'        },
  { step: '04', title: 'Signal + Five Layers',desc: 'Five signal types plus RSI, MA200, Bollinger, fundamentals, momentum flow, risk profile, and peer comparison.'   },
];

const STATS = [
  { value: '50+', label: 'Global markets covered', color: '#e8e8f0' },
  { value: '5',   label: 'Divergence signal types', color: '#e8e8f0' },
  { value: '7s',  label: 'Avg analysis time',       color: '#00e5ff' },
  { value: '3',   label: 'Timeframe windows',        color: '#e8e8f0' },
];

const MONO  = '"Courier New", monospace';
const SERIF = 'Georgia, serif';

function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ height: '32px', background: '#080810', borderBottom: '1px solid #111120', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        gap: '48px',
        alignItems: 'center',
        height: '100%',
        width: 'max-content',
        animation: 'tickerScroll 35s linear infinite',
        paddingLeft: '100%',
      }}>
        {items.map((item, i) => (
          <span key={i} style={{ whiteSpace: 'nowrap', fontFamily: MONO, fontSize: '0.72rem' }}>
            <span style={{ color: '#e8e8f0' }}>{item.ticker}</span>
            <span style={{ color: '#2a2a3a', margin: '0 6px' }}>·</span>
            <span style={{ color: item.color }}>{item.signal}</span>
            <span style={{ color: '#2a2a3a', margin: '0 6px' }}>·</span>
            <span style={{ color: '#4a4a6a' }}>{item.price}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery]               = useState('');
  const [timeframe, setTimeframe]       = useState<7 | 30 | 90>(30);
  const [suggestions, setSuggestions]   = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('markora_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.trim().length < 1) { setSuggestions([]); setShowDropdown(false); return; }
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
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
      const prev    = JSON.parse(localStorage.getItem('markora_recent_searches') ?? '[]') as string[];
      const updated = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
      localStorage.setItem('markora_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch { /* ignore */ }
    router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${timeframe}`);
  };

  return (
    <div style={{ background: '#05050a', minHeight: '100vh', color: '#e8e8f0' }}>

      {/* ── 1. NAV BAR ─────────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid #111120', background: '#05050a',
      }}>
        <span style={{ fontFamily: SERIF, fontSize: '22px', letterSpacing: '-0.02em', color: '#e8e8f0' }}>
          MARKORA
        </span>
        <div style={{ display: 'flex', gap: '32px' }}>
          {['Signals', 'Markets', 'Methodology'].map((link) => (
            <a
              key={link} href="#"
              style={{ fontFamily: MONO, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a4a6a', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00e5ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#4a4a6a'; }}
            >{link}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: MONO, fontSize: '11px', color: '#4a4a6a' }}>Market data live</span>
        </div>
      </nav>

      {/* ── 2. TICKER TAPE ─────────────────────────────────────────────────── */}
      <TickerTape />

      {/* ── 3. HERO ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '580px' }}>

        {/* Left column */}
        <div style={{
          padding: '64px 48px', borderRight: '1px solid #111120',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontFamily: MONO, fontSize: '11px', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '28px' }}>
              Divergence Analysis Engine — v3.0
            </p>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(40px, 5vw, 68px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: '#e8e8f0', marginBottom: '24px' }}>
              Where sentiment meets <em style={{ fontStyle: 'italic', color: '#00e5ff' }}>reality.</em>
            </h1>
            <p style={{ fontFamily: MONO, fontSize: '13px', color: '#4a4a6a', lineHeight: 1.6, maxWidth: '380px', marginBottom: '48px' }}>
              Markora quantifies the gap between what the crowd believes and what price confirms. Five signal types. Live across 50+ markets.
            </p>
          </div>

          {/* Search area */}
          <div style={{ maxWidth: '480px' }}>
            <div style={{ position: 'relative' }}>
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
                placeholder="Company name or ticker — e.g. Reliance, AAPL"
                style={{
                  width: '100%', background: '#0d0d14', border: '1px solid #1c1c2c', borderRadius: '0',
                  padding: '16px 20px', color: '#e8e8f0', fontSize: '13px', fontFamily: MONO,
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocusCapture={(e) => { (e.target as HTMLInputElement).style.borderColor = '#00e5ff44'; }}
                onBlurCapture={(e)  => { (e.target as HTMLInputElement).style.borderColor = '#1c1c2c';   }}
              />

              {/* Autocomplete dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: '#0d0d14', border: '1px solid #1c1c2c', borderRadius: '0',
                  overflow: 'hidden', zIndex: 50,
                }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => handleSelect(s)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                        padding: '12px 16px', background: 'transparent', border: 'none',
                        borderBottom: i < suggestions.length - 1 ? '1px solid #111120' : 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#0a0a12'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span style={{ fontFamily: MONO, fontSize: '12px', color: '#00e5ff', minWidth: '55px' }}>{s.ticker}</span>
                      <span style={{ color: '#e8e8f0', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                      {s.exchange && (
                        <span style={{ fontFamily: MONO, fontSize: '11px', color: '#4a4a6a', background: '#111120', padding: '2px 6px' }}>
                          {s.exchange}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Timeframe buttons */}
            <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
              {TIMEFRAMES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTimeframe(value)}
                  style={{
                    flex: 1, padding: '10px 8px',
                    background: timeframe === value ? '#00e5ff08' : '#0a0a12',
                    border: `1px solid ${timeframe === value ? '#00e5ff33' : '#1a1a28'}`,
                    borderRadius: '0',
                    color: timeframe === value ? '#00e5ff' : '#4a4a6a',
                    fontSize: '11px', fontFamily: MONO, letterSpacing: '0.06em', cursor: 'pointer',
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              style={{
                width: '100%', marginTop: '2px', padding: '16px',
                background: '#e8e8f0', color: '#05050a', fontFamily: MONO,
                fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', borderRadius: '0', border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e8e8f0'; }}
            >Run Analysis →</button>

            <p style={{ fontFamily: MONO, fontSize: '10px', color: '#2a2a3a', letterSpacing: '0.08em', marginTop: '12px' }}>
              Quantitative analysis only. Not financial advice.
            </p>
          </div>
        </div>

        {/* Right column */}
        <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontFamily: MONO, fontSize: '10px', color: '#2a2a3a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '20px' }}>
            Live signal board — 30D
          </p>

          {SIGNAL_ROWS.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 80px 80px', gap: '12px',
              alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #0d0d16',
            }}>
              <span style={{ fontFamily: MONO, fontSize: '13px', color: '#e8e8f0', fontWeight: 700 }}>{row.ticker}</span>
              <div style={{ height: '4px', background: '#111120', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: row.barWidth, background: row.color }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: row.color, textAlign: 'right' }}>{row.signal}</span>
              <span style={{ fontFamily: MONO, fontSize: '12px', color: row.price.startsWith('-') ? '#ef4444' : row.color, textAlign: 'right' }}>
                {row.price}
              </span>
            </div>
          ))}

          {/* Divergence scale */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #111120' }}>
            <p style={{ fontFamily: MONO, fontSize: '10px', color: '#2a2a3a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Divergence score range
            </p>
            <div style={{ position: 'relative' }}>
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #ef4444, #4a4a6a, #00e5ff)' }} />
              <div style={{
                position: 'absolute', top: '-3px', left: '50%', transform: 'translateX(-50%)',
                width: '2px', height: '10px', background: '#e8e8f0',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: '#ef4444' }}>−100 Overconfidence</span>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a' }}>0 Aligned</span>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: '#00e5ff' }}>+100 Hidden</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. SIGNAL LEGEND ───────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #111120' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 48px' }}>
          <span style={{ fontFamily: MONO, fontSize: '10px', color: '#2a2a3a', textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>
            Five signals
          </span>
          <div style={{ flex: 1, height: '1px', background: '#111120' }} />
        </div>
        <div style={{ display: 'flex' }}>
          {SIGNALS.map((sig, i) => (
            <div key={i} style={{
              flex: 1, padding: '28px 32px',
              borderRight: i < SIGNALS.length - 1 ? '1px solid #111120' : 'none',
            }}>
              <div style={{ width: '24px', height: '2px', background: sig.color, marginBottom: '12px' }} />
              <p style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: sig.color, marginBottom: '6px' }}>{sig.name}</p>
              <p style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a', lineHeight: 1.6 }}>{sig.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. HOW IT WORKS ────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #111120' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 48px' }}>
          <span style={{ fontFamily: MONO, fontSize: '10px', color: '#2a2a3a', textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>
            How it works
          </span>
          <div style={{ flex: 1, height: '1px', background: '#111120' }} />
        </div>
        <div style={{ display: 'flex' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{
              flex: 1, padding: '40px 36px',
              borderRight: i < HOW_IT_WORKS.length - 1 ? '1px solid #111120' : 'none',
            }}>
              <p style={{ fontFamily: MONO, fontSize: '10px', color: '#2a2a3a', letterSpacing: '0.1em', marginBottom: '20px' }}>{step.step}</p>
              <p style={{ fontFamily: SERIF, fontSize: '18px', color: '#e8e8f0', lineHeight: 1.2, marginBottom: '12px' }}>{step.title}</p>
              <p style={{ fontFamily: MONO, fontSize: '11px', color: '#4a4a6a', lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. STATS ROW ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderTop: '1px solid #111120' }}>
        {STATS.map((stat, i) => (
          <div key={i} style={{
            flex: 1, padding: '32px 40px',
            borderRight: i < STATS.length - 1 ? '1px solid #111120' : 'none',
          }}>
            <p style={{ fontFamily: SERIF, fontSize: '36px', letterSpacing: '-0.03em', color: stat.color, marginBottom: '6px' }}>{stat.value}</p>
            <p style={{ fontFamily: MONO, fontSize: '10px', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── 7. RECENT SEARCHES ─────────────────────────────────────────────── */}
      {recentSearches.length > 0 && (
        <div style={{ padding: '28px 48px', borderTop: '1px solid #111120' }}>
          <p style={{ fontFamily: MONO, fontSize: '10px', color: '#2a2a3a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '10px' }}>
            Recent
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {recentSearches.map((t) => (
              <button
                key={t}
                onClick={() => { setQuery(t); router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${timeframe}`); }}
                style={{
                  background: '#0d0d14', border: '1px solid #1c1c2c', borderRadius: '0',
                  padding: '6px 14px', fontFamily: MONO, fontSize: '12px', color: '#4a4a6a', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#00e5ff33'; (e.currentTarget as HTMLButtonElement).style.color = '#00e5ff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1c1c2c';   (e.currentTarget as HTMLButtonElement).style.color = '#4a4a6a';  }}
              >{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
