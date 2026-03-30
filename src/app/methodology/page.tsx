'use client';

import Link from 'next/link';
import { C, T } from '@/lib/designTokens';

const MONO  = T.MONO;
const SERIF = T.SERIF;
const BODY  = T.BODY;

const STEPS = [
  {
    step: '01',
    title: 'Headline Sentiment',
    detail: 'Markora aggregates news headlines from Finnhub and Marketaux. Each headline is scored independently for bullish or bearish signal using a weighted sentiment model — no human opinion, no recency bias.',
    metric: 'Sentiment Score · 0–100',
  },
  {
    step: '02',
    title: 'Price Normalisation',
    detail: 'Raw percentage price change is mapped to a 0–100 scale. A 50% move equals 100. Flat equals 50. This makes divergence comparable across any stock, sector, or market cap.',
    metric: 'Normalised Price · 0–100',
  },
  {
    step: '03',
    title: 'Divergence Score',
    detail: 'The core signal. Sentiment score minus normalised price. Positive divergence means the crowd is more bullish than price justifies — a potential overconfidence or optimism signal. Negative means price is outrunning sentiment.',
    metric: 'Divergence · −100 to +100',
  },
  {
    step: '04',
    title: 'Signal Classification',
    detail: 'Divergence is bucketed into five named signals: Overconfidence, Mild Optimism, Aligned, Mild Pessimism, and Hidden Strength. Thresholds are calibrated against historical divergence distributions.',
    metric: '5 Signal Types',
  },
  {
    step: '05',
    title: 'Technical Overlay',
    detail: 'RSI, 200-day moving average, and Bollinger Bands are layered on top of the divergence model to validate or flag signals. A strong divergence signal against oversold RSI carries more weight.',
    metric: 'RSI · MA200 · Bollinger',
  },
  {
    step: '06',
    title: 'Fundamentals & Flow',
    detail: 'P/E, revenue growth, institutional ownership, short interest, and options flow are computed for a complete picture. Fundamentals contextualise whether a divergence signal is structurally supported.',
    metric: 'P/E · Revenue · Institutions',
  },
];

const SIGNALS = [
  { name: 'Overconfidence',  color: C.RED,    desc: 'Sentiment far ahead of price. Crowd is more bullish than price action justifies. Pullback risk elevated.' },
  { name: 'Mild Optimism',   color: C.ORANGE, desc: 'Sentiment slightly ahead of price. Momentum may carry the crowd right — or be early.' },
  { name: 'Aligned',         color: C.GREEN,  desc: 'Sentiment and price are in sync. No divergence edge. Trend confirmation.' },
  { name: 'Mild Pessimism',  color: C.ORANGE, desc: 'Price outpacing bearish sentiment. Market ignoring the narrative. Watch for sentiment catch-up.' },
  { name: 'Hidden Strength', color: C.CYAN,   desc: 'Price rising despite a bearish crowd. Rare. Often precedes a sentiment reversal. Actionable.' },
];

export default function MethodologyPage() {
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
            <Link href="/markets" style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', color: C.TEXT2 }}>MARKETS</Link>
            <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.GREEN, borderBottom: `1px solid ${C.GREEN}`, paddingBottom: '2px' }}>METHODOLOGY</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.GREEN, animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT2, textTransform: 'uppercase', letterSpacing: '0.15em' }}>LIVE_FEED</span>
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ paddingTop: '48px', maxWidth: '800px', margin: '0 auto', padding: '80px 40px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: '64px', animation: 'fadeUp 400ms ease forwards' }}>
          <p style={{ fontFamily: MONO, fontSize: '10px', color: C.TEXT3, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>HOW IT WORKS</p>
          <h1 style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(2.4rem, 5vw, 3.5rem)', fontWeight: 800, color: C.TEXT, lineHeight: 1.1, marginBottom: '20px' }}>
            Sentiment Divergence<br />Model
          </h1>
          <p style={{ fontFamily: BODY, fontSize: '16px', color: C.TEXT2, lineHeight: 1.7, maxWidth: '560px' }}>
            Markora does not predict price. It measures the gap between what the crowd believes and what price is doing — then classifies that gap into an actionable signal.
          </p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: '72px' }}>
          <p style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '24px' }}>COMPUTATION PIPELINE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.BORDER_FAINT }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background: C.BG, padding: '28px 32px', display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: '24px', alignItems: 'start' }}>
                <span style={{ fontFamily: MONO, fontSize: '11px', color: C.CYAN, opacity: 0.5 }}>{s.step}</span>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 700, color: C.TEXT, letterSpacing: '0.05em', marginBottom: '10px', textTransform: 'uppercase' }}>{s.title}</p>
                  <p style={{ fontFamily: BODY, fontSize: '14px', color: C.TEXT2, lineHeight: 1.7 }}>{s.detail}</p>
                </div>
                <span style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.08em', whiteSpace: 'nowrap', paddingTop: '2px' }}>{s.metric}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signal types */}
        <div>
          <p style={{ fontFamily: MONO, fontSize: '9px', color: C.TEXT3, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '24px' }}>SIGNAL CLASSIFICATION</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.BORDER_FAINT }}>
            {SIGNALS.map((s, i) => (
              <div key={i} style={{ background: C.BG, padding: '20px 32px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em',
                  padding: '3px 10px', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  color: s.color, background: s.color + '15', border: `1px solid ${s.color}30`,
                  marginTop: '2px',
                }}>{s.name}</span>
                <p style={{ fontFamily: BODY, fontSize: '14px', color: C.TEXT2, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
