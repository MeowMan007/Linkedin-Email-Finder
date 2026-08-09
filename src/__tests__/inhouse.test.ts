// ============================================================
// In-House Engine & SMTP/DNS Unit Tests
// ============================================================

import { InHouseEmailProvider, InHouseProfileProvider } from '../providers/inhouse';
import { inferCandidateEmails } from '../lib/patternInference';
import { resolveDomainMx } from '../lib/dnsResolver';

describe('InHouseEmailProvider', () => {
  it('is always configured and active by default', () => {
    expect(InHouseEmailProvider.isConfigured()).toBe(true);
  });

  it('generates correct candidate email patterns for a person', () => {
    const candidates = inferCandidateEmails('John', 'Doe', 'example.com');
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].candidateEmail).toBe('john.doe@example.com');
    expect(candidates.some((c) => c.candidateEmail === 'john@example.com')).toBe(true);
    expect(candidates.some((c) => c.candidateEmail === 'jdoe@example.com')).toBe(true);
  });
});

describe('InHouseProfileProvider', () => {
  it('parses name and title from LinkedIn slug', async () => {
    const profile = await InHouseProfileProvider.enrichProfile('https://linkedin.com/in/satya-nadella');
    expect(profile).not.toBeNull();
    expect(profile?.firstName).toBe('Satya');
    expect(profile?.lastName).toBe('Nadella');
    expect(profile?.fullName).toBe('Satya Nadella');
  });
});

describe('resolveDomainMx', () => {
  it('resolves MX records for known domains', async () => {
    const res = await resolveDomainMx('microsoft.com');
    expect(res.hasMx).toBe(true);
    expect(res.primaryMx).toBeTruthy();
  });
});
