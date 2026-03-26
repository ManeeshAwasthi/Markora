'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { C, T, styles } from '@/lib/designTokens';

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

const sectionStyle = { marginBottom: '40px' };
const sectionTitleStyle = {
  fontSize: '10px', fontFamily: T.MONO, color: C.TEXT3,
  letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '20px',
};

function fmt(v: number | null | undefined, decimals = 1): string {
  return v !== null && v !== undefined ? v.toFixed(decimals) : '—';
}

function fmtPct(v: number | null | undefined, isAlreadyPct = false): string {
  return v !== null && v !== undefined ? `${(isAlreadyPct ? v : v * 100).toFixed(1)}%` : '—';
}

function MetricBigCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.SURFACE, padding: '20px 22px', flex: 1, minWidth: '140px' }}>
      <p style={styles.metricLabel}>{label}</p>
      <p style={{ ...styles.metricValue, fontSize: '1.8rem', color: color ?? C.TEXT, marginBottom: sub ? '8px' : 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: C.TEXT3, fontFamily: T.MONO }}>{sub}</p>}
    </div>
  );
}

function StatRow({ label, value, color, hint }: { label: string; value: string; color?: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${C.BORDER_FAINT}`, gap: '16px' }}>
      <div>
        <span style={styles.statRowLabel}>{label}</span>
        {hint && <p style={styles.statRowHint}>{hint}</p>}
      </div>
      <span style={{ ...styles.statRowValue, color: color ?? C.TEXT, whiteSpace: 'nowrap' }}>{value}</span>
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
    <div style={{ fontFamily: T.BODY }}>
      {/* Summary */}
      <div style={{ ...styles.card, marginBottom: '40px' }}>
        <p style={styles.insightLabel}>Fundamentals Summary</p>
        <p style={{ fontFamily: T.BODY, fontSize: '14px', color: C.TEXT2, lineHeight: 1.7 }}>
          {meta.companyName} trades at a{' '}
          {data.peRatio !== null
            ? <><span style={{ color: C.CYAN, fontFamily: T.MONO }}>{data.peRatio.toFixed(1)}x</span> trailing P/E</>
            : 'P/E not available'}.{' '}
          {data.revenueGrowth !== null
            ? <>Revenue is growing at <span style={{ color: data.revenueGrowth >= 0 ? C.GREEN : C.RED, fontFamily: T.MONO }}>{fmtPct(data.revenueGrowth)}</span> year-over-year.</>
            : ''}
          {data.grossMargins !== null && <> Gross margins are <span style={{ fontFamily: T.MONO, color: C.TEXT }}>{fmtPct(data.grossMargins)}</span>.</>}
          {data.sector && <> Sector: <span style={{ fontFamily: T.MONO, color: C.TEXT2 }}>{data.sector}</span>.</>}
        </p>
      </div>

      {/* 1. Valuation Metrics */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Valuation Metrics</p>
        <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
          <MetricBigCard
            label="P/E Ratio (Trailing)"
            value={fmt(data.peRatio)}
            sub="Price / Earnings"
            color={data.peRatio !== null ? (data.peRatio < 15 ? C.GREEN : data.peRatio > 40 ? C.RED : C.TEXT) : undefined}
          />
          <MetricBigCard
            label="Forward P/E"
            value={fmt(data.forwardPE)}
            sub="Next Year's Earnings"
            color={data.forwardPE !== null ? (data.forwardPE < 15 ? C.GREEN : data.forwardPE > 40 ? C.RED : C.TEXT) : undefined}
          />
          <MetricBigCard
            label="PEG Ratio"
            value={fmt(data.pegRatio, 2)}
            sub="P/E ÷ Growth Rate"
            color={data.pegRatio !== null ? (data.pegRatio < 1 ? C.GREEN : data.pegRatio > 2 ? C.RED : C.GOLD) : undefined}
          />
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.peRatio !== null
              ? `A P/E of ${data.peRatio.toFixed(1)}x means investors pay ${data.peRatio.toFixed(1)} dollars for every dollar of earnings. ${data.peRatio < 15 ? 'This is relatively low — potentially undervalued or a value stock.' : data.peRatio > 40 ? 'This is high — the market expects significant future growth to justify the premium.' : 'This is in a moderate range for most established companies.'}`
              : 'P/E ratio data is unavailable — this may be because the company has negative earnings.'}
            {data.pegRatio !== null && ` PEG ratio of ${data.pegRatio.toFixed(2)} ${data.pegRatio < 1 ? '(below 1) suggests the stock may be undervalued relative to its growth rate.' : data.pegRatio > 2 ? '(above 2) suggests the stock may be overvalued relative to growth.' : 'is in a fair-value range.'}`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowValLearn(v => !v)}>
          {showValLearn ? '▲' : '▼'} How valuation metrics work
        </button>
        {showValLearn && (
          <div style={styles.collapsibleContent}>
            P/E Ratio (Price-to-Earnings) is the most widely used valuation metric. It shows how much investors pay per dollar of profit. High P/E means high growth expectations. Forward P/E uses estimated future earnings — a lower forward P/E than trailing P/E suggests earnings are expected to grow. PEG ratio adjusts P/E for growth rate — below 1.0 typically indicates value, above 2.0 suggests overvaluation. Compare to sector peers for context.
          </div>
        )}
      </div>

      {/* 2. Growth & Profitability */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Growth &amp; Profitability</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '4px 20px' }}>
          <StatRow
            label="Revenue Growth (YoY)"
            hint="Year-over-year top-line growth"
            value={fmtPct(data.revenueGrowth)}
            color={revenueGrowthPct !== null ? (revenueGrowthPct >= 0 ? C.GREEN : C.RED) : undefined}
          />
          <StatRow
            label="Gross Margins"
            hint="Revenue kept after direct costs"
            value={fmtPct(data.grossMargins)}
            color={grossMarginsPct !== null ? (grossMarginsPct >= 50 ? C.GREEN : grossMarginsPct >= 20 ? C.TEXT : C.RED) : undefined}
          />
          <StatRow
            label="Return on Equity"
            hint="Profit generated per unit of shareholder equity"
            value={fmtPct(data.returnOnEquity)}
            color={roePct !== null ? (roePct >= 15 ? C.GREEN : roePct >= 0 ? C.TEXT : C.RED) : undefined}
          />
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {revenueGrowthPct !== null
              ? `Revenue is ${revenueGrowthPct >= 0 ? 'growing' : 'declining'} at ${Math.abs(revenueGrowthPct).toFixed(1)}% year-over-year.`
              : ''}
            {grossMarginsPct !== null && ` Gross margins of ${grossMarginsPct.toFixed(1)}% ${grossMarginsPct >= 50 ? 'indicate a high-margin business with pricing power.' : grossMarginsPct >= 20 ? 'are typical for the sector.' : 'are low, suggesting competitive pressure or high input costs.'}`}
            {roePct !== null && ` ROE of ${roePct.toFixed(1)}% ${roePct >= 15 ? 'shows strong capital efficiency.' : roePct >= 0 ? 'is positive but moderate.' : 'is negative — the company is not generating returns for shareholders.'}`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowGrowthLearn(v => !v)}>
          {showGrowthLearn ? '▲' : '▼'} How growth metrics work
        </button>
        {showGrowthLearn && (
          <div style={styles.collapsibleContent}>
            Revenue growth measures how fast a company is expanding its top line. Gross margins show how much of each dollar of revenue the company keeps after direct costs. Return on Equity (ROE) measures how efficiently management uses shareholder capital to generate profit — Warren Buffett considers sustained ROE above 15% a sign of a durable competitive advantage. High margins combined with strong ROE and growth is the hallmark of quality businesses.
          </div>
        )}
      </div>

      {/* 3. Earnings History */}
      {earningsChartData.length > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Earnings History (EPS)</p>
          <div style={{ background: C.SURFACE, padding: '16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={earningsChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} vertical={false} />
                <XAxis dataKey="quarter" tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [v !== null && v !== undefined ? (v as number).toFixed(2) : '—', name as string]} />
                <ReferenceLine y={0} stroke={C.BORDER} />
                <Bar dataKey="estimate" fill={C.TEXT3} name="EPS Estimate" isAnimationActive={false} />
                <Bar dataKey="actual" name="EPS Actual" isAnimationActive={false}>
                  {earningsChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.actual !== null && entry.estimate !== null
                        ? (entry.actual >= entry.estimate ? C.GREEN : C.RED)
                        : C.NEUTRAL}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            {[[C.TEXT3, 'Estimate'], [C.GREEN, 'Beat'], [C.RED, 'Miss']].map(([c, l]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', background: c, display: 'inline-block' }} />
                <span style={{ color: C.TEXT2, fontSize: '11px', fontFamily: T.MONO }}>{l}</span>
              </span>
            ))}
          </div>
          <button style={styles.collapsibleBtn} onClick={() => setShowEPSLearn(v => !v)}>
            {showEPSLearn ? '▲' : '▼'} How EPS history works
          </button>
          {showEPSLearn && (
            <div style={styles.collapsibleContent}>
              EPS (Earnings Per Share) shows the company&apos;s profit divided by outstanding shares. Comparing actual EPS to analyst estimates shows whether the company beats or misses expectations. Consistent beats build investor confidence. Misses can trigger sharp selloffs. The trend in EPS matters as much as the individual quarter — sustained growth in EPS alongside revenue growth is the strongest fundamental signal.
            </div>
          )}
        </div>
      )}

      {/* 4. Revenue Trend */}
      {revenueChartData.length > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Revenue Trend (Quarterly)</p>
          <div style={{ background: C.SURFACE, padding: '16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER} vertical={false} />
                <XAxis dataKey="period" tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: C.TEXT2, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} tickFormatter={formatRevenue} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown) => [formatRevenue(v as number), 'Revenue']} />
                <Bar dataKey="revenue" fill={C.VIOLET} name="Revenue" isAnimationActive={false}>
                  {revenueChartData.map((_, i) => (
                    <Cell key={`rev-${i}`} fill={i === revenueChartData.length - 1 ? C.CYAN : C.VIOLET} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button style={styles.collapsibleBtn} onClick={() => setShowRevLearn(v => !v)}>
            {showRevLearn ? '▲' : '▼'} How revenue trend works
          </button>
          {showRevLearn && (
            <div style={styles.collapsibleContent}>
              Quarterly revenue shows the trajectory of the company&apos;s top-line growth. A consistently rising revenue chart suggests business expansion. Flat or declining revenue can indicate market saturation or competitive pressure. Seasonal businesses will show cyclical patterns. The most recent quarter (highlighted in cyan) shows the latest data point. Compare each quarter to the same quarter a year ago (year-over-year) for the most accurate growth picture.
            </div>
          )}
        </div>
      )}

      {/* 5. Financial Health */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Financial Health</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '4px 20px' }}>
          <StatRow
            label="Debt / Equity"
            hint="Total debt relative to shareholder equity"
            value={fmt(data.debtToEquity, 2)}
            color={data.debtToEquity !== null ? (data.debtToEquity < 0.5 ? C.GREEN : data.debtToEquity > 2 ? C.RED : C.GOLD) : undefined}
          />
          <StatRow
            label="Current Ratio"
            hint="Short-term assets vs short-term liabilities"
            value={fmt(data.currentRatio, 2)}
            color={data.currentRatio !== null ? (data.currentRatio >= 2 ? C.GREEN : data.currentRatio >= 1 ? C.TEXT : C.RED) : undefined}
          />
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.debtToEquity !== null
              ? `Debt/Equity of ${data.debtToEquity.toFixed(2)} means the company has ${data.debtToEquity.toFixed(2)} dollars of debt for every dollar of equity. ${data.debtToEquity < 0.5 ? 'Low leverage — financially conservative.' : data.debtToEquity > 2 ? 'High leverage — elevated financial risk, especially in rising rate environments.' : 'Moderate leverage — manageable for most sectors.'}`
              : ''}
            {data.currentRatio !== null && ` Current ratio of ${data.currentRatio.toFixed(2)} ${data.currentRatio >= 2 ? 'shows strong short-term liquidity.' : data.currentRatio >= 1 ? 'indicates the company can meet short-term obligations.' : 'is below 1 — potential short-term liquidity concerns.'}`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowHealthLearn(v => !v)}>
          {showHealthLearn ? '▲' : '▼'} How financial health metrics work
        </button>
        {showHealthLearn && (
          <div style={styles.collapsibleContent}>
            Debt/Equity ratio measures how much a company finances operations with debt vs shareholder equity. High D/E amplifies both gains and losses — manageable in low-rate environments but risky when rates rise. The Current Ratio measures short-term solvency: current assets divided by current liabilities. Above 2 is generally healthy; below 1 may signal liquidity risk. Both metrics vary significantly by industry — capital-intensive industries like utilities typically carry more debt.
          </div>
        )}
      </div>

      {/* 6. Dividend */}
      {dividendYieldPct !== null && dividendYieldPct > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Dividend</p>
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div>
              <p style={styles.metricLabel}>Dividend Yield</p>
              <p style={{ fontFamily: T.MONO, fontSize: '2.5rem', color: C.GREEN, fontWeight: 700, lineHeight: 1 }}>
                {dividendYieldPct.toFixed(2)}%
              </p>
            </div>
            <p style={{ fontFamily: T.BODY, fontSize: '13px', color: C.TEXT2, lineHeight: 1.6 }}>
              Annual dividend income as a percentage of the current stock price.{' '}
              {dividendYieldPct > 5
                ? 'High yield — verify it is sustainable and not driven by a falling stock price.'
                : dividendYieldPct > 2
                ? 'Healthy yield offering income alongside potential price appreciation.'
                : 'Low yield — company prioritizes growth reinvestment over income distribution.'}
            </p>
          </div>
          <button style={styles.collapsibleBtn} onClick={() => setShowDivLearn(v => !v)}>
            {showDivLearn ? '▲' : '▼'} How dividend yield works
          </button>
          {showDivLearn && (
            <div style={styles.collapsibleContent}>
              Dividend yield = annual dividend per share divided by current stock price. A rising yield can mean the company raised its dividend (positive) or the stock price fell (negative — the &quot;yield trap&quot;). Key metrics to check: payout ratio (what % of earnings is paid as dividend — above 80% is risky), dividend growth history, and free cash flow coverage. Consistent dividend growers (Dividend Aristocrats) are considered quality income investments.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
