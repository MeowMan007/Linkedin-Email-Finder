import type { Metadata } from 'next';
import Link from 'next/link';
import { getSearchStats, getSearchHistory } from '@/lib/db';
import { auth } from '@/lib/auth';
import { SearchHistory } from '@/components/SearchHistory';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your enrichment activity and recent searches.',
};

export const dynamic = 'force-dynamic';

async function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{
      padding: '20px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
    }}>
      <p style={{
        fontSize: '28px',
        fontWeight: 700,
        letterSpacing: '-0.04em',
        color: 'var(--text-primary)',
        margin: '0 0 4px',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
        {label}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [stats, historyData] = await Promise.all([
    getSearchStats(userId),
    getSearchHistory({ userId, page: 1, limit: 5 }),
  ]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          {session?.user
            ? `Signed in as ${session.user.email}`
            : 'Sign in to track your searches across sessions.'}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '40px',
      }}>
        <StatCard value={stats.total}           label="Searches" />
        <StatCard value={stats.verified}        label="Verified" />
        <StatCard value={stats.probable}        label="Probable" />
        <StatCard value={stats.notFound}        label="Not found" />
        <StatCard value={stats.total > 0 ? `${stats.avgConfidence}%` : '—'} label="Avg. confidence" />
      </div>

      {/* Quick search link */}
      <div style={{ marginBottom: '32px' }}>
        <Link
          href="/"
          id="new-search-button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'var(--color-900)',
            color: 'var(--color-white)',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background 120ms ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          New search
        </Link>
      </div>

      {/* Recent history */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Recent searches</h2>
          {historyData.total > 5 && (
            <Link href="/history" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              View all {historyData.total} →
            </Link>
          )}
        </div>
        <SearchHistory
          records={historyData.records}
          total={historyData.total}
        />
      </div>
    </div>
  );
}
