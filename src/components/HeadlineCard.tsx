'use client';

import { useState } from 'react';
import { Headline } from '@/types';
import SentimentBadge from './SentimentBadge';

interface HeadlineCardProps {
  headline: Headline;
}

export default function HeadlineCard({ headline }: HeadlineCardProps) {
  const [hovered, setHovered] = useState(false);

  const formatted = new Date(headline.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111111',
        border: `1px solid ${hovered ? '#333333' : '#222222'}`,
        borderRadius: '8px',
        padding: '16px',
        transition: 'border-color 0.15s ease',
      }}
    >
      <a
        href={headline.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '0.95rem',
          fontWeight: 500,
          lineHeight: 1.4,
          display: 'block',
          marginBottom: '10px',
        }}
      >
        {headline.title}
      </a>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: '#555555', fontSize: '0.78rem' }}>{headline.source}</span>
        <span style={{ color: '#444444', fontSize: '0.78rem' }}>{formatted}</span>
        <SentimentBadge sentiment={headline.sentiment} />
      </div>
    </div>
  );
}
