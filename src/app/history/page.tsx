'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { SearchRecord } from '@/types';
import { getHistory, deleteRecord, clearHistory } from '@/lib/api';
import { SearchHistory } from '@/components/SearchHistory';

export default function HistoryPage() {
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadHistory = useCallback(async (p: number = 1) => {
    setLoading(true);
    try {
      const data = await getHistory(p);
      setRecords(data.records);
      setTotal(data.total);
      setPages(data.pages ?? 1);
      setPage(p);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setTotal((prev) => prev - 1);
  };

  const handleClearAll = async () => {
    if (!confirm('Delete all search history? This cannot be undone.')) return;
    setClearing(true);
    await clearHistory();
    setRecords([]);
    setTotal(0);
    setClearing(false);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 4px' }}>
            Search History
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Your enrichment records
          </p>
        </div>
        {total > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid var(--border-strong)',
              borderRadius: '5px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: clearing ? 0.5 : 1,
            }}
          >
            {clearing ? 'Clearing...' : 'Clear all history'}
          </button>
        )}
      </div>

      <SearchHistory
        records={records}
        total={total}
        loading={loading}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {pages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => loadHistory(page - 1)}
            disabled={page <= 1}
            style={{
              padding: '7px 14px',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              fontSize: '13px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.4 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {page} / {pages}
          </span>
          <button
            onClick={() => loadHistory(page + 1)}
            disabled={page >= pages}
            style={{
              padding: '7px 14px',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              fontSize: '13px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: page >= pages ? 'not-allowed' : 'pointer',
              opacity: page >= pages ? 0.4 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
