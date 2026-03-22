import { GoogleGenerativeAI } from '@google/generative-ai';

interface NewsdataResponse {
  status: string;
  results: Array<{ title: string | null; description: string | null }>;
}

interface GeminiRelevanceJSON {
  relevant: number[];
}

/**
 * Parses Google News RSS XML and extracts titles.
 * Google News RSS returns standard RSS XML with <item><title>...</title></item>
 */
function parseTitlesFromRSS(xml: string): string[] {
  const titles: string[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const titleMatch = itemMatch[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    if (titleMatch) {
      let title = (titleMatch[1] ?? titleMatch[2] ?? '').trim();
      // Google News appends " - Source Name" to titles — strip it
      const dashIndex = title.lastIndexOf(' - ');
      if (dashIndex > 20) {
        title = title.slice(0, dashIndex).trim();
      }
      if (title.length > 10) {
        titles.push(title);
      }
    }
  }
  return titles;
}

/**
 * Source 1: Google News RSS — free, no API key, supports time ranges.
 * Returns up to ~100 headlines. Supports `when:7d`, `when:30d`, etc.
 */
async function fetchFromGoogleNewsRSS(companyName: string, timeframeDays: number): Promise<string[]> {
  try {
    const whenParam = `${timeframeDays}d`;
    const query = encodeURIComponent(`"${companyName}" when:${whenParam}`);
    const url = `https://news.google.com/rss/search?q=${query}&ceid=US:en&hl=en-US&gl=US`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Markora/1.0)',
      },
    });

    if (!response.ok) return [];

    const xml = await response.text();
    return parseTitlesFromRSS(xml);
  } catch {
    return [];
  }
}

/**
 * Source 2: newsdata.io — free tier, max 10 articles, last 48 hours only.
 * Used as fallback when Google News RSS returns too few results.
 */
async function fetchFromNewsdata(companyName: string): Promise<{ title: string; description: string }[]> {
  try {
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) return [];

    const url = new URL('https://newsdata.io/api/1/latest');
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('q', companyName);
    url.searchParams.set('language', 'en');
    url.searchParams.set('size', '10');
    url.searchParams.set('timeframe', '48');

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) return [];

    const data = (await response.json()) as NewsdataResponse;
    if (data.status !== 'success') return [];

    return (data.results ?? [])
      .filter((a) => typeof a.title === 'string' && a.title.trim().length > 0)
      .map((a) => ({
        title: a.title as string,
        description: typeof a.description === 'string' ? a.description : '',
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
 * 1. Fetch from Google News RSS (primary — free, large volume, supports timeframe)
 * 2. Fetch from newsdata.io (secondary — smaller volume but different sources)
 * 3. Merge, deduplicate, and cap at 30
 * 4. Run Gemini relevance gate to filter out noise
 */
export async function fetchHeadlines(
  companyName: string,
  _timeframe: number
): Promise<string[]> {
  // ── Step 1: Fetch from multiple sources in parallel ───────────────────────
  const [googleTitles, newsdataArticles] = await Promise.all([
    fetchFromGoogleNewsRSS(companyName, _timeframe),
    fetchFromNewsdata(companyName),
  ]);

  const newsdataTitles = newsdataArticles.map((a) => a.title);

  // Merge: Google News first (higher volume), then newsdata
  const allTitles = [...googleTitles, ...newsdataTitles];

  // Deduplicate across sources
  const deduplicated = deduplicateTitles(allTitles);

  if (deduplicated.length === 0) {
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
    for (const a of newsdataArticles) {
      if (a.description) descriptionMap.set(a.title, a.description.trim().slice(0, 120));
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
