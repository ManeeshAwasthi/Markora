'use client';

import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";

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

export default function RiskProfileTab({ data, meta }: RiskProfileTabProps) {
  const [showBetaLearn, setShowBetaLearn] = useState(false);
  const [showVolLearn, setShowVolLearn] = useState(false);
  const [showDrawLearn, setShowDrawLearn] = useState(false);
  const [showDistLearn, setShowDistLearn] = useState(false);
  const [showSharpeLearn, setShowSharpeLearn] = useState(false);

  const betaColors: Record<string, string> = { Low: '#00ff88', Moderate: '#888', High: '#f97316', 'Very High': '#ef4444' };
  const volColors: Record<string, string> = { Low: '#00ff88', Moderate: '#888', High: '#f97316', 'Very High': '#ef4444' };

  const betaColor = betaColors[data.betaLabel] ?? '#888';
  const volColor = volColors[data.volatilityLabel] ?? '#888';
  const sharpeColor = data.sharpeRatio === null ? '#555' : data.sharpeRatio >= 1 ? '#00ff88' : data.sharpeRatio >= 0 ? '#888' : '#ef4444';

  const xInterval = Math.floor((data.drawdownHistory.length - 1) / 5);

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Summary */}
      <div style={{ background: '#0a0a12', border: '1px solid #1c1c26', borderRadius: '10px', padding: '24px 28px', marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontFamily: MONO, color: '#4a4a6a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Risk Profile Summary
        </p>
        <p style={{ fontSize: '15px', color: '#c0c0d0', lineHeight: 1.7 }}>
          {meta.companyName} has{' '}
          {data.beta !== null
            ? <><span style={{ color: betaColor, fontFamily: MONO }}>{data.betaLabel.toLowerCase()}</span> market sensitivity (beta <span style={{ fontFamily: MONO }}>{data.beta.toFixed(2)}</span>)</>
            : <span style={{ color: '#888' }}>unknown market sensitivity</span>}.{' '}
          Annualized volatility is{' '}
          <span style={{ color: volColor, fontFamily: MONO }}>{data.realizedVolatility.toFixed(1)}%</span> ({data.volatilityLabel.toLowerCase()}).{' '}
          Maximum drawdown in the period was{' '}
          <span style={{ color: '#ef4444', fontFamily: MONO }}>{data.maxDrawdown.toFixed(1)}%</span>.{' '}
          {data.sharpeRatio !== null && <>Sharpe ratio: <span style={{ color: sharpeColor, fontFamily: MONO }}>{data.sharpeRatio.toFixed(2)}</span>.</>}
        </p>
      </div>

      {/* 1. Beta */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Beta — Market Sensitivity</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ fontFamily: MONO, fontSize: '3.5rem', fontWeight: 700, color: betaColor, lineHeight: 1 }}>
            {data.beta !== null ? data.beta.toFixed(2) : '—'}
          </span>
          <div>
            <span style={{
              fontFamily: MONO, fontSize: '12px', padding: '4px 12px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px',
              color: betaColor, background: betaColor + '18',
            }}>{data.betaLabel}</span>
            <p style={{ fontSize: '12px', fontFamily: MONO, color: '#4a4a6a' }}>vs Market beta of 1.00</p>
          </div>
        </div>
        {/* Beta context bar */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: MONO, color: '#555', marginBottom: '4px' }}>
            <span>0.0 (Defensive)</span>
            <span>1.0 (Market)</span>
            <span>2.0+ (Aggressive)</span>
          </div>
          <div style={{ position: 'relative', height: '8px', background: 'linear-gradient(to right, #00ff8840, #88888840, #ef444440)', borderRadius: '4px' }}>
            {data.beta !== null && (
              <div style={{
                position: 'absolute',
                left: `${Math.min(100, Math.max(0, (data.beta / 2) * 100))}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '14px', height: '14px',
                background: betaColor,
                borderRadius: '50%',
                boxShadow: `0 0 6px ${betaColor}80`,
              }} />
            )}
          </div>
        </div>
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {data.beta !== null
              ? `A beta of ${data.beta.toFixed(2)} means ${meta.companyName} historically moves ${data.beta > 1 ? 'more' : 'less'} than the broad market. ${data.beta > 1 ? `For every 1% market move, this stock tends to move ${data.beta.toFixed(2)}%.` : `For every 1% market move, this stock tends to move only ${data.beta.toFixed(2)}%.`} ${data.betaLabel === 'Low' ? 'Low beta stocks are more defensive and less sensitive to market swings.' : data.betaLabel === 'Very High' ? 'Very high beta means extreme sensitivity — large gains and losses relative to the market.' : ''}`
              : 'Beta data is unavailable. This may be due to limited trading history or data unavailability for this security.'}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowBetaLearn(v => !v)}>
          {showBetaLearn ? '▲' : '▼'} How Beta works
        </button>
        {showBetaLearn && (
          <div style={collapsibleContentStyle}>
            Beta measures a stock&apos;s volatility relative to the market (typically the S&P 500). A beta of 1.0 means the stock moves in line with the market. Above 1.0 means more volatile than the market; below 1.0 means less volatile. Beta above 2.0 is very high risk/reward. Negative beta (rare) means the stock moves inversely to the market — gold and some utilities can show this. Beta is calculated from historical price data and may not predict future sensitivity.
          </div>
        )}
      </div>

      {/* 2. Realized Volatility */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Realized Volatility (Annualized)</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ fontFamily: MONO, fontSize: '3.5rem', fontWeight: 700, color: volColor, lineHeight: 1 }}>
            {data.realizedVolatility.toFixed(1)}%
          </span>
          <span style={{
            fontFamily: MONO, fontSize: '12px', padding: '4px 12px', borderRadius: '4px',
            color: volColor, background: volColor + '18',
          }}>{data.volatilityLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[['< 20%', 'Low', '#00ff88'], ['20–40%', 'Moderate', '#888'], ['40–60%', 'High', '#f97316'], ['> 60%', 'Very High', '#ef4444']].map(([range, label, color]) => (
            <div key={label} style={{
              padding: '8px 14px', borderRadius: '6px', border: '1px solid',
              borderColor: data.volatilityLabel === label ? color : '#1c1c26',
              background: data.volatilityLabel === label ? color + '12' : '#0d0d12',
            }}>
              <p style={{ fontSize: '10px', fontFamily: MONO, color: data.volatilityLabel === label ? color : '#4a4a6a', marginBottom: '2px' }}>{label}</p>
              <p style={{ fontSize: '11px', fontFamily: MONO, color: '#555' }}>{range}</p>
            </div>
          ))}
        </div>
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            Annualized volatility of {data.realizedVolatility.toFixed(1)}% means {meta.companyName}&apos;s price has been varying at roughly {(data.realizedVolatility / Math.sqrt(252)).toFixed(2)}% per trading day on average.{' '}
            {data.volatilityLabel === 'Low'
              ? 'Low volatility stocks are more predictable and suitable for conservative investors.'
              : data.volatilityLabel === 'Moderate'
              ? 'Moderate volatility is typical for large-cap stocks — manageable risk for most investors.'
              : data.volatilityLabel === 'High'
              ? 'High volatility means significant daily price swings — requires wider stop-losses and smaller position sizes.'
              : 'Extreme volatility — this stock can move dramatically in either direction. Only suitable for experienced risk managers.'}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowVolLearn(v => !v)}>
          {showVolLearn ? '▲' : '▼'} How realized volatility works
        </button>
        {showVolLearn && (
          <div style={collapsibleContentStyle}>
            Realized volatility is calculated from the standard deviation of daily log returns, annualized by multiplying by √252 (trading days per year). Unlike implied volatility (which reflects options market expectations), realized volatility shows what actually happened. It&apos;s a backward-looking measure. Low realized volatility means the stock has been calm recently. High realized volatility means large daily swings. Position sizing should scale inversely with volatility — the more volatile a stock, the smaller the position.
          </div>
        )}
      </div>

      {/* 3. Drawdown History */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Drawdown History</p>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontFamily: MONO, fontSize: '11px', color: '#4a4a6a' }}>Max Drawdown: </span>
          <span style={{ fontFamily: MONO, fontSize: '15px', color: '#ef4444', fontWeight: 600 }}>{data.maxDrawdown.toFixed(1)}%</span>
        </div>
        {data.drawdownHistory.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.drawdownHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} interval={xInterval} />
              <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => [`${(v as number).toFixed(2)}%`, 'Drawdown']} />
              <ReferenceLine y={0} stroke="#2a2a3a" />
              <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={1.5} fill="url(#ddGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            The maximum drawdown of {data.maxDrawdown.toFixed(1)}% represents the worst peak-to-trough decline for {meta.companyName} in the period.{' '}
            {Math.abs(data.maxDrawdown) > 30
              ? 'This is a severe drawdown — an investor who bought at the peak would have temporarily lost more than 30% of their investment.'
              : Math.abs(data.maxDrawdown) > 15
              ? 'A meaningful drawdown, but within the range seen for most volatile stocks over a year.'
              : 'A relatively contained drawdown — the stock did not experience extreme peak-to-trough losses in this period.'}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowDrawLearn(v => !v)}>
          {showDrawLearn ? '▲' : '▼'} How drawdown works
        </button>
        {showDrawLearn && (
          <div style={collapsibleContentStyle}>
            Drawdown measures the decline from a peak value to a subsequent trough, expressed as a percentage. It answers the question: &quot;If I bought at the worst possible time, how much would I have lost?&quot; Maximum drawdown is the largest such decline in the period. Recovery time (time to regain the peak) is equally important but not shown here. Drawdown is a key risk metric for comparing investments — two stocks with similar returns can have very different drawdown profiles.
          </div>
        )}
      </div>

      {/* 4. Return Distribution */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Daily Return Distribution</p>
        {data.returnDistribution.length > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.returnDistribution} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c26" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#555', fontSize: 9, fontFamily: MONO }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: MONO }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown, name: unknown) => [v as number, (name as string) === 'count' ? 'Days' : name as string]} />
              <ReferenceLine x="0%" stroke="#2a2a3a" strokeDasharray="4 3" />
              <Bar dataKey="count" name="count" isAnimationActive={false}>
                {data.returnDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={parseFloat(entry.range) < 0 ? '#ef444480' : '#00ff8880'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <button style={collapsibleBtnStyle} onClick={() => setShowDistLearn(v => !v)}>
          {showDistLearn ? '▲' : '▼'} How return distribution works
        </button>
        {showDistLearn && (
          <div style={collapsibleContentStyle}>
            The return distribution histogram shows how frequently different daily return magnitudes occurred. A normal distribution forms a bell curve centered near zero. A stock with fat tails (large bars at the extremes) has more frequent large moves than a normal distribution would predict — this is &quot;excess kurtosis&quot; or &quot;leptokurtosis.&quot; A skew to the right (more positive returns) is preferable. Comparing the height of positive vs negative bars gives a visual sense of return asymmetry.
          </div>
        )}
      </div>

      {/* 5. Sharpe Ratio */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>Sharpe Ratio</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ fontFamily: MONO, fontSize: '3.5rem', fontWeight: 700, color: sharpeColor, lineHeight: 1 }}>
            {data.sharpeRatio !== null ? data.sharpeRatio.toFixed(2) : '—'}
          </span>
          {data.sharpeRatio !== null && (
            <span style={{
              fontFamily: MONO, fontSize: '12px', padding: '4px 12px', borderRadius: '4px',
              color: sharpeColor, background: sharpeColor + '18',
            }}>
              {data.sharpeRatio >= 2 ? 'Excellent'
                : data.sharpeRatio >= 1 ? 'Good'
                : data.sharpeRatio >= 0 ? 'Below Average'
                : 'Poor'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[['< 0', 'Poor', '#ef4444'], ['0–1', 'Suboptimal', '#888'], ['1–2', 'Good', '#fbbf24'], ['> 2', 'Excellent', '#00ff88']].map(([range, label, color]) => (
            <div key={label} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #1c1c26', background: '#0d0d12', minWidth: '80px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', fontFamily: MONO, color, marginBottom: '2px' }}>{label}</p>
              <p style={{ fontSize: '10px', fontFamily: MONO, color: '#4a4a6a' }}>{range}</p>
            </div>
          ))}
        </div>
        <div style={insightBoxStyle}>
          <p style={insightLabelStyle}>What this means</p>
          <p style={insightTextStyle}>
            {data.sharpeRatio === null
              ? 'Sharpe ratio could not be calculated due to insufficient data.'
              : `A Sharpe ratio of ${data.sharpeRatio.toFixed(2)} means ${meta.companyName} earned ${data.sharpeRatio.toFixed(2)} units of return for each unit of risk taken. ${data.sharpeRatio >= 1 ? 'This is strong risk-adjusted performance — the stock compensates investors well for the volatility they bear.' : data.sharpeRatio >= 0 ? 'Below 1 means returns are not fully compensating for the volatility — better risk-adjusted alternatives may exist.' : 'Negative Sharpe means the stock delivered returns below the risk-free rate — you took on risk without adequate reward.'}`}
          </p>
        </div>
        <button style={collapsibleBtnStyle} onClick={() => setShowSharpeLearn(v => !v)}>
          {showSharpeLearn ? '▲' : '▼'} How Sharpe Ratio works
        </button>
        {showSharpeLearn && (
          <div style={collapsibleContentStyle}>
            The Sharpe Ratio measures risk-adjusted return: (Portfolio Return − Risk-Free Rate) / Standard Deviation of Returns. It answers: &quot;Am I being adequately compensated for the risk I&apos;m taking?&quot; A ratio above 1 is considered good; above 2 is excellent. The risk-free rate here is approximated as zero for simplicity. Sharpe ratio is calculated on an annualized basis. Use it to compare two investments — the one with a higher Sharpe ratio gives more return per unit of risk.
          </div>
        )}
      </div>
    </div>
  );
}
