'use client';

import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";

interface FundamentalsTabProps {
  data: {
    peRatio: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
    revenueGrowth: number | null;
    grossMargins: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    returnOnEquity: number | null;
    dividendYield: number | null;
    sector: string | null;
    industry: string | null;
    currencySymbol: string;
    earningsHistory: Array<{ quarter: string; epsActual: number | null; epsEstimate: number | null }>;
    revenueHistory: Array<{ period: string; revenue: number | null }>;
  };
  meta: { companyName: string; currencySymbol: string; currentPrice: number };
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

function fmt(v: number | null | undefined, decimals = 1): string {
  return v !== null && v !== undefined ? v.toFixed(decimals) : '—';
}

function fmtPct(v: number | null | undefined, isAlreadyPct = false): string {
  return v !== null && v !== undefined ? `${(isAlreadyPct ? v : v * 100).toFixed(1)}%` : '—';
}

function MetricBigCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '20px 22px', flex: 1, minWidth: '140px' }}>
      <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>{label}</p>
      <p style={{ fontSize: '1.8rem', fontFamily: MONO, color: color ?? '#e8e8f0', fontWeight: 600, lineHeight: 1, marginBottom: sub ? '8px' : 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: '#4a4a6a', fontFamily: MONO }}>{sub}</p>}
    </div>
  );
}

