import type { CSSProperties } from 'react';

// ─────────────────────────────────────────────────────────────────
// MARKORA DESIGN SYSTEM — "The Sovereign Terminal"
// Editorial Brutalism: Playfair Display × IBM Plex Mono × DM Sans
// ─────────────────────────────────────────────────────────────────

export const T = {
  MONO:  "var(--font-ibm-plex-mono), 'IBM Plex Mono', 'Courier New', monospace",
  SERIF: "var(--font-playfair), 'Playfair Display', Georgia, serif",
  BODY:  "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif",
} as const;

// ── Colour palette (obsidian void → vibrant signal) ──────────────
export const C = {
  // Surfaces (tonal layering, no shadows)
  BG:           '#020204',   // canvas — outermost void
  SURFACE:      '#07080d',   // primary workspace
  ELEVATED:     '#0c0d14',   // active / hover layer

  // Borders (etched glass, never white)
  BORDER:       '#1c1c26',   // default border
  BORDER_FAINT: '#0f1118',   // separator / faint divider

  // Text hierarchy
  TEXT:   '#e2e2ec',   // primary — high contrast
  TEXT2:  '#5a5a75',   // secondary — muted
  TEXT3:  '#2a2a3a',   // tertiary — label / ghost

  // Functional signal colours
  CYAN:   '#00e5ff',   // Hidden Strength / alpha indicator
  GREEN:  '#00ff88',   // Aligned / positive / bullish
  RED:    '#ef4444',   // Overconfidence / error / bearish
  ORANGE: '#f97316',   // Mild Optimism / warning
  VIOLET: '#7c3aed',   // Sentiment overlay
  GOLD:   '#fbbf24',   // Highlight / MA50

  // Aliases
  UP:      '#00ff88',
  DOWN:    '#ef4444',
  NEUTRAL: '#5a5a75',
} as const;

// ── Spacing scale (8px grid) ─────────────────────────────────────
export const SPACE = {
  CONDENSED:  '8px',    // internal padding for data cells
  STANDARD:   '16px',   // card internal padding
  STRUCTURAL: '32px',   // gaps between major modules
  EDITORIAL:  '56px',   // top-level margins
} as const;

// ── Typography scale ─────────────────────────────────────────────
// Hero/display — Playfair Display, used ONLY for major section entries
// Data/labels  — IBM Plex Mono, all numbers, nav, labels
// Prose        — DM Sans, descriptions, insight text

