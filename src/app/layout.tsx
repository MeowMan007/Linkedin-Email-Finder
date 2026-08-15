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
    default: 'Resolve — Work Email Finder & Live SMTP Mailbox Verifier',
    template: '%s · Resolve',
  },
  description:
    'Find verified corporate work email addresses and verify live mailbox existence via direct RFC 5321 TCP SMTP socket pinging.',
  keywords: ['email finder', 'SMTP verification', 'email ping', 'catch-all detector', 'B2B outreach', 'mailbox verifier'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Resolve — Work Email Finder & Live SMTP Mailbox Verifier',
    description:
      'Find verified corporate work emails and verify live mailbox deliverability using direct SMTP socket handshakes.',
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
