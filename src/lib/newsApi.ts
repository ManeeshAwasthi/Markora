interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{ title: string | null }>;
}

// Financial/business context terms. An article must mention the company name
// AND at least one of these to be considered relevant. This prevents generic
// words like "eternal" from matching unrelated lifestyle/culture articles.
const FINANCIAL_CONTEXT =
  'stock OR shares OR market OR earnings OR revenue OR profit OR quarterly OR ' +
  'investor OR IPO OR merger OR acquisition OR CEO OR sales OR valuation OR dividend';

async function fetchFromNewsAPI(apiKey: string, query: string): Promise<string[]> {
  const url =
    `https://newsapi.org/v2/everything` +
    `?q=${encodeURIComponent(query)}` +
    `&pageSize=30` +
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

  return data.articles
    .map((a) => a.title)
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
}

/**
 * Fetches up to 30 recent news headlines for the given company name using NewsAPI.
 *
 * Strategy:
 * 1. Primary query: "CompanyName" AND (financial context terms)
 *    — This prevents generic words like "eternal" or "general" from matching
 *      unrelated articles where the word appears in the body.
 * 2. Fallback query: "CompanyName" (exact phrase, no context filter)
 *    — Used when the primary query returns too few results (niche companies
 *      or those rarely covered with standard financial vocabulary).
 */
export async function fetchHeadlines(
  companyName: string,
  timeframe: number
): Promise<string[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error('NEWS_API_KEY is not configured');

  // Primary: exact company name + financial context
  const primaryQuery = `"${companyName}" AND (${FINANCIAL_CONTEXT})`;
  const primary = await fetchFromNewsAPI(apiKey, primaryQuery);

  if (primary.length >= 5) return primary;

  // Fallback: exact phrase only, no context filter
  const fallback = await fetchFromNewsAPI(apiKey, `"${companyName}"`);
  const headlines = fallback.length > 0 ? fallback : primary;

  if (headlines.length === 0) {
    throw new Error(`NO_NEWS: No recent news found for ${companyName}`);
  }

  return headlines;
}
