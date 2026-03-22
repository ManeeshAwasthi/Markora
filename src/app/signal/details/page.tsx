'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PriceIntelligenceTab from '@/components/details/PriceIntelligenceTab';
import FundamentalsTab from '@/components/details/FundamentalsTab';
import MomentumTab from '@/components/details/MomentumTab';
import RiskProfileTab from '@/components/details/RiskProfileTab';
import PeerComparisonTab from '@/components/details/PeerComparisonTab';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";

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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#060608' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #1c1c26', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#060608', color: '#ef4444', fontFamily: MONO }}>
      Error: {error}
    </div>
  );

  if (!data) return null;

  const { meta, priceIntelligence, fundamentals, momentumFlow, riskProfile, peerComparison } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#060608', color: '#e8e8f0' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1c1c26', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d0d12', flexWrap: 'wrap', gap: '12px' }}>
        <a href="/signal" style={{ color: '#4a4a6a', fontFamily: MONO, fontSize: '12px', textDecoration: 'none', letterSpacing: '0.05em' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#00e5ff'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#4a4a6a'; }}
        >
          ← Back to Signal Board
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT, fontSize: '15px', color: '#e8e8f0' }}>{meta.companyName}</span>
          <span style={{ fontFamily: MONO, fontSize: '15px', color: '#00e5ff' }}>{meta.currencySymbol}{meta.currentPrice.toLocaleString()}</span>
          <span style={{ fontFamily: MONO, fontSize: '11px', color: '#4a4a6a', background: '#1c1c26', padding: '3px 8px', borderRadius: '4px' }}>{meta.exchange}</span>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>

        {/* Sidebar */}
        <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid #1c1c26', background: '#0d0d12', display: 'flex', flexDirection: 'column', paddingTop: '24px' }}>
          {TABS.map(tab => (
            <button
              key={tab.slug}
              onClick={() => switchTab(tab.slug)}
              style={{
                padding: '14px 20px',
                textAlign: 'left',
                background: activeTab === tab.slug ? '#00e5ff08' : 'transparent',
                border: 'none',
                borderLeft: activeTab === tab.slug ? '3px solid #00e5ff' : '3px solid transparent',
                color: activeTab === tab.slug ? '#00e5ff' : '#4a4a6a',
                fontFamily: MONO,
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                width: '100%',
              }}
              onMouseEnter={e => { if (activeTab !== tab.slug) (e.currentTarget as HTMLElement).style.color = '#a0a0b8'; }}
              onMouseLeave={e => { if (activeTab !== tab.slug) (e.currentTarget as HTMLElement).style.color = '#4a4a6a'; }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto', maxWidth: '900px' }}>
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#060608' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #1c1c26', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <DetailsContent />
    </Suspense>
  );
}
