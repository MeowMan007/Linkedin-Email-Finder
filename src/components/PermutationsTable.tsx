'use client';

import React, { useState } from 'react';
import { CandidatePermutation, SmtpPingResult } from '@/types';
import { CopyButton } from './CopyButton';
import { VerificationStatus } from './VerificationStatus';
import { pingEmailSmtp } from '@/lib/api';

interface PermutationsTableProps {
  candidates: CandidatePermutation[];
  primaryEmail?: string;
}

export function PermutationsTable({ candidates, primaryEmail }: PermutationsTableProps) {
  const [pingingMap, setPingingMap] = useState<Record<string, boolean>>({});
  const [pingResults, setPingResults] = useState<Record<string, SmtpPingResult>>({});

  if (!candidates || candidates.length === 0) return null;

  const handlePing = async (email: string) => {
    setPingingMap((prev) => ({ ...prev, [email]: true }));
    try {
      const res = await pingEmailSmtp(email);
      setPingResults((prev) => ({ ...prev, [email]: res }));
    } catch {
      // ignore individual failures
    } finally {
      setPingingMap((prev) => ({ ...prev, [email]: false }));
    }
  };

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
          Ranked by likelihood · Live SMTP Verification Available
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
          const pingResult = pingResults[cand.email];
          const isPinging = pingingMap[cand.email];

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
                  {pingResult && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: pingResult.verdict === 'genuine' ? 'rgba(16, 185, 129, 0.15)' : pingResult.verdict === 'catch_all' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: pingResult.verdict === 'genuine' ? '#10b981' : pingResult.verdict === 'catch_all' ? '#f59e0b' : '#ef4444',
                    }}>
                      {pingResult.verdict === 'genuine' ? 'SMTP 250 OK' : pingResult.verdict === 'catch_all' ? 'Catch-All' : `Rejected (${pingResult.smtpStatusCode || '550'})`}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {cand.label} · {cand.confidence}% pattern weight
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {!pingResult && (
                  <button
                    type="button"
                    onClick={() => handlePing(cand.email)}
                    disabled={isPinging}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: isPinging ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isPinging ? (
                      <>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            border: '1.5px solid var(--color-400)',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            display: 'inline-block',
                          }}
                          className="animate-spin"
                        />
                        Verifying...
                      </>
                    ) : (
                      'Verify SMTP'
                    )}
                  </button>
                )}
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
