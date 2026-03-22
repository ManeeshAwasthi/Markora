'use client';

import React, { useState } from 'react';
import type { CSSProperties } from 'react';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";

interface PeerComparisonTabProps {
  data: {
    peers: Array<{
      companyName: string;
      priceChangePercent: number;
      peRatio: number | null;
      relativeStrength: number;
      currencySymbol: string;
    }>;
  };
  meta: { companyName: string; currentPrice: number; currencySymbol: string; timeframe: number };
  targetPriceChangePercent?: number;
  targetPeRatio?: number | null;
}

const insightBoxStyle: CSSProperties = {
  background: '#0a0a12', borderLeft: '3px solid #00e5ff',
  borderRadius: '8px', padding: '20px 24px', marginTop: '20px',
};
const insightLabelStyle: CSSProperties = {
  fontSize: '11px', fontFamily: MONO, color: '#4a4a6a',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px',
};
const insightTextStyle: CSSProperties = {
  fontSize: '14px', color: '#c0c0d0', lineHeight: 1.65, fontFamily: FONT,
};
const collapsibleBtnStyle: CSSProperties = {
  background: 'transparent', border: 'none', color: '#4a4a6a',
  fontFamily: MONO, fontSize: '11px', letterSpacing: '0.08em',
  cursor: 'pointer', padding: '12px 0 0',
  display: 'flex', alignItems: 'center', gap: '6px',
};
const collapsibleContentStyle: CSSProperties = {
  marginTop: '12px', padding: '16px 20px', background: '#0d0d14',
  border: '1px solid #1c1c26', borderRadius: '6px',
  fontSize: '13px', color: '#666', lineHeight: 1.7, fontFamily: FONT,
};

