import { GoogleGenerativeAI } from '@google/generative-ai';

interface NewsdataResponse {
  status: string;
  results: Array<{ title: string | null; description: string | null }>;
}

interface GeminiRelevanceJSON {
  relevant: number[];
}

/**
 * Fetches relevant news headlines for a company using a two-step approach:
 * 1. newsdata.io fetch using exact phrase matching with timeframe filtering
 * 2. Gemini relevance gate to filter articles primarily about the company
 */
export async function fetchHeadlines(
  companyName: string,
  _timeframe: number
): Promise<string[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) throw new Error('NEWSDATA_API_KEY is not configured');

  // ── Step 1: newsdata.io fetch ─────────────────────────────────────────────
  const url = new URL('https://newsdata.io/api/1/news');
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('q', `"${companyName}"`);
  url.searchParams.set('language', 'en');
  url.searchParams.set('size', '10');

  // Omit from_date for 90-day timeframe — newsdata.io free tier window limit
  if (_timeframe !== 90) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - _timeframe);
    url.searchParams.set('from_date', fromDate.toISOString().slice(0, 10));
  }

  const response = await fetch(url.toString(), { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`newsdata.io request failed with status ${response.status}`);
  }

  const data = (await response.json()) as NewsdataResponse;

  if (data.status !== 'success') {
    throw new Error(`newsdata.io request failed with status ${data.status}`);
  }

  const candidates = (data.results ?? [])
    .filter((a) => typeof a.title === 'string' && a.title.trim().length > 0)
    .slice(0, 50);

  if (candidates.length === 0) {
    throw new Error(`NO_NEWS: No recent news found for ${companyName}`);
  }

  // Raw titles — used as fallback if Gemini filtering fails or over-filters
  const rawTitles = candidates
    .map((a) => a.title as string)
    .slice(0, 30);

  // ── Step 2: Gemini relevance gate ─────────────────────────────────────────
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('no key');

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const numberedList = candidates
      .map((a, i) => {
        const desc = typeof a.description === 'string'
          ? a.description.trim().slice(0, 120)
          : '';
        return `${i + 1}. ${a.title}${desc ? ` — ${desc}` : ''}`;
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

    if (
      !Array.isArray(parsed.relevant) ||
      parsed.relevant.length < 3
    ) {
      // Gemini over-filtered or returned malformed data — use raw fallback
      return rawTitles;
    }

    const filtered = parsed.relevant
      .filter((idx) => typeof idx === 'number' && idx >= 1 && idx <= candidates.length)
      .map((idx) => candidates[idx - 1].title as string)
      .slice(0, 30);

    return filtered.length >= 3 ? filtered : rawTitles;
  } catch {
    // Gemini unavailable, timed out, or returned unparseable JSON — fall back silently
    return rawTitles;
  }
}
