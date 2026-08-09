import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSearchRecordById } from '@/lib/db';
import { auth } from '@/lib/auth';
import { LeadCard } from '@/components/LeadCard';

export const metadata: Metadata = { title: 'Result' };
export const dynamic = 'force-dynamic';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const { id } = await params;

  const record = await getSearchRecordById(id, userId);
  if (!record) notFound();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '28px' }}>
        <Link
          href="/history"
          style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to history
        </Link>
      </div>

      <LeadCard result={record.resultData} />
    </div>
  );
}
