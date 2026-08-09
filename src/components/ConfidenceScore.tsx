import React from 'react';
import { ConfidenceBreakdown } from '@/types';

interface ConfidenceScoreProps {
  breakdown: ConfidenceBreakdown;
  compact?: boolean;
}

const SIGNAL_LABELS: Record<string, string> = {
  identityMatch: 'Identity matched',
  currentCompanyMatch: 'Current employer matched',
  domainMatch: 'Company domain resolved',
  emailFromProvider: 'Email found via enrichment',
  emailVerification: 'Email verification passed',
};

export function ConfidenceScore({ breakdown, compact = false }: ConfidenceScoreProps) {
  const { total, band, scores, signals } = breakdown;

  const signalEntries = [
    { key: 'identityMatch',       achieved: signals.identityMatched,       score: scores.identityMatch,       max: 25 },
    { key: 'currentCompanyMatch', achieved: signals.currentCompanyMatched, score: scores.currentCompanyMatch, max: 25 },
    { key: 'domainMatch',         achieved: signals.domainMatched,         score: scores.domainMatch,         max: 15 },
    { key: 'emailFromProvider',   achieved: signals.emailFromProvider,     score: scores.emailFromProvider,   max: 20 },
    { key: 'emailVerification',   achieved: signals.emailVerified,         score: scores.emailVerification,   max: 15 },
  ];

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          {total}%
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          {band}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          {total}%
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {band} confidence
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '3px',
        background: 'var(--border)',
        borderRadius: '2px',
        marginBottom: '18px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${total}%`,
          background: total >= 75 ? 'var(--color-900)' : 'var(--color-400)',
          borderRadius: '2px',
          transition: 'width 600ms ease',
        }} />
      </div>

      {/* Signal breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {signalEntries.map(({ key, achieved, score, max }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                aria-hidden="true"
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: `1.5px solid ${achieved ? 'var(--color-700)' : 'var(--border-strong)'}`,
                  background: achieved ? 'var(--color-900)' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {achieved && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span style={{
                fontSize: '13px',
                color: achieved ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}>
                {SIGNAL_LABELS[key]}
              </span>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: achieved ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}>
              +{score}/{max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
