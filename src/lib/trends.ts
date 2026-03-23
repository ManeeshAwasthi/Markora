import { TrendDirection } from '@/types';

export interface TrendResult {
  trendScore: number;
  trendDirection: TrendDirection;
  trendData: Array<{ date: string; value: number }>;
}

/**
 * Google Trends scraper is blocked on Vercel serverless IPs.
 * Return neutral defaults immediately to avoid crashes.
 */
export async function fetchTrends(
  _companyName: string,
  _timeframe: number
): Promise<TrendResult> {
  return neutral();
}

function neutral(): TrendResult {
  return { trendScore: 50, trendDirection: 'Stable', trendData: [] };
}
