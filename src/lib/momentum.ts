import YahooFinance from 'yahoo-finance2';
import { resolveTickerFromName } from './resolveTicker';
import { MomentumFlow } from '@/types';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

type MomentumRaw = {
  majorHoldersBreakdown?: {
    institutionsPercentHeld?: number | null;
  } | null;
  insiderTransactions?: {
    transactions?: Array<{
      startDate?: Date | string | null;
      transactionDate?: Date | string | null;
      typesDisplay?: string | null;
      transactionType?: string | null;
    }> | null;
  } | null;
  defaultKeyStatistics?: {
    shortPercentOfFloat?: number | null;
    shortRatio?: number | null;
  } | null;
};

const FALLBACK: MomentumFlow = {
  institutionalOwnershipPercent: null,
  insiderBuys: 0,
  insiderSells: 0,
  insiderSentiment: 'Neutral',
  shortPercentOfFloat: null,
  shortRatio: null,
  shortLabel: 'Normal',
};

function isBuy(type: string | null | undefined): boolean {
  if (!type) return false;
  const t = type.toLowerCase();
  return t.includes('purchase') || t.includes('buy') || t === 'p';
}

function isSell(type: string | null | undefined): boolean {
  if (!type) return false;
  const t = type.toLowerCase();
  return t.includes('sale') || t.includes('sell') || t === 's';
}

export async function fetchMomentumAndFlow(companyName: string): Promise<MomentumFlow> {
  try {
    const ticker = await resolveTickerFromName(companyName);

    const raw = await (yahooFinance as any).quoteSummary(
      ticker,
      { modules: ['majorHoldersBreakdown', 'insiderTransactions', 'defaultKeyStatistics'] },
      { validateResult: false }
    ) as MomentumRaw;

    // ── Institutional ownership ───────────────────────────────────────────────
    const institutionsRaw = raw.majorHoldersBreakdown?.institutionsPercentHeld;
    const institutionalOwnershipPercent =
      institutionsRaw !== null && institutionsRaw !== undefined && isFinite(institutionsRaw)
        ? Math.round(institutionsRaw * 10000) / 100  // convert 0.xx to xx.xx%
        : null;

    // ── Insider transactions (last 90 days) ───────────────────────────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const transactions = raw.insiderTransactions?.transactions ?? [];
    let insiderBuys = 0;
    let insiderSells = 0;

    for (const tx of transactions) {
      const txDate = tx.startDate ?? tx.transactionDate;
      if (txDate && new Date(txDate) < cutoff) continue;
      const typeStr = tx.typesDisplay ?? tx.transactionType;
      if (isBuy(typeStr)) insiderBuys++;
      else if (isSell(typeStr)) insiderSells++;
    }

    const insiderSentiment: MomentumFlow['insiderSentiment'] =
      insiderBuys > insiderSells ? 'Buying' : insiderSells > insiderBuys ? 'Selling' : 'Neutral';

    // ── Short interest ────────────────────────────────────────────────────────
    const spofRaw = raw.defaultKeyStatistics?.shortPercentOfFloat;
    const shortPercentOfFloat =
      spofRaw !== null && spofRaw !== undefined && isFinite(spofRaw) ? spofRaw : null;

    const srRaw = raw.defaultKeyStatistics?.shortRatio;
    const shortRatio =
      srRaw !== null && srRaw !== undefined && isFinite(srRaw) ? srRaw : null;

    let shortLabel: MomentumFlow['shortLabel'] = 'Normal';
    if (shortPercentOfFloat !== null) {
      if (shortPercentOfFloat > 0.2) shortLabel = 'High';
      else if (shortPercentOfFloat > 0.1) shortLabel = 'Elevated';
    }

    return {
      institutionalOwnershipPercent,
      insiderBuys,
      insiderSells,
      insiderSentiment,
      shortPercentOfFloat,
      shortRatio,
      shortLabel,
    };
  } catch {
    return FALLBACK;
  }
}
