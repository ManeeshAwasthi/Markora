'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PriceIntelligenceTab from '@/components/details/PriceIntelligenceTab';
import FundamentalsTab      from '@/components/details/FundamentalsTab';
import MomentumTab          from '@/components/details/MomentumTab';
import RiskProfileTab       from '@/components/details/RiskProfileTab';
import PeerComparisonTab    from '@/components/details/PeerComparisonTab';
import { C, T, TYPE, styles } from '@/lib/designTokens';
import { SearchResult, SignalType } from '@/types';

const SIGNAL_COLORS: Record<SignalType, string> = {
  Overconfidence:   C.RED,
  'Mild Optimism':  C.ORANGE,
  Aligned:          C.GREEN,
  'Mild Pessimism': C.ORANGE,
  'Hidden Strength':C.CYAN,
};

type TabSlug = 'price-intelligence' | 'fundamentals' | 'momentum' | 'risk-profile' | 'peer-comparison';

const TABS: Array<{ slug: TabSlug; label: string }> = [
  { slug: 'price-intelligence', label: 'Price Intelligence' },
  { slug: 'fundamentals',       label: 'Fundamentals'       },
  { slug: 'momentum',           label: 'Momentum & Flow'    },
  { slug: 'risk-profile',       label: 'Risk Profile'       },
  { slug: 'peer-comparison',    label: 'Peer Comparison'    },
];

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.BG, gap: '24px' }}>
      <div style={{ position: 'relative', width: '48px', height: '48px' }}>
        <div style={{ position: 'absolute', inset: 0, border: `1px solid ${C.BORDER}`, borderTop: `1px solid ${C.CYAN}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <div style={{ position: 'absolute', inset: '10px', border: `1px solid ${C.BORDER_FAINT}`, borderBottom: `1px solid ${C.VIOLET}`, borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '6px' }}>LOADING DEEP ANALYSIS</p>
        <p style={{ fontFamily: T.MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.1em', opacity: 0.6 }}>Fetching market data…</p>
      </div>
    </div>
  );
}

function DetailsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const company      = searchParams.get('company')   ?? '';
  const timeframe    = Number(searchParams.get('timeframe') ?? '30') || 30;
  const tabParam     = (searchParams.get('tab') ?? 'price-intelligence') as TabSlug;
  const signalParam  = searchParams.get('signal') ?? '';

  const [activeTab, setActiveTab] = useState<TabSlug>(tabParam);
  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [inputTicker,       setInputTicker]       = useState(company);
  const [selectedTimeframe, setSelectedTimeframe] = useState<7 | 30 | 90>(timeframe as 7 | 30 | 90);
  const [suggestions,       setSuggestions]       = useState<SearchResult[]>([]);
  const [showDropdown,      setShowDropdown]       = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!company) return;
    setLoading(true);
    setError(null);
    fetch(`/api/details?company=${encodeURIComponent(company)}&timeframe=${timeframe}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        setError((e as Error).message);
        setLoading(false);
      });
  }, [company, timeframe]);

  const switchTab = (slug: TabSlug) => {
    setActiveTab(slug);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', slug);
    router.replace(`/signal/details?${params.toString()}`);
  };

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.trim().length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const results: SearchResult[] = await res.json();
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleAnalyze = () => {
    const t = inputTicker.trim();
    if (!t) return;
    router.push(`/signal?ticker=${encodeURIComponent(t)}&timeframe=${selectedTimeframe}`);
  };

  if (loading) return <Spinner />;

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.BG }}>
      <div style={{ background: C.RED + '0a', border: `1px solid ${C.RED}33`, borderLeft: `3px solid ${C.RED}`, padding: '24px 32px', maxWidth: '480px', width: '100%' }}>
        <p style={{ ...TYPE.LABEL_SM, color: C.RED, marginBottom: '8px' }}>ANALYSIS FAILED</p>
        <p style={{ ...TYPE.DATA_SM, color: C.TEXT2, marginBottom: '16px' }}>{error}</p>
        <a href="/" style={{ ...TYPE.LABEL_SM, color: C.TEXT3, textDecoration: 'none', border: `1px solid ${C.BORDER}`, padding: '6px 16px', display: 'inline-block' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT3; }}
        >← Return to Terminal</a>
      </div>
    </div>
  );

  if (!data) return null;

  const { meta, priceIntelligence, fundamentals, momentumFlow, riskProfile, peerComparison } = data;

  return (
    <div style={{ minHeight: '100vh', background: C.BG, color: C.TEXT }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      {/* ── TOP NAV ── */}
      <nav style={{
        position:    'fixed',
        top:          0,
        left:         0,
        right:        0,
        height:       '48px',
        background:   C.BG,
        borderBottom: `1px solid ${C.BORDER_FAINT}`,
        display:      'flex',
        justifyContent: 'space-between',
        alignItems:   'center',
        padding:      '0 32px',
        zIndex:        50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: T.MONO, fontSize: '13px', fontWeight: 700, letterSpacing: '0.2em', color: C.TEXT }}>MARKORA</span>
          </a>
          <div style={{ display: 'flex', gap: '32px' }}>
            <a
              href={`/signal?ticker=${encodeURIComponent(company)}&timeframe=${timeframe}`}
              style={{ fontFamily: T.MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: C.TEXT2 }}
            >SIGNALS</a>
            <span style={{ fontFamily: T.MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.GREEN, borderBottom: `1px solid ${C.GREEN}`, paddingBottom: '2px' }}>DEEP ANALYSIS</span>
            <a href="/markets" style={{ fontFamily: T.MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: C.TEXT2 }}>MARKETS</a>
            <a href="/methodology" style={{ fontFamily: T.MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: C.TEXT2 }}>METHODOLOGY</a>
          </div>
        </div>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.GREEN, animation: 'pulse 2s infinite' }} />
          <span style={{ ...TYPE.LABEL_SM, color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>LIVE_FEED</span>
        </div>
      </nav>

      {/* ── LAYOUT: sidebar + content ── */}
      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '48px' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: '220px',
          flexShrink: 0,
          position: 'fixed',
          top: '48px',
          left: 0,
          height: 'calc(100vh - 48px)',
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
            }}>DEEP_ANALYSIS</p>
          </div>

          {/* Page indicator chip — CYAN for details page */}
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
            }}>VIEW: DEEP_ANALYSIS</span>
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

          {/* Nav items — all 5 always shown, active one highlighted */}
          {TABS.map(tab => (
            <button
              key={tab.slug}
              onClick={() => switchTab(tab.slug)}
              style={styles.navItem(activeTab === tab.slug)}
              onMouseEnter={e => {
                if (activeTab !== tab.slug) {
                  (e.currentTarget as HTMLElement).style.color = C.TEXT;
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.slug) {
                  (e.currentTarget as HTMLElement).style.color = C.TEXT2;
                }
              }}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main style={{
          marginLeft:  '220px',
          flex:          1,
          background:   C.BG,
          minHeight:    'calc(100vh - 48px)',
        }}>
          {/* ── HERO HEADER ── */}
          <header style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '40px 40px 32px', borderBottom: `1px solid ${C.BORDER_FAINT}`,
            flexWrap: 'wrap', gap: '24px', background: C.BG,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: T.SERIF, fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: C.TEXT, margin: 0, lineHeight: 1.1 }}>
                {meta.companyName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: T.MONO, fontSize: '1.6rem', fontWeight: 700, color: C.TEXT }}>
                  {meta.currencySymbol}{meta.currentPrice.toLocaleString()}
                </span>
                {meta.priceChangePercent !== undefined && (
                  <span style={{ fontFamily: T.MONO, fontSize: '12px', fontWeight: 700, color: meta.priceChangePercent >= 0 ? C.GREEN : C.RED }}>
                    {meta.priceChangePercent >= 0 ? '+' : ''}{meta.priceChangePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {signalParam && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontFamily: T.MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Signal Status</span>
                    <span style={{
                      padding: '4px 12px',
                      background: `${SIGNAL_COLORS[signalParam as SignalType] ?? C.NEUTRAL}10`,
                      border: `1px solid ${SIGNAL_COLORS[signalParam as SignalType] ?? C.NEUTRAL}40`,
                      color: SIGNAL_COLORS[signalParam as SignalType] ?? C.NEUTRAL,
                      fontFamily: T.MONO, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                    }}>{signalParam}</span>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: C.BORDER_FAINT }} />
                </>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                {data.fundamentals?.sector && (
                  <span style={{ padding: '4px 10px', background: C.ELEVATED, border: `1px solid ${C.BORDER}`, fontFamily: T.MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {data.fundamentals.sector}
                  </span>
                )}
                {data.fundamentals?.industry && (
                  <span style={{ padding: '4px 10px', background: C.ELEVATED, border: `1px solid ${C.BORDER}`, fontFamily: T.MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {data.fundamentals.industry}
                  </span>
                )}
              </div>
              <a
                href="/"
                style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '10px', textDecoration: 'none', border: `1px solid ${C.BORDER}`, padding: '8px 16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT2; }}
              >← Home</a>
            </div>
          </header>

          {/* ── CONTROLS BAR ── */}
          <section style={{
            borderBottom: `1px solid ${C.BORDER_FAINT}`,
            padding: '10px 40px',
            display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
            background: C.SURFACE,
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
                  width: '100%', background: C.SURFACE, border: `1px solid ${C.BORDER}`,
                  color: C.TEXT, fontFamily: T.MONO, fontSize: '10px', height: '40px',
                  padding: '0 16px', outline: 'none', letterSpacing: '0.1em',
                  boxSizing: 'border-box' as const,
                }}
                onFocusCapture={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.CYAN; }}
                onBlurCapture={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.BORDER; }}
              />
              {showDropdown && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: C.SURFACE, border: `1px solid ${C.BORDER}`,
                  overflow: 'hidden', zIndex: 50,
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
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.ELEVATED; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span style={{ color: C.TEXT, fontSize: '12px', fontFamily: T.BODY, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                      {s.exchange && (
                        <span style={{ fontFamily: T.MONO, fontSize: '10px', color: C.TEXT2, background: C.ELEVATED, padding: '2px 6px' }}>{s.exchange}</span>
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
                    padding: '6px 20px', fontFamily: T.MONO, fontSize: '10px',
                    letterSpacing: '0.1em', cursor: 'pointer', border: 'none',
                    background: selectedTimeframe === tf ? C.CYAN : 'transparent',
                    color: selectedTimeframe === tf ? C.BG : C.TEXT2,
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
                marginLeft: 'auto', padding: '10px 40px', background: C.SURFACE,
                color: C.TEXT, fontFamily: T.MONO, fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                border: `1px solid ${C.BORDER}`, cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.CYAN; (e.currentTarget as HTMLButtonElement).style.color = C.CYAN; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.BORDER; (e.currentTarget as HTMLButtonElement).style.color = C.TEXT; }}
            >
              ANALYZE
            </button>
          </section>

          {/* Scrollable tab content */}
          <div style={{ padding: '40px 40px 80px' }}>
            {activeTab === 'price-intelligence' && (
              <PriceIntelligenceTab
                data={priceIntelligence}
                meta={{ companyName: meta.companyName, currencySymbol: meta.currencySymbol, currentPrice: meta.currentPrice }}
              />
            )}
            {activeTab === 'fundamentals' && (
              <FundamentalsTab
                data={fundamentals}
                meta={{ companyName: meta.companyName, currencySymbol: meta.currencySymbol, currentPrice: meta.currentPrice }}
              />
            )}
            {activeTab === 'momentum' && (
              <MomentumTab
                data={momentumFlow}
                meta={{ companyName: meta.companyName }}
              />
            )}
            {activeTab === 'risk-profile' && (
              <RiskProfileTab
                data={riskProfile}
                meta={{ companyName: meta.companyName }}
              />
            )}
            {activeTab === 'peer-comparison' && (
              <PeerComparisonTab
                data={peerComparison}
                meta={{ companyName: meta.companyName, currentPrice: meta.currentPrice, currencySymbol: meta.currencySymbol, timeframe: meta.timeframe }}
                targetPriceChangePercent={undefined}
                targetPeRatio={fundamentals.peRatio}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DetailsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DetailsContent />
    </Suspense>
  );
}
