'use client';

import React, { useState } from 'react';
import { SearchInput, DirectSearchParams, HrSearchParams } from '@/components/SearchInput';
import { LoadingState } from '@/components/LoadingState';
import { LeadCard } from '@/components/LeadCard';
import { HrLeadListCard } from '@/components/HrLeadListCard';
import { enrichDirect, searchCompanyHr, ApiError } from '@/lib/api';
import { EnrichmentResult, CompanyHrSearchResponse } from '@/types';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [reverifying, setReverifying] = useState(false);
  const [personResult, setPersonResult] = useState<EnrichmentResult | null>(null);
  const [hrResult, setHrResult] = useState<CompanyHrSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePersonSubmit = async (params: DirectSearchParams) => {
    setLoading(true);
    setPersonResult(null);
    setHrResult(null);
    setError(null);

    try {
      const data = await enrichDirect(params);
      setPersonResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to resolve email. Please check the person and company name and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyHrSubmit = async (params: HrSearchParams) => {
    setLoading(true);
    setPersonResult(null);
    setHrResult(null);
    setError(null);

    try {
      const data = await searchCompanyHr(params);
      setHrResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Company HR discovery failed. Please verify the company name or domain.');
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
      setPersonResult(data);
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
        padding: '52px 24px 32px',
      }}>
        <div style={{ maxWidth: '640px', marginBottom: '28px' }}>
          <h1 style={{
            fontSize: 'clamp(1.85rem, 4.5vw, 2.6rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}>
            Work Email Finder &<br />Company HR Discovery
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '560px',
          }}>
            Find verified corporate emails for individuals or discover HR and talent acquisition professionals by company.
            Every search includes automated domain MX resolution, email permutation generation, and live SMTP verification.
          </p>
        </div>

        {/* Search input */}
        <div style={{ maxWidth: '640px' }}>
          <SearchInput
            onSubmitPerson={handlePersonSubmit}
            onSubmitCompanyHr={handleCompanyHrSubmit}
            loading={loading}
          />
          <p style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            marginTop: '12px',
            marginBottom: 0,
          }}>
            Professional corporate email discovery. Built with zero paid third-party API dependencies.
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
              padding: '18px 22px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Notice
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {error}
            </p>
          </div>
        )}

        {/* Person Email Result */}
        {!loading && personResult && (
          <LeadCard
            result={personResult}
            onReverify={handleReverify}
            reverifying={reverifying}
          />
        )}

        {/* Company HR Discovery Result */}
        {!loading && hrResult && (
          <HrLeadListCard
            data={hrResult}
          />
        )}

        {/* Feature Pillars */}
        {!loading && !personResult && !hrResult && !error && (
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
              { label: 'Person Email Search', desc: 'Find corporate email addresses for specific professionals' },
              { label: 'Company HR Discovery', desc: 'Find active recruiters and talent acquisition leads by company' },
              { label: 'Permutation Matrices', desc: '12+ weighted enterprise email formula patterns' },
              { label: 'Live SMTP Verification', desc: 'RFC 5321 socket validation and catch-all detection' },
            ].map((feature) => (
              <div
                key={feature.label}
                style={{
                  padding: '18px',
                  background: 'var(--surface)',
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}>
                  {feature.label}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
