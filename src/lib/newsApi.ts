import { GoogleGenerativeAI } from '@google/generative-ai';

interface FinnhubNewsItem {
  headline: string;
  summary?: string;
}

interface MarketauxNewsItem {
  title: string;
  description?: string;
}

interface MarketauxResponse {
  data: MarketauxNewsItem[];
}

interface GeminiRelevanceJSON {
  relevant: number[];
}

/**
 * Source 1: Finnhub /company-news — keyed on ticker + date range.
 * Works reliably from Vercel serverless IPs.
 */
async function fetchFromFinnhub(
  ticker: string,
  timeframeDays: number
): Promise<{ title: string; description: string }[]> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];

    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - timeframeDays);

    const toStr = to.toISOString().slice(0, 10);
    const fromStr = from.toISOString().slice(0, 10);

    const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${fromStr}&to=${toStr}&token=${apiKey}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];

    const data = (await response.json()) as FinnhubNewsItem[];
    if (!Array.isArray(data)) return [];

    return data
      .filter((a) => typeof a.headline === 'string' && a.headline.trim().length > 10)
      .slice(0, 50)
      .map((a) => ({
        title: a.headline.trim(),
        description: typeof a.summary === 'string' ? a.summary.trim().slice(0, 120) : '',
      }));
  } catch {
    return [];
  }
}

/**
 * Source 2: Marketaux /v1/news/all — keyed on company name.
 * Fallback when Finnhub returns too few results.
 */
async function fetchFromMarketaux(
  companyName: string,
  timeframeDays: number
): Promise<{ title: string; description: string }[]> {
  try {
    const apiKey = process.env.MARKETAUX_API_KEY;
    if (!apiKey) return [];

    const publishedAfter = new Date();
    publishedAfter.setDate(publishedAfter.getDate() - timeframeDays);
    const publishedAfterStr = publishedAfter.toISOString().slice(0, 10);

    const url = new URL('https://api.marketaux.com/v1/news/all');
    url.searchParams.set('api_token', apiKey);
    url.searchParams.set('search', companyName);
    url.searchParams.set('language', 'en');
    url.searchParams.set('limit', '30');
    url.searchParams.set('published_after', publishedAfterStr);

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) return [];

    const data = (await response.json()) as MarketauxResponse;
    if (!Array.isArray(data?.data)) return [];

    return data.data
      .filter((a) => typeof a.title === 'string' && a.title.trim().length > 10)
      .map((a) => ({
        title: a.title.trim(),
        description: typeof a.description === 'string' ? a.description.trim().slice(0, 120) : '',
      }));
  } catch {
    return [];
  }
}

/**
 * Deduplicates headlines by checking for substantial overlap.
 */
function deduplicateTitles(titles: string[]): string[] {
  const unique: string[] = [];
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  for (const title of titles) {
    const words = new Set(normalize(title));
    const isDuplicate = unique.some((existing) => {
      const existingWords = new Set(normalize(existing));
      const intersection = Array.from(words).filter((w) => existingWords.has(w));
      const smaller = Math.min(words.size, existingWords.size);
      return smaller > 0 && intersection.length / smaller > 0.6;
    });
    if (!isDuplicate) {
      unique.push(title);
    }
  }
  return unique;
}

/**
 * Main headline fetching function — multi-source aggregation.
 *
 * Strategy:
 * 1. Fetch from Finnhub (primary — ticker-based, reliable on serverless)
 * 2. Fetch from Marketaux (fallback — name-based, different sources)
 * 3. Merge, deduplicate, and cap at 30
 * 4. Run Gemini relevance gate to filter out noise
 */
export async function fetchHeadlines(
  companyName: string,
  timeframe: number,
  ticker?: string
): Promise<string[]> {
  // ── Step 1: Fetch from multiple sources in parallel ───────────────────────
  const [finnhubArticles, marketauxArticles] = await Promise.all([
    ticker ? fetchFromFinnhub(ticker, timeframe) : Promise.resolve([]),
    fetchFromMarketaux(companyName, timeframe),
  ]);

  const allArticles = [...finnhubArticles, ...marketauxArticles];
  const allTitles = allArticles.map((a) => a.title);

  // Deduplicate across sources
  const deduplicated = deduplicateTitles(allTitles);

  if (deduplicated.length < 3) {
    throw new Error(`NO_NEWS: No recent news found for ${companyName}`);
  }

  // Cap at 30 for Gemini processing
  const candidates = deduplicated.slice(0, 30);

  // If we have fewer than 5, skip Gemini filtering — every headline matters
  if (candidates.length < 5) {
    return candidates;
  }

  // ── Step 2: Gemini relevance gate ─────────────────────────────────────────
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('no key');

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const descriptionMap = new Map<string, string>();
    for (const a of allArticles) {
      if (a.description) descriptionMap.set(a.title, a.description);
    }

    const numberedList = candidates
      .map((title, i) => {
        const desc = descriptionMap.get(title) ?? '';
        return `${i + 1}. ${title}${desc ? ` — ${desc}` : ''}`;
      })
      .join('\n');

    const prompt = `You are a financial news filter. Below is a numbered list of news article summaries.

Return ONLY the 1-based indices of articles that are **primarily about** "${companyName}" — covering its operations, financials, management, products, or stock performance.

Exclude any article where "${companyName}" is:
- mentioned only in passing or incidentally
- listed among many other companies
- used as a generic word unrelated to the company

Return exactly this JSON object and nothing else — no markdown, no explanation:
{ "relevant": [1, 4, 7] }

Articles:
${numberedList}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleaned) as GeminiRelevanceJSON;

    if (!Array.isArray(parsed.relevant) || parsed.relevant.length < 3) {
      return candidates;
    }

    const filtered = parsed.relevant
      .filter((idx) => typeof idx === 'number' && idx >= 1 && idx <= candidates.length)
      .map((idx) => candidates[idx - 1])
      .slice(0, 30);

    return filtered.length >= 3 ? filtered : candidates;
  } catch {
    return candidates;
  }
}
