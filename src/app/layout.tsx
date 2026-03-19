import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Mono, Outfit } from 'next/font/google';
import './globals.css';

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Markora — Where sentiment meets reality',
  description: 'Quantitative equity divergence analysis. Sentiment, price, and trend in one view.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${dmMono.variable} ${outfit.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
