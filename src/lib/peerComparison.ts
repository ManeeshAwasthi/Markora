import YahooFinance from 'yahoo-finance2';
import { ResolvedCompany, PeerComparison, PeerSnapshot } from '@/types';
import { getCurrencyForExchange, isIndianExchange } from './resolveTicker';

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
  resolved: ResolvedCompany,
  timeframe: number
): Promise<PeerComparison> {
  try {
    const { ticker: targetTicker, currency: targetCurrency, currencySymbol: targetCurrencySymbol } = resolved;
    const targetIsIndian = isIndianExchange(resolved.exchange);

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
      exchange?: string;
    }>;

    // Filter to same market type:
    // - Indian stocks: only NSE/BSE peers
    // - Non-Indian stocks: exclude NSE/BSE peers
    // - Only include peers whose currency matches target currency
    const filteredCandidates = candidates.filter((c) => {
      if (c.quoteType !== 'EQUITY' || !c.symbol || c.symbol === targetTicker) return false;
      const peerIsIndian = isIndianExchange(c.exchange);
      if (targetIsIndian !== peerIsIndian) return false;
      const peerCurrency = getCurrencyForExchange(c.exchange).currency;
      return peerCurrency === targetCurrency;
    });

    const peerTickers = filteredCandidates.slice(0, 3);

    if (peerTickers.length === 0) return FALLBACK;

    // ── For each peer fetch price change and P/E in parallel ─────────────────
    const peerResults = await Promise.all(
      peerTickers.map(async (peer): Promise<PeerSnapshot | null> => {
        try {
          let peerTicker = peer.symbol!;
          const peerExchange = peer.exchange;
          const peerName = peer.longname ?? peer.shortname ?? peerTicker;

          // Ensure correct suffix for Indian peers
          if (peerExchange === 'NSE' && !peerTicker.endsWith('.NS')) peerTicker = `${peerTicker}.NS`;
          if (peerExchange === 'BSE' && !peerTicker.endsWith('.BO')) peerTicker = `${peerTicker}.BO`;

          const peerCurrencySymbol = getCurrencyForExchange(peerExchange).currencySymbol;

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
            currencySymbol: peerCurrencySymbol || targetCurrencySymbol,
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
