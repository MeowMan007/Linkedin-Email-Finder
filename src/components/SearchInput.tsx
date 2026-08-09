'use client';

import React, { useState, useRef } from 'react';
import { validateLinkedInUrl } from '@/lib/validation';

interface SearchInputProps {
  onSubmit: (url: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SearchInput({ onSubmit, loading = false, disabled = false }: SearchInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = value.trim();
    const validation = validateLinkedInUrl(trimmed);

    if (!validation.valid) {
      setError(validation.error ?? 'Invalid LinkedIn URL.');
      inputRef.current?.focus();
      return;
    }

    onSubmit(validation.normalizedUrl!);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (error) setError(null);
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Profile enrichment form">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              id="linkedin-url-input"
              type="url"
              value={value}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/profile-name"
              disabled={loading || disabled}
              aria-label="LinkedIn profile URL"
              aria-invalid={!!error}
              aria-describedby={error ? 'url-error' : undefined}
              style={{
                padding: '13px 16px',
                fontSize: '14px',
                borderRadius: '6px',
                border: `1px solid ${error ? 'var(--color-400)' : 'var(--border-strong)'}`,
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
            disabled={loading || disabled || !value.trim()}
            id="find-email-button"
            aria-label={loading ? 'Searching...' : 'Find work email'}
            style={{
              padding: '13px 22px',
              background: loading || !value.trim() ? 'var(--color-200)' : 'var(--color-900)',
              color: loading || !value.trim() ? 'var(--color-400)' : 'var(--color-white)',
              border: 'none',
              borderRadius: '6px',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 120ms ease, color 120ms ease',
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
                Searching
              </>
            ) : (
              'Find Work Email'
            )}
          </button>
        </div>

        {error && (
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
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
