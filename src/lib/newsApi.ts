import { GoogleGenerativeAI } from '@google/generative-ai';

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{ title: string | null; description: string | null }>;
}

interface GeminiRelevanceJSON {
  relevant: number[];
}

/**
 * Fetches relevant news headlines for a company using a two-step approach:
 * 1. Broad NewsAPI fetch using exact phrase matching
 * 2. Gemini relevance gate to filter articles primarily about the company
 */
export async function fetchHeadlines(
  companyName: string,
  // timeframe is not used in the query — NewsAPI free tier does not support
  // reliable date filtering; relevancy sort surfaces recent articles naturally
  _timeframe: number
): Promise<string[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error('NEWS_API_KEY is not configured');

  // ── Step 1: Broad NewsAPI fetch ───────────────────────────────────────────
  const url =
    `https://newsapi.org/v2/everything` +
    `?q=${encodeURIComponent(`"${companyName}"`)}` +
    `&pageSize=60` +
    `&language=en` +
    `&sortBy=relevancy`;

  const response = await fetch(url, {
    headers: { 'X-Api-Key': apiKey },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`NewsAPI request failed with status ${response.status}`);
  }

  const data = (await response.json()) as NewsAPIResponse;

  const candidates = data.articles
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
