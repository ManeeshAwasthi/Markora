'use client';

import Link from 'next/link';
import { C, T } from '@/lib/designTokens';

const MONO  = T.MONO;
const SERIF = T.SERIF;
const BODY  = T.BODY;

const MARKET_REGIONS = [
  { region: 'United States',  exchange: 'NYSE / NASDAQ',  status: 'ACTIVE', color: C.GREEN,  count: '8,000+' },
  { region: 'United Kingdom', exchange: 'LSE',            status: 'ACTIVE', color: C.GREEN,  count: '2,000+' },
  { region: 'India',          exchange: 'NSE / BSE',      status: 'ACTIVE', color: C.GREEN,  count: '5,000+' },
  { region: 'European Union', exchange: 'EURONEXT',       status: 'ACTIVE', color: C.GREEN,  count: '1,500+' },
  { region: 'Japan',          exchange: 'TSE',            status: 'ACTIVE', color: C.GREEN,  count: '3,800+' },
  { region: 'Hong Kong',      exchange: 'HKEX',           status: 'ACTIVE', color: C.GREEN,  count: '2,500+' },
  { region: 'Canada',         exchange: 'TSX',            status: 'ACTIVE', color: C.GREEN,  count: '1,500+' },
  { region: 'Australia',      exchange: 'ASX',            status: 'COMING', color: C.ORANGE, count: '2,200+' },
  { region: 'Brazil',         exchange: 'B3',             status: 'COMING', color: C.ORANGE, count: '400+'   },
  { region: 'South Korea',    exchange: 'KRX',            status: 'COMING', color: C.ORANGE, count: '2,400+' },
];

export default function MarketsPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.BG, color: C.TEXT }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* NAV */}
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
            <Link href="/signal" style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: C.TEXT2 }}>SIGNALS</Link>
            <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.GREEN, borderBottom: `1px solid ${C.GREEN}`, paddingBottom: '2px' }}>MARKETS</span>
            <Link href="/methodology" style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: C.TEXT2 }}>METHODOLOGY</Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.GREEN, animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>LIVE_FEED</span>
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ paddingTop: '80px', maxWidth: '960px', margin: '0 auto', padding: '80px 40px 80px' }}>
        <div style={{ marginBottom: '56px', animation: 'fadeUp 400ms ease forwards' }}>
          <p style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT3, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>COVERAGE</p>
          <h1 style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(2.4rem, 5vw, 3.5rem)', fontWeight: 800, color: C.TEXT, lineHeight: 1.1, marginBottom: '20px' }}>
            Global Markets
          </h1>
          <p style={{ fontFamily: BODY, fontSize: '16px', color: C.TEXT2, lineHeight: 1.7, maxWidth: '520px' }}>
            Markora analyses equities across 50+ exchanges. Sentiment divergence is computed in real-time for any listed security using local pricing and global news sources.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: C.BORDER_FAINT, marginBottom: '56px', border: `1px solid ${C.BORDER_FAINT}` }}>
          {[
            { value: '50+',    label: 'Exchanges covered' },
            { value: '30,000+',label: 'Listed securities' },
            { value: '7s',     label: 'Avg analysis time'  },
          ].map((s, i) => (
            <div key={i} style={{ background: C.SURFACE, padding: '28px 32px' }}>
              <p style={{ fontFamily: MONO, fontSize: '2rem', fontWeight: 700, color: C.CYAN, marginBottom: '8px' }}>{s.value}</p>
              <p style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Markets table */}
        <div style={{ border: `1px solid ${C.BORDER_FAINT}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', padding: '10px 24px', borderBottom: `1px solid ${C.BORDER_FAINT}`, background: C.SURFACE }}>
            {['REGION', 'EXCHANGE', 'SECURITIES', 'STATUS'].map(h => (
              <span key={h} style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {MARKET_REGIONS.map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr auto auto',
              padding: '16px 24px', borderBottom: i < MARKET_REGIONS.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
              background: C.BG, alignItems: 'center', gap: '16px',
            }}>
              <span style={{ fontFamily: BODY, fontSize: '14px', color: C.TEXT }}>{m.region}</span>
              <span style={{ fontFamily: MONO, fontSize: '11px', color: C.TEXT2 }}>{m.exchange}</span>
              <span style={{ fontFamily: MONO, fontSize: '11px', color: C.TEXT3 }}>{m.count}</span>
              <span style={{
                fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em',
                padding: '3px 10px', textTransform: 'uppercase',
                color: m.color, background: m.color + '15', border: `1px solid ${m.color}30`,
              }}>{m.status}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
