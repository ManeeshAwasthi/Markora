'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { C, T, styles } from '@/lib/designTokens';

interface MomentumTabProps {
  data: {
    institutionalOwnershipPercent: number | null;
    insiderBuys: number;
    insiderSells: number;
    insiderSentiment: 'Buying' | 'Selling' | 'Neutral';
    shortPercentOfFloat: number | null;
    shortRatio: number | null;
    shortLabel: 'High' | 'Elevated' | 'Normal';
  };
  meta: { companyName: string };
}

const sectionStyle = { marginBottom: '40px' };
const sectionTitleStyle = {
  fontSize: '10px', fontFamily: T.MONO, color: C.TEXT3,
  letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '20px',
};

export default function MomentumTab({ data, meta }: MomentumTabProps) {
  const [showInstLearn, setShowInstLearn] = useState(false);
  const [showInsiderLearn, setShowInsiderLearn] = useState(false);
  const [showShortLearn, setShowShortLearn] = useState(false);

  const shortPct = data.shortPercentOfFloat !== null ? data.shortPercentOfFloat * 100 : null;
  const shortBarWidth = shortPct !== null ? Math.min(100, (shortPct / 30) * 100) : 0;

  const insiderColors = { Buying: C.GREEN, Selling: C.RED, Neutral: C.NEUTRAL };
  const shortColors = { Normal: C.GREEN, Elevated: C.ORANGE, High: C.RED };

  const insiderChartData = (data.insiderBuys > 0 || data.insiderSells > 0)
    ? [{ name: 'Activity', Buys: data.insiderBuys, Sells: data.insiderSells }]
    : [];

  return (
    <div style={{ fontFamily: T.BODY }}>
      {/* Summary */}
      <div style={{ ...styles.card, marginBottom: '40px' }}>
        <p style={styles.insightLabel}>Momentum & Flow Summary</p>
        <p style={{ fontFamily: T.BODY, fontSize: '14px', color: C.TEXT2, lineHeight: 1.7 }}>
          {data.institutionalOwnershipPercent !== null
            ? <><span style={{ color: C.CYAN, fontFamily: T.MONO }}>{data.institutionalOwnershipPercent.toFixed(1)}%</span> of {meta.companyName} is held by institutions.</>
            : <>Institutional ownership data unavailable.</>}{' '}
          Insider activity shows{' '}
          <span style={{ color: insiderColors[data.insiderSentiment], fontFamily: T.MONO }}>{data.insiderBuys}</span> buys and{' '}
          <span style={{ color: insiderColors[data.insiderSentiment], fontFamily: T.MONO }}>{data.insiderSells}</span> sells in the last 90 days ({data.insiderSentiment}).{' '}
          Short interest is{' '}
          <span style={{ color: shortColors[data.shortLabel], fontFamily: T.MONO }}>{data.shortLabel.toLowerCase()}</span>
          {shortPct !== null ? <> at <span style={{ fontFamily: T.MONO, color: C.TEXT }}>{shortPct.toFixed(1)}%</span> of float</> : ''}.
        </p>
      </div>

      {/* 1. Institutional Ownership */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Institutional Ownership</p>
        {data.institutionalOwnershipPercent !== null ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: T.MONO, fontSize: '3.5rem', fontWeight: 700, color: C.TEXT, lineHeight: 1 }}>
              {data.institutionalOwnershipPercent.toFixed(1)}%
            </span>
            <div style={{ flex: 1, minWidth: '200px', paddingBottom: '8px' }}>
              <div style={{ height: '6px', background: C.BORDER, marginBottom: '8px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, data.institutionalOwnershipPercent)}%`,
                  background: data.institutionalOwnershipPercent > 70 ? C.GREEN : data.institutionalOwnershipPercent > 30 ? C.VIOLET : C.ORANGE,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: '12px', fontFamily: T.MONO, color: C.TEXT3 }}>
                {data.institutionalOwnershipPercent > 70
                  ? 'Strong institutional backing — funds and large investors are heavily invested'
                  : data.institutionalOwnershipPercent > 30
                  ? 'Moderate institutional interest — some professional investor presence'
                  : 'Light institutional presence — more retail-driven stock'}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: T.MONO, fontSize: '13px', color: C.TEXT2 }}>Institutional ownership data unavailable for this security.</p>
        )}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.institutionalOwnershipPercent !== null
              ? `${data.institutionalOwnershipPercent.toFixed(1)}% institutional ownership means professional money managers (mutual funds, hedge funds, pension funds) hold this proportion of the company's shares. ${data.institutionalOwnershipPercent > 70 ? 'High institutional ownership provides price stability but can lead to sharp drops when institutions exit simultaneously.' : data.institutionalOwnershipPercent > 30 ? 'Moderate institutional presence indicates professional investor confidence without crowding.' : 'Low institutional ownership can mean higher volatility and less analyst coverage — both a risk and an opportunity.'}`
              : 'Institutional ownership data is unavailable. This is common for smaller companies, ETFs, or international securities.'}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowInstLearn(v => !v)}>
          {showInstLearn ? '▲' : '▼'} How institutional ownership works
        </button>
        {showInstLearn && (
          <div style={styles.collapsibleContent}>
            Institutional ownership measures the percentage of a company&apos;s shares held by professional investors — mutual funds, pension funds, hedge funds, endowments, and insurance companies. High institutional ownership (above 70%) generally indicates strong professional conviction, provides liquidity, and typically means more analyst research coverage. However, it can also create concentrated selling risk. When institutions rotate out of a position, it can cause significant price pressure.
          </div>
        )}
      </div>

      {/* 2. Insider Activity */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Insider Activity (Last 90 Days)</p>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'baseline' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', fontFamily: T.MONO, fontWeight: 700, color: C.GREEN, lineHeight: 1 }}>{data.insiderBuys}</p>
              <p style={{ fontSize: '11px', fontFamily: T.MONO, color: C.GREEN, marginTop: '4px' }}>↑ Buys</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', fontFamily: T.MONO, fontWeight: 700, color: C.RED, lineHeight: 1 }}>{data.insiderSells}</p>
              <p style={{ fontSize: '11px', fontFamily: T.MONO, color: C.RED, marginTop: '4px' }}>↓ Sells</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
            <span style={styles.badge(insiderColors[data.insiderSentiment])}>{data.insiderSentiment}</span>
            <p style={{ fontSize: '12px', color: C.TEXT3, fontFamily: T.MONO }}>
              {data.insiderSentiment === 'Buying'
                ? 'Insiders accumulating — vote of confidence'
                : data.insiderSentiment === 'Selling'
                ? 'Insiders reducing — worth monitoring'
                : 'No strong directional signal'}
            </p>
          </div>
        </div>

        {insiderChartData.length > 0 && (data.insiderBuys > 0 && data.insiderSells > 0) && (
          <div style={{ marginTop: '20px', background: C.SURFACE, padding: '16px' }}>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={insiderChartData} layout="vertical" margin={{ top: 4, right: 8, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} horizontal={false} />
                <XAxis type="number" tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <Tooltip {...styles.tooltipStyle} />
                <Bar dataKey="Buys" fill={C.GREEN} isAnimationActive={false} />
                <Bar dataKey="Sells" fill={C.RED} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.insiderBuys === 0 && data.insiderSells === 0
              ? `No insider transactions recorded in the last 90 days for ${meta.companyName}. This is common for companies where insiders are in a trading blackout period or simply not actively trading.`
              : `${meta.companyName} had ${data.insiderBuys} insider purchase${data.insiderBuys !== 1 ? 's' : ''} and ${data.insiderSells} insider sale${data.insiderSells !== 1 ? 's' : ''} in the last 90 days. `}
            {data.insiderSentiment === 'Buying'
              ? 'Insiders buying their own company stock is generally bullish — they have the most information about the company\'s prospects.'
              : data.insiderSentiment === 'Selling'
              ? 'Insider selling can have many explanations (diversification, taxes, personal needs) but heavy selling by multiple insiders can be a warning signal.'
              : ''}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowInsiderLearn(v => !v)}>
          {showInsiderLearn ? '▲' : '▼'} How insider activity works
        </button>
        {showInsiderLearn && (
          <div style={styles.collapsibleContent}>
            Insider trading data tracks stock transactions by company executives, directors, and major shareholders (those with 10%+ ownership). These are legally required to be reported to the SEC. The key insight: insiders know more about the company than anyone. Cluster buying (multiple insiders buying simultaneously) is one of the strongest bullish signals in the market. Selling is less informative since insiders sell for many reasons, but systematic selling across multiple insiders warrants attention.
          </div>
        )}
      </div>

      {/* 3. Short Interest */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Short Interest</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.MONO, fontSize: '3rem', fontWeight: 700, color: shortColors[data.shortLabel], lineHeight: 1 }}>
            {shortPct !== null ? `${shortPct.toFixed(1)}%` : '—'}
          </span>
          <div style={{ paddingBottom: '6px' }}>
            <span style={styles.badge(shortColors[data.shortLabel])}>{data.shortLabel}</span>
            {data.shortRatio !== null && (
              <p style={{ fontSize: '12px', fontFamily: T.MONO, color: C.TEXT3, marginTop: '6px' }}>
                {data.shortRatio.toFixed(1)} days to cover
              </p>
            )}
          </div>
        </div>

        {/* Visual gauge bar */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: T.MONO, color: C.TEXT2, marginBottom: '4px' }}>
            <span>0%</span>
            <span>5% (Normal)</span>
            <span>15% (High)</span>
            <span>30%+</span>
          </div>
          <div style={{ position: 'relative', height: '6px', background: C.BORDER, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${shortBarWidth}%`,
              background: data.shortLabel === 'High' ? C.RED : data.shortLabel === 'Elevated' ? C.ORANGE : C.GREEN,
            }} />
          </div>
          {shortPct !== null && (
            <div style={{
              position: 'relative',
              marginTop: '4px',
              height: '0',
            }}>
              <div style={{
                position: 'absolute',
                left: `${shortBarWidth}%`,
                transform: 'translateX(-50%)',
                fontSize: '10px',
                fontFamily: T.MONO,
                color: shortColors[data.shortLabel],
                top: '0',
              }}>
                ▲ {shortPct.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        <div style={{ ...styles.insightBox, marginTop: '32px' }}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {shortPct !== null
              ? `${shortPct.toFixed(1)}% of ${meta.companyName}'s float is currently sold short. ${data.shortLabel === 'High' ? 'High short interest creates significant short squeeze potential — if the stock rises, shorts are forced to cover (buy back shares), amplifying the move upward.' : data.shortLabel === 'Elevated' ? 'Elevated short interest suggests meaningful bearish sentiment from traders betting against the stock.' : 'Low short interest indicates limited bearish speculation — the stock is not heavily contested.'}`
              : 'Short interest data unavailable for this security.'}
            {data.shortRatio !== null && ` At current volume, it would take ${data.shortRatio.toFixed(1)} days for all short positions to be covered.`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowShortLearn(v => !v)}>
          {showShortLearn ? '▲' : '▼'} How short interest works
        </button>
        {showShortLearn && (
          <div style={styles.collapsibleContent}>
            Short interest measures the percentage of a company&apos;s float (tradeable shares) that have been borrowed and sold short. Short sellers profit when the stock price falls. High short interest (above 10-15%) means many traders are betting against the stock. The &quot;days to cover&quot; (short ratio) shows how many days of average trading volume it would take to close all short positions — higher means more potential squeeze pressure. A short squeeze occurs when a heavily shorted stock rises sharply, forcing short sellers to buy back shares to cover losses.
          </div>
        )}
      </div>
    </div>
  );
}
