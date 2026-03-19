import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Markora',
  description: 'Financial news sentiment analyzer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: '#0a0a0a',
          color: '#ffffff',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