export const TYPE = {
  // Display (Playfair) — hero headlines
  DISPLAY_XL: { fontFamily: T.SERIF, fontSize: 'clamp(3rem,5vw,5rem)',   fontWeight: 700, letterSpacing: '-0.01em', lineHeight: '0.95' } as CSSProperties,
  DISPLAY_LG: { fontFamily: T.SERIF, fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: '1.0'  } as CSSProperties,
  DISPLAY_MD: { fontFamily: T.SERIF, fontSize: '1.75rem',                fontWeight: 700, letterSpacing: '-0.01em', lineHeight: '1.1'  } as CSSProperties,
  DISPLAY_SM: { fontFamily: T.SERIF, fontSize: '1.25rem',                fontWeight: 700, letterSpacing: '-0.01em', lineHeight: '1.2'  } as CSSProperties,

  // Data (IBM Plex Mono) — numbers, labels, nav
  DATA_HERO:  { fontFamily: T.MONO, fontSize: '3.5rem',  fontWeight: 700, letterSpacing: '-0.03em', lineHeight: '1.0' } as CSSProperties,
  DATA_XL:    { fontFamily: T.MONO, fontSize: '2.5rem',  fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '1.0' } as CSSProperties,
  DATA_LG:    { fontFamily: T.MONO, fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '1.0' } as CSSProperties,
  DATA_MD:    { fontFamily: T.MONO, fontSize: '1.1rem',  fontWeight: 600, letterSpacing: '-0.01em', lineHeight: '1.1' } as CSSProperties,
  DATA_SM:    { fontFamily: T.MONO, fontSize: '13px',    fontWeight: 500, letterSpacing: '0.01em',  lineHeight: '1.4' } as CSSProperties,

  // Label (IBM Plex Mono) — section headers, nav, chips
  LABEL_LG:   { fontFamily: T.MONO, fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const, lineHeight: '1.0' } as CSSProperties,
  LABEL_MD:   { fontFamily: T.MONO, fontSize: '10px', fontWeight: 500, letterSpacing: '0.2em',  textTransform: 'uppercase' as const, lineHeight: '1.0' } as CSSProperties,
  LABEL_SM:   { fontFamily: T.MONO, fontSize: '9px',  fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase' as const, lineHeight: '1.0' } as CSSProperties,

  // Prose (DM Sans) — body copy, insights
  PROSE_LG:   { fontFamily: T.BODY, fontSize: '15px', fontWeight: 400, lineHeight: '1.8' } as CSSProperties,
  PROSE_MD:   { fontFamily: T.BODY, fontSize: '13px', fontWeight: 400, lineHeight: '1.7' } as CSSProperties,
  PROSE_SM:   { fontFamily: T.BODY, fontSize: '12px', fontWeight: 400, lineHeight: '1.6' } as CSSProperties,
} as const;

// ── Layout constants ─────────────────────────────────────────────
export const S = {
  NAV_H:     '48px',
  TICKER_H:  '32px',
  SIDEBAR_W: '220px',
} as const;

// ── Shared component styles ──────────────────────────────────────
export const styles = {
  // Section label — 10px mono uppercase muted
  sectionLabel: {
    ...TYPE.LABEL_MD,
    color: C.TEXT3,
    marginBottom: '16px',
  } as CSSProperties,

  // Insight block — left cyan border on surface
  insightBox: {
    background:  C.SURFACE,
    borderLeft:  `3px solid ${C.CYAN}`,
    padding:     '18px 22px',
    marginTop:   '16px',
  } as CSSProperties,

  insightLabel: {
    ...TYPE.LABEL_SM,
    color:        C.TEXT3,
    marginBottom: '8px',
  } as CSSProperties,

  insightText: {
    ...TYPE.PROSE_MD,
    color: C.TEXT2,
  } as CSSProperties,

  // Card — surface + border
  card: {
    background:   C.SURFACE,
    border:       `1px solid ${C.BORDER}`,
    padding:      '28px',
    marginBottom: '20px',
  } as CSSProperties,

  // Stat row parts
  statRowLabel: { ...TYPE.DATA_SM,  color: C.TEXT2 } as CSSProperties,
  statRowHint:  { ...TYPE.LABEL_SM, color: C.TEXT3, marginTop: '2px' } as CSSProperties,
  statRowValue: { ...TYPE.DATA_SM,  color: C.TEXT,  fontWeight: 600 } as CSSProperties,

  // Metric card label + value
  metricLabel: {
    ...TYPE.LABEL_SM,
    color:        C.TEXT3,
    marginBottom: '10px',
  } as CSSProperties,

  metricValue: {
    ...TYPE.DATA_HERO,
    color:        C.TEXT,
    marginBottom: '8px',
  } as CSSProperties,

  // Badge — inline pill
  badge: (color: string): CSSProperties => ({
    display:       'inline-block',
    ...TYPE.LABEL_SM,
    padding:       '3px 10px',
    color,
    background:    color + '18',
    border:        `1px solid ${color}30`,
    borderRadius:  '0px',
  }),

  // Tooltip config for recharts
  tooltipStyle: {
    contentStyle: {
      background:   C.ELEVATED,
      border:       `1px solid ${C.BORDER}`,
      borderRadius: 0,
      ...TYPE.DATA_SM,
      color:        C.TEXT,
    },
    labelStyle: { color: C.TEXT2, marginBottom: '4px' },
    cursor:     { stroke: C.BORDER },
  },

  // Collapsible learn button
  collapsibleBtn: {
    background:    'transparent',
    border:        'none',
    color:         C.TEXT3,
    ...TYPE.LABEL_SM,
    cursor:        'pointer',
    padding:       '12px 0 0',
    display:       'flex' as const,
    alignItems:    'center' as const,
    gap:           '6px',
  } as CSSProperties,

  collapsibleContent: {
    marginTop:  '10px',
    padding:    '14px 18px',
    background: C.ELEVATED,
    border:     `1px solid ${C.BORDER}`,
    ...TYPE.PROSE_SM,
    color:      C.TEXT2,
  } as CSSProperties,

  // Nav item (sidebar) — works on both <a> and <button>
  navItem: (active: boolean): CSSProperties => ({
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    padding:        '13px 20px',
    width:          '100%',
    boxSizing:      'border-box' as const,
    ...TYPE.LABEL_MD,
    textDecoration: 'none',
    cursor:         'pointer',
    border:         'none',
    outline:        'none',
    textAlign:      'left' as const,
    color:          active ? C.CYAN : C.TEXT2,
    background:     active ? C.CYAN + '08' : 'transparent',
    borderLeft:     active ? `3px solid ${C.CYAN}` : '3px solid transparent',
  }),
};
