'use client';

import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { C, T, TYPE, styles } from '@/lib/designTokens';

interface RiskProfileTabProps {
  data: {
    beta: number | null;
    betaLabel: string;
    realizedVolatility: number;
    volatilityLabel: string;
    maxDrawdown: number;
    sharpeRatio: number | null;
    drawdownHistory: Array<{ date: string; drawdown: number }>;
    returnDistribution: Array<{ range: string; count: number }>;
    currencySymbol: string;
  };
  meta: { companyName: string };
}

export default function RiskProfileTab({ data, meta }: RiskProfileTabProps) {
  const [showBetaLearn,   setShowBetaLearn]   = useState(false);
  const [showVolLearn,    setShowVolLearn]     = useState(false);
  const [showDrawLearn,   setShowDrawLearn]    = useState(false);
  const [showDistLearn,   setShowDistLearn]    = useState(false);
  const [showSharpeLearn, setShowSharpeLearn]  = useState(false);

  const betaColors: Record<string, string>  = { Low: C.GREEN, Moderate: C.NEUTRAL, High: C.ORANGE, 'Very High': C.RED };
  const volColors:  Record<string, string>  = { Low: C.GREEN, Moderate: C.NEUTRAL, High: C.ORANGE, 'Very High': C.RED };

  const betaColor   = betaColors[data.betaLabel]      ?? C.NEUTRAL;
  const volColor    = volColors[data.volatilityLabel]  ?? C.NEUTRAL;
  const sharpeColor = data.sharpeRatio === null ? C.TEXT2 : data.sharpeRatio >= 1 ? C.GREEN : data.sharpeRatio >= 0 ? C.NEUTRAL : C.RED;

  const xInterval = Math.floor((data.drawdownHistory.length - 1) / 5);

  const sharpeLabel = data.sharpeRatio !== null
    ? data.sharpeRatio >= 2 ? 'Excellent' : data.sharpeRatio >= 1 ? 'Good' : data.sharpeRatio >= 0 ? 'Below Average' : 'Poor'
    : '—';

  return (
    <div style={{ fontFamily: T.BODY, color: C.TEXT }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '12px' }}>
          RISK ASSESSMENT // EQUITY // {meta.companyName.toUpperCase()}
        </p>
        <h2 style={{ ...TYPE.DISPLAY_LG, fontStyle: 'italic', color: C.TEXT, marginBottom: '4px' }}>
          {meta.companyName}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <p style={{ ...TYPE.LABEL_SM, color: C.GREEN }}>STATUS: ANALYSIS_LIVE</p>
        </div>
        {/* Summary strip — 4 key metrics */}
        <div style={{ display: 'flex', gap: '1px', background: C.BORDER_FAINT }}>
          {[
            { label: 'Beta (1Y)',    value: data.beta !== null ? data.beta.toFixed(2) : '—', sub: data.betaLabel,       color: betaColor   },
            { label: 'Realized Vol', value: `${data.realizedVolatility.toFixed(1)}%`,        sub: data.volatilityLabel, color: volColor    },
            { label: 'Max Drawdown', value: `${data.maxDrawdown.toFixed(1)}%`,               sub: 'Peak-to-Trough',     color: C.RED       },
            { label: 'Sharpe Ratio', value: data.sharpeRatio !== null ? data.sharpeRatio.toFixed(2) : '—', sub: sharpeLabel, color: sharpeColor },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: C.SURFACE, padding: '20px 24px', flex: '1 1 120px' }}>
              <p style={styles.metricLabel}>{label}</p>
              <p style={{ ...TYPE.DATA_LG, color, marginBottom: '4px' }}>{value}</p>
              <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3 }}>
                {sub === 'High' ? '▲ HIGH' : sub === 'Very High' ? '▲ VERY HIGH' : sub === 'Low' ? '▼ STABLE' : sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1. BETA ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Beta — Market Sensitivity</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <p style={{ ...TYPE.DATA_HERO, fontSize: '4.5rem', color: betaColor, lineHeight: '1', margin: 0 }}>
              {data.beta !== null ? data.beta.toFixed(2) : '—'}
            </p>
            <div>
              <span style={styles.badge(betaColor)}>{data.betaLabel}</span>
              <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginTop: '8px' }}>vs Market beta of 1.00</p>
            </div>
          </div>
          {/* Beta gauge */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '4px' }}>
              <span>0.0 Defensive</span><span>1.0 Market</span><span>2.0+ Aggressive</span>
            </div>
            <div style={{ position: 'relative', height: '8px', background: `linear-gradient(to right, ${C.GREEN}40, ${C.NEUTRAL}40, ${C.RED}40)` }}>
              {data.beta !== null && (
                <div style={{
                  position: 'absolute',
                  left: `${Math.min(100, Math.max(0, (data.beta / 2) * 100))}%`,
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: '12px', height: '12px',
                  background: betaColor,
                  borderRadius: '50%',
                  boxShadow: `0 0 6px ${betaColor}80`,
                }} />
              )}
            </div>
          </div>
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.beta !== null
              ? `A beta of ${data.beta.toFixed(2)} means ${meta.companyName} historically moves ${data.beta > 1 ? 'more' : 'less'} than the market. ${data.beta > 1 ? `For every 1% market move, this stock tends to move ${data.beta.toFixed(2)}%.` : `For every 1% market move, this stock moves only ${data.beta.toFixed(2)}%.`} ${data.betaLabel === 'Low' ? 'Defensive — less sensitive to market swings.' : data.betaLabel === 'Very High' ? 'Extreme sensitivity — large gains and losses relative to the market.' : ''}`
              : 'Beta data is unavailable. May be due to limited trading history.'}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowBetaLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showBetaLearn ? '▾' : '▸'}</span> How Beta works
        </button>
        {showBetaLearn && (
          <div style={styles.collapsibleContent}>
            Beta measures volatility relative to the market (typically S&P 500). Beta 1.0 = moves with market. Above 1.0 = more volatile. Negative beta = moves inversely to market. Beta is calculated from historical data and may not predict future sensitivity.
          </div>
        )}
      </div>

      {/* ── 2. REALIZED VOLATILITY ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Realized Volatility (Annualized)</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <p style={{ ...TYPE.DATA_HERO, fontSize: '4.5rem', color: volColor, lineHeight: '1', margin: 0 }}>
              {data.realizedVolatility.toFixed(1)}%
            </p>
            <span style={styles.badge(volColor)}>{data.volatilityLabel}</span>
          </div>
          {/* Tier labels */}
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
            {[['< 20%', 'Low', C.GREEN], ['20–40%', 'Moderate', C.NEUTRAL], ['40–60%', 'High', C.ORANGE], ['> 60%', 'Very High', C.RED]].map(([range, label, color]) => (
              <div key={label as string} style={{
                padding: '10px 16px', flex: '1 1 80px',
                background: data.volatilityLabel === label ? (color as string) + '12' : C.SURFACE,
                borderBottom: data.volatilityLabel === label ? `2px solid ${color}` : `2px solid transparent`,
              }}>
                <p style={{ ...TYPE.LABEL_SM, color: data.volatilityLabel === label ? (color as string) : C.TEXT3 }}>{label as string}</p>
                <p style={{ ...TYPE.DATA_SM, color: C.TEXT3, marginTop: '2px' }}>{range as string}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            Annualized volatility of {data.realizedVolatility.toFixed(1)}% means daily moves average ~{(data.realizedVolatility / Math.sqrt(252)).toFixed(2)}%.{' '}
            {data.volatilityLabel === 'Low' ? 'Calm, predictable price action — suitable for conservative investors.' :
             data.volatilityLabel === 'Moderate' ? 'Normal variation for most large-cap stocks — manageable risk.' :
             data.volatilityLabel === 'High' ? 'Significant daily swings — requires wider stops and smaller position sizes.' :
             'Extreme volatility — very high risk profile, only for experienced risk managers.'}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowVolLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showVolLearn ? '▾' : '▸'}</span> How realized volatility works
        </button>
        {showVolLearn && (
          <div style={styles.collapsibleContent}>
            Realized volatility = standard deviation of daily log returns × √252 (annualized). Unlike implied volatility (options market), this is backward-looking. Position sizing should scale inversely with volatility.
          </div>
        )}
      </div>

      {/* ── 3. DRAWDOWN HISTORY ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Drawdown History</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <h3 style={{ ...TYPE.DISPLAY_SM, fontStyle: 'italic', color: C.TEXT, margin: 0 }}>Drawdown History</h3>
            <div style={{ background: C.RED + '18', border: `1px solid ${C.RED}40`, padding: '4px 12px' }}>
              <span style={{ ...TYPE.LABEL_SM, color: C.RED }}>CRITICAL_THRESHOLD: {data.maxDrawdown.toFixed(1)}%</span>
            </div>
          </div>
          <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '16px' }}>Trailing Maximum Peak-to-Trough</p>
          {data.drawdownHistory.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.drawdownHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.RED} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.RED} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} interval={xInterval} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown) => [`${(v as number).toFixed(2)}%`, 'Drawdown']} />
                <ReferenceLine y={0} stroke={C.BORDER} />
                <Area type="monotone" dataKey="drawdown" stroke={C.RED} strokeWidth={1.5} fill="url(#ddGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            Maximum drawdown of {data.maxDrawdown.toFixed(1)}% = the worst peak-to-trough decline in the period.{' '}
            {Math.abs(data.maxDrawdown) > 30 ? 'Severe drawdown — an investor buying at the peak would have temporarily lost 30%+.' :
             Math.abs(data.maxDrawdown) > 15 ? 'Meaningful but within normal range for volatile stocks over a year.' :
             'Relatively contained — no extreme peak-to-trough losses in this period.'}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowDrawLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showDrawLearn ? '▾' : '▸'}</span> How drawdown works
        </button>
        {showDrawLearn && (
          <div style={styles.collapsibleContent}>
            Drawdown measures decline from a peak to a subsequent trough. Maximum drawdown answers: "If I bought at the worst time, how much would I have lost?" A key metric for comparing risk profiles — two stocks with similar returns can have very different drawdown characteristics.
          </div>
        )}
      </div>

      {/* ── 4. RETURN DISTRIBUTION ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Daily Return Distribution</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
          <h3 style={{ ...TYPE.DISPLAY_SM, fontStyle: 'italic', color: C.TEXT, marginBottom: '4px' }}>Distribution</h3>
          <p style={{ ...TYPE.LABEL_SM, color: C.TEXT3, marginBottom: '16px' }}>Daily Returns Kurtosis</p>
          {data.returnDistribution.length > 0 && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.returnDistribution} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.BORDER_FAINT} vertical={false} />
                <XAxis dataKey="range" tick={{ fill: C.TEXT3, fontSize: 9, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: C.TEXT3, fontSize: 10, fontFamily: T.MONO }} tickLine={false} axisLine={false} />
                <Tooltip {...styles.tooltipStyle} formatter={(v: unknown, name: unknown) => [v as number, (name as string) === 'count' ? 'Days' : name as string]} />
                <Bar dataKey="count" name="count" isAnimationActive={false}>
                  {data.returnDistribution.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={parseFloat(entry.range) < 0 ? C.RED + '80' : C.GREEN + '80'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowDistLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showDistLearn ? '▾' : '▸'}</span> How return distribution works
        </button>
        {showDistLearn && (
          <div style={styles.collapsibleContent}>
            Return distribution shows how frequently different daily return magnitudes occurred. Fat tails = more frequent large moves than normal distribution. Skew to the right (more positive bars) is preferable. Comparing positive vs negative bar heights gives visual sense of return asymmetry.
          </div>
        )}
      </div>

      {/* ── 5. SHARPE RATIO ── */}
      <div style={{ marginBottom: '40px' }}>
        <p style={styles.sectionLabel}>Sharpe Ratio</p>
        <div style={{ background: C.SURFACE, border: `1px solid ${C.BORDER}`, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <p style={{ ...TYPE.DATA_HERO, fontSize: '4.5rem', color: sharpeColor, lineHeight: '1', margin: 0 }}>
              {data.sharpeRatio !== null ? data.sharpeRatio.toFixed(2) : '—'}
            </p>
            {data.sharpeRatio !== null && <span style={styles.badge(sharpeColor)}>{sharpeLabel}</span>}
          </div>
          {/* Tier reference */}
          <div style={{ display: 'flex', gap: '1px', flexWrap: 'wrap', background: C.BORDER_FAINT }}>
            {[['< 0', 'Poor', C.RED], ['0–1', 'Suboptimal', C.NEUTRAL], ['1–2', 'Good', C.GOLD], ['> 2', 'Excellent', C.GREEN]].map(([range, label, color]) => (
              <div key={label as string} style={{ padding: '10px 16px', flex: '1 1 80px', background: C.SURFACE, textAlign: 'center' }}>
                <p style={{ ...TYPE.LABEL_SM, color: color as string, marginBottom: '2px' }}>{label as string}</p>
                <p style={{ ...TYPE.DATA_SM, color: C.TEXT3 }}>{range as string}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.insightBox}>
          <p style={styles.insightLabel}>What this means</p>
          <p style={styles.insightText}>
            {data.sharpeRatio === null
              ? 'Sharpe ratio could not be calculated — insufficient data.'
              : `Sharpe ratio of ${data.sharpeRatio.toFixed(2)} means ${meta.companyName} earned ${data.sharpeRatio.toFixed(2)} units of return per unit of risk. ${data.sharpeRatio >= 1 ? 'Strong risk-adjusted performance — stock compensates investors well for the volatility.' : data.sharpeRatio >= 0 ? 'Returns not fully compensating for volatility — better risk-adjusted alternatives may exist.' : 'Negative Sharpe — returns below the risk-free rate. Risk taken without adequate reward.'}`}
          </p>
        </div>
        <button style={styles.collapsibleBtn} onClick={() => setShowSharpeLearn(v => !v)}>
          <span style={{ color: C.CYAN }}>{showSharpeLearn ? '▾' : '▸'}</span> How Sharpe Ratio works
        </button>
        {showSharpeLearn && (
          <div style={styles.collapsibleContent}>
            Sharpe Ratio = (Return − Risk-Free Rate) / Standard Deviation. Answers: "Am I compensated for the risk I'm taking?" Above 1 = good, above 2 = excellent. Use it to compare investments — higher Sharpe means more return per unit of risk.
          </div>
        )}
      </div>

    </div>
  );
}
