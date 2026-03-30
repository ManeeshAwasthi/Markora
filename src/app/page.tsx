'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResult } from '@/types';
import { C, T } from '@/lib/designTokens';

const MONO  = T.MONO;
const SERIF = T.SERIF;
const BODY  = T.BODY;

const TIMEFRAMES = [
  { value: 7,  label: '7D · WEEK'    },
  { value: 30, label: '30D · MONTH'  },
  { value: 90, label: '90D · QUARTER'},
] as const;

const TICKER_ITEMS = [
  { ticker: 'AAPL',        signal: 'Aligned',         color: C.GREEN,  price: '+1.2%' },
  { ticker: 'TSLA',        signal: 'Mild Optimism',   color: C.ORANGE, price: '+3.4%' },
  { ticker: 'MSFT',        signal: 'Overconfidence',  color: C.RED,    price: '-0.8%' },
  { ticker: 'NVDA',        signal: 'Hidden Strength', color: C.CYAN,   price: '+5.1%' },
  { ticker: 'META',        signal: 'Aligned',         color: C.GREEN,  price: '+0.6%' },
  { ticker: 'AMZN',        signal: 'Mild Pessimism',  color: C.ORANGE, price: '-1.9%' },
  { ticker: 'RELIANCE.NS', signal: 'Hidden Strength', color: C.CYAN,   price: '+2.3%' },
  { ticker: 'GOOG',        signal: 'Aligned',         color: C.GREEN,  price: '+0.9%' },
];

const SIGNALS = [
  { name: 'Overconfidence', color: C.RED,    desc: 'Crowd bullish. Price disagrees. Pullback risk elevated.'         },
  { name: 'Mild Optimism',  color: C.ORANGE, desc: 'Sentiment slightly ahead of price. Watch momentum.'             },
  { name: 'Aligned',        color: C.GREEN,  desc: 'Sentiment and price in sync. No divergence edge.'               },
  { name: 'Mild Pessimism', color: C.ORANGE, desc: 'Price outrunning bearish crowd. Monitor for reversal.'          },
  { name: 'Hidden Strength',color: C.CYAN,   desc: 'Price rising despite bearish narrative. Rare. Actionable.'      },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Headline Sentiment',  desc: 'Aggregates from Finnhub and Marketaux. Each headline is scored for bullish or bearish signal without opinion.' },
  { step: '02', title: 'Price Normalisation', desc: 'Maps raw percentage price change to a 0–100 scale. A 50% move = 100. Flat = 50. Comparable across any stock.'  },
  { step: '03', title: 'Divergence Score',    desc: 'Sentiment score minus normalised price. Positive = crowd ahead of price. Negative = price ahead of crowd.'      },
  { step: '04', title: 'Signal + Five Layers',desc: 'Five signal types plus RSI, MA200, Bollinger, fundamentals, momentum flow, risk profile, and peer comparison.'  },
];

const STATS = [
  { value: '50+', label: 'Global markets covered',  color: C.TEXT },
  { value: '5',   label: 'Divergence signal types',  color: C.TEXT },
  { value: '7s',  label: 'Avg analysis time',        color: C.CYAN },
  { value: '3',   label: 'Timeframe windows',         color: C.TEXT },
];

