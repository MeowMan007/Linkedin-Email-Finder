'use client';

import React, { useState } from 'react';
import { SmtpPingResult } from '@/types';
import { CopyButton } from './CopyButton';

interface SmtpPingResultCardProps {
  result: SmtpPingResult;
  onPingAnother?: () => void;
}

export function SmtpPingResultCard({ result, onPingAnother }: SmtpPingResultCardProps) {
  const [showAudit, setShowAudit] = useState(true);

  const getVerdictTheme = () => {
    switch (result.verdict) {
      case 'genuine':
        return {
          badgeBg: 'rgba(16, 185, 129, 0.12)',
          badgeBorder: 'rgba(16, 185, 129, 0.3)',
          badgeColor: '#10b981',
          icon: '✓',
          title: 'GENUINE & DELIVERABLE MAILBOX',
          accent: '#10b981',
        };
      case 'catch_all':
        return {
          badgeBg: 'rgba(245, 158, 11, 0.12)',
          badgeBorder: 'rgba(245, 158, 11, 0.3)',
          badgeColor: '#f59e0b',
          icon: '⚡',
          title: 'CATCH-ALL DOMAIN (DELIVERABLE)',
          accent: '#f59e0b',
        };
      case 'invalid':
        return {
          badgeBg: 'rgba(239, 68, 68, 0.12)',
          badgeBorder: 'rgba(239, 68, 68, 0.3)',
          badgeColor: '#ef4444',
          icon: '✕',
          title: 'INVALID / MAILBOX DOES NOT EXIST',
          accent: '#ef4444',
        };
      default:
        return {
          badgeBg: 'rgba(156, 163, 175, 0.12)',
          badgeBorder: 'rgba(156, 163, 175, 0.3)',
          badgeColor: '#9ca3af',
          icon: '⚠',
          title: 'SERVER RESTRICTED / UNVERIFIABLE',
          accent: '#9ca3af',
        };
    }
  };

  const theme = getVerdictTheme();

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card-raised">
        {/* Header with Verdict Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: theme.badgeBg,
            border: `1px solid ${theme.badgeBorder}`,
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: theme.badgeColor,
          }}>
            <span style={{ fontSize: '14px', fontWeight: 900 }}>{theme.icon}</span>
            {theme.title}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Ping Latency: <strong style={{ color: 'var(--text-secondary)' }}>{result.durationMs}ms</strong>
          </div>
        </div>

        {/* Email Address Hero Box */}
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              Target Email Address
            </span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)' }}>
              {result.email}
            </span>
          </div>
          <CopyButton text={result.email} label="Copy Email" />
        </div>

        {/* Verdict Explanation Banner */}
        <p style={{
          fontSize: '13px',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          background: 'var(--surface)',
          borderLeft: `3px solid ${theme.accent}`,
          padding: '10px 14px',
          borderRadius: '0 6px 6px 0',
          margin: '0 0 20px 0',
        }}>
          {result.verdictDescription}
        </p>

        {/* Diagnostics Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Mail Provider</span>
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {result.mailProvider}
            </strong>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Primary MX Server</span>
            <strong style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
              {result.primaryMx ?? 'None'}
            </strong>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>Catch-All Domain</span>
            <strong style={{ fontSize: '13px', color: result.isCatchAll ? '#f59e0b' : 'var(--text-primary)' }}>
              {result.isCatchAll ? 'Yes (Accepts All)' : 'No (Strict)'}
            </strong>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>SMTP Status</span>
            <strong style={{ fontSize: '13px', color: result.smtpStatusCode === 250 ? '#10b981' : (result.smtpStatusCode && result.smtpStatusCode >= 500 ? '#ef4444' : 'var(--text-secondary)') }}>
              {result.smtpStatusCode ? `${result.smtpStatusCode} Code` : 'Unavailable'}
            </strong>
          </div>
        </div>

        {/* Collapsible Live Socket Audit Trail */}
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          <button
            type="button"
            onClick={() => setShowAudit(!showAudit)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg-subtle)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            <span>Live RFC 5321 SMTP Handshake & DNS Audit Trail ({result.auditTrail.length} steps)</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{showAudit ? 'Collapse ▲' : 'Expand ▼'}</span>
          </button>

          {showAudit && (
            <div style={{ padding: '12px 16px', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.auditTrail.map((step, idx) => {
                  const stepColor =
                    step.status === 'pass'
                      ? '#10b981'
                      : step.status === 'fail'
                      ? '#ef4444'
                      : step.status === 'warn'
                      ? '#f59e0b'
                      : 'var(--text-secondary)';

                  const stepIcon =
                    step.status === 'pass'
                      ? '✓'
                      : step.status === 'fail'
                      ? '✕'
                      : step.status === 'warn'
                      ? '⚡'
                      : 'ℹ';

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '12px',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{
                        color: stepColor,
                        fontWeight: 700,
                        width: '14px',
                        textAlign: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}>
                        {stepIcon}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{step.step}</span>
                          {step.code && (
                            <span style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border)',
                              fontFamily: 'monospace',
                              color: stepColor,
                              fontWeight: 600,
                            }}>
                              Code {step.code}
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                            +{step.timestamp}ms
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', wordBreak: 'break-word', fontFamily: step.message.includes('RCPT TO') || step.message.includes('250') || step.message.includes('550') ? 'monospace' : 'inherit' }}>
                          {step.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        {onPingAnother && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onPingAnother}
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ← Ping Another Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
