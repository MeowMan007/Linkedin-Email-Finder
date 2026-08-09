import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Navigation } from '@/components/Navigation';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Resolve — Professional Email Enrichment',
    template: '%s · Resolve',
  },
  description:
    'Find verified professional email addresses from LinkedIn profiles. B2B contact enrichment for serious outreach.',
  keywords: ['email enrichment', 'LinkedIn', 'email finder', 'B2B', 'lead generation'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Resolve — Professional Email Enrichment',
    description:
      'Find verified professional email addresses from LinkedIn profiles.',
    type: 'website',
    siteName: 'Resolve',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navigation />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 24px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
            Resolve — Professional contact enrichment.{' '}
            Uses authorized third-party data providers only.
          </p>
        </footer>
      </body>
    </html>
  );
}
