import React from 'react';
import { EmailStatus } from '@/types';

interface VerificationStatusProps {
  status: EmailStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<EmailStatus, { label: string; description: string }> = {
  verified:   { label: 'Verified',   description: 'Email confirmed by enrichment and verification provider' },
  probable:   { label: 'Probable',   description: 'Email identified through a reputable enrichment source' },
  unverified: { label: 'Unverified', description: 'Email identified but could not be independently verified' },
  catch_all:  { label: 'Catch-all',  description: 'Domain accepts all incoming email — deliverability unconfirmed' },
  invalid:    { label: 'Invalid',    description: 'Email address is not deliverable' },
  not_found:  { label: 'Not found',  description: 'No sufficiently reliable email could be identified' },
};

export function VerificationStatus({ status, size = 'md' }: VerificationStatusProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_found;

  return (
    <span
      className={`status-badge status-${status}`}
      title={config.description}
      role="status"
      aria-label={`Email status: ${config.label}`}
      style={{ fontSize: size === 'sm' ? '10px' : '11px' }}
    >
      {status === 'verified' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {config.label}
    </span>
  );
}
