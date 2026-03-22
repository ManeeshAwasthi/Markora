'use client';

import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";

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

const sectionStyle: CSSProperties = { marginBottom: '40px' };
const sectionTitleStyle: CSSProperties = {
  fontSize: '13px', fontFamily: MONO, color: '#a0a0b8',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 600,
};
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
const tooltipStyle = {
  contentStyle: { background: '#0a0a12', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 11, fontFamily: MONO },
  labelStyle: { color: '#555', marginBottom: '4px' },
  cursor: { stroke: '#2a2a3a' },
};

export default function MomentumTab({ data, meta }: MomentumTabProps) {
  const [showInstLearn, setShowInstLearn] = useState(false);
  const [showInsiderLearn, setShowInsiderLearn] = useState(false);
  const [showShortLearn, setShowShortLearn] = useState(false);

  const shortPct = data.shortPercentOfFloat !== null ? data.shortPercentOfFloat * 100 : null;
  const shortBarWidth = shortPct !== null ? Math.min(100, (shortPct / 30) * 100) : 0;

  const insiderColors = { Buying: '#00ff88', Selling: '#ef4444', Neutral: '#888' };
  const shortColors = { Normal: '#00ff88', Elevated: '#f97316', High: '#ef4444' };

  const insiderChartData = (data.insiderBuys > 0 || data.insiderSells > 0)
    ? [{ name: 'Activity', Buys: data.insiderBuys, Sells: data.insiderSells }]
    : [];

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Summary */}
      <div style={{ background: '#0a0a12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '24px 28px', marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Momentum & Flow Summary
        </p>
        <p style={{ fontSize: '15px', color: '#c0c0d0', lineHeight: 1.7 }}>
          {data.institutionalOwnershipPercent !== null
            ? <><span style={{ color: '#00e5ff', fontFamily: MONO }}>{data.institutionalOwnershipPercent.toFixed(1)}%</span> of {meta.companyName} is held by institutions.</>
            : <>Institutional ownership data unavailable.</>}{' '}
          Insider activity shows{' '}
          <span style={{ color: insiderColors[data.insiderSentiment], fontFamily: MONO }}>{data.insiderBuys}</span> buys and{' '}
          <span style={{ color: insiderColors[data.insiderSentiment], fontFamily: MONO }}>{data.insiderSells}</span> sells in the last 90 days ({data.insiderSentiment}).{' '}
          Short interest is{' '}
          <span style={{ color: shortColors[data.shortLabel], fontFamily: MONO }}>{data.shortLabel.toLowerCase()}</span>
          {shortPct !== null ? <> at <span style={{ fontFamily: MONO, color: '#e8e8f0' }}>{shortPct.toFixed(1)}%</span> of float</> : ''}.
        </p>
      </div>

      {/* 1. Institutional Ownership */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Institutional Ownership</p>
        {data.institutionalOwnershipPercent !== null ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: MONO, fontSize: '3.5rem', fontWeight: 700, color: '#e8e8f0', lineHeight: 1 }}>
              {data.institutionalOwnershipPercent.toFixed(1)}%
            </span>
            <div style={{ flex: 1, minWidth: '200px', paddingBottom: '8px' }}>
              <div style={{ height: '8px', background: '#1c1c26', borderRadius: '4px', marginBottom: '8px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, data.institutionalOwnershipPercent)}%`,
                  background: data.institutionalOwnershipPercent > 70 ? '#00ff88' : data.institutionalOwnershipPercent > 30 ? '#7c3aed' : '#f97316',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: '12px', fontFamily: MONO, color: '#4a4a6a' }}>
                {data.institutionalOwnershipPercent > 70
                  ? 'Strong institutional backing — funds and large investors are heavily invested'
                  : data.institutionalOwnershipPercent > 30
                  ? 'Moderate institutional interest — some professional investor presence'
                  : 'Light institutional presence — more retail-driven stock'}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: MONO, fontSize: '13px', color: '#555' }}>Institutional ownership data unavailable for this security.</p>
        )}
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {data.institutionalOwnershipPercent !== null
              ? `${data.institutionalOwnershipPercent.toFixed(1)}% institutional ownership means professional money managers (mutual funds, hedge funds, pension funds) hold this proportion of the company's shares. ${data.institutionalOwnershipPercent > 70 ? 'High institutional ownership provides price stability but can lead to sharp drops when institutions exit simultaneously.' : data.institutionalOwnershipPercent > 30 ? 'Moderate institutional presence indicates professional investor confidence without crowding.' : 'Low institutional ownership can mean higher volatility and less analyst coverage — both a risk and an opportunity.'}`
              : 'Institutional ownership data is unavailable. This is common for smaller companies, ETFs, or international securities.'}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowInstLearn(v => !v)}>
          {showInstLearn ? '▲' : '▼'} How institutional ownership works
        </button>
        {showInstLearn && (
          <div style={collapsibleContentStyle}>
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
              <p style={{ fontSize: '3rem', fontFamily: MONO, fontWeight: 700, color: '#00ff88', lineHeight: 1 }}>{data.insiderBuys}</p>
              <p style={{ fontSize: '11px', fontFamily: MONO, color: '#00ff88', marginTop: '4px' }}>↑ Buys</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', fontFamily: MONO, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>{data.insiderSells}</p>
              <p style={{ fontSize: '11px', fontFamily: MONO, color: '#ef4444', marginTop: '4px' }}>↓ Sells</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
            <span style={{
              fontFamily: MONO, fontSize: '13px', padding: '6px 16px', borderRadius: '6px', display: 'inline-block',
              color: insiderColors[data.insiderSentiment],
              background: insiderColors[data.insiderSentiment] + '18',
            }}>{data.insiderSentiment}</span>
            <p style={{ fontSize: '12px', color: '#4a4a6a', fontFamily: MONO }}>
              {data.insiderSentiment === 'Buying'
                ? 'Insiders accumulating — vote of confidence'
                : data.insiderSentiment === 'Selling'
                ? 'Insiders reducing — worth monitoring'
                : 'No strong directional signal'}
            </p>
          </div>
        </div>

        {insiderChartData.length > 0 && (data.insiderBuys > 0 && data.insiderSells > 0) && (
          <div style={{ marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={insiderChartData} layout="vertical" margin={{ top: 4, right: 8, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="Buys" fill="#00ff88" isAnimationActive={false} />
                <Bar dataKey="Sells" fill="#ef4444" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
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
        <button style={collapsibleBtnStyle} onClick={() => setShowInsiderLearn(v => !v)}>
          {showInsiderLearn ? '▲' : '▼'} How insider activity works
        </button>
        {showInsiderLearn && (
          <div style={collapsibleContentStyle}>
            Insider trading data tracks stock transactions by company executives, directors, and major shareholders (those with 10%+ ownership). These are legally required to be reported to the SEC. The key insight: insiders know more about the company than anyone. Cluster buying (multiple insiders buying simultaneously) is one of the strongest bullish signals in the market. Selling is less informative since insiders sell for many reasons, but systematic selling across multiple insiders warrants attention.
          </div>
        )}
      </div>

      {/* 3. Short Interest */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Short Interest</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: '3rem', fontWeight: 700, color: shortColors[data.shortLabel], lineHeight: 1 }}>
            {shortPct !== null ? `${shortPct.toFixed(1)}%` : '—'}
          </span>
          <div style={{ paddingBottom: '6px' }}>
            <span style={{
              fontFamily: MONO, fontSize: '12px', padding: '4px 12px', borderRadius: '4px',
              color: shortColors[data.shortLabel], background: shortColors[data.shortLabel] + '18',
              display: 'inline-block', marginBottom: '6px',
            }}>{data.shortLabel}</span>
            {data.shortRatio !== null && (
              <p style={{ fontSize: '12px', fontFamily: MONO, color: '#4a4a6a' }}>
                {data.shortRatio.toFixed(1)} days to cover
              </p>
            )}
          </div>
        </div>

        {/* Visual gauge bar */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: MONO, color: '#555', marginBottom: '4px' }}>
            <span>0%</span>
            <span>5% (Normal)</span>
            <span>15% (High)</span>
            <span>30%+</span>
          </div>
          <div style={{ position: 'relative', height: '8px', background: '#1c1c26', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${shortBarWidth}%`,
              background: data.shortLabel === 'High' ? '#ef4444' : data.shortLabel === 'Elevated' ? '#f97316' : '#00ff88',
              borderRadius: '4px',
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
                fontFamily: MONO,
                color: shortColors[data.shortLabel],
                top: '0',
              }}>
                ▲ {shortPct.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        <div style={{ ...insightBoxStyle, marginTop: '32px' }}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {shortPct !== null
              ? `${shortPct.toFixed(1)}% of ${meta.companyName}'s float is currently sold short. ${data.shortLabel === 'High' ? 'High short interest creates significant short squeeze potential — if the stock rises, shorts are forced to cover (buy back shares), amplifying the move upward.' : data.shortLabel === 'Elevated' ? 'Elevated short interest suggests meaningful bearish sentiment from traders betting against the stock.' : 'Low short interest indicates limited bearish speculation — the stock is not heavily contested.'}`
              : 'Short interest data unavailable for this security.'}
            {data.shortRatio !== null && ` At current volume, it would take ${data.shortRatio.toFixed(1)} days for all short positions to be covered.`}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowShortLearn(v => !v)}>
          {showShortLearn ? '▲' : '▼'} How short interest works
        </button>
        {showShortLearn && (
          <div style={collapsibleContentStyle}>
            Short interest measures the percentage of a company&apos;s float (tradeable shares) that have been borrowed and sold short. Short sellers profit when the stock price falls. High short interest (above 10-15%) means many traders are betting against the stock. The &quot;days to cover&quot; (short ratio) shows how many days of average trading volume it would take to close all short positions — higher means more potential squeeze pressure. A short squeeze occurs when a heavily shorted stock rises sharply, forcing short sellers to buy back shares to cover losses.
          </div>
        )}
      </div>
    </div>
  );
}
