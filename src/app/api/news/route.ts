import { NextRequest, NextResponse } from 'next/server';
import { NewsAPIArticle } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NEWS_API_KEY is not configured' }, { status: 500 });
    }

    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', query);
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('language', 'en');
    url.searchParams.set('pageSize', '10');

    const response = await fetch(url.toString(), {
      headers: { 'X-Api-Key': apiKey },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `NewsAPI returned ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    const headlines = (data.articles as NewsAPIArticle[]).map((article) => ({
      title: article.title,
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
    }));

    return NextResponse.json(headlines);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
