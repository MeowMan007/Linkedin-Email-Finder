'use client';

import React from 'react';
import Link from 'next/link';
import { SearchRecord } from '@/types';
import { VerificationStatus } from './VerificationStatus';
import { CopyButton } from './CopyButton';

interface SearchHistoryProps {
  records: SearchRecord[];
  total: number;
  loading?: boolean;
  onDelete?: (id: string) => void;
}

export function SearchHistory({ records, total, loading = false, onDelete }: SearchHistoryProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: '72px', borderRadius: '8px' }}
          />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 24px',
        color: 'var(--text-tertiary)',
      }}>
        <p style={{ fontSize: '14px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
          No enrichment history yet.
        </p>
        <p style={{ fontSize: '13px', margin: 0 }}>
          Paste a LinkedIn profile above to start your first enrichment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
          {total} search{total !== 1 ? 'es' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {records.map((record, i) => (
          <HistoryRow
            key={record.id}
            record={record}
            onDelete={onDelete}
            animate={i < 10}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryRow({
  record,
  onDelete,
  animate,
}: {
  record: SearchRecord;
  onDelete?: (id: string) => void;
  animate: boolean;
}) {
  const date = new Date(record.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={animate ? 'animate-fade-in' : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        padding: '14px 0',
        borderBottom: '1px solid var(--border)',
        alignItems: 'start',
      }}
    >
      {/* Left: Info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <Link
            href={`/result/${record.id}`}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              transition: 'color 120ms ease',
            }}
            aria-label={`View result for ${record.personName ?? 'unknown person'}`}
          >
            {record.personName ?? 'Unknown'}
          </Link>
          {record.emailStatus && (
            <VerificationStatus status={record.emailStatus} size="sm" />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {record.companyName && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {record.companyName}
            </span>
          )}
          {record.email && (
            <span style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}>
              {record.email}
            </span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{date}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {record.email && (
          <CopyButton text={record.email} label="Email" />
        )}
        {record.linkedinUrl && (
          <a
            href={record.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open LinkedIn profile"
            style={{
              padding: '7px 10px',
              border: '1px solid var(--border-strong)',
              borderRadius: '5px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'border-color 120ms ease',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M2.5 8.5l6-6M8.5 2.5H5M8.5 2.5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Profile
          </a>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(record.id)}
            aria-label={`Delete record for ${record.personName ?? 'this person'}`}
            style={{
              padding: '7px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              transition: 'border-color 120ms ease, color 120ms ease',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M2 3h9M5 3V2h3v1M4 3v7.5a.5.5 0 00.5.5h4a.5.5 0 00.5-.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
