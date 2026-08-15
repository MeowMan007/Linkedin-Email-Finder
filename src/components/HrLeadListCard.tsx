'use client';

import React, { useState } from 'react';
import { CompanyHrSearchResponse, HrLead } from '@/types';
import { CopyButton } from './CopyButton';
import { VerificationStatus } from './VerificationStatus';
import { pingEmailSmtp } from '@/lib/api';

interface HrLeadListCardProps {
  data: CompanyHrSearchResponse;
}

export function HrLeadListCard({ data }: HrLeadListCardProps) {
  const { companyName, companyDomain, mailProvider, mxServer, totalFound, leads } = data;
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [pingingMap, setPingingMap] = useState<Record<string, boolean>>({});
  const [pingResults, setPingResults] = useState<Record<string, { code: number; verdict: string }>>({});

  const handleCopyAll = () => {
    const emails = leads.map((l) => l.primaryEmail).filter(Boolean).join('\n');
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['Full Name', 'First Name', 'Last Name', 'Job Title', 'Company', 'Domain', 'Work Email', 'Status'];
    const rows = leads.map((l) => [
      `"${l.fullName}"`,
      `"${l.firstName}"`,
      `"${l.lastName}"`,
      `"${l.jobTitle}"`,
      `"${companyName}"`,
      `"${companyDomain}"`,
      `"${l.primaryEmail}"`,
      `"${l.emailStatus}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${companyDomain || companyName}-hr-leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePingPermutation = async (email: string) => {
    setPingingMap((prev) => ({ ...prev, [email]: true }));
    try {
      const res = await pingEmailSmtp(email);
      setPingResults((prev) => ({
        ...prev,
        [email]: { code: res.smtpStatusCode ?? 250, verdict: res.verdictLabel },
      }));
    } catch {
      // ignore
    } finally {
      setPingingMap((prev) => ({ ...prev, [email]: false }));
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="card-raised">
        {/* Header summary */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {companyName}
              </h2>
              <span style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '2px 8px',
              }}>
                {companyDomain}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {totalFound} HR & Talent Acquisition professionals discovered · {mailProvider}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyAll}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {copiedAll ? 'Copied All' : 'Copy All Emails'}
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-900)',
                background: 'var(--color-900)',
                color: 'var(--color-white)',
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="divider" style={{ marginBottom: '16px' }} />

        {/* Lead List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {leads.map((lead) => {
            const isExpanded = expandedLeadId === lead.id;

            return (
              <div
                key={lead.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--surface)',
                  padding: '14px 16px',
                  transition: 'border-color 120ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {lead.fullName}
                      </h3>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {lead.jobTitle}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}>
                        {lead.primaryEmail}
                      </span>
                      <VerificationStatus status={lead.emailStatus} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <CopyButton text={lead.primaryEmail} label="Copy email" />
                    <button
                      type="button"
                      onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? 'Hide' : 'Permutations'}
                    </button>
                  </div>
                </div>

                {/* Expandable Permutations List */}
                {isExpanded && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
                      Candidate Email Permutations
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {lead.permutations.map((perm) => {
                        const ping = pingResults[perm.email];
                        const isPinging = pingingMap[perm.email];

                        return (
                          <div
                            key={perm.email}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              background: 'var(--bg-subtle)',
                              borderRadius: '4px',
                              fontSize: '12px',
                              gap: '8px',
                            }}
                          >
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                              {perm.email}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {ping ? (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: ping.code === 250 ? '#10b981' : '#ef4444',
                                }}>
                                  {ping.verdict}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePingPermutation(perm.email)}
                                  disabled={isPinging}
                                  style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '3px',
                                    background: 'var(--surface)',
                                    color: 'var(--text-secondary)',
                                    cursor: isPinging ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {isPinging ? 'Checking...' : 'Verify SMTP'}
                                </button>
                              )}
                              <CopyButton text={perm.email} label="Copy" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
