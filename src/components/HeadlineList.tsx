import { Headline } from '@/types';
import HeadlineCard from './HeadlineCard';

interface HeadlineListProps {
  headlines: Headline[];
}

export default function HeadlineList({ headlines }: HeadlineListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {headlines.map((headline, i) => (
        <HeadlineCard key={`${headline.url}-${i}`} headline={headline} />
      ))}
    </div>
  );
}
