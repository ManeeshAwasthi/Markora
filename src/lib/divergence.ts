import { SignalType } from '@/types';

/**
 * Maps a divergence score to a human-readable signal.
 *
 * Thresholds:
 *   > 30        → Overconfidence  (sentiment far ahead of price)
 *   10 to 30    → Mild Optimism
 *   -10 to 10   → Aligned
 *   -30 to -10  → Mild Pessimism
 *   < -30       → Hidden Strength (price far ahead of sentiment)
 */
export function getSignal(divergenceScore: number): SignalType {
  if (divergenceScore > 30) return 'Overconfidence';
  if (divergenceScore >= 10) return 'Mild Optimism';
  if (divergenceScore > -10) return 'Aligned';
  if (divergenceScore >= -30) return 'Mild Pessimism';
  return 'Hidden Strength';
}
