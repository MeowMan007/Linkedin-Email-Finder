'use client';

import React, { useState } from 'react';
import { MailServerDetails, EmailVerificationDetails } from '@/types';

interface MailServerInspectorProps {
  verification?: EmailVerificationDetails;
}

export function MailServerInspector({ verification }: MailServerInspectorProps) {
  const [open, setOpen] = useState(false);
  const mailServer = verification?.mailServer;

  if (!verification && !mailServer) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 120ms ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
          Mail Server & DNS Diagnostics
        </span>
        <span>{open ? 'Hide details' : 'Inspect server'}</span>
      </button>

      {open && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '8px',
            padding: '14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Mail Provider:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {mailServer?.providerName ?? 'Custom SMTP'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Primary MX Host:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {mailServer?.primaryMx ?? 'Resolved via DNS'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Catch-All Mailbox:</span>
            <span style={{
              color: mailServer?.isCatchAll ? '#f59e0b' : '#10b981',
              fontWeight: 600,
            }}>
              {mailServer?.isCatchAll ? 'Yes (Accept-All Domain)' : 'No (Strict Mailbox Enforcement)'}
            </span>
          </div>

          {mailServer?.smtpStatusCode && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>SMTP Handshake:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                Code {mailServer.smtpStatusCode} (RCPT TO)
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>RFC 5322 Syntax:</span>
            <span style={{ color: verification?.syntaxValid ? '#10b981' : '#ef4444' }}>
              {verification?.syntaxValid ? 'Valid' : 'Invalid'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
