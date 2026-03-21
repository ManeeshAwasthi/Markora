import { NextRequest, NextResponse } from 'next/server';

interface NewsdataArticle {
  title: string | null;
  link: string | null;
  description: string | null;
  pubDate: string | null;
  source_id: string;
}

interface NewsdataResponse {
  status: string;
  results: NewsdataArticle[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NEWSDATA_API_KEY is not configured' }, { status: 500 });
    }

    const url = new URL('https://newsdata.io/api/1/news');
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('q', query);
    url.searchParams.set('language', 'en');
    url.searchParams.set('size', '10');

    const response = await fetch(url.toString(), { next: { revalidate: 0 } });

    if (!response.ok) {
      return NextResponse.json(
        { error: `newsdata.io returned ${response.status}` },
        { status: 500 }
      );
    }

    const data = (await response.json()) as NewsdataResponse;

    if (data.status !== 'success') {
      return NextResponse.json(
        { error: `newsdata.io returned status ${data.status}` },
        { status: 500 }
      );
    }

    const headlines = (data.results ?? []).map((article) => ({
      title: article.title,
      url: article.link,
      source: article.source_id,
      publishedAt: article.pubDate,
    }));

    return NextResponse.json(headlines);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