export default function PeerComparisonTab({ data, meta, targetPriceChangePercent, targetPeRatio }: PeerComparisonTabProps) {
  const [showLearn, setShowLearn] = useState(false);

  const { peers } = data;
  const peersAbove = peers.filter(p => p.priceChangePercent > (targetPriceChangePercent ?? 0)).length;
  const peersBelow = peers.filter(p => p.priceChangePercent <= (targetPriceChangePercent ?? 0)).length;

  // Compute target rank
  const allChanges = [...peers.map(p => p.priceChangePercent), targetPriceChangePercent ?? 0].sort((a, b) => b - a);
  const targetRank = allChanges.indexOf(targetPriceChangePercent ?? 0) + 1;

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Summary */}
      <div style={{ background: '#0a0a12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '24px 28px', marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Peer Comparison Summary
        </p>
        <p style={{ fontSize: '15px', color: '#c0c0d0', lineHeight: 1.7 }}>
          {meta.companyName} vs{' '}
          <span style={{ fontFamily: MONO, color: '#00e5ff' }}>{peers.length}</span> sector peers over{' '}
          <span style={{ fontFamily: MONO, color: '#00e5ff' }}>{meta.timeframe}</span> days.{' '}
          {peers.length > 0 && targetPriceChangePercent !== undefined && (
            <>
              {meta.companyName} ranks{' '}
              <span style={{ fontFamily: MONO, color: '#00e5ff' }}>#{targetRank}</span> of {peers.length + 1} by price change.{' '}
              {peersAbove} peer{peersAbove !== 1 ? 's' : ''} outperformed and{' '}
              {peersBelow} underperformed.
            </>
          )}
        </p>
      </div>

      {/* Comparison Table */}
      {peers.length === 0 ? (
        <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ color: '#555', fontFamily: MONO, fontSize: '13px' }}>No peer comparison data available for this security.</p>
        </div>
      ) : (
        <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '12px', padding: '14px 20px',
            borderBottom: '1px solid #1c1c26',
            background: '#0a0a12',
          }}>
            {['Company', 'Price Chg', 'P/E', 'vs Target'].map((h, i) => (
              <span key={h} style={{
                color: '#4a4a6a', fontSize: '11px', fontFamily: MONO,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textAlign: i > 0 ? 'right' : 'left',
              }}>{h}</span>
            ))}
          </div>

          {/* Target row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '12px', padding: '16px 20px',
            borderBottom: '1px solid #1c1c26',
            background: '#00e5ff06',
            borderLeft: '3px solid #00e5ff',
          }}>
            <span style={{ color: '#e8e8f0', fontSize: '13px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {meta.companyName}
              <span style={{ fontFamily: MONO, fontSize: '10px', color: '#00e5ff', background: '#00e5ff15', padding: '1px 7px', borderRadius: '3px' }}>target</span>
            </span>
            <span style={{
              color: (targetPriceChangePercent ?? 0) >= 0 ? '#00ff88' : '#ef4444',
              fontSize: '13px', fontFamily: MONO, textAlign: 'right', fontWeight: 600,
            }}>
              {targetPriceChangePercent !== undefined
                ? `${targetPriceChangePercent >= 0 ? '+' : ''}${targetPriceChangePercent.toFixed(2)}%`
                : '—'}
            </span>
            <span style={{ color: '#e8e8f0', fontSize: '13px', fontFamily: MONO, textAlign: 'right' }}>
              {targetPeRatio !== null && targetPeRatio !== undefined ? targetPeRatio.toFixed(1) : '—'}
            </span>
            <span style={{ color: '#4a4a6a', fontSize: '13px', fontFamily: MONO, textAlign: 'right' }}>—</span>
          </div>

          {/* Peer rows */}
          {[...peers].sort((a, b) => b.priceChangePercent - a.priceChangePercent).map((peer, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: '12px', padding: '14px 20px',
                borderBottom: i < peers.length - 1 ? '1px solid #13131e' : 'none',
              }}
            >
              <span style={{ color: '#a0a0b8', fontSize: '13px', fontFamily: FONT }}>
                {peer.companyName}
              </span>
              <span style={{
                color: peer.priceChangePercent >= 0 ? '#00ff88' : '#ef4444',
                fontSize: '13px', fontFamily: MONO, textAlign: 'right',
              }}>
                {peer.priceChangePercent >= 0 ? '+' : ''}{peer.priceChangePercent.toFixed(2)}%
              </span>
              <span style={{ color: '#e8e8f0', fontSize: '13px', fontFamily: MONO, textAlign: 'right' }}>
                {peer.peRatio !== null ? peer.peRatio.toFixed(1) : '—'}
              </span>
              <span style={{
                color: peer.relativeStrength >= 0 ? '#00ff88' : '#ef4444',
                fontSize: '13px', fontFamily: MONO, textAlign: 'right',
              }}>
                {peer.relativeStrength >= 0 ? '+' : ''}{peer.relativeStrength.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Insight box */}
      <div style={insightBoxStyle}>
        <p style={insightLabelStyle}>What this tells you</p>
        <p style={insightTextStyle}>
          Peer comparison shows how {meta.companyName} performs relative to companies in the same sector.
          {peers.length > 0 && targetPriceChangePercent !== undefined && (
            <> {meta.companyName}{targetPriceChangePercent >= 0 ? ' gained' : ' lost'}{' '}
            {Math.abs(targetPriceChangePercent).toFixed(2)}% vs an average peer{' '}
            {(() => {
              const avgPeer = peers.reduce((acc, p) => acc + p.priceChangePercent, 0) / peers.length;
              return avgPeer >= 0 ? `gain of +${avgPeer.toFixed(2)}%` : `loss of ${avgPeer.toFixed(2)}%`;
            })()}.{' '}
            {targetPriceChangePercent > (peers.reduce((a, p) => a + p.priceChangePercent, 0) / peers.length)
              ? 'Outperforming peers is a sign of relative strength.'
              : 'Underperforming peers may indicate company-specific headwinds.'}</>
          )}{' '}
          The &quot;vs Target&quot; column shows each peer&apos;s relative strength compared to {meta.companyName} — how much more or less they gained/lost.
        </p>
      </div>

      <button style={collapsibleBtnStyle} onClick={() => setShowLearn(v => !v)}>
        {showLearn ? '▲' : '▼'} How peer comparison works
      </button>
      {showLearn && (
        <div style={collapsibleContentStyle}>
          Peer comparison (also called relative strength analysis) shows whether a stock&apos;s price action is driven by the broad sector or is company-specific. If the whole sector is down but one stock is up, that stock shows unusual strength. If a stock is down when peers are up, something company-specific may be happening. P/E comparison across peers shows whether a stock is valued at a premium or discount relative to its competitors. Higher P/E generally means higher growth expectations.
        </div>
      )}
    </div>
  );
}
