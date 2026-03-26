'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PriceIntelligenceTab from '@/components/details/PriceIntelligenceTab';
import FundamentalsTab      from '@/components/details/FundamentalsTab';
import MomentumTab          from '@/components/details/MomentumTab';
import RiskProfileTab       from '@/components/details/RiskProfileTab';
import PeerComparisonTab    from '@/components/details/PeerComparisonTab';
import { C, T, TYPE, styles } from '@/lib/designTokens';

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.BG, gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: `2px solid ${C.BORDER}`, borderTop: `2px solid ${C.CYAN}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>LOADING DEEP ANALYSIS</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DetailsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const company      = searchParams.get('company')   ?? '';
  const timeframe    = Number(searchParams.get('timeframe') ?? '30') || 30;
  const tabParam     = (searchParams.get('tab') ?? 'price-intelligence') as TabSlug;

  const [activeTab, setActiveTab] = useState<TabSlug>(tabParam);
  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

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

  if (loading) return <Spinner />;

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.BG }}>
      <div style={{ background: C.RED + '0d', border: `1px solid ${C.RED}44`, padding: '20px 32px', ...TYPE.DATA_SM, color: C.RED }}>
        ERROR: {error}
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
          <span style={{ ...TYPE.LABEL_LG, fontSize: '13px', letterSpacing: '0.2em', color: C.TEXT }}>MARKORA</span>
          <a
            href={`/signal?ticker=${encodeURIComponent(company)}&timeframe=${timeframe}`}
            style={{ ...TYPE.LABEL_SM, color: C.TEXT2, textDecoration: 'none' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = C.CYAN)}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = C.TEXT2)}
          >← SIGNAL BOARD</a>
        </div>
        {/* Company name + price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.SERIF, fontStyle: 'italic', fontSize: '18px', fontWeight: 800, color: C.TEXT }}>{meta.companyName}</span>
          <span style={{ ...TYPE.DATA_MD, color: C.CYAN }}>{meta.currencySymbol}{meta.currentPrice.toLocaleString()}</span>
          <span style={{ ...TYPE.LABEL_SM, color: C.TEXT2, background: C.ELEVATED, border: `1px solid ${C.BORDER}`, padding: '3px 8px' }}>
            {meta.exchange}
          </span>
        </div>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.GREEN, animation: 'pulse 2s infinite' }} />
          <span style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>LIVE_FEED</span>
        </div>
      </nav>

      {/* ── LAYOUT: sidebar + content ── */}
      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '48px' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width:        '220px',
          flexShrink:    0,
          position:     'fixed',
          top:           '48px',
          left:           0,
          height:        'calc(100vh - 48px)',
          background:    C.BG,
          borderRight:  `1px solid ${C.BORDER_FAINT}`,
          display:       'flex',
          flexDirection: 'column',
          paddingTop:    '24px',
          overflowY:     'auto',
          zIndex:         40,
        }}>
          <div style={{ padding: '0 24px', marginBottom: '40px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.GREEN,  letterSpacing: '0.3em', marginBottom: '4px' }}>TERMINAL_V1.04</p>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3,  letterSpacing: '0.1em' }}>DEEP_ANALYSIS</p>
          </div>
          <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, letterSpacing: '0.3em', padding: '0 24px', marginBottom: '16px' }}>SECTIONS</p>
          {TABS.map(tab => (
            <button
              key={tab.slug}
              onClick={() => switchTab(tab.slug)}
              style={styles.navItem(activeTab === tab.slug)}
              onMouseEnter={e => { if (activeTab !== tab.slug) (e.currentTarget as HTMLElement).style.color = C.TEXT; }}
              onMouseLeave={e => { if (activeTab !== tab.slug) (e.currentTarget as HTMLElement).style.color = C.TEXT2; }}
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
          {/* Page hero header */}
          <div style={{
            background:    C.SURFACE,
            borderBottom: `1px solid ${C.BORDER_FAINT}`,
            padding:       '32px 40px',
          }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '8px' }}>
              DEEP ANALYSIS // {TABS.find(t => t.slug === activeTab)?.label.toUpperCase()} · {timeframe}D
            </p>
            <h1 style={{ ...TYPE.DISPLAY_LG, fontStyle: 'italic', color: C.TEXT, margin: 0 }}>
              {meta.companyName}
            </h1>
          </div>

          {/* Scrollable tab content */}
          <div style={{ padding: '40px 40px 80px', maxWidth: '1000px' }}>
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
