'use client';

import React, { useState } from 'react';
import { SearchInput, DirectSearchParams } from '@/components/SearchInput';
import { LoadingState } from '@/components/LoadingState';
import { LeadCard } from '@/components/LeadCard';
import { SmtpPingResultCard } from '@/components/SmtpPingResultCard';
import { enrichDirect, pingEmailSmtp, ApiError } from '@/lib/api';
import { EnrichmentResult, SmtpPingResult } from '@/types';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<'enrich' | 'ping'>('enrich');
  const [reverifying, setReverifying] = useState(false);
  const [enrichResult, setEnrichResult] = useState<EnrichmentResult | null>(null);
  const [smtpResult, setSmtpResult] = useState<SmtpPingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDirectSubmit = async (params: DirectSearchParams) => {
    setLoading(true);
    setLoadingMode('enrich');
    setEnrichResult(null);
    setSmtpResult(null);
    setError(null);

    try {
      const data = await enrichDirect(params);
      setEnrichResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please check the inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSmtpPingSubmit = async (email: string) => {
    setLoading(true);
    setLoadingMode('ping');
    setEnrichResult(null);
    setSmtpResult(null);
    setError(null);

    try {
      const data = await pingEmailSmtp(email);
      setSmtpResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('SMTP Ping failed. Target mail server may be unreachable or rejecting socket probes.');
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
      setEnrichResult(data);
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
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#10b981',
            marginBottom: '14px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            Zero External API Dependencies · Direct Port 25 SMTP Handshake Engine
          </div>

          <h1 style={{
            fontSize: 'clamp(1.85rem, 4.5vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}>
            Work Email Finder &<br />Live SMTP Mailbox Verifier
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '560px',
          }}>
            Find any person&apos;s corporate email or live-ping any mailbox in real-time.
            Performs direct RFC 5321 TCP socket handshakes (<code>EHLO</code>, <code>MAIL FROM</code>, <code>RCPT TO</code>)
            against target MX servers to verify genuine deliverability and detect catch-all domains.
          </p>
        </div>

        {/* Search input */}
        <div style={{ maxWidth: '640px' }}>
          <SearchInput
            onSubmitDirect={handleDirectSubmit}
            onSubmitSmtpPing={handleSmtpPingSubmit}
            loading={loading}
          />
          <p style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            marginTop: '12px',
            marginBottom: 0,
          }}>
            Professional corporate email discovery & live RFC 5321 socket verification. No paid API credits required.
          </p>
        </div>
      </section>

      {/* Results section */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 72px' }}>
        {loading && (
          <LoadingState
            active={loading}
          />
        )}

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
              Verification Notice
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {error}
            </p>
          </div>
        )}

        {/* Email Discovery Lead Result */}
        {!loading && enrichResult && (
          <LeadCard
            result={enrichResult}
            onReverify={handleReverify}
            reverifying={reverifying}
          />
        )}

        {/* Live SMTP Pinger Result */}
        {!loading && smtpResult && (
          <SmtpPingResultCard
            result={smtpResult}
            onPingAnother={() => setSmtpResult(null)}
          />
        )}

        {/* Feature Pillars (Empty State) */}
        {!loading && !enrichResult && !smtpResult && !error && (
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
              { label: 'Direct Name & Company', desc: 'Find corporate emails by person name and organization' },
              { label: 'Autonomous Domain Engine', desc: 'Enterprise directory & DNS MX heuristics' },
              { label: 'Permutation Inference', desc: '12+ weighted enterprise email formula matrices' },
              { label: 'Live Socket SMTP Probes', desc: 'Real-time RFC 5321 RCPT TO mailbox ping & catch-all detector' },
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
