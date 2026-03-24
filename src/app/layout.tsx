import type { Metadata } from 'next';
import { Playfair_Display, Space_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Markora — Where sentiment meets reality',
  description: 'Quantitative equity divergence analysis. Sentiment, price, and trend in one view.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${spaceMono.variable} ${spaceGrotesk.variable}`}>
      <body style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
