/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { C, T, TYPE, styles } from '@/lib/designTokens';

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

function fmt(v: number | null | undefined, d = 1)           { return v !== null && v !== undefined ? v.toFixed(d) : '—'; }
function fmtPct(v: number | null | undefined, isP = false) { return v !== null && v !== undefined ? `${(isP ? v : v * 100).toFixed(1)}%` : '—'; }
function fmtRev(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `${(v / 1e6).toFixed(1)}M`;
  return `${(v / 1e3).toFixed(0)}K`;
}

function StatRow({ label, hint, value, color }: { label: string; hint?: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${C.BORDER_FAINT}`, gap: '16px' }}>
      <div>
        <span style={{ ...TYPE.DATA_SM, color: C.TEXT2 }}>{label}</span>
        {hint && <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginTop: '2px' }}>{hint}</p>}
      </div>
      <span style={{ ...TYPE.DATA_SM, color: color ?? C.TEXT, fontWeight: 600, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

export default function FundamentalsTab({ data, meta }: FundamentalsTabProps) {
  const [showValLearn,    setShowValLearn]    = useState(false);
  const [showGrowthLearn, setShowGrowthLearn] = useState(false);
  const [showHealthLearn, setShowHealthLearn] = useState(false);
  const [showEPSLearn,    setShowEPSLearn]    = useState(false);
  const [showRevLearn,    setShowRevLearn]    = useState(false);
  const [showDivLearn,    setShowDivLearn]    = useState(false);

  const roePct          = data.returnOnEquity !== null ? data.returnOnEquity * 100 : null;
  const revenueGrowthPct = data.revenueGrowth  !== null ? data.revenueGrowth  * 100 : null;
  const grossMarginsPct  = data.grossMargins   !== null ? data.grossMargins   * 100 : null;
  const dividendYieldPct = data.dividendYield  !== null ? data.dividendYield  * 100 : null;

  const earningsChartData = data.earningsHistory
    .filter(e => e.epsActual !== null || e.epsEstimate !== null)
    .map(e => ({ quarter: e.quarter, actual: e.epsActual, estimate: e.epsEstimate }));

  const revenueChartData = data.revenueHistory
    .filter(r => r.revenue !== null)
    .map(r => ({ period: r.period, revenue: r.revenue as number }));

  return (
    <div style={{ fontFamily: T.BODY, color: C.TEXT }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '12px' }}>
          FUNDAMENTALS // {meta.companyName.toUpperCase()}
        </p>
        <h2 style={{ ...TYPE.DISPLAY_MD, color: C.TEXT, marginBottom: '16px' }}>
          Financial Analysis
        </h2>
        {/* Summary */}
        <div style={{ ...styles.insightBox }}>
          <p style={styles.insightLabel}>Fundamentals Summary</p>
          <p style={styles.insightText}>
            {meta.companyName} trades at{' '}
            {data.peRatio !== null
              ? <><span style={{ ...TYPE.DATA_SM, color: C.CYAN }}>{data.peRatio.toFixed(1)}×</span> trailing P/E</>
              : 'P/E not available'}.{' '}
            {revenueGrowthPct !== null && <>Revenue growth: <span style={{ ...TYPE.DATA_SM, color: revenueGrowthPct >= 0 ? C.GREEN : C.RED }}>{fmtPct(data.revenueGrowth)}</span> YoY. </>}
            {grossMarginsPct  !== null && <>Gross margins: <span style={{ ...TYPE.DATA_SM, color: C.TEXT }}>{fmtPct(data.grossMargins)}</span>. </>}
            {data.sector && <>Sector: <span style={{ ...TYPE.DATA_SM, color: C.TEXT2 }}>{data.sector}</span>.</>}
          </p>
        </div>
      </div>

      {/* ── 1. VALUATION METRICS ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Valuation Metrics</p>
        {/* Three big metric cards */}
        <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap', background: C.BORDER_FAINT, marginBottom: '16px' }}>
          {[
            {
              label: 'P/E Ratio (TTM)',
              value: fmt(data.peRatio),
              sub: 'Price / Earnings',
              color: data.peRatio !== null ? (data.peRatio < 15 ? C.GREEN : data.peRatio > 40 ? C.RED : C.TEXT) : C.TEXT,
            },
            {
              label: 'Forward P/E',
              value: fmt(data.forwardPE),
              sub: '1YR Estimate',
              color: data.forwardPE !== null ? (data.forwardPE < 15 ? C.GREEN : data.forwardPE > 40 ? C.RED : C.TEXT) : C.TEXT,
            },
            {
              label: 'PEG Ratio',
              value: fmt(data.pegRatio, 2),
              sub: 'P/E ÷ Growth Rate',
              color: data.pegRatio !== null ? (data.pegRatio < 1 ? C.GREEN : data.pegRatio > 2 ? C.RED : C.GOLD) : C.TEXT,
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: C.SURFACE, padding: '24px 28px', flex: '1 1 160px' }}>
              <p style={styles.metricLabel}>{label}</p>
              <p style={{ ...TYPE.DATA_HERO, fontSize: '3rem', color, marginBottom: '6px', lineHeight: '1' }}>{value}</p>
              <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>{sub}</p>
            </div>
          ))}
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.peRatio !== null
              ? `A P/E of ${data.peRatio.toFixed(1)}× means investors pay ${data.peRatio.toFixed(1)} dollars per dollar of earnings. ${data.peRatio < 15 ? 'Relatively low — potentially undervalued.' : data.peRatio > 40 ? 'High — market expects significant future growth.' : 'Moderate range for established companies.'}`
              : 'P/E ratio unavailable — company may have negative earnings.'}
            {data.pegRatio !== null && ` PEG of ${data.pegRatio.toFixed(2)} ${data.pegRatio < 1 ? '— potentially undervalued relative to growth.' : data.pegRatio > 2 ? '— may be overvalued relative to growth.' : '— fair-value range.'}`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowValLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showValLearn ? '▾' : '▸'}</span> How valuation metrics work
        </button>
        {showValLearn && (
          <div style={styles.collapsibleContent}>
            P/E = price per dollar of profit. High P/E = high growth expectations. Forward P/E uses estimated future earnings. PEG adjusts P/E for growth — below 1.0 suggests value, above 2.0 suggests overvaluation. Always compare to sector peers.
          </div>
        )}
      </div>

      {/* ── 2. GROWTH & PROFITABILITY ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Growth &amp; Profitability</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '4px 24px' }}>
          <StatRow label="Revenue Growth (YoY)" hint="Year-over-year top-line growth" value={fmtPct(data.revenueGrowth)} color={revenueGrowthPct !== null ? (revenueGrowthPct >= 0 ? C.GREEN : C.RED) : undefined} />
          <StatRow label="Gross Margins"        hint="Revenue kept after direct costs" value={fmtPct(data.grossMargins)} color={grossMarginsPct  !== null ? (grossMarginsPct >= 50 ? C.GREEN : grossMarginsPct >= 20 ? C.TEXT : C.RED) : undefined} />
          <StatRow label="Return on Equity"     hint="Profit per unit of equity" value={fmtPct(data.returnOnEquity)} color={roePct !== null ? (roePct >= 15 ? C.GREEN : roePct >= 0 ? C.TEXT : C.RED) : undefined} />
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {revenueGrowthPct !== null ? `Revenue is ${revenueGrowthPct >= 0 ? 'growing' : 'declining'} at ${Math.abs(revenueGrowthPct).toFixed(1)}% YoY. ` : ''}
            {grossMarginsPct !== null && `Gross margins of ${grossMarginsPct.toFixed(1)}% ${grossMarginsPct >= 50 ? 'indicate strong pricing power.' : grossMarginsPct >= 20 ? 'are typical for the sector.' : 'suggest competitive pressure or high input costs.'} `}
            {roePct !== null && `ROE of ${roePct.toFixed(1)}% ${roePct >= 15 ? 'shows strong capital efficiency.' : roePct >= 0 ? 'is positive but moderate.' : 'is negative — not generating returns for shareholders.'}`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowGrowthLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showGrowthLearn ? '▾' : '▸'}</span> How growth metrics work
        </button>
        {showGrowthLearn && (
          <div style={styles.collapsibleContent}>
            Revenue growth = top-line expansion. Gross margins = revenue kept after direct costs. ROE = profit generated per unit of shareholder equity. Sustained ROE above 15% is a hallmark of quality businesses (Buffett benchmark).
          </div>
        )}
      </div>

      {/* ── 3. EPS HISTORY ── */}
      {earningsChartData.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <p style={styles.sectionLabel}>EPS History (Quarterly)</p>
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '24px' }}>
            <h3 style={{ ...TYPE.DISPLAY_SM, color: C.TEXT, marginBottom: '4px' }}>Earnings Per Share</h3>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '20px' }}>Actual vs Estimates</p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              {([[C.TEXT3, 'Estimate'], [C.GREEN, 'Beat'], [C.RED, 'Miss']] as [string, string][]).map(([c, l]) => (
                <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', background: c, display: 'inline-block' }} />
                  <span style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>{l}</span>
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={earningsChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="quarter" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [v !== null && v !== undefined ? (v as number).toFixed(2) : '—', name as string]} />
                <ReferenceLine y={0} stroke={C.BORDER} />
                <Bar dataKey="estimate" fill={C.TEXT3} name="Estimate" isAnimationActive={false} />
                <Bar dataKey="actual"   name="Actual"  isAnimationActive={false}>
                  {earningsChartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={
                      entry.actual !== null && entry.estimate !== null
                        ? (entry.actual >= entry.estimate ? C.GREEN : C.RED)
                        : C.NEUTRAL
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button style={styles.collapsibleBtn} onClick={() => setShowEPSLearn(v => !v)}>
            <span style={{ color: C.CYAN }}>{showEPSLearn ? '▾' : '▸'}</span> How EPS history works
          </button>
          {showEPSLearn && (
            <div style={styles.collapsibleContent}>
              EPS = profit divided by shares outstanding. Beats build confidence; misses can trigger selloffs. Consistent beats alongside revenue growth is the strongest fundamental signal.
            </div>
          )}
        </div>
      )}

      {/* ── 4. REVENUE TREND ── */}
      {revenueChartData.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <p style={styles.sectionLabel}>Revenue Trend (Quarterly)</p>
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '24px' }}>
            <h3 style={{ ...TYPE.DISPLAY_SM, color: C.TEXT, marginBottom: '4px' }}>Revenue History</h3>
            <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '20px' }}>Most recent quarter highlighted in cyan</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="period" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} tickFormatter={fmtRev} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown) => [fmtRev(v as number), 'Revenue']} />
                <Bar dataKey="revenue" name="Revenue" isAnimationActive={false}>
                  {revenueChartData.map((_, i) => (
                    <Cell key={`rev-${i}`} fill={i === revenueChartData.length - 1 ? C.CYAN : C.VIOLET} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button style={styles.collapsibleBtn} onClick={() => setShowRevLearn(v => !v)}>
            <span style={{ color: C.CYAN }}>{showRevLearn ? '▾' : '▸'}</span> How revenue trend works
          </button>
          {showRevLearn && (
            <div style={styles.collapsibleContent}>
              Consistently rising revenue signals business expansion. Flat or declining revenue can indicate market saturation. Compare each quarter to the same quarter a year ago (YoY) for the most accurate picture.
            </div>
          )}
        </div>
      )}

      {/* ── 5. FINANCIAL HEALTH ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Financial Health</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '4px 24px' }}>
          <StatRow label="Debt / Equity"   hint="Total debt relative to equity"       value={fmt(data.debtToEquity, 2)} color={data.debtToEquity !== null ? (data.debtToEquity < 0.5 ? C.GREEN : data.debtToEquity > 2 ? C.RED : C.GOLD) : undefined} />
          <StatRow label="Current Ratio"   hint="Short-term assets vs liabilities"    value={fmt(data.currentRatio, 2)} color={data.currentRatio !== null ? (data.currentRatio >= 2 ? C.GREEN : data.currentRatio >= 1 ? C.TEXT : C.RED) : undefined} />
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.debtToEquity !== null ? `D/E of ${data.debtToEquity.toFixed(2)} — ${data.debtToEquity < 0.5 ? 'low leverage, financially conservative.' : data.debtToEquity > 2 ? 'high leverage, elevated risk in rising rate environments.' : 'moderate leverage.'}` : ''}
            {data.currentRatio !== null && ` Current ratio of ${data.currentRatio.toFixed(2)} ${data.currentRatio >= 2 ? '— strong short-term liquidity.' : data.currentRatio >= 1 ? '— can meet short-term obligations.' : '— potential liquidity concerns.'}`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowHealthLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showHealthLearn ? '▾' : '▸'}</span> How financial health metrics work
        </button>
        {showHealthLearn && (
          <div style={styles.collapsibleContent}>
            Debt/Equity measures financial leverage. High D/E amplifies gains and losses — risky when rates rise. Current Ratio above 2 = healthy liquidity. Below 1 = potential short-term risk. Both vary by industry.
          </div>
        )}
      </div>

      {/* ── 6. DIVIDEND ── */}
      {dividendYieldPct !== null && dividendYieldPct > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <p style={styles.sectionLabel}>Dividend</p>
          <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px', display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            <div>
              <p style={styles.metricLabel}>Dividend Yield</p>
              <p style={{ ...TYPE.DATA_HERO, fontSize: '3.5rem', color: C.GREEN, lineHeight: '1' }}>
                {dividendYieldPct.toFixed(2)}%
              </p>
            </div>
            <p style={{ ...TYPE.PROSE_MD, color: C.TEXT2, maxWidth: '360px' }}>
              Annual dividend income as a % of current price.{' '}
              {dividendYieldPct > 5
                ? 'High yield — verify it is sustainable and not a falling-price trap.'
                : dividendYieldPct > 2
                ? 'Healthy yield offering income alongside price appreciation.'
                : 'Low yield — company reinvests in growth over income distribution.'}
            </p>
          </div>
          <button style={styles.collapsibleBtn} onClick={() => setShowDivLearn(v => !v)}>
            <span style={{ color: C.CYAN }}>{showDivLearn ? '▾' : '▸'}</span> How dividend yield works
          </button>
          {showDivLearn && (
            <div style={styles.collapsibleContent}>
              Dividend yield = annual dividend ÷ current price. Rising yield can mean higher dividend (good) or falling stock price (bad — the &quot;yield trap&quot;). Payout ratio above 80% is risky. Dividend Aristocrats (consistent growers) are quality income investments.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
