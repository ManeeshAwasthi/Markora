'use client';

import { useState } from 'react';
import { Headline } from '@/types';
import SentimentBadge from './SentimentBadge';
import { C, T } from '@/lib/designTokens';

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
        background: C.SURFACE,
        border: `1px solid ${hovered ? C.BORDER : C.BORDER_FAINT}`,
        padding: '16px',
        transition: 'border-color 0.15s ease',
      }}
    >
      <a
        href={headline.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: C.TEXT,
          textDecoration: 'none',
          fontFamily: T.BODY,
          fontSize: '14px',
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
        <span style={{ color: C.TEXT2, fontFamily: T.MONO, fontSize: '11px' }}>{headline.source}</span>
        <span style={{ color: C.TEXT3, fontFamily: T.MONO, fontSize: '11px' }}>{formatted}</span>
        <SentimentBadge sentiment={headline.sentiment} />
      </div>
    </div>
  );
}
