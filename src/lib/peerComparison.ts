import YahooFinance from 'yahoo-finance2';
import { resolveTickerFromName } from './resolveTicker';
import { PeerComparison, PeerSnapshot } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

const FALLBACK: PeerComparison = { peers: [] };

async function getPriceChangePercent(
  ticker: string,
  period1: Date,
  period2: Date
): Promise<number> {
  const result = await yahooFinance.chart(ticker, { period1, period2, interval: '1d' });
  const quotes = (result.quotes ?? []) as Array<{ close: number | null }>;
  const valid = quotes
    .filter((q): q is { close: number } => q.close !== null)
    .map((q) => q.close);
  if (valid.length < 2) return 0;
  return ((valid[valid.length - 1] - valid[0]) / valid[0]) * 100;
}

export async function fetchPeerComparison(
  companyName: string,
  timeframe: number
): Promise<PeerComparison> {
  try {
    const targetTicker = await resolveTickerFromName(companyName);

    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period1.getDate() - timeframe);

    // ── Get target price change and industry in parallel ──────────────────────
    const [targetPriceChange, assetRaw] = await Promise.all([
      getPriceChangePercent(targetTicker, period1, period2),
      (yahooFinance as any).quoteSummary(
        targetTicker,
        { modules: ['assetProfile'] },
        { validateResult: false }
      ) as Promise<{ assetProfile?: { industry?: string | null } | null }>,
    ]);

    const industry = assetRaw.assetProfile?.industry ?? null;
    if (!industry) return FALLBACK;

    // ── Search for companies in the same industry ─────────────────────────────
    const searchRaw = await yahooFinance.search(industry, {}, { validateResult: false });
    const candidates = ((searchRaw as { quotes?: unknown[] }).quotes ?? []) as Array<{
      symbol?: string;
      longname?: string;
      shortname?: string;
      quoteType?: string;
    }>;

    const peerTickers = candidates
      .filter((c) => c.quoteType === 'EQUITY' && c.symbol && c.symbol !== targetTicker)
      .slice(0, 3);

    if (peerTickers.length === 0) return FALLBACK;

    // ── For each peer fetch price change and P/E in parallel ─────────────────
    const peerResults = await Promise.all(
      peerTickers.map(async (peer): Promise<PeerSnapshot | null> => {
        try {
          const peerTicker = peer.symbol!;
          const peerName = peer.longname ?? peer.shortname ?? peerTicker;

          const [peerPriceChange, peerSummaryRaw] = await Promise.all([
            getPriceChangePercent(peerTicker, period1, period2),
            (yahooFinance as any).quoteSummary(
              peerTicker,
              { modules: ['summaryDetail'] },
              { validateResult: false }
            ) as Promise<{ summaryDetail?: { trailingPE?: number | null } | null }>,
          ]);

          const peRaw = peerSummaryRaw.summaryDetail?.trailingPE;
          const peRatio =
            peRaw !== null && peRaw !== undefined && isFinite(peRaw)
              ? Math.round(peRaw * 100) / 100
              : null;

          return {
            companyName: peerName,
            priceChangePercent: Math.round(peerPriceChange * 100) / 100,
            peRatio,
            relativeStrength: Math.round((peerPriceChange - targetPriceChange) * 100) / 100,
          };
        } catch {
          return null;
        }
      })
    );

    return {
      peers: peerResults.filter((p): p is PeerSnapshot => p !== null),
    };
  } catch {
    return FALLBACK;
  }
}