function StatRow({ label, value, color, hint }: { label: string; value: string; color?: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #13131e', gap: '16px' }}>
      <div>
        <span style={{ color: '#a0a0b8', fontSize: '13px', fontFamily: MONO }}>{label}</span>
        {hint && <p style={{ color: '#333345', fontSize: '11px', fontFamily: MONO, marginTop: '2px' }}>{hint}</p>}
      </div>
      <span style={{ color: color ?? '#e8e8f0', fontSize: '13px', fontFamily: MONO, fontWeight: 500, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function formatRevenue(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  return `${(v / 1e3).toFixed(0)}K`;
}

export default function FundamentalsTab({ data, meta }: FundamentalsTabProps) {
  const [showValLearn, setShowValLearn] = useState(false);
  const [showGrowthLearn, setShowGrowthLearn] = useState(false);
  const [showHealthLearn, setShowHealthLearn] = useState(false);
  const [showEPSLearn, setShowEPSLearn] = useState(false);
  const [showRevLearn, setShowRevLearn] = useState(false);
  const [showDivLearn, setShowDivLearn] = useState(false);

  const revenueGrowthPct = data.revenueGrowth !== null ? data.revenueGrowth * 100 : null;
  const grossMarginsPct = data.grossMargins !== null ? data.grossMargins * 100 : null;
  const roePct = data.returnOnEquity !== null ? data.returnOnEquity * 100 : null;
  const dividendYieldPct = data.dividendYield !== null ? data.dividendYield * 100 : null;

  const earningsChartData = data.earningsHistory
    .filter(e => e.epsActual !== null || e.epsEstimate !== null)
    .map(e => ({ quarter: e.quarter, actual: e.epsActual, estimate: e.epsEstimate }));

  const revenueChartData = data.revenueHistory
    .filter(r => r.revenue !== null)
    .map(r => ({ period: r.period, revenue: r.revenue as number }));

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Summary */}
      <div style={{ background: '#0a0a12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '24px 28px', marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Fundamentals Summary
        </p>
        <p style={{ fontSize: '15px', color: '#c0c0d0', lineHeight: 1.7 }}>
          {meta.companyName} trades at a{' '}
          {data.peRatio !== null
            ? <><span style={{ color: '#00e5ff', fontFamily: MONO }}>{data.peRatio.toFixed(1)}x</span> trailing P/E</>
            : 'P/E not available'}.{' '}
          {data.revenueGrowth !== null
            ? <>Revenue is growing at <span style={{ color: data.revenueGrowth >= 0 ? '#00ff88' : '#ef4444', fontFamily: MONO }}>{fmtPct(data.revenueGrowth)}</span> year-over-year.</>
            : ''}
          {data.grossMargins !== null && <> Gross margins are <span style={{ fontFamily: MONO, color: '#e8e8f0' }}>{fmtPct(data.grossMargins)}</span>.</>}
          {data.sector && <> Sector: <span style={{ fontFamily: MONO, color: '#a0a0b8' }}>{data.sector}</span>.</>}
        </p>
      </div>

      {/* 1. Valuation Metrics */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Valuation Metrics</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <MetricBigCard
            label="P/E Ratio (Trailing)"
            value={fmt(data.peRatio)}
            sub="Price / Earnings"
            color={data.peRatio !== null ? (data.peRatio < 15 ? '#00ff88' : data.peRatio > 40 ? '#ef4444' : '#e8e8f0') : undefined}
          />
          <MetricBigCard
            label="Forward P/E"
            value={fmt(data.forwardPE)}
            sub="Next Year's Earnings"
            color={data.forwardPE !== null ? (data.forwardPE < 15 ? '#00ff88' : data.forwardPE > 40 ? '#ef4444' : '#e8e8f0') : undefined}
          />
          <MetricBigCard
            label="PEG Ratio"
            value={fmt(data.pegRatio, 2)}
            sub="P/E ÷ Growth Rate"
            color={data.pegRatio !== null ? (data.pegRatio < 1 ? '#00ff88' : data.pegRatio > 2 ? '#ef4444' : '#fbbf24') : undefined}
          />
        </div>
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {data.peRatio !== null
              ? `A P/E of ${data.peRatio.toFixed(1)}x means investors pay ${data.peRatio.toFixed(1)} dollars for every dollar of earnings. ${data.peRatio < 15 ? 'This is relatively low — potentially undervalued or a value stock.' : data.peRatio > 40 ? 'This is high — the market expects significant future growth to justify the premium.' : 'This is in a moderate range for most established companies.'}`
              : 'P/E ratio data is unavailable — this may be because the company has negative earnings.'}
            {data.pegRatio !== null && ` PEG ratio of ${data.pegRatio.toFixed(2)} ${data.pegRatio < 1 ? '(below 1) suggests the stock may be undervalued relative to its growth rate.' : data.pegRatio > 2 ? '(above 2) suggests the stock may be overvalued relative to growth.' : 'is in a fair-value range.'}`}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowValLearn(v => !v)}>
          {showValLearn ? '▲' : '▼'} How valuation metrics work
        </button>
        {showValLearn && (
          <div style={collapsibleContentStyle}>
            P/E Ratio (Price-to-Earnings) is the most widely used valuation metric. It shows how much investors pay per dollar of profit. High P/E means high growth expectations. Forward P/E uses estimated future earnings — a lower forward P/E than trailing P/E suggests earnings are expected to grow. PEG ratio adjusts P/E for growth rate — below 1.0 typically indicates value, above 2.0 suggests overvaluation. Compare to sector peers for context.
          </div>
        )}
      </div>

      {/* 2. Growth & Profitability */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Growth & Profitability</p>
        <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '4px 20px' }}>
          <StatRow
            label="Revenue Growth (YoY)"
            hint="Year-over-year top-line growth"
            value={fmtPct(data.revenueGrowth)}
            color={revenueGrowthPct !== null ? (revenueGrowthPct >= 0 ? '#00ff88' : '#ef4444') : undefined}
          />
          <StatRow
            label="Gross Margins"
            hint="Revenue kept after direct costs"
            value={fmtPct(data.grossMargins)}
            color={grossMarginsPct !== null ? (grossMarginsPct >= 50 ? '#00ff88' : grossMarginsPct >= 20 ? '#e8e8f0' : '#ef4444') : undefined}
          />
          <StatRow
            label="Return on Equity"
            hint="Profit generated per unit of shareholder equity"
            value={fmtPct(data.returnOnEquity)}
            color={roePct !== null ? (roePct >= 15 ? '#00ff88' : roePct >= 0 ? '#e8e8f0' : '#ef4444') : undefined}
          />
        </div>
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {revenueGrowthPct !== null
              ? `Revenue is ${revenueGrowthPct >= 0 ? 'growing' : 'declining'} at ${Math.abs(revenueGrowthPct).toFixed(1)}% year-over-year.`
              : ''}
            {grossMarginsPct !== null && ` Gross margins of ${grossMarginsPct.toFixed(1)}% ${grossMarginsPct >= 50 ? 'indicate a high-margin business with pricing power.' : grossMarginsPct >= 20 ? 'are typical for the sector.' : 'are low, suggesting competitive pressure or high input costs.'}`}
            {roePct !== null && ` ROE of ${roePct.toFixed(1)}% ${roePct >= 15 ? 'shows strong capital efficiency.' : roePct >= 0 ? 'is positive but moderate.' : 'is negative — the company is not generating returns for shareholders.'}`}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowGrowthLearn(v => !v)}>
          {showGrowthLearn ? '▲' : '▼'} How growth metrics work
        </button>
        {showGrowthLearn && (
          <div style={collapsibleContentStyle}>
            Revenue growth measures how fast a company is expanding its top line. Gross margins show how much of each dollar of revenue the company keeps after direct costs. Return on Equity (ROE) measures how efficiently management uses shareholder capital to generate profit — Warren Buffett considers sustained ROE above 15% a sign of a durable competitive advantage. High margins combined with strong ROE and growth is the hallmark of quality businesses.
          </div>
        )}
      </div>

      {/* 3. Earnings History */}
      {earningsChartData.length > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Earnings History (EPS)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={earningsChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown, name: unknown) => [v !== null && v !== undefined ? (v as number).toFixed(2) : '—', name as string]} />
              <ReferenceLine y={0} stroke="#2a2a3a" />
              <Bar dataKey="estimate" fill="#4a4a6a" name="EPS Estimate" isAnimationActive={false} />
              <Bar dataKey="actual" name="EPS Actual" isAnimationActive={false}>
                {earningsChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.actual !== null && entry.estimate !== null
                      ? (entry.actual >= entry.estimate ? '#00ff88' : '#ef4444')
                      : '#888'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            {[['#4a4a6a', 'Estimate'], ['#00ff88', 'Beat'], ['#ef4444', 'Miss']].map(([c, l]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c, display: 'inline-block' }} />
                <span style={{ color: '#555', fontSize: '11px', fontFamily: MONO }}>{l}</span>
              </span>
            ))}
          </div>
          <button style={collapsibleBtnStyle} onClick={() => setShowEPSLearn(v => !v)}>
            {showEPSLearn ? '▲' : '▼'} How EPS history works
          </button>
          {showEPSLearn && (
            <div style={collapsibleContentStyle}>
              EPS (Earnings Per Share) shows the company&apos;s profit divided by outstanding shares. Comparing actual EPS to analyst estimates shows whether the company beats or misses expectations. Consistent beats build investor confidence. Misses can trigger sharp selloffs. The trend in EPS matters as much as the individual quarter — sustained growth in EPS alongside revenue growth is the strongest fundamental signal.
            </div>
          )}
        </div>
      )}

      {/* 4. Revenue Trend */}
      {revenueChartData.length > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Revenue Trend (Quarterly)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueChartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} tickFormatter={formatRevenue} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => [formatRevenue(v as number), 'Revenue']} />
              <Bar dataKey="revenue" fill="#7c3aed" name="Revenue" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                {revenueChartData.map((_, i) => (
                  <Cell key={`rev-${i}`} fill={i === revenueChartData.length - 1 ? '#00e5ff' : '#7c3aed'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <button style={collapsibleBtnStyle} onClick={() => setShowRevLearn(v => !v)}>
            {showRevLearn ? '▲' : '▼'} How revenue trend works
          </button>
          {showRevLearn && (
            <div style={collapsibleContentStyle}>
              Quarterly revenue shows the trajectory of the company&apos;s top-line growth. A consistently rising revenue chart suggests business expansion. Flat or declining revenue can indicate market saturation or competitive pressure. Seasonal businesses will show cyclical patterns. The most recent quarter (highlighted in cyan) shows the latest data point. Compare each quarter to the same quarter a year ago (year-over-year) for the most accurate growth picture.
            </div>
          )}
        </div>
      )}

      {/* 5. Financial Health */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Financial Health</p>
        <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '4px 20px' }}>
          <StatRow
            label="Debt / Equity"
            hint="Total debt relative to shareholder equity"
            value={fmt(data.debtToEquity, 2)}
            color={data.debtToEquity !== null ? (data.debtToEquity < 0.5 ? '#00ff88' : data.debtToEquity > 2 ? '#ef4444' : '#fbbf24') : undefined}
          />
          <StatRow
            label="Current Ratio"
            hint="Short-term assets vs short-term liabilities"
            value={fmt(data.currentRatio, 2)}
            color={data.currentRatio !== null ? (data.currentRatio >= 2 ? '#00ff88' : data.currentRatio >= 1 ? '#e8e8f0' : '#ef4444') : undefined}
          />
        </div>
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {data.debtToEquity !== null
              ? `Debt/Equity of ${data.debtToEquity.toFixed(2)} means the company has ${data.debtToEquity.toFixed(2)} dollars of debt for every dollar of equity. ${data.debtToEquity < 0.5 ? 'Low leverage — financially conservative.' : data.debtToEquity > 2 ? 'High leverage — elevated financial risk, especially in rising rate environments.' : 'Moderate leverage — manageable for most sectors.'}`
              : ''}
            {data.currentRatio !== null && ` Current ratio of ${data.currentRatio.toFixed(2)} ${data.currentRatio >= 2 ? 'shows strong short-term liquidity.' : data.currentRatio >= 1 ? 'indicates the company can meet short-term obligations.' : 'is below 1 — potential short-term liquidity concerns.'}`}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowHealthLearn(v => !v)}>
          {showHealthLearn ? '▲' : '▼'} How financial health metrics work
        </button>
        {showHealthLearn && (
          <div style={collapsibleContentStyle}>
            Debt/Equity ratio measures how much a company finances operations with debt vs shareholder equity. High D/E amplifies both gains and losses — manageable in low-rate environments but risky when rates rise. The Current Ratio measures short-term solvency: current assets divided by current liabilities. Above 2 is generally healthy; below 1 may signal liquidity risk. Both metrics vary significantly by industry — capital-intensive industries like utilities typically carry more debt.
          </div>
        )}
      </div>

      {/* 6. Dividend */}
      {dividendYieldPct !== null && dividendYieldPct > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Dividend</p>
          <div style={{ background: '#0d0d12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', marginBottom: '8px' }}>Dividend Yield</p>
              <p style={{ fontSize: '2.5rem', fontFamily: MONO, color: '#00ff88', fontWeight: 700, lineHeight: 1 }}>
                {dividendYieldPct.toFixed(2)}%
              </p>
            </div>
            <p style={{ fontSize: '14px', color: '#a0a0b8', lineHeight: 1.6, fontFamily: FONT }}>
              Annual dividend income as a percentage of the current stock price.{' '}
              {dividendYieldPct > 5
                ? 'High yield — verify it is sustainable and not driven by a falling stock price.'
                : dividendYieldPct > 2
                ? 'Healthy yield offering income alongside potential price appreciation.'
                : 'Low yield — company prioritizes growth reinvestment over income distribution.'}
            </p>
          </div>
          <button style={collapsibleBtnStyle} onClick={() => setShowDivLearn(v => !v)}>
            {showDivLearn ? '▲' : '▼'} How dividend yield works
          </button>
          {showDivLearn && (
            <div style={collapsibleContentStyle}>
              Dividend yield = annual dividend per share divided by current stock price. A rising yield can mean the company raised its dividend (positive) or the stock price fell (negative — the &quot;yield trap&quot;). Key metrics to check: payout ratio (what % of earnings is paid as dividend — above 80% is risky), dividend growth history, and free cash flow coverage. Consistent dividend growers (Dividend Aristocrats) are considered quality income investments.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
