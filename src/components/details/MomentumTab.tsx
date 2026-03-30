'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C, T, TYPE, styles } from '@/lib/designTokens';

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

export default function MomentumTab({ data, meta }: MomentumTabProps) {
  const [showInstLearn,    setShowInstLearn]    = useState(false);
  const [showInsiderLearn, setShowInsiderLearn] = useState(false);
  const [showShortLearn,   setShowShortLearn]   = useState(false);

  const shortPct      = data.shortPercentOfFloat !== null ? data.shortPercentOfFloat * 100 : null;
  const shortBarWidth = shortPct !== null ? Math.min(100, (shortPct / 30) * 100) : 0;

  const insiderColors = { Buying: C.GREEN, Selling: C.RED,    Neutral: C.NEUTRAL } as const;
  const shortColors   = { Normal: C.GREEN, Elevated: C.ORANGE, High:    C.RED    } as const;

  const insiderColor = insiderColors[data.insiderSentiment];
  const shortColor   = shortColors[data.shortLabel];

  const insiderChartData = (data.insiderBuys > 0 || data.insiderSells > 0)
    ? [{ name: 'Activity', Buys: data.insiderBuys, Sells: data.insiderSells }]
    : [];

  return (
    <div style={{ fontFamily: T.BODY, color: C.TEXT }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '12px' }}>
          MOMENTUM &amp; FLOW // {meta.companyName.toUpperCase()}
        </p>
        <h2 style={{ ...TYPE.DISPLAY_MD, color: C.TEXT, marginBottom: '20px' }}>
          Momentum &amp; Flow
        </h2>
        {/* Summary insight */}
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>Summary Insight</p>
          <p style={{ ...TYPE.PROSE_LG, color: C.TEXT2 }}>
            {data.institutionalOwnershipPercent !== null
              ? <><span style={{ ...TYPE.DATA_SM, color: C.CYAN, fontWeight: 700 }}>{data.institutionalOwnershipPercent.toFixed(1)}%</span> of {meta.companyName} is held by institutions. </>
              : <>Institutional ownership data unavailable. </>}
            Insider activity shows{' '}
            <span style={{ ...TYPE.DATA_SM, color: insiderColor, fontWeight: 700 }}>{data.insiderBuys}</span> buys and{' '}
            <span style={{ ...TYPE.DATA_SM, color: insiderColor, fontWeight: 700 }}>{data.insiderSells}</span> sells over 90 days.{' '}
            Short interest is{' '}
            <span style={{ ...TYPE.DATA_SM, color: shortColor, fontWeight: 700 }}>{data.shortLabel.toLowerCase()}</span>
            {shortPct !== null ? <> at {shortPct.toFixed(1)}% of float</> : ''}.
          </p>
        </div>
      </div>

      {/* ── 1. INSTITUTIONAL OWNERSHIP ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Institutional Ownership</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
          {data.institutionalOwnershipPercent !== null ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <p style={{ ...TYPE.DATA_HERO, fontSize: '4.5rem', color: C.TEXT, lineHeight: '1', margin: 0 }}>
                  {data.institutionalOwnershipPercent.toFixed(1)}
                  <span style={{ ...TYPE.DATA_LG, color: C.TEXT2 }}>%</span>
                </p>
                <div style={{ paddingBottom: '6px' }}>
                  <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '8px' }}>OF FLOAT HELD BY INSTITUTIONS</p>
                  <span style={styles.badge(
                    data.institutionalOwnershipPercent > 70 ? C.GREEN :
                    data.institutionalOwnershipPercent > 30 ? C.VIOLET : C.ORANGE
                  )}>
                    {data.institutionalOwnershipPercent > 70 ? 'High Conviction' :
                     data.institutionalOwnershipPercent > 30 ? 'Moderate Interest' : 'Light Presence'}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: '4px', background: C.BORDER, overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, data.institutionalOwnershipPercent)}%`,
                  background: data.institutionalOwnershipPercent > 70 ? C.GREEN :
                              data.institutionalOwnershipPercent > 30 ? C.VIOLET : C.ORANGE,
                }} />
              </div>
              <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>
                {data.institutionalOwnershipPercent > 70
                  ? 'Strong institutional backing — funds and large investors are heavily invested'
                  : data.institutionalOwnershipPercent > 30
                  ? 'Moderate institutional interest — professional investor presence'
                  : 'Light institutional presence — more retail-driven stock'}
              </p>
            </>
          ) : (
            <p style={{ ...TYPE.DATA_SM, color: C.TEXT2 }}>Institutional ownership data unavailable for this security.</p>
          )}
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.institutionalOwnershipPercent !== null
              ? `${data.institutionalOwnershipPercent.toFixed(1)}% institutional ownership means professional money managers hold this proportion. ${data.institutionalOwnershipPercent > 70 ? 'High institutional ownership provides price stability but can cause sharp drops when institutions exit simultaneously.' : data.institutionalOwnershipPercent > 30 ? 'Moderate presence indicates professional confidence without crowding.' : 'Low ownership means higher volatility and less analyst coverage — a risk and an opportunity.'}`
              : 'Institutional ownership data is unavailable. Common for smaller companies, ETFs, or international securities.'}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowInstLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showInstLearn ? '▾' : '▸'}</span> How institutional ownership works
        </button>
        {showInstLearn && (
          <div style={styles.collapsibleContent}>
            Institutional ownership measures shares held by mutual funds, pension funds, hedge funds, endowments, and insurance companies. High institutional ownership generally indicates strong professional conviction and analyst coverage. However it creates concentrated selling risk when institutions rotate out.
          </div>
        )}
      </div>

      {/* ── 2. INSIDER ACTIVITY ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Insider Activity (Last 90 Days)</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...TYPE.DATA_HERO, fontSize: '3.5rem', color: C.GREEN, lineHeight: '1', marginBottom: '4px' }}>{data.insiderBuys}</p>
              <p style={{ ...TYPE.LABEL_SM, color: C.GREEN }}>↑ BUYS</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...TYPE.DATA_HERO, fontSize: '3.5rem', color: C.RED, lineHeight: '1', marginBottom: '4px' }}>{data.insiderSells}</p>
              <p style={{ ...TYPE.LABEL_SM, color: C.RED }}>↓ SELLS</p>
            </div>
            <div style={{ borderLeft: `1px solid ${C.BORDER}`, paddingLeft: '32px', flex: 1, minWidth: '160px' }}>
              <p style={styles.metricLabel}>Net Sentiment</p>
              <div style={{
                background: insiderColor + '18',
                border: `1px solid ${insiderColor}40`,
                padding: '12px 20px',
                display: 'inline-block',
                marginBottom: '8px',
              }}>
                <p style={{ ...TYPE.DATA_LG, color: insiderColor, lineHeight: '1' }}>
                  {data.insiderBuys > data.insiderSells ? '+' : ''}{data.insiderBuys - data.insiderSells}
                </p>
                <p style={{ ...TYPE.LABEL_SM, color: insiderColor, marginTop: '4px' }}>NET POSITION</p>
              </div>
              <div>
                <span style={styles.badge(insiderColor)}>{data.insiderSentiment}</span>
              </div>
            </div>
          </div>
          {insiderChartData.length > 0 && data.insiderBuys > 0 && data.insiderSells > 0 && (
            <div style={{ marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={insiderChartData} layout="vertical" margin={{ top: 4, right: 8, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER_FAINT} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                  <Tooltip {...styles.tooltipStyle} />
                  <Bar dataKey="Buys"  fill={C.GREEN} isAnimationActive={false} />
                  <Bar dataKey="Sells" fill={C.RED}   isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.insiderBuys === 0 && data.insiderSells === 0
              ? `No insider transactions recorded in the last 90 days. May be in a trading blackout period.`
              : `${meta.companyName} had ${data.insiderBuys} insider purchase${data.insiderBuys !== 1 ? 's' : ''} and ${data.insiderSells} insider sale${data.insiderSells !== 1 ? 's' : ''} in 90 days. `}
            {data.insiderSentiment === 'Buying'
              ? 'Insiders buying their own stock is generally bullish — they have the most information about the company\'s prospects.'
              : data.insiderSentiment === 'Selling'
              ? 'Insider selling can indicate diversification or personal needs, but heavy selling by multiple insiders warrants attention.'
              : ''}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowInsiderLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showInsiderLearn ? '▾' : '▸'}</span> How insider activity works
        </button>
        {showInsiderLearn && (
          <div style={styles.collapsibleContent}>
            Insider trading tracks stock transactions by executives, directors, and major shareholders (10%+). These are legally required SEC filings. Cluster buying (multiple insiders simultaneously) is one of the strongest bullish signals. Selling is less informative since insiders sell for many reasons.
          </div>
        )}
      </div>

      {/* ── 3. SHORT INTEREST ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Short Interest</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <p style={{ ...TYPE.DATA_HERO, fontSize: '3.5rem', color: shortColor, lineHeight: '1', margin: 0 }}>
              {shortPct !== null ? `${shortPct.toFixed(1)}%` : '—'}
            </p>
            <div style={{ paddingBottom: '6px' }}>
              <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '8px' }}>OF FLOAT SHORT SOLD</p>
              <span style={styles.badge(shortColor)}>{data.shortLabel}</span>
              {data.shortRatio !== null && (
                <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginTop: '8px' }}>{data.shortRatio.toFixed(1)} days to cover</p>
              )}
            </div>
          </div>
          {/* Gauge bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '4px' }}>
              <span>0%</span><span>5% (Normal)</span><span>15% (High)</span><span>30%+</span>
            </div>
            <div style={{ position: 'relative', height: '6px', background: C.BORDER }}>
              <div style={{ height: '100%', width: `${shortBarWidth}%`, background: shortColor }} />
            </div>
            {shortPct !== null && (
              <div style={{ position: 'relative', marginTop: '4px', height: '16px' }}>
                <p style={{
                  position: 'absolute',
                  left: `${Math.min(95, shortBarWidth)}%`,
                  transform: 'translateX(-50%)',
                  ...TYPE.LABEL_SM,
                  color: shortColor,
                  whiteSpace: 'nowrap',
                }}>▲ {shortPct.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
        <div style={{ ...styles.insightBox, marginTop: '16px' }}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {shortPct !== null
              ? `${shortPct.toFixed(1)}% of ${meta.companyName}'s float is currently sold short. ${data.shortLabel === 'High' ? 'High short interest creates significant short squeeze potential — if the stock rises, forced covering amplifies the move.' : data.shortLabel === 'Elevated' ? 'Elevated short pressure suggests meaningful bearish speculation.' : 'Low short interest — limited bearish speculation, normal trading conditions.'}`
              : 'Short interest data unavailable for this security.'}
            {data.shortRatio !== null && ` It would take ${data.shortRatio.toFixed(1)} days at current volume to cover all short positions.`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowShortLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showShortLearn ? '▾' : '▸'}</span> How short interest works
        </button>
        {showShortLearn && (
          <div style={styles.collapsibleContent}>
            Short interest = % of tradeable shares borrowed and sold short. Short sellers profit when the stock falls. High short interest (above 10–15%) means many traders are betting against the stock. A short squeeze occurs when a rising stock forces short sellers to buy back shares, amplifying the move upward.
          </div>
        )}
      </div>

    </div>
  );
}
