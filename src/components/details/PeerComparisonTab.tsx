'use client';

import React, { useState } from 'react';
import { C, T, TYPE, styles } from '@/lib/designTokens';

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
  const allChanges  = [...peers.map(p => p.priceChangePercent), targetPriceChangePercent ?? 0].sort((a, b) => b - a);
  const targetRank  = allChanges.indexOf(targetPriceChangePercent ?? 0) + 1;
  const avgPeer     = peers.length > 0 ? peers.reduce((acc, p) => acc + p.priceChangePercent, 0) / peers.length : 0;
  const peersAbove  = peers.filter(p => p.priceChangePercent > (targetPriceChangePercent ?? 0)).length;

  const sortedPeers = [...peers].sort((a, b) => b.priceChangePercent - a.priceChangePercent);

  return (
    <div style={{ fontFamily: T.BODY, color: C.TEXT }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '12px' }}>
          EQUITY_REPORT // {new Date().getFullYear()}.Q{Math.ceil((new Date().getMonth() + 1) / 3)}
        </p>
        <h2 style={{ ...TYPE.DISPLAY_LG, color: C.TEXT, marginBottom: '4px' }}>
          {meta.companyName}
        </h2>
        <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '20px' }}>
          SECTOR PEER BENCHMARKING // {meta.timeframe}D WINDOW
        </p>
        {/* Target company key metrics */}
        <div style={{ display: 'flex', gap: '1px', background: C.BORDER_FAINT, marginBottom: '16px' }}>
          {[
            { label: 'Current Price', value: `${meta.currencySymbol}${meta.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
            { label: 'P/E Ratio',     value: targetPeRatio !== null && targetPeRatio !== undefined ? targetPeRatio.toFixed(1) : '—' },
            { label: `${meta.timeframe}D Change`, value: targetPriceChangePercent !== undefined ? `${targetPriceChangePercent >= 0 ? '+' : ''}${targetPriceChangePercent.toFixed(2)}%` : '—',
              color: targetPriceChangePercent !== undefined ? (targetPriceChangePercent >= 0 ? C.GREEN : C.RED) : C.TEXT },
            { label: 'Rank vs Peers', value: peers.length > 0 ? `#${targetRank} of ${peers.length + 1}` : '—', color: C.CYAN },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.SURFACE, padding: '18px 24px', flex: '1 1 100px' }}>
              <p style={styles.metricLabel}>{label}</p>
              <p style={{ ...TYPE.DATA_MD, color: color ?? C.TEXT }}>{value}</p>
            </div>
          ))}
        </div>
        {/* Summary */}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>Summary</p>
          <p style={styles.insightText}>
            {meta.companyName} vs{' '}
            <span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>{peers.length}</span> sector peers over{' '}
            <span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>{meta.timeframe}</span> days.{' '}
            {peers.length > 0 && targetPriceChangePercent !== undefined && (
              <>
                Ranked <span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>#{targetRank}</span> of {peers.length + 1} by price change.{' '}
                {peersAbove} peer{peersAbove !== 1 ? 's' : ''} outperformed;{' '}
                {targetPriceChangePercent > avgPeer
                  ? <span style={{ color: C.GREEN }}>outperforming peer average by {(targetPriceChangePercent - avgPeer).toFixed(2)}%.</span>
                  : <span style={{ color: C.RED }}>underperforming peer average by {(avgPeer - targetPriceChangePercent).toFixed(2)}%.</span>}
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── PEER BENCHMARKING TABLE ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Peer_Benchmarking</p>

        {peers.length === 0 ? (
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '32px', textAlign: 'center' }}>
            <p style={{ ...TYPE.DATA_SM, color: C.TEXT2 }}>No peer comparison data available for this security.</p>
          </div>
        ) : (
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              gap: '12px',
              padding: '12px 20px',
              background: C.ELEVATED,
              borderBottom: `1px solid ${C.BORDER}`,
            }}>
              {['Ticker', `Price Change (${meta.timeframe}D)`, 'P/E Ratio', 'Rel. Strength', 'Market Status'].map((h, i) => (
                <span key={h} style={{ ...TYPE.LABEL_SM, color: C.TEXT3, textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>

            {/* Target row — highlighted */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              gap: '12px',
              padding: '16px 20px',
              borderBottom: `1px solid ${C.BORDER}`,
              borderLeft: `3px solid ${C.CYAN}`,
              background: C.CYAN + '05',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ ...TYPE.DATA_SM, color: C.CYAN, fontWeight: 700 }}>{meta.companyName.split(' ')[0].toUpperCase()}</span>
                <span style={{ ...TYPE.LABEL_SM, color: C.CYAN, background: C.CYAN + '18', border: `1px solid ${C.CYAN}30`, padding: '1px 7px' }}>CORE_HOLDING</span>
              </div>
              <span style={{ ...TYPE.DATA_SM, color: targetPriceChangePercent !== undefined && targetPriceChangePercent >= 0 ? C.GREEN : C.RED, textAlign: 'right', fontWeight: 600 }}>
                {targetPriceChangePercent !== undefined ? `${targetPriceChangePercent >= 0 ? '+' : ''}${targetPriceChangePercent.toFixed(2)}% ${targetPriceChangePercent >= 0 ? '▲' : '▼'}` : '—'}
              </span>
              <span style={{ ...TYPE.DATA_SM, color: C.TEXT, textAlign: 'right' }}>
                {targetPeRatio !== null && targetPeRatio !== undefined ? targetPeRatio.toFixed(2) : '—'}
              </span>
              <span style={{ ...TYPE.DATA_SM, color: C.TEXT3, textAlign: 'right' }}>—</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}></div>
            </div>

            {/* Peer rows */}
            {sortedPeers.map((peer, i) => {
              const statusColor = peer.relativeStrength > 5 ? C.GREEN : peer.relativeStrength < -5 ? C.RED : C.NEUTRAL;
              const statusLabel = peer.relativeStrength > 5 ? 'OUTPERFORM' : peer.relativeStrength < -5 ? 'UNDERPERFORM' : 'NEUTRAL';
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  gap: '12px',
                  padding: '14px 20px',
                  borderBottom: i < peers.length - 1 ? `1px solid ${C.BORDER_FAINT}` : 'none',
                }}>
                  <span style={{ ...TYPE.DATA_SM, color: C.TEXT, fontWeight: 600 }}>{peer.companyName}</span>
                  <span style={{ ...TYPE.DATA_SM, color: peer.priceChangePercent >= 0 ? C.GREEN : C.RED, textAlign: 'right', fontWeight: 600 }}>
                    {peer.priceChangePercent >= 0 ? '+' : ''}{peer.priceChangePercent.toFixed(2)}% {peer.priceChangePercent >= 0 ? '▲' : '▼'}
                  </span>
                  <span style={{ ...TYPE.DATA_SM, color: C.TEXT, textAlign: 'right' }}>
                    {peer.peRatio !== null ? peer.peRatio.toFixed(2) : '—'}
                  </span>
                  <span style={{ ...TYPE.DATA_SM, color: peer.relativeStrength >= 0 ? C.GREEN : C.RED, textAlign: 'right', fontWeight: 600 }}>
                    {peer.relativeStrength >= 0 ? '+' : ''}{peer.relativeStrength.toFixed(2)}%
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={styles.badge(statusColor)}>{statusLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── STRATEGY & SENTIMENT ── */}
      {peers.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.BORDER_FAINT, marginBottom: '40px' }}>
          {/* Divergence strategy */}
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '12px' }}>DIVERGENCE_STRATEGY</p>
            <p style={{ ...TYPE.PROSE_MD, color: C.TEXT2, marginBottom: '20px' }}>
              {meta.companyName}{targetPriceChangePercent !== undefined && targetPriceChangePercent >= 0 ? ' gained' : ' lost'}{' '}
              {targetPriceChangePercent !== undefined ? `${Math.abs(targetPriceChangePercent).toFixed(2)}%` : '—'} vs sector average of{' '}
              {avgPeer >= 0 ? `+${avgPeer.toFixed(2)}%` : `${avgPeer.toFixed(2)}%`}.{' '}
              {targetPriceChangePercent !== undefined && targetPriceChangePercent > avgPeer
                ? 'Outperforming peers is a sign of relative strength and sector leadership.'
                : 'Underperforming peers may indicate company-specific headwinds vs sector tailwinds.'}
            </p>
          </div>
          {/* Peer sentiment */}
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '12px' }}>SECTOR_PULSE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Peers Outperforming', value: `${peersAbove}`, color: peersAbove < peers.length / 2 ? C.GREEN : C.RED },
                { label: 'Sector Avg Change',   value: `${avgPeer >= 0 ? '+' : ''}${avgPeer.toFixed(2)}%`, color: avgPeer >= 0 ? C.GREEN : C.RED },
                { label: 'Relative Rank',        value: peers.length > 0 ? `#${targetRank} / ${peers.length + 1}` : '—', color: C.CYAN },
                { label: 'Timeframe',            value: `${meta.timeframe}D`, color: C.TEXT2 },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.BORDER_FAINT}` }}>
                  <span style={{ ...TYPE.DATA_SM, color: C.TEXT3 }}>{label}</span>
                  <span style={{ ...TYPE.DATA_SM, color, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Learn */}
      <button style={styles.collapsibleBtn} onClick={() => setShowLearn(v => !v)}>
        <span style={{ color: C.CYAN }}>{showLearn ? '▾' : '▸'}</span> How peer comparison works
      </button>
      {showLearn && (
        <div style={styles.collapsibleContent}>
          Peer comparison (relative strength analysis) shows whether a stock&apos;s move is sector-driven or company-specific. If the whole sector is down but one stock is up, that stock shows unusual strength. P/E comparison across peers shows whether a stock trades at a premium or discount to competitors. Higher P/E = higher growth expectations.
        </div>
      )}

    </div>
  );
}
