'use client';

import React, { useState } from 'react';
import type { Metadata } from 'next';
import { SearchInput } from '@/components/SearchInput';
import { LoadingState } from '@/components/LoadingState';
import { LeadCard } from '@/components/LeadCard';
import { enrichProfile, ApiError } from '@/lib/api';
import { EnrichmentResult } from '@/types';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await enrichProfile(url);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero section */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '72px 24px 48px',
      }}>
        <div style={{ maxWidth: '580px', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.2,
            color: 'var(--text-primary)',
            marginBottom: '14px',
          }}>
            Find verified professional<br />emails from LinkedIn.
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: '440px',
          }}>
            Enter a LinkedIn profile and identify the person&apos;s current professional
            contact information using authorized data providers.
          </p>
        </div>

        {/* Search input */}
        <div style={{ maxWidth: '580px' }}>
          <SearchInput onSubmit={handleSubmit} loading={loading} />
          <p style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            marginTop: '10px',
            marginBottom: 0,
          }}>
            Professional contact enrichment only. No personal email addresses.
          </p>
        </div>
      </section>

      {/* Results section */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 72px' }}>
        {loading && <LoadingState active={loading} />}

        {!loading && error && (
          <div
            className="animate-fade-in"
            role="alert"
            style={{
              maxWidth: '580px',
              padding: '20px 24px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Enrichment could not be completed
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {error}
            </p>
          </div>
        )}

        {!loading && result && <LeadCard result={result} />}

        {!loading && !result && !error && (
          /* Empty state / Features */
          <div style={{
            maxWidth: '580px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            marginTop: '8px',
          }}>
            {[
              { label: 'Identity resolution', desc: 'Name, title, current employer' },
              { label: 'Domain resolution',   desc: 'Verified company domain' },
              { label: 'Email discovery',     desc: 'Multi-provider waterfall' },
              { label: 'Email verification',  desc: 'Independent status check' },
            ].map((feature) => (
              <div
                key={feature.label}
                style={{
                  padding: '18px',
                  background: 'var(--surface)',
                }}
              >
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  {feature.label}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
