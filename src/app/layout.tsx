import type { Metadata } from 'next';
import { Playfair_Display, IBM_Plex_Mono, DM_Sans } from 'next/font/google';
import './globals.css';

const playfairDisplay = Playfair_Display({
  subsets:  ['latin'],
  weight:   ['700', '800'],
  style:    ['normal', 'italic'],
  variable: '--font-playfair',
  display:  'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500', '700'],
  variable: '--font-ibm-plex-mono',
  display:  'swap',
});

const dmSans = DM_Sans({
  subsets:  ['latin'],
  weight:   ['400', '500'],
  variable: '--font-dm-sans',
  display:  'swap',
});

export const metadata: Metadata = {
  title: 'Markora — Where sentiment meets reality',
  description: 'Quantitative equity divergence analysis. Sentiment, price, and trend in one view.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${ibmPlexMono.variable} ${dmSans.variable}`}>
      <body style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif", background: '#020204', color: '#e2e2ec' }}>
        {children}
      </body>
    </html>
  );
}
