import googleTrends from 'google-trends-api';
import { TrendDirection } from '@/types';

export interface TrendResult {
  trendScore: number;
  trendDirection: TrendDirection;
  trendData: Array<{ date: string; value: number }>;
}

interface TimelineItem {
  time?: string;
  formattedTime?: string;
  value: number[];
}

/**
 * Fetches Google Trends interest-over-time data for a company name.
 * Normalises the peak index to 0–100 and computes a trend direction.
 * Gracefully returns neutral defaults if Google blocks the request
 * (common in serverless environments).
 */
export async function fetchTrends(
  companyName: string,
  timeframe: number
): Promise<TrendResult> {
  const endTime = new Date();
  const startTime = new Date();
  startTime.setDate(endTime.getDate() - timeframe);

  try {
    const rawJson = await googleTrends.interestOverTime({
      keyword: companyName,
      startTime,
      endTime,
      granularTimeResolution: true,
    });

    const parsed = JSON.parse(rawJson) as {
      default?: { timelineData?: TimelineItem[] };
    };

    const timeline: TimelineItem[] = parsed?.default?.timelineData ?? [];

    if (timeline.length === 0) {
      return neutral();
    }

    const trendData = timeline.map((item) => ({
      date: item.time
        ? new Date(parseInt(item.time) * 1000).toISOString().slice(0, 10)
        : (item.formattedTime ?? ''),
      value: item.value[0] ?? 0,
    }));

    const values = trendData.map((d) => d.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const lastValue = values[values.length - 1];

    let trendDirection: TrendDirection;
    if (lastValue > average * 1.1) trendDirection = 'Rising';
    else if (lastValue < average * 0.9) trendDirection = 'Falling';
    else trendDirection = 'Stable';

    return {
      trendScore: Math.round(average),
      trendDirection,
      trendData,
    };
  } catch {
    return neutral();
  }
}

function neutral(): TrendResult {
  return { trendScore: 50, trendDirection: 'Stable', trendData: [] };
}
