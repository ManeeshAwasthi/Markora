'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LegacySentimentResult as SentimentResult } from '@/types';
import SearchBar from './SearchBar';
import SentimentBadge from './SentimentBadge';
import MarketOutlook from './MarketOutlook';
import HeadlineList from './HeadlineList';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SentimentResult | null>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Fetch headlines from NewsAPI
      const newsRes = await fetch(`/api/news?query=${encodeURIComponent(query)}`);
      if (!newsRes.ok) {
        const err = await newsRes.json();
        throw new Error(err.error ?? 'Failed to fetch news');
      }
      const rawHeadlines: { title: string; url: string; source: string; publishedAt: string }[] =
        await newsRes.json();

      if (rawHeadlines.length === 0) {
        throw new Error('No headlines found for this query.');
      }

      // Step 2: Extract titles for sentiment analysis
      const titles = rawHeadlines.map((h) => h.title);

      // Step 3: POST to sentiment API
      const sentimentRes = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ headlines: titles }),
      });
      if (!sentimentRes.ok) {
        const err = await sentimentRes.json();
        throw new Error(err.error ?? 'Failed to analyze sentiment');
      }
      const sentimentData: {
        overall: 'bullish' | 'bearish' | 'neutral';
        headlineSentiments: ('bullish' | 'bearish' | 'neutral')[];
        outlook: string;
      } = await sentimentRes.json();

      // Step 4: Merge sentiment back into headline objects
      const headlines = rawHeadlines.map((h, i) => ({
        ...h,
        sentiment: sentimentData.headlineSentiments[i] ?? 'neutral',
      }));

      setResult({
        overall: sentimentData.overall,
        headlines,
        outlook: sentimentData.outlook,
        analyzedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '860px',
        margin: '0 auto',
        padding: '48px 24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            Markora
          </h1>
          <p style={{ color: '#555555', fontSize: '0.9rem' }}>
            Financial news sentiment analyzer
          </p>
        </div>
        <Link
          href="/signal"
          style={{
            background: '#00ff8811',
            color: '#00ff88',
            border: '1px solid #00ff8833',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Signal Board →
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '40px' }}>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px 0',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #222222',
              borderTop: '3px solid #00ff88',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: '#1a0000',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            padding: '16px',
            color: '#ff4444',
            fontSize: '0.9rem',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Overall sentiment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#888888', fontSize: '0.85rem' }}>Overall market sentiment:</span>
            <SentimentBadge sentiment={result.overall} />
            <span style={{ color: '#444444', fontSize: '0.78rem', marginLeft: 'auto' }}>
              {new Date(result.analyzedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Market outlook */}
          <MarketOutlook outlook={result.outlook} overall={result.overall} />

          {/* Headlines */}
          <div>
            <p
              style={{
                color: '#555555',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              Headlines ({result.headlines.length})
            </p>
            <HeadlineList headlines={result.headlines} />
          </div>
        </div>
      )}
    </div>
  );
}
