'use client';

import React, { useState } from 'react';
import { SearchInput, DirectSearchParams } from '@/components/SearchInput';
import { LoadingState } from '@/components/LoadingState';
import { LeadCard } from '@/components/LeadCard';
import { enrichProfile, enrichDirect, ApiError } from '@/lib/api';
import { EnrichmentResult } from '@/types';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [reverifying, setReverifying] = useState(false);
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUrlSubmit = async (url: string) => {
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

  const handleDirectSubmit = async (params: DirectSearchParams) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await enrichDirect(params);
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

  const handleReverify = async (params: {
    firstName: string;
    lastName: string;
    companyName: string;
    companyDomain: string;
  }) => {
    setReverifying(true);
    setError(null);

    try {
      const data = await enrichDirect(params);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Re-verification failed. Please check inputs and try again.');
      }
    } finally {
      setReverifying(false);
    }
  };

  return (
    <>
      {/* Hero section */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '56px 24px 36px',
      }}>
        <div style={{ maxWidth: '640px', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '999px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#10b981',
            marginBottom: '12px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            Zero External API Dependencies · Direct DNS & SMTP Engine
          </div>

          <h1 style={{
            fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}>
            LinkedIn Email Finder &<br />Live SMTP Mailbox Verifier
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '540px',
          }}>
            Paste any public LinkedIn profile URL or enter a person&apos;s name and company.
            The system resolves corporate domains, generates all standard email permutations,
            and validates live mailbox existence using direct TCP SMTP handshakes.
          </p>
        </div>

        {/* Search input */}
        <div style={{ maxWidth: '640px' }}>
          <SearchInput
            onSubmitUrl={handleUrlSubmit}
            onSubmitDirect={handleDirectSubmit}
            loading={loading}
          />
          <p style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            marginTop: '12px',
            marginBottom: 0,
          }}>
            Professional corporate email enrichment only. No paid credits required.
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
              maxWidth: '640px',
              padding: '20px 24px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Enrichment Notice
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {error}
            </p>
          </div>
        )}

        {!loading && result && (
          <LeadCard
            result={result}
            onReverify={handleReverify}
            reverifying={reverifying}
          />
        )}

        {!loading && !result && !error && (
          /* Feature Pillars */
          <div style={{
            maxWidth: '640px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            marginTop: '8px',
          }}>
            {[
              { label: 'Autonomous Scraper', desc: 'Zero-API public profile & OpenGraph extraction' },
              { label: 'Autonomous Domain Engine', desc: 'Enterprise directory & DNS MX heuristics' },
              { label: 'Permutation Inference', desc: '12+ weighted enterprise email formula matrices' },
              { label: 'Direct TCP SMTP Probes', desc: 'Live RFC 5321 RCPT TO socket verification & catch-all detector' },
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
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
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
