import { Headline } from '@/types';
import HeadlineCard from './HeadlineCard';
import { C } from '@/lib/designTokens';

interface HeadlineListProps {
  headlines: Headline[];
}

export default function HeadlineList({ headlines }: HeadlineListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.BORDER_FAINT }}>
      {headlines.map((headline, i) => (
        <HeadlineCard key={`${headline.url}-${i}`} headline={headline} />
      ))}
    </div>
  );
}
