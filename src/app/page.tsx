'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult } from '@/types';

const TIMEFRAMES = [
  { value: 7,  label: '7D · WEEK'    },
  { value: 30, label: '30D · MONTH'  },
  { value: 90, label: '90D · QUARTER'},
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

const SIGNALS = [
  { name: 'Overconfidence', color: '#ef4444', desc: 'Crowd bullish. Price disagrees. Pullback risk elevated.'         },
  { name: 'Mild Optimism',  color: '#f97316', desc: 'Sentiment slightly ahead of price. Watch momentum.'             },
  { name: 'Aligned',        color: '#00ff88', desc: 'Sentiment and price in sync. No divergence edge.'               },
  { name: 'Mild Pessimism', color: '#f97316', desc: 'Price outrunning bearish crowd. Monitor for reversal.'          },
  { name: 'Hidden Strength',color: '#00e5ff', desc: 'Price rising despite bearish narrative. Rare. Actionable.'      },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Headline Sentiment',  desc: 'Aggregates from Finnhub and Marketaux. Each headline is scored for bullish or bearish signal without opinion.' },
  { step: '02', title: 'Price Normalisation', desc: 'Maps raw percentage price change to a 0–100 scale. A 50% move = 100. Flat = 50. Comparable across any stock.'  },
  { step: '03', title: 'Divergence Score',    desc: 'Sentiment score minus normalised price. Positive = crowd ahead of price. Negative = price ahead of crowd.'      },
  { step: '04', title: 'Signal + Five Layers',desc: 'Five signal types plus RSI, MA200, Bollinger, fundamentals, momentum flow, risk profile, and peer comparison.'  },
];

const STATS = [
  { value: '50+', label: 'Global markets covered',  color: '#e8e8f0' },
  { value: '5',   label: 'Divergence signal types',  color: '#e8e8f0' },
  { value: '7s',  label: 'Avg analysis time',        color: '#00e5ff' },
  { value: '3',   label: 'Timeframe windows',         color: '#e8e8f0' },
];

const MONO  = 'var(--font-space-mono), "Courier New", monospace';
const SERIF = 'var(--font-playfair), Georgia, serif';
const BODY  = 'var(--font-space-grotesk), system-ui, sans-serif';

function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ height: '32px', background: '#0a0a0f', borderBottom: '1px solid #0f0f16', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        gap: '56px',
        alignItems: 'center',
        height: '100%',
        width: 'max-content',
        animation: 'tickerScroll 35s linear infinite',
        paddingLeft: '100%',
      }}>
        {items.map((item, i) => (
          <span key={i} style={{ whiteSpace: 'nowrap', fontFamily: MONO, fontSize: '11px', letterSpacing: '0.04em' }}>
            <span style={{ color: '#e8e8f0' }}>{item.ticker}</span>
            <span style={{ color: '#1a1a24', margin: '0 6px' }}>·</span>
            <span style={{ color: item.color }}>{item.signal}</span>
            <span style={{ color: '#1a1a24', margin: '0 6px' }}>·</span>
            <span style={{ color: '#3a3a4a' }}>{item.price}</span>
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
    <div style={{
      background: '#060608',
      minHeight: '100vh',
      color: '#e8e8f0',
      fontFamily: BODY,
    }}>

      {/* ── 1. NAV BAR ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '50px',
        padding: '0 48px',
        background: '#060608',
        borderBottom: '1px solid #0f0f16',
      }}>
        <span style={{
          fontFamily: MONO,
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#e8e8f0',
        }}>
          MARKORA
        </span>

        <div style={{ display: 'flex', gap: '36px' }}>
          {['SIGNALS', 'MARKETS', 'METHODOLOGY'].map((link) => (
            <a
              key={link}
              href="#"
              style={{
                fontFamily: MONO,
                fontSize: '10px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.18em',
                color: '#3a3a4a',
                textDecoration: 'none',
                transition: 'color 150ms',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00e5ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#3a3a4a'; }}
            >{link}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00ff88',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: MONO, fontSize: '10px', color: '#3a3a4a', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </nav>

      {/* ── 2. TICKER TAPE ─────────────────────────────────────────────────── */}
      <TickerTape />

      {/* ── 3. HERO ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '100px 52px 96px',
        maxWidth: '860px',
      }}>
        <p style={{
          fontFamily: MONO,
          fontSize: '10px',
          color: '#3a3a4a',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.24em',
          marginBottom: '40px',
        }}>
          DIVERGENCE ANALYSIS ENGINE
        </p>

        <h1 style={{
          margin: 0,
          marginBottom: '32px',
          fontSize: 'clamp(52px, 6vw, 82px)',
          lineHeight: 0.95,
          letterSpacing: '-0.01em',
          fontWeight: 400,
          animation: 'heroFadeIn 300ms ease forwards',
        }}>
          <span style={{
            display: 'block',
            fontFamily: SERIF,
            fontStyle: 'normal',
          }}>
            Where sentiment
          </span>
          <span style={{
            display: 'block',
            fontFamily: SERIF,
          }}>
            meets{' '}
            <em style={{
              fontStyle: 'italic',
              color: '#00e5ff',
            }}>reality.</em>
          </span>
        </h1>

        <p style={{
          fontFamily: BODY,
          fontSize: '16px',
          fontWeight: 300,
          color: '#5a5a70',
          lineHeight: 1.8,
          maxWidth: '520px',
          marginBottom: '56px',
        }}>
          Markora quantifies the gap between what the crowd believes and what price confirms. Five signal types across 50+ global markets.
        </p>

        {/* Search + CTA block */}
        <div style={{ maxWidth: '540px' }}>
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
              placeholder="Search company or ticker — AAPL, Reliance, TSLA"
              style={{
                width: '100%',
                height: '58px',
                background: '#0a0a0f',
                border: '1px solid #1c1c28',
                borderRadius: 0,
                padding: '0 48px 0 16px',
                color: '#e8e8f0',
                fontFamily: MONO,
                fontSize: '12px',
                letterSpacing: '0.02em',
                outline: 'none',
                boxSizing: 'border-box' as const,
                transition: 'border-color 150ms',
              }}
              onFocusCapture={(e) => { (e.target as HTMLInputElement).style.borderColor = '#00e5ff'; }}
              onBlurCapture={(e)  => { (e.target as HTMLInputElement).style.borderColor = '#1c1c28'; }}
            />
            <span style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#3a3a4a',
              fontFamily: MONO,
              fontSize: '16px',
              pointerEvents: 'none',
            }}>→</span>

            {/* Autocomplete dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#0a0a0f',
                border: '1px solid #1c1c28',
                borderTop: 'none',
                zIndex: 50,
                overflow: 'hidden',
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
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: i < suggestions.length - 1 ? '1px solid #0f0f16' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#0d0d14'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span style={{
                      fontFamily: MONO,
                      fontSize: '11px',
                      color: '#00e5ff',
                      minWidth: '60px',
                    }}>{s.ticker}</span>
                    <span style={{
                      fontFamily: BODY,
                      fontSize: '13px',
                      color: '#e8e8f0',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                    }}>{s.name}</span>
                    {s.exchange && (
                      <span style={{
                        fontFamily: MONO,
                        fontSize: '10px',
                        color: '#3a3a4a',
                        background: '#111118',
                        padding: '2px 6px',
                      }}>{s.exchange}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe selector — flush below input */}
          <div style={{ display: 'flex' }}>
            {TIMEFRAMES.map(({ value, label }, idx) => (
              <button
                key={value}
                onClick={() => setTimeframe(value)}
                style={{
                  flex: 1,
                  height: '42px',
                  background: timeframe === value ? '#0d0d14' : '#0a0a0f',
                  border: '1px solid #1c1c28',
                  borderTop: 'none',
                  borderRight: idx < TIMEFRAMES.length - 1 ? 'none' : '1px solid #1c1c28',
                  borderBottom: timeframe === value ? '2px solid #00e5ff' : '1px solid #1c1c28',
                  borderRadius: 0,
                  color: timeframe === value ? '#00e5ff' : '#3a3a4a',
                  fontFamily: MONO,
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  cursor: 'pointer',
                  transition: 'color 150ms, background 150ms',
                }}
              >{label}</button>
            ))}
          </div>

          {/* Run Analysis button */}
          <button
            onClick={handleAnalyze}
            style={{
              width: '100%',
              height: '54px',
              marginTop: '2px',
              background: '#e8e8f0',
              color: '#060608',
              border: 'none',
              borderRadius: 0,
              fontFamily: MONO,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e8e8f0'; }}
          >RUN ANALYSIS</button>

          <p style={{
            fontFamily: MONO,
            fontSize: '10px',
            color: '#3a3a4a',
            letterSpacing: '0.06em',
            marginTop: '16px',
          }}>
            Quantitative analysis only. Not financial advice.
          </p>
        </div>
      </div>

      {/* ── 4. FIVE SIGNALS STRIP ──────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #0f0f16' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '0 48px',
          height: '40px',
        }}>
          <span style={{
            fontFamily: MONO,
            fontSize: '9px',
            color: '#3a3a4a',
            letterSpacing: '0.24em',
            textTransform: 'uppercase' as const,
            whiteSpace: 'nowrap' as const,
          }}>FIVE SIGNALS</span>
          <div style={{ flex: 1, height: '1px', background: '#0f0f16' }} />
        </div>

        <div style={{ display: 'flex' }}>
          {SIGNALS.map((sig, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '44px 36px',
              borderRight: i < SIGNALS.length - 1 ? '1px solid #0f0f16' : 'none',
            }}>
              <div style={{
                width: '28px',
                height: '3px',
                background: sig.color,
                marginBottom: '22px',
              }} />
              <p style={{
                fontFamily: MONO,
                fontSize: '11px',
                color: sig.color,
                fontWeight: 600,
                letterSpacing: '0.08em',
                marginBottom: '12px',
              }}>{sig.name}</p>
              <p style={{
                fontFamily: BODY,
                fontSize: '13px',
                fontWeight: 300,
                color: '#5a5a70',
                lineHeight: 1.85,
              }}>{sig.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. HOW IT WORKS ────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #0f0f16' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '0 48px',
          height: '40px',
        }}>
          <span style={{
            fontFamily: MONO,
            fontSize: '9px',
            color: '#3a3a4a',
            letterSpacing: '0.24em',
            textTransform: 'uppercase' as const,
            whiteSpace: 'nowrap' as const,
          }}>HOW IT WORKS</span>
          <div style={{ flex: 1, height: '1px', background: '#0f0f16' }} />
        </div>

        <div style={{ display: 'flex' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '48px 40px',
              borderRight: i < HOW_IT_WORKS.length - 1 ? '1px solid #0f0f16' : 'none',
            }}>
              <p style={{
                fontFamily: MONO,
                fontSize: '10px',
                color: '#222230',
                letterSpacing: '0.12em',
                marginBottom: '28px',
              }}>{step.step}</p>
              <p style={{
                fontFamily: SERIF,
                fontSize: '21px',
                color: '#e8e8f0',
                lineHeight: 1.2,
                marginBottom: '16px',
                fontWeight: 400,
              }}>{step.title}</p>
              <p style={{
                fontFamily: BODY,
                fontSize: '13px',
                fontWeight: 300,
                color: '#5a5a70',
                lineHeight: 1.85,
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. STATS ROW ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderTop: '1px solid #0f0f16' }}>
        {STATS.map((stat, i) => (
          <div key={i} style={{
            flex: 1,
            padding: '44px 52px',
            borderRight: i < STATS.length - 1 ? '1px solid #0f0f16' : 'none',
          }}>
            <p style={{
              fontFamily: MONO,
              fontSize: '54px',
              color: stat.color,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: '12px',
            }}>{stat.value}</p>
            <p style={{
              fontFamily: MONO,
              fontSize: '10px',
              color: '#3a3a4a',
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
            }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── 7. RECENT SEARCHES ─────────────────────────────────────────────── */}
      {recentSearches.length > 0 && (
        <div style={{ borderTop: '1px solid #0f0f16', padding: '28px 52px 44px' }}>
          <p style={{
            fontFamily: MONO,
            fontSize: '9px',
            color: '#3a3a4a',
            letterSpacing: '0.24em',
            textTransform: 'uppercase' as const,
            marginBottom: '16px',
          }}>RECENT</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {recentSearches.map((t) => (
              <button
                key={t}
                onClick={() => { setQuery(t); router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${timeframe}`); }}
                style={{
                  background: 'transparent',
                  border: '1px solid #1a1a26',
                  borderRadius: 0,
                  padding: '7px 16px',
                  fontFamily: MONO,
                  fontSize: '11px',
                  color: '#5a5a70',
                  cursor: 'pointer',
                  transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#00e5ff';
                  (e.currentTarget as HTMLButtonElement).style.color = '#00e5ff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a26';
                  (e.currentTarget as HTMLButtonElement).style.color = '#5a5a70';
                }}
              >{t}</button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
