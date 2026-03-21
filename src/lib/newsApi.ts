interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{ title: string | null }>;
}

// Words that appear in company names but are too generic to filter on
const COMPANY_SUFFIX_STOPWORDS = new Set([
  'ltd', 'limited', 'inc', 'corp', 'corporation', 'co', 'company',
  'group', 'holdings', 'holding', 'industries', 'industry',
  'the', 'and', 'of', 'for', 'in',
]);

/**
 * Extracts the meaningful keywords from a company name for headline filtering.
 * e.g. "Eternal Limited" → ["eternal"]
 *      "State Bank of India" → ["state", "bank", "india"]
 *      "Apple Inc" → ["apple"]
 */
function significantWords(companyName: string): string[] {
  return companyName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !COMPANY_SUFFIX_STOPWORDS.has(w));
}

/**
 * Fetches up to 30 recent news headlines for the given company name using NewsAPI.
 * Searches titles only to avoid body-match noise (e.g. "eternal" in unrelated articles).
 * Post-filters to drop any headline that doesn't mention a key company word.
 */
export async function fetchHeadlines(
  companyName: string,
  timeframe: number
): Promise<string[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error('NEWS_API_KEY is not configured');

  // searchIn=title ensures the company name appears in the actual headline,
  // not buried in the article body. This prevents generic words like "eternal"
  // from matching thousands of unrelated articles.
  const url =
    `https://newsapi.org/v2/everything` +
    `?q=${encodeURIComponent(companyName)}` +
    `&searchIn=title` +
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

  const allTitles = data.articles
    .map((a) => a.title)
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

  // Post-filter: keep only headlines that mention at least one significant
  // word from the company name. This is a safety net for cases where the
  // title search returns tangentially related results.
  const keywords = significantWords(companyName);
  const relevant =
    keywords.length === 0
      ? allTitles
      : allTitles.filter((h) =>
          keywords.some((kw) => h.toLowerCase().includes(kw))
        );

  // Fall back to all title-matched results if the keyword filter is too strict
  const headlines = relevant.length >= 3 ? relevant : allTitles;

  if (headlines.length === 0) {
    throw new Error(`NO_NEWS: No recent news found for ${companyName}`);
  }

  return headlines;
}
