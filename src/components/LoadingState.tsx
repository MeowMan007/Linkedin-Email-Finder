'use client';

import React, { useEffect, useState } from 'react';

export interface LoadingStep {
  id: string;
  label: string;
}

const STEPS: LoadingStep[] = [
  { id: 'validate',  label: 'Validating LinkedIn profile' },
  { id: 'profile',   label: 'Identifying person' },
  { id: 'company',   label: 'Resolving current employer' },
  { id: 'domain',    label: 'Resolving company domain' },
  { id: 'discover',  label: 'Searching enrichment providers' },
  { id: 'verify',    label: 'Verifying email address' },
];

type StepStatus = 'pending' | 'running' | 'done';

interface LoadingStateProps {
  active: boolean;
}

export function LoadingState({ active }: LoadingStateProps) {
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>(() =>
    Object.fromEntries(STEPS.map((s) => [s.id, 'pending']))
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStatuses(Object.fromEntries(STEPS.map((s) => [s.id, 'pending'])));
      setCurrentIndex(0);
      return;
    }

    // Animate through steps with realistic timing
    const timings = [400, 1000, 1800, 2600, 3400, 4200];

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((step, i) => {
      // Mark as running
      timeouts.push(
        setTimeout(() => {
          setCurrentIndex(i);
          setStatuses((prev) => ({ ...prev, [step.id]: 'running' }));
        }, timings[i])
      );

      // Mark as done (next step starts)
      if (i < STEPS.length - 1) {
        timeouts.push(
          setTimeout(() => {
            setStatuses((prev) => ({ ...prev, [step.id]: 'done' }));
          }, timings[i + 1] - 150)
        );
      }
    });

    return () => timeouts.forEach(clearTimeout);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="animate-fade-in"
      role="status"
      aria-label="Processing your request"
      aria-live="polite"
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: '28px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
      }}
    >
      <p style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-tertiary)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        margin: '0 0 20px',
      }}>
        Processing
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {STEPS.map((step) => {
          const status = statuses[step.id];
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: status === 'pending' ? 0.35 : 1,
                transition: 'opacity 200ms ease',
              }}
            >
              {/* Icon */}
              <div style={{ width: '18px', height: '18px', flexShrink: 0, position: 'relative' }}>
                {status === 'done' && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="8.25" stroke="var(--color-700)" strokeWidth="1.5"/>
                    <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="var(--color-700)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {status === 'running' && (
                  <div
                    className="animate-spin"
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid var(--border)',
                      borderTopColor: 'var(--color-700)',
                      borderRadius: '50%',
                    }}
                    aria-label="Loading"
                  />
                )}
                {status === 'pending' && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="8.25" stroke="var(--border-strong)" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: '14px',
                color: status === 'done'
                  ? 'var(--text-secondary)'
                  : status === 'running'
                  ? 'var(--text-primary)'
                  : 'var(--text-tertiary)',
                fontWeight: status === 'running' ? 500 : 400,
                transition: 'color 200ms ease',
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
