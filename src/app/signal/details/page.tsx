'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PriceIntelligenceTab from '@/components/details/PriceIntelligenceTab';
import FundamentalsTab from '@/components/details/FundamentalsTab';
import MomentumTab from '@/components/details/MomentumTab';
import RiskProfileTab from '@/components/details/RiskProfileTab';
import PeerComparisonTab from '@/components/details/PeerComparisonTab';
import { C, T } from '@/lib/designTokens';

type TabSlug = 'price-intelligence' | 'fundamentals' | 'momentum' | 'risk-profile' | 'peer-comparison';

const TABS: Array<{ slug: TabSlug; label: string }> = [
  { slug: 'price-intelligence', label: 'Price Intelligence' },
  { slug: 'fundamentals', label: 'Fundamentals' },
  { slug: 'momentum', label: 'Momentum & Flow' },
  { slug: 'risk-profile', label: 'Risk Profile' },
  { slug: 'peer-comparison', label: 'Peer Comparison' },
];

function DetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const company = searchParams.get('company') ?? '';
  const timeframe = Number(searchParams.get('timeframe') ?? '30') || 30;
  const tabParam = (searchParams.get('tab') ?? 'price-intelligence') as TabSlug;

  const [activeTab, setActiveTab] = useState<TabSlug>(tabParam);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.BG }}>
      <div style={{ width: '40px', height: '40px', border: `3px solid ${C.BORDER}`, borderTop: `3px solid ${C.CYAN}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.BG, color: C.RED, fontFamily: T.MONO }}>
      Error: {error}
    </div>
  );

  if (!data) return null;

  const { meta, priceIntelligence, fundamentals, momentumFlow, riskProfile, peerComparison } = data;

  return (
    <div style={{ minHeight: '100vh', background: C.BG, color: C.TEXT }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.BORDER_FAINT}`, padding: '0 32px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.BG, flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span style={{ fontFamily: T.MONO, fontSize: '13px', fontWeight: 700, letterSpacing: '0.2em', color: C.TEXT }}>MARKORA</span>
          <a href="/signal" style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '10px', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.CYAN; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = C.TEXT2; }}
          >
            ← SIGNAL BOARD
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.SERIF, fontStyle: 'italic', fontSize: '18px', fontWeight: 800, color: C.TEXT }}>{meta.companyName}</span>
          <span style={{ fontFamily: T.MONO, fontSize: '16px', fontWeight: 700, color: C.CYAN }}>{meta.currencySymbol}{meta.currentPrice.toLocaleString()}</span>
          <span style={{ fontFamily: T.MONO, fontSize: '10px', color: C.TEXT2, background: C.ELEVATED, border: `1px solid ${C.BORDER}`, padding: '3px 8px', letterSpacing: '0.08em' }}>{meta.exchange}</span>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>

        {/* Sidebar */}
        <div style={{ width: '220px', flexShrink: 0, borderRight: `1px solid ${C.BORDER}`, background: C.SURFACE, display: 'flex', flexDirection: 'column', paddingTop: '24px' }}>
          {TABS.map(tab => (
            <button
              key={tab.slug}
              onClick={() => switchTab(tab.slug)}
              style={{
                padding: '14px 20px',
                textAlign: 'left',
                background: activeTab === tab.slug ? C.CYAN + '08' : 'transparent',
                border: 'none',
                borderLeft: activeTab === tab.slug ? `3px solid ${C.CYAN}` : '3px solid transparent',
                color: activeTab === tab.slug ? C.CYAN : C.TEXT2,
                fontFamily: T.MONO,
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                width: '100%',
              }}
              onMouseEnter={e => { if (activeTab !== tab.slug) (e.currentTarget as HTMLElement).style.color = C.TEXT; }}
              onMouseLeave={e => { if (activeTab !== tab.slug) (e.currentTarget as HTMLElement).style.color = C.TEXT2; }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: '48px 56px 80px', overflowY: 'auto', maxWidth: '960px' }}>
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
      </div>
    </div>
  );
}

export default function DetailsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.BG }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${C.BORDER}`, borderTop: `3px solid ${C.CYAN}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <DetailsContent />
    </Suspense>
  );
}
