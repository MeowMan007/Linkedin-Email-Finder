'use client';

import React from 'react';
import { CandidatePermutation } from '@/types';
import { CopyButton } from './CopyButton';
import { VerificationStatus } from './VerificationStatus';

interface PermutationsTableProps {
  candidates: CandidatePermutation[];
  primaryEmail?: string;
}

export function PermutationsTable({ candidates, primaryEmail }: PermutationsTableProps) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          margin: 0,
        }}>
          Email Permutations ({candidates.length})
        </p>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Ranked by likelihood
        </span>
      </div>

      <div style={{
        borderRadius: '8px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        background: 'var(--surface)',
      }}>
        {candidates.map((cand, idx) => {
          const isPrimary = cand.email === primaryEmail;
          return (
            <div
              key={cand.email}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: idx < candidates.length - 1 ? '1px solid var(--border)' : 'none',
                background: isPrimary ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                gap: '12px',
                transition: 'background 120ms ease',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: isPrimary ? 600 : 400,
                    color: isPrimary ? 'var(--text-primary)' : 'var(--text-secondary)',
                    wordBreak: 'break-all',
                  }}>
                    {cand.email}
                  </span>
                  {isPrimary && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'var(--color-900)',
                      color: 'var(--color-white)',
                      letterSpacing: '0.04em',
                    }}>
                      Primary Match
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {cand.label} · {cand.confidence}% pattern weight
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <VerificationStatus status={cand.status} />
                <CopyButton text={cand.email} label="Copy email" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
