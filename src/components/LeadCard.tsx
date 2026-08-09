import React from 'react';
import { EnrichmentResult } from '@/types';
import { CopyButton } from './CopyButton';
import { VerificationStatus } from './VerificationStatus';
import { ConfidenceScore } from './ConfidenceScore';

interface LeadCardProps {
  result: EnrichmentResult;
}

export function LeadCard({ result }: LeadCardProps) {
  const { person, company, email, confidence, sources } = result;

  return (
    <div className="animate-fade-in">
      {/* Main lead card */}
      <div
        className="card-raised"
        style={{ maxWidth: '580px', margin: '0 auto' }}
        role="region"
        aria-label="Enrichment result"
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '3px',
              }}>
                {person.name}
              </h2>
              {person.title && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  {person.title}
                </p>
              )}
            </div>
            {email?.status && (
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                <VerificationStatus status={email.status} />
              </div>
            )}
          </div>
        </div>

        <div className="divider" style={{ marginBottom: '20px' }} />

        {/* Company */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {company.name}
            </span>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              aria-label={`Visit ${company.website}`}
            >
              {company.domain}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M3 7L7 3M7 3H4M7 3v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="divider" style={{ marginBottom: '20px' }} />

        {/* Email */}
        {email ? (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
              Work Email
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {email.address}
              </span>
              <CopyButton text={email.address} label="Copy email" />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
              Work Email
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>
              No verified email found
            </p>
          </div>
        )}

        <div className="divider" style={{ marginBottom: '20px' }} />

        {/* Confidence */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
            Confidence
          </p>
          <ConfidenceScore breakdown={confidence} />
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <>
            <div className="divider" style={{ marginBottom: '16px' }} />
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
                Sources
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sources.map((source) => (
                  <span
                    key={source}
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                    }}
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <>
            <div className="divider" style={{ marginTop: '16px', marginBottom: '12px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6 }}>
              {result.warnings[0]}
            </p>
          </>
        )}

        {/* Timestamp */}
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0 }}>
            Enriched {new Date(result.timestamp).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
            {result.cached && ' · from cache'}
          </p>
        </div>
      </div>
    </div>
  );
}
