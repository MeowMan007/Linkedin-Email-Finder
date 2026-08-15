'use client';

import React, { useState, useRef } from 'react';
import { validateLinkedInUrl } from '@/lib/validation';

export interface DirectSearchParams {
  firstName: string;
  lastName: string;
  companyName: string;
  companyDomain?: string;
}

interface SearchInputProps {
  onSubmitUrl: (url: string) => void;
  onSubmitDirect: (params: DirectSearchParams) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SearchInput({
  onSubmitUrl,
  onSubmitDirect,
  loading = false,
  disabled = false,
}: SearchInputProps) {
  const [tab, setTab] = useState<'url' | 'direct'>('url');
  
  // URL mode state
  const [urlValue, setUrlValue] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Direct mode state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');
  const [directError, setDirectError] = useState<string | null>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    const trimmed = urlValue.trim();
    const validation = validateLinkedInUrl(trimmed);

    if (!validation.valid) {
      setUrlError(validation.error ?? 'Invalid LinkedIn URL.');
      inputRef.current?.focus();
      return;
    }

    onSubmitUrl(validation.normalizedUrl!);
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError(null);

    const f = firstName.trim();
    const l = lastName.trim();
    const c = company.trim();
    const d = domain.trim();

    if (!f && !l) {
      setDirectError('Please enter the person\'s name.');
      return;
    }

    if (!c && !d) {
      setDirectError('Please enter a company name or company website domain.');
      return;
    }

    onSubmitDirect({
      firstName: f,
      lastName: l,
      companyName: c,
      companyDomain: d || undefined,
    });
  };

  const applyExample = (exUrl: string) => {
    setTab('url');
    setUrlValue(exUrl);
    setUrlError(null);
  };

  const applyDirectExample = (f: string, l: string, c: string, d?: string) => {
    setTab('direct');
    setFirstName(f);
    setLastName(l);
    setCompany(c);
    setDomain(d ?? '');
    setDirectError(null);
  };

  return (
    <div>
      {/* Tab Switcher */}
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
          onClick={() => setTab('url')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: tab === 'url' ? 600 : 400,
            borderRadius: '6px',
            border: 'none',
            background: tab === 'url' ? 'var(--surface)' : 'transparent',
            color: tab === 'url' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: tab === 'url' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
        >
          LinkedIn Profile URL
        </button>
        <button
          type="button"
          onClick={() => setTab('direct')}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: tab === 'direct' ? 600 : 400,
            borderRadius: '6px',
            border: 'none',
            background: tab === 'direct' ? 'var(--surface)' : 'transparent',
            color: tab === 'direct' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: tab === 'direct' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
        >
          Name & Company Direct
        </button>
      </div>

      {tab === 'url' ? (
        <form onSubmit={handleUrlSubmit} noValidate aria-label="LinkedIn URL enrichment form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  id="linkedin-url-input"
                  type="text"
                  value={urlValue}
                  onChange={(e) => {
                    setUrlValue(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  placeholder="https://www.linkedin.com/in/satyanadella"
                  disabled={loading || disabled}
                  aria-label="LinkedIn profile URL"
                  aria-invalid={!!urlError}
                  style={{
                    padding: '13px 16px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: `1px solid ${urlError ? 'var(--color-400)' : 'var(--border-strong)'}`,
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    width: '100%',
                    transition: 'border-color 120ms ease',
                    opacity: disabled ? 0.6 : 1,
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || disabled || !urlValue.trim()}
                id="find-email-button"
                style={{
                  padding: '13px 22px',
                  background: loading || !urlValue.trim() ? 'var(--color-200)' : 'var(--color-900)',
                  color: loading || !urlValue.trim() ? 'var(--color-400)' : 'var(--color-white)',
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading || !urlValue.trim() ? 'not-allowed' : 'pointer',
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
                        border: '2px solid var(--color-400)',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                      className="animate-spin"
                    />
                    Finding & Verifying...
                  </>
                ) : (
                  'Find Work Email'
                )}
              </button>
            </div>

            {urlError && (
              <p
                id="url-error"
                role="alert"
                style={{
                  color: 'var(--color-500)',
                  fontSize: '13px',
                  margin: 0,
                  paddingLeft: '2px',
                }}
              >
                {urlError}
              </p>
            )}
          </div>
        </form>
      ) : (
        <form onSubmit={handleDirectSubmit} noValidate aria-label="Direct Name and Company form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="First Name (e.g. Satya)"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (directError) setDirectError(null);
                }}
                disabled={loading || disabled}
                style={{
                  padding: '12px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
              <input
                type="text"
                placeholder="Last Name (e.g. Nadella)"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (directError) setDirectError(null);
                }}
                disabled={loading || disabled}
                style={{
                  padding: '12px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Company Name (e.g. Microsoft)"
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  if (directError) setDirectError(null);
                }}
                disabled={loading || disabled}
                style={{
                  padding: '12px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
              <input
                type="text"
                placeholder="Website / Domain (optional, e.g. microsoft.com)"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  if (directError) setDirectError(null);
                }}
                disabled={loading || disabled}
                style={{
                  padding: '12px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
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
              }}
            >
              {loading ? 'Discovering Permutations & Probing SMTP...' : 'Find & Verify Work Email'}
            </button>

            {directError && (
              <p style={{ color: 'var(--color-500)', fontSize: '13px', margin: 0 }}>
                {directError}
              </p>
            )}
          </div>
        </form>
      )}

      {/* Quick Example Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Try:</span>
        <button
          type="button"
          onClick={() => applyExample('https://www.linkedin.com/in/satyanadella/')}
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
          onClick={() => applyDirectExample('Sam', 'Altman', 'OpenAI', 'openai.com')}
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
          onClick={() => applyDirectExample('Sundar', 'Pichai', 'Google', 'google.com')}
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
          Sundar Pichai (Google)
        </button>
      </div>
    </div>
  );
}
