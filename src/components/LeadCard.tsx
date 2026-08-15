'use client';

import React, { useState } from 'react';
import { EnrichmentResult } from '@/types';
import { CopyButton } from './CopyButton';
import { VerificationStatus } from './VerificationStatus';
import { ConfidenceScore } from './ConfidenceScore';
import { PermutationsTable } from './PermutationsTable';
import { MailServerInspector } from './MailServerInspector';

interface LeadCardProps {
  result: EnrichmentResult;
  onReverify?: (params: { firstName: string; lastName: string; companyName: string; companyDomain: string }) => void;
  reverifying?: boolean;
}

export function LeadCard({ result, onReverify, reverifying = false }: LeadCardProps) {
  const { person, company, email, confidence, sources } = result;

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(person.firstName);
  const [lastName, setLastName] = useState(person.lastName);
  const [companyName, setCompanyName] = useState(company.name);
  const [companyDomain, setCompanyDomain] = useState(company.domain);

  const handleReverifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onReverify) {
      onReverify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        companyDomain: companyDomain.trim(),
      });
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Main lead card */}
      <div
        className="card-raised"
        style={{ maxWidth: '640px', margin: '0 auto' }}
        role="region"
        aria-label="Enrichment result"
      >
        {/* Header */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '4px',
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

        <div className="divider" style={{ marginBottom: '18px' }} />

        {/* Company & Domain */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
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

            {onReverify && (
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                {editing ? 'Cancel edit' : 'Edit & Re-verify ✎'}
              </button>
            )}
          </div>

          {/* Inline Edit Form */}
          {editing && (
            <form onSubmit={handleReverifySubmit} style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Company</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Domain</label>
                  <input
                    type="text"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={reverifying}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--color-900)',
                  color: 'var(--color-white)',
                  borderRadius: '5px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: reverifying ? 'not-allowed' : 'pointer',
                }}
              >
                {reverifying ? 'Re-verifying via SMTP...' : 'Re-verify with Adjusted Details'}
              </button>
            </form>
          )}
        </div>

        <div className="divider" style={{ marginBottom: '18px' }} />

        {/* Primary Email */}
        {email ? (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
              Primary Work Email
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  wordBreak: 'break-all',
                }}
              >
                {email.address}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CopyButton text={email.address} label="Copy primary email" />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
              Primary Work Email
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>
              No verified email found for this profile.
            </p>
          </div>
        )}

        {/* Permutations Table (All Generated Email Patterns) */}
        {email?.candidates && email.candidates.length > 0 && (
          <>
            <div className="divider" style={{ marginBottom: '18px' }} />
            <PermutationsTable candidates={email.candidates} primaryEmail={email.address} />
          </>
        )}

        {/* Mail Server Diagnostics */}
        {email?.verification && (
          <MailServerInspector verification={email.verification} />
        )}

        <div className="divider" style={{ marginTop: '18px', marginBottom: '18px' }} />

        {/* Confidence */}
        <div style={{ marginBottom: '18px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
            Confidence Assessment
          </p>
          <ConfidenceScore breakdown={confidence} />
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <>
            <div className="divider" style={{ marginBottom: '16px' }} />
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
                Data & Verification Sources
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