function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ height: '32px', background: C.SURFACE, borderBottom: `1px solid ${C.BORDER_FAINT}`, overflow: 'hidden' }}>
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
            <span style={{ color: C.TEXT }}>{item.ticker}</span>
            <span style={{ color: C.BORDER, margin: '0 6px' }}>·</span>
            <span style={{ color: item.color }}>{item.signal}</span>
            <span style={{ color: C.BORDER, margin: '0 6px' }}>·</span>
            <span style={{ color: C.TEXT3 }}>{item.price}</span>
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

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
    router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${timeframe}`);
  };

  return (
    <div style={{
      background: C.BG,
      minHeight: '100vh',
      color: C.TEXT,
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
        height: '48px',
        padding: '0 48px',
        background: C.BG,
        borderBottom: `1px solid ${C.BORDER_FAINT}`,
      }}>
        <span style={{
          fontFamily: MONO,
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: C.TEXT,
        }}>
          MARKORA
        </span>

        <div style={{ display: 'flex', gap: '36px' }}>
          {([
            { label: 'SIGNALS',     href: '/signal'      },
            { label: 'MARKETS',     href: '/markets'     },
            { label: 'METHODOLOGY', href: '/methodology' },
          ] as const).map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: MONO,
                fontSize: '9px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.18em',
                color: C.TEXT2,
                textDecoration: 'none',
                transition: 'color 150ms',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.CYAN; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT2; }}
            >{link.label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: C.GREEN,
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT3, letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </nav>

      {/* ── 2. TICKER TAPE ─────────────────────────────────────────────────── */}
      <TickerTape />

      {/* ── 3. HERO ────────────────────────────────────────────────────────── */}
      <div style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '0 24px',
      }}>
        <p style={{
          fontFamily: MONO,
          fontSize: '10px',
          color: C.TEXT3,
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
              color: C.CYAN,
            }}>reality.</em>
          </span>
        </h1>

        <p style={{
          fontFamily: BODY,
          fontSize: '16px',
          fontWeight: 300,
          color: C.TEXT2,
          lineHeight: 1.8,
          maxWidth: '520px',
          margin: '0 auto 52px',
        }}>
          Markora quantifies the gap between what the crowd believes and what price confirms. Five signal types across 50+ global markets.
        </p>

        {/* Search + CTA block */}
        <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
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
                background: C.SURFACE,
                border: `1px solid ${C.BORDER}`,
                borderRadius: 0,
                padding: '0 48px 0 16px',
                color: C.TEXT,
                fontFamily: MONO,
                fontSize: '12px',
                letterSpacing: '0.02em',
                outline: 'none',
                boxSizing: 'border-box' as const,
                transition: 'border-color 150ms',
              }}
              onFocusCapture={(e) => { (e.target as HTMLInputElement).style.borderColor = C.CYAN; }}
              onBlurCapture={(e)  => { (e.target as HTMLInputElement).style.borderColor = C.BORDER; }}
            />
            <span style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: C.TEXT3,
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
                background: C.SURFACE,
                border: `1px solid ${C.BORDER}`,
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
                      borderBottom: i < suggestions.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.ELEVATED; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span style={{
                      fontFamily: MONO,
                      fontSize: '11px',
                      color: C.CYAN,
                      minWidth: '60px',
                    }}>{s.ticker}</span>
                    <span style={{
                      fontFamily: BODY,
                      fontSize: '13px',
                      color: C.TEXT,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                    }}>{s.name}</span>
                    {s.exchange && (
                      <span style={{
                        fontFamily: MONO,
                        fontSize: '10px',
                        color: C.TEXT3,
                        background: C.ELEVATED,
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
                  background: timeframe === value ? C.ELEVATED : C.SURFACE,
                  border: `1px solid ${C.BORDER}`,
                  borderTop: 'none',
                  borderRight: idx < TIMEFRAMES.length - 1 ? 'none' : `1px solid ${C.BORDER}`,
                  borderBottom: timeframe === value ? `2px solid ${C.CYAN}` : `1px solid ${C.BORDER}`,
                  borderRadius: 0,
                  color: timeframe === value ? C.CYAN : C.TEXT3,
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
              background: C.TEXT,
              color: C.BG,
              border: 'none',
              borderRadius: 0,
              fontFamily: MONO,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              transition: 'opacity 150ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >RUN ANALYSIS</button>

          <p style={{
            fontFamily: MONO,
            fontSize: '10px',
            color: C.TEXT3,
            letterSpacing: '0.06em',
            marginTop: '16px',
            textAlign: 'center' as const,
          }}>
            Quantitative analysis only. Not financial advice.
          </p>
        </div>
      </div>

      {/* ── 4. FIVE SIGNALS STRIP ──────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${C.BORDER_FAINT}` }}>
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
            color: C.TEXT3,
            letterSpacing: '0.24em',
            textTransform: 'uppercase' as const,
            whiteSpace: 'nowrap' as const,
          }}>FIVE SIGNALS</span>
          <div style={{ flex: 1, height: '1px', background: C.BORDER_FAINT }} />
        </div>

        <div style={{ display: 'flex' }}>
          {SIGNALS.map((sig, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '44px 36px',
              borderRight: i < SIGNALS.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
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
                color: C.TEXT2,
                lineHeight: 1.85,
              }}>{sig.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. HOW IT WORKS ────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${C.BORDER_FAINT}` }}>
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
            color: C.TEXT3,
            letterSpacing: '0.24em',
            textTransform: 'uppercase' as const,
            whiteSpace: 'nowrap' as const,
          }}>HOW IT WORKS</span>
          <div style={{ flex: 1, height: '1px', background: C.BORDER_FAINT }} />
        </div>

        <div style={{ display: 'flex' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '48px 40px',
              borderRight: i < HOW_IT_WORKS.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
            }}>
              <p style={{
                fontFamily: MONO,
                fontSize: '10px',
                color: C.TEXT3,
                letterSpacing: '0.12em',
                marginBottom: '28px',
              }}>{step.step}</p>
              <p style={{
                fontFamily: SERIF,
                fontSize: '21px',
                color: C.TEXT,
                lineHeight: 1.2,
                marginBottom: '16px',
                fontWeight: 400,
              }}>{step.title}</p>
              <p style={{
                fontFamily: BODY,
                fontSize: '13px',
                fontWeight: 300,
                color: C.TEXT2,
                lineHeight: 1.85,
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. STATS ROW ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderTop: `1px solid ${C.BORDER_FAINT}` }}>
        {STATS.map((stat, i) => (
          <div key={i} style={{
            flex: 1,
            padding: '44px 52px',
            borderRight: i < STATS.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
          }}>
            <p style={{
              fontFamily: MONO,
              fontSize: 'clamp(2.8rem, 4vw, 3.5rem)',
              color: stat.color,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}>{stat.value}</p>
            <p style={{
              fontFamily: MONO,
              fontSize: '10px',
              color: C.TEXT3,
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
            }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── 7. FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${C.BORDER_FAINT}`,
        padding: '28px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap' as const,
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: C.TEXT }}>MARKORA</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.12em' }}>
            DIVERGENCE ANALYSIS ENGINE · v1.04
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' as const }}>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.1em' }}>QUANTITATIVE ANALYSIS ONLY</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.1em' }}>NOT FINANCIAL ADVICE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.GREEN, animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.12em' }}>LIVE</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
