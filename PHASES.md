# Markora — Build Phases

This file is the source of truth for what has been built, what is in progress,
and what is planned. Read this before making any changes. Do not implement
features from a phase that is marked ❌ Not Started unless explicitly instructed.

---

## Phase 1 — Proof of Concept ✅ COMPLETE (do not modify)
Legacy sentiment engine. No longer the main product. Keep these files but do not
change them — they are used as a reference and may be deleted in a future cleanup.

Files:
- src/components/Dashboard.tsx
- src/components/SearchBar.tsx
- src/components/HeadlineCard.tsx
- src/components/HeadlineList.tsx
- src/components/SentimentBadge.tsx
- src/components/MarketOutlook.tsx
- src/app/api/news/route.ts
- src/app/api/sentiment/route.ts

What it does: Takes a free-text query, fetches headlines from NewsAPI, sends them
to Gemini for per-headline bullish/bearish/neutral classification, displays results.
No price data. No divergence. Not the product anymore.

---

## Phase 2 — Core Divergence Engine ✅ COMPLETE (one known bug — see below)

The real product. Single unified API route, divergence math, results page.

Files:
- src/app/page.tsx — landing page
- src/app/signal/page.tsx — results page
- src/app/api/analyze/route.ts — unified analysis route
- src/lib/gemini.ts — Gemini sentiment analysis
- src/lib/normalize.ts — price normalization + sentiment score math
- src/lib/divergence.ts — signal threshold mapping
- src/lib/yahoofinance.ts — historical price data
- src/lib/newsApi.ts — headline fetching
- src/types/index.ts — shared TypeScript types

What it does:
1. User enters ticker or company name + selects timeframe (7/30/90 days)
2. /api/analyze fetches headlines + prices in parallel
3. Gemini analyzes headline sentiment → bullish%, bearish%, neutral%, insight
4. Backend computes sentimentScore = (bullish - bearish + 100) / 2
5. Backend computes normalizedPrice = clamp(50 + priceChangePercent * 2, 0, 100)
6. divergenceScore = sentimentScore - normalizedPrice
7. Signal mapped from divergenceScore thresholds:
   - > +30  → Overconfidence (red #ef4444)
   - +10 to +30 → Mild Optimism (orange #f97316)
   - -10 to +10 → Aligned (green #00ff88)
   - -10 to -30 → Mild Pessimism (orange #f97316)
   - < -30  → Hidden Strength (cyan #00e5ff)
8. Results page shows: 4 metric cards, dual-line chart, sentiment bar,
   analysis paragraph, collapsible headlines, ticker tape

Known bug: Gemini prompt does not enforce real variance — returns near-equal
bullish/bearish splits causing divergenceScore to collapse to ~0 for most stocks.
Fix: tighten Gemini prompt to penalize balanced splits and demand honest analysis.

---

## Phase 3 — Google Trends + Entry/Exit Signal ✅ COMPLETE (one known bug — see below)

Adds public search interest as a third data layer and a composite entry/exit signal.

What was added on top of Phase 2:
- Google Trends fetch via google-trends-api npm package (no API key needed)
- trendScore (0-100), trendDirection (Rising/Falling/Stable), trendData[] added
  to API response
- 5th metric card: SEARCH TREND with direction arrow
- Chart upgraded from dual-line to triple-line (adds orange Search Trend line)
- Entry/Exit panel below metric cards — composite signal from:
    signal + trendDirection + priceChangePercent
  Maps to: ENTRY / EXIT / WATCH / HOLD badge with one-line explanation
- Gemini insight prompt updated to reference trend data
- Disclaimer: "Quantitative analysis only. Not financial advice."
- Graceful fallback: if Trends fetch fails, hide 5th card and use dual-line chart

Known bug: Entry/Exit logic fires HOLD for almost every stock because
divergenceScore ≈ 0 (same root cause as Phase 2 bug). Once Gemini prompt is
fixed, real divergence will flow through and the logic will work correctly.
Fix: also widen the ENTRY/EXIT/WATCH conditions slightly (see Phase 2 bug fix).

---

## Phase 4 — UI Polish & Design System ❌ NOT STARTED

Do not implement any of these until explicitly instructed.

Design spec:
- Background: #060608, Surfaces: #0d0d12, Borders: #1c1c26
- Cyan: #00e5ff, Purple: #7c3aed, Green: #00ff88, Red: #ef4444, Orange: #f97316
- Text: #e8e8f0, Muted: #4a4a6a
- Fonts via Google Fonts: DM Serif Display (logo/headings), DM Mono (numbers/labels),
  Outfit (body/tooltips)
- Inline styles only — no Tailwind, no CSS modules

Animations:
- Animated CSS grid in background (keyframe pulse on grid lines, low opacity)
- Metric card numbers: glow on mount (text-shadow + box-shadow in signal color)
- Cards: fade + slide up on mount, staggered 80ms per card
- Chart lines: draw-in animation (Recharts animationDuration={1200})
- Sentiment bar: width animates from 0 to final value on mount (CSS transition 600ms)

Tooltip system:
- Every metric card has a ⓘ icon top-right
- Hover → tooltip fades in (200ms), max-width 260px
- Background #1c1c26, border #2a2a3a, Outfit 13px, color #a0a0b8
- Pure inline CSS + onMouseEnter/onMouseLeave state, no library

Mobile:
- Fully responsive at 375px and above
- Cards stack to 2-column grid on mobile, single column below 480px
- Chart scrollable horizontally on mobile

---

## Phase 5 — Advanced UX ❌ NOT STARTED

Do not implement any of these until explicitly instructed.

Features:
- Live autocomplete dropdown on ticker input (company name + ticker + exchange)
  as user types — debounced 300ms, uses yahoo-finance2 search on a GET /api/search
  endpoint, shows top 5 results
- Timeframe button tooltips on hover: "Analyzes the last 7 days of headlines and
  price data"
- Exchange badge next to company name in results header (NYSE, NASDAQ, NSE etc.)
- Error states with helpful copy:
  - Invalid ticker → "We couldn't find a stock with that ticker. Try 'AAPL' or 'Apple'."
  - No news → "No recent headlines found for [ticker]. Try a larger timeframe."
  - Rate limited → "Too many requests. Please wait a moment and try again."
  - API failure → "Analysis unavailable right now. Check back shortly."
- Loading state: step-by-step progress messages replace the spinner
  ("Fetching headlines..." → "Analyzing sentiment..." → "Pulling price data..." →
  "Computing divergence..." → "Done")
- First-visit empty state on landing page with brief explainer of what Markora does

---

## Design Constraints (apply to ALL phases)

- Inline styles only. No Tailwind. No CSS modules. No styled-components.
- No auth, no database, no user accounts.
- All analysis is stateless and per-request.
- Recent searches stored in localStorage only (max 5).
- Never mention Gemini, Google, AI, or any underlying model in UI-facing copy.
- All outputs labeled "Analysis". The product has its own identity.
- Environment variables: GEMINI_API_KEY, NEWS_API_KEY (no others needed through Phase 5)

---

## How to Use This File

When given a task, check which phase it belongs to.
- If the phase is ✅ COMPLETE — only fix bugs or make targeted changes to that phase.
- If the phase is ❌ NOT STARTED — do not touch it unless the prompt explicitly says
  "implement Phase N".
- If a bug fix in an earlier phase will unblock a later phase, fix the bug but do
  not implement the later phase's other features.
