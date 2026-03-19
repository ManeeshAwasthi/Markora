// Pure math functions — no API calls, no side effects

// 50 = max expected single-stock move in percent (a 50% move maps to extreme)
const MAX_EXPECTED_MOVE = 50;

/**
 * Maps a percentage price change to a 0–100 scale.
 * 0% → 50 (flat), +50% → 100 (max up), -50% → 0 (max down).
 */
export function normalizePriceChange(priceChangePercent: number): number {
  const raw = 50 + (priceChangePercent / MAX_EXPECTED_MOVE) * 50;
  return Math.min(100, Math.max(0, raw));
}

/**
 * Computes a 0–100 sentiment score from bullish/bearish percentages.
 * Formula: (bullish - bearish + 100) / 2
 */
export function computeSentimentScore(bullish: number, bearish: number): number {
  const raw = (bullish - bearish + 100) / 2;
  return Math.min(100, Math.max(0, raw));
}

/**
 * Divergence = sentimentScore - normalizedPrice.
 * Positive → sentiment ahead of price. Negative → price ahead of sentiment.
 * Not clamped — can be positive or negative.
 */
export function computeDivergenceScore(
  sentimentScore: number,
  normalizedPrice: number
): number {
  return Math.round((sentimentScore - normalizedPrice) * 100) / 100;
}
