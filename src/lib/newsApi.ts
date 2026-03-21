interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{ title: string | null }>;
}

/**
 * Fetches up to 30 recent news headlines for the given company name using NewsAPI.
 * Returns only the article titles as plain strings.
 */
export async function fetchHeadlines(
  companyName: string,
  timeframe: number
): Promise<string[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error('NEWS_API_KEY is not configured');

  // The free NewsAPI plan permits articles up to ~1 month old.
  // Omitting `from` lets NewsAPI use its default window, avoiding off-by-one
  // 426 errors at the plan boundary. We rely on sortBy=relevancy to surface
  // the most pertinent recent articles for the given company.
  const url =
    `https://newsapi.org/v2/everything` +
    `?q=${encodeURIComponent(companyName)}` +
    `&pageSize=30` +
    `&language=en` +
    `&sortBy=relevancy`;

  // Pass key via header; disable Next.js caching so every request is live.
  const response = await fetch(url, {
    headers: {
      'X-Api-Key': apiKey,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`NewsAPI request failed with status ${response.status}`);
  }

  const data = (await response.json()) as NewsAPIResponse;

  const headlines = data.articles
    .map((a) => a.title)
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

  if (headlines.length === 0) {
    throw new Error(`NO_NEWS: No recent news found for ${companyName}`);
  }

  return headlines;
}
