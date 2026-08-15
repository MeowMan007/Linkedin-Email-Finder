'use client';

import React, { useState } from 'react';
import { validateEmailSyntax } from '@/lib/validation';

export interface DirectSearchParams {
  firstName: string;
  lastName: string;
  companyName: string;
  companyDomain?: string;
}

interface SearchInputProps {
  onSubmitDirect: (params: DirectSearchParams) => void;
  onSubmitSmtpPing: (email: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SearchInput({
  onSubmitDirect,
  onSubmitSmtpPing,
  loading = false,
  disabled = false,
}: SearchInputProps) {
  const [activeTab, setActiveTab] = useState<'find' | 'ping'>('find');

  // Find Person Email state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');
  const [findError, setFindError] = useState<string | null>(null);

  // Live SMTP Ping state
  const [pingEmail, setPingEmail] = useState('');
  const [pingError, setPingError] = useState<string | null>(null);

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFindError(null);

    const f = firstName.trim();
    const l = lastName.trim();
    const c = company.trim();
    const d = domain.trim();

    if (!f && !l) {
      setFindError('Please enter at least a First Name or Last Name.');
      return;
    }

    if (!c && !d) {
      setFindError('Please enter a Company Name or website domain (e.g. OpenAI, openai.com).');
      return;
    }

    onSubmitDirect({
      firstName: f,
      lastName: l,
      companyName: c,
      companyDomain: d || undefined,
    });
  };

  const handlePingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPingError(null);

    const trimmed = pingEmail.trim();
    if (!trimmed) {
      setPingError('Please enter an email address to ping.');
      return;
    }

    if (!validateEmailSyntax(trimmed)) {
      setPingError('Please enter a valid email address format (e.g. name@company.com).');
      return;
    }

    onSubmitSmtpPing(trimmed);
  };

  const applyFindExample = (f: string, l: string, c: string, d?: string) => {
    setActiveTab('find');
    setFirstName(f);
    setLastName(l);
    setCompany(c);
    setDomain(d ?? '');
    setFindError(null);
  };

  const applyPingExample = (email: string) => {
    setActiveTab('ping');
    setPingEmail(email);
    setPingError(null);
  };

  return (
    <div>
      {/* Mode Switcher Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'var(--bg-subtle)',
        padding: '4px',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        marginBottom: '16px',
        width: 'fit-content',
      }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('find');
            setFindError(null);
          }}
          style={{
            padding: '7px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'find' ? 600 : 400,
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'find' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'find' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'find' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 120ms ease',
          }}
        >
          <span>👤</span>
          <span>Find Person Email</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('ping');
            setPingError(null);
          }}
          style={{
            padding: '7px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'ping' ? 600 : 400,
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'ping' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'ping' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'ping' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 120ms ease',
          }}
        >
          <span>⚡</span>
          <span>Live SMTP Email Pinger</span>
        </button>
      </div>

      {/* Tab 1: Find Person Email Form */}
      {activeTab === 'find' ? (
        <form onSubmit={handleDirectSubmit} noValidate aria-label="Find Person Work Email Form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Satya"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (findError) setFindError(null);
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
                  placeholder="e.g. Nadella"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (findError) setFindError(null);
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
                  placeholder="e.g. Microsoft"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (findError) setFindError(null);
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
                  placeholder="e.g. microsoft.com"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    if (findError) setFindError(null);
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
                  Generating Permutations & Probing SMTP...
                </>
              ) : (
                'Find & Verify Work Email'
              )}
            </button>

            {findError && (
              <p style={{ color: 'var(--color-500)', fontSize: '13px', margin: '4px 0 0' }}>
                {findError}
              </p>
            )}
          </div>
        </form>
      ) : (
        /* Tab 2: Live SMTP Email Pinger Form */
        <form onSubmit={handlePingSubmit} noValidate aria-label="Direct Live SMTP Email Pinger Form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Email Address to Ping & Verify
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="e.g. satya.nadella@microsoft.com or contact@openai.com"
                  value={pingEmail}
                  onChange={(e) => {
                    setPingEmail(e.target.value);
                    if (pingError) setPingError(null);
                  }}
                  disabled={loading || disabled}
                  style={{
                    flex: 1,
                    padding: '13px 16px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || disabled || !pingEmail.trim()}
                  style={{
                    padding: '13px 22px',
                    background: loading || !pingEmail.trim() ? 'var(--color-200)' : '#10b981',
                    color: loading || !pingEmail.trim() ? 'var(--color-400)' : '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading || !pingEmail.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0,
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#ffffff',
                          borderRadius: '50%',
                          display: 'inline-block',
                        }}
                        className="animate-spin"
                      />
                      Pinging Server...
                    </>
                  ) : (
                    'Ping Live Mailbox ⚡'
                  )}
                </button>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '0' }}>
              Connects directly to the domain&apos;s MX server over port 25 with RFC 5321 RCPT TO socket handshake and tests catch-all behavior.
            </p>

            {pingError && (
              <p style={{ color: 'var(--color-500)', fontSize: '13px', margin: '4px 0 0' }}>
                {pingError}
              </p>
            )}
          </div>
        </form>
      )}

      {/* Quick Example Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Try examples:</span>
        <button
          type="button"
          onClick={() => applyFindExample('Satya', 'Nadella', 'Microsoft', 'microsoft.com')}
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
          onClick={() => applyFindExample('Sam', 'Altman', 'OpenAI', 'openai.com')}
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
          onClick={() => applyPingExample('satya.nadella@microsoft.com')}
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
          ⚡ Ping satya.nadella@microsoft.com
        </button>
      </div>
    </div>
  );
}
