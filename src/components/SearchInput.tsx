'use client';

import React, { useState } from 'react';

export interface DirectSearchParams {
  firstName: string;
  lastName: string;
  companyName: string;
  companyDomain?: string;
}

export interface HrSearchParams {
  companyName: string;
  companyDomain?: string;
}

interface SearchInputProps {
  onSubmitPerson: (params: DirectSearchParams) => void;
  onSubmitCompanyHr: (params: HrSearchParams) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SearchInput({
  onSubmitPerson,
  onSubmitCompanyHr,
  loading = false,
  disabled = false,
}: SearchInputProps) {
  const [activeTab, setActiveTab] = useState<'person' | 'hr'>('person');

  // Person Email state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');
  const [personError, setPersonError] = useState<string | null>(null);

  // Company HR state
  const [hrCompany, setHrCompany] = useState('');
  const [hrDomain, setHrDomain] = useState('');
  const [hrError, setHrError] = useState<string | null>(null);

  const handlePersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPersonError(null);

    const f = firstName.trim();
    const l = lastName.trim();
    const c = company.trim();
    const d = domain.trim();

    if (!f && !l) {
      setPersonError('Please enter at least a first name or last name.');
      return;
    }

    if (!c && !d) {
      setPersonError('Please enter a company name or domain.');
      return;
    }

    onSubmitPerson({
      firstName: f,
      lastName: l,
      companyName: c,
      companyDomain: d || undefined,
    });
  };

  const handleHrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHrError(null);

    const c = hrCompany.trim();
    const d = hrDomain.trim();

    if (!c && !d) {
      setHrError('Please enter a company name or company domain.');
      return;
    }

    onSubmitCompanyHr({
      companyName: c,
      companyDomain: d || undefined,
    });
  };

  const applyPersonExample = (f: string, l: string, c: string, d?: string) => {
    setActiveTab('person');
    setFirstName(f);
    setLastName(l);
    setCompany(c);
    setDomain(d ?? '');
    setPersonError(null);
  };

  const applyHrExample = (c: string, d?: string) => {
    setActiveTab('hr');
    setHrCompany(c);
    setHrDomain(d ?? '');
    setHrError(null);
  };

  return (
    <div>
      {/* Mode Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        background: 'var(--bg-subtle)',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        marginBottom: '16px',
        width: 'fit-content',
      }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('person');
            setPersonError(null);
          }}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: activeTab === 'person' ? 600 : 400,
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'person' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'person' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'person' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
        >
          Find Person Email
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('hr');
            setHrError(null);
          }}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: activeTab === 'hr' ? 600 : 400,
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'hr' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'hr' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'hr' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
        >
          Find Company HR & Recruiters
        </button>
      </div>

      {/* Tab 1: Find Person Email */}
      {activeTab === 'person' ? (
        <form onSubmit={handlePersonSubmit} noValidate aria-label="Find Person Email Form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Satya"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (personError) setPersonError(null);
                  }}
                  disabled={loading || disabled}
                  style={{
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Nadella"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (personError) setPersonError(null);
                  }}
                  disabled={loading || disabled}
                  style={{
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="Microsoft"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (personError) setPersonError(null);
                  }}
                  disabled={loading || disabled}
                  style={{
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Company Domain <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="microsoft.com"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    if (personError) setPersonError(null);
                  }}
                  disabled={loading || disabled}
                  style={{
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || disabled || (!firstName.trim() && !lastName.trim())}
              style={{
                padding: '13px 22px',
                background: loading ? 'var(--color-200)' : 'var(--color-900)',
                color: loading ? 'var(--color-400)' : 'var(--color-white)',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid var(--color-400)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                    }}
                    className="animate-spin"
                  />
                  Finding & Verifying Email...
                </>
              ) : (
                'Find & Verify Email'
              )}
            </button>

            {personError && (
              <p style={{ color: 'var(--color-500)', fontSize: '13px', margin: '4px 0 0' }}>
                {personError}
              </p>
            )}
          </div>
        </form>
      ) : (
        /* Tab 2: Find Company HR & Recruiters */
        <form onSubmit={handleHrSubmit} noValidate aria-label="Find Company HR Form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, OpenAI, ConsultBae"
                  value={hrCompany}
                  onChange={(e) => {
                    setHrCompany(e.target.value);
                    if (hrError) setHrError(null);
                  }}
                  disabled={loading || disabled}
                  style={{
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Company Website / Domain <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. stripe.com"
                  value={hrDomain}
                  onChange={(e) => {
                    setHrDomain(e.target.value);
                    if (hrError) setHrError(null);
                  }}
                  disabled={loading || disabled}
                  style={{
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || disabled || (!hrCompany.trim() && !hrDomain.trim())}
              style={{
                padding: '13px 22px',
                background: loading ? 'var(--color-200)' : 'var(--color-900)',
                color: loading ? 'var(--color-400)' : 'var(--color-white)',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid var(--color-400)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                    }}
                    className="animate-spin"
                  />
                  Searching HR Profiles & Verifying Emails...
                </>
              ) : (
                'Find HR & Recruiter Emails'
              )}
            </button>

            {hrError && (
              <p style={{ color: 'var(--color-500)', fontSize: '13px', margin: '4px 0 0' }}>
                {hrError}
              </p>
            )}
          </div>
        </form>
      )}

      {/* Quick Example Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Examples:</span>
        <button
          type="button"
          onClick={() => applyPersonExample('Satya', 'Nadella', 'Microsoft', 'microsoft.com')}
          style={{
            fontSize: '11px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px 8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Satya Nadella (Microsoft)
        </button>
        <button
          type="button"
          onClick={() => applyPersonExample('Sam', 'Altman', 'OpenAI', 'openai.com')}
          style={{
            fontSize: '11px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px 8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Sam Altman (OpenAI)
        </button>
        <button
          type="button"
          onClick={() => applyHrExample('Stripe', 'stripe.com')}
          style={{
            fontSize: '11px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px 8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          HR at Stripe
        </button>
        <button
          type="button"
          onClick={() => applyHrExample('Airbnb', 'airbnb.com')}
          style={{
            fontSize: '11px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px 8px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          HR at Airbnb
        </button>
      </div>
    </div>
  );
}
