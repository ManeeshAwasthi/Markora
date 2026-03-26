'use client';

import React, { useState } from 'react';
import { C, T, styles } from '@/lib/designTokens';

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

export default function PeerComparisonTab({ data, meta, targetPriceChangePercent, targetPeRatio }: PeerComparisonTabProps) {
  const [showLearn, setShowLearn] = useState(false);

  const { peers } = data;
  const peersAbove = peers.filter(p => p.priceChangePercent > (targetPriceChangePercent ?? 0)).length;
  const peersBelow = peers.filter(p => p.priceChangePercent <= (targetPriceChangePercent ?? 0)).length;

  // Compute target rank
  const allChanges = [...peers.map(p => p.priceChangePercent), targetPriceChangePercent ?? 0].sort((a, b) => b - a);
  const targetRank = allChanges.indexOf(targetPriceChangePercent ?? 0) + 1;

  return (
    <div style={{ fontFamily: T.BODY }}>
      {/* Summary */}
      <div style={{ ...styles.card, marginBottom: '40px' }}>
        <p style={styles.insightLabel}>Peer Comparison Summary</p>
        <p style={{ fontFamily: T.BODY, fontSize: '14px', color: C.TEXT2, lineHeight: 1.7 }}>
          {meta.companyName} vs{' '}
          <span style={{ fontFamily: T.MONO, color: C.CYAN }}>{peers.length}</span> sector peers over{' '}
          <span style={{ fontFamily: T.MONO, color: C.CYAN }}>{meta.timeframe}</span> days.{' '}
          {peers.length > 0 && targetPriceChangePercent !== undefined && (
            <>
              {meta.companyName} ranks{' '}
              <span style={{ fontFamily: T.MONO, color: C.CYAN }}>#{targetRank}</span> of {peers.length + 1} by price change.{' '}
              {peersAbove} peer{peersAbove !== 1 ? 's' : ''} outperformed and{' '}
              {peersBelow} underperformed.
            </>
          )}
        </p>
      </div>

      {/* Comparison Table */}
      {peers.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <p style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '13px' }}>No peer comparison data available for this security.</p>
        </div>
      ) : (
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, overflow: 'hidden', marginBottom: '20px' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '12px', padding: '14px 20px',
            borderBottom: `1px solid ${C.BORDER}`,
            background: C.ELEVATED,
          }}>
            {['Company', 'Price Chg', 'P/E', 'vs Target'].map((h, i) => (
              <span key={h} style={{
                color: C.TEXT3, fontSize: '10px', fontFamily: T.MONO,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                textAlign: i > 0 ? 'right' : 'left',
              }}>{h}</span>
            ))}
          </div>

          {/* Target row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '12px', padding: '16px 20px',
            borderBottom: `1px solid ${C.BORDER}`,
            background: C.CYAN + '06',
            borderLeft: `3px solid ${C.CYAN}`,
          }}>
            <span style={{ color: C.TEXT, fontSize: '13px', fontFamily: T.BODY, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {meta.companyName}
              <span style={{ fontFamily: T.MONO, fontSize: '10px', color: C.CYAN, background: C.CYAN + '15', padding: '1px 7px' }}>target</span>
            </span>
            <span style={{
              color: (targetPriceChangePercent ?? 0) >= 0 ? C.GREEN : C.RED,
              fontSize: '13px', fontFamily: T.MONO, textAlign: 'right', fontWeight: 600,
            }}>
              {targetPriceChangePercent !== undefined
                ? `${targetPriceChangePercent >= 0 ? '+' : ''}${targetPriceChangePercent.toFixed(2)}%`
                : '—'}
            </span>
            <span style={{ color: C.TEXT, fontSize: '13px', fontFamily: T.MONO, textAlign: 'right' }}>
              {targetPeRatio !== null && targetPeRatio !== undefined ? targetPeRatio.toFixed(1) : '—'}
            </span>
            <span style={{ color: C.TEXT2, fontSize: '13px', fontFamily: T.MONO, textAlign: 'right' }}>—</span>
          </div>

          {/* Peer rows */}
          {[...peers].sort((a, b) => b.priceChangePercent - a.priceChangePercent).map((peer, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: '12px', padding: '14px 20px',
                borderBottom: i < peers.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
              }}
            >
              <span style={{ color: C.TEXT2, fontSize: '13px', fontFamily: T.BODY }}>
                {peer.companyName}
              </span>
              <span style={{
                color: peer.priceChangePercent >= 0 ? C.GREEN : C.RED,
                fontSize: '13px', fontFamily: T.MONO, textAlign: 'right',
              }}>
                {peer.priceChangePercent >= 0 ? '+' : ''}{peer.priceChangePercent.toFixed(2)}%
              </span>
              <span style={{ color: C.TEXT, fontSize: '13px', fontFamily: T.MONO, textAlign: 'right' }}>
                {peer.peRatio !== null ? peer.peRatio.toFixed(1) : '—'}
              </span>
              <span style={{
                color: peer.relativeStrength >= 0 ? C.GREEN : C.RED,
                fontSize: '13px', fontFamily: T.MONO, textAlign: 'right',
              }}>
                {peer.relativeStrength >= 0 ? '+' : ''}{peer.relativeStrength.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Insight box */}
      <div style={styles.insightBox}>
        <p style={styles.insightLabel}>What this tells you</p>
        <p style={styles.insightText}>
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

      <button style={styles.collapsibleBtn} onClick={() => setShowLearn(v => !v)}>
        {showLearn ? '▲' : '▼'} How peer comparison works
      </button>
      {showLearn && (
        <div style={styles.collapsibleContent}>
          Peer comparison (also called relative strength analysis) shows whether a stock&apos;s price action is driven by the broad sector or is company-specific. If the whole sector is down but one stock is up, that stock shows unusual strength. If a stock is down when peers are up, something company-specific may be happening. P/E comparison across peers shows whether a stock is valued at a premium or discount relative to its competitors. Higher P/E generally means higher growth expectations.
        </div>
      )}
    </div>
  );
}
