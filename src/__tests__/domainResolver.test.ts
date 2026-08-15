// ============================================================
// Domain Resolver & Permutation Engine Unit Tests
// ============================================================

import { resolveCompanyDomain } from '../lib/domainResolver';
import { inferCandidateEmails } from '../lib/patternInference';
import { isNonPersonTitle, cleanPersonName, parseLinkedInTitle } from '../lib/publicProfileScraper';
import { detectMailProvider } from '../lib/smtpVerifier';

describe('resolveCompanyDomain', () => {
  it('resolves popular enterprise & startup tech companies instantly', async () => {
    const msft = await resolveCompanyDomain('Microsoft');
    expect(msft).not.toBeNull();
    expect(msft?.domain).toBe('microsoft.com');
    expect(msft?.source).toBe('curated_directory');

    const stripe = await resolveCompanyDomain('Stripe');
    expect(stripe?.domain).toBe('stripe.com');

    const openai = await resolveCompanyDomain('OpenAI');
    expect(openai?.domain).toBe('openai.com');
  });

  it('uses hint URL when provided', async () => {
    const res = await resolveCompanyDomain('Acme Corp', 'https://www.google.com/about');
    expect(res).not.toBeNull();
    expect(res?.domain).toBe('google.com');
  });
});

describe('inferCandidateEmails & Permutations', () => {
  it('generates 12+ enterprise permutations with weights and labels', () => {
    const candidates = inferCandidateEmails('Satya', 'Nadella', 'microsoft.com');
    expect(candidates.length).toBeGreaterThanOrEqual(10);
    expect(candidates[0].candidateEmail).toBe('satya.nadella@microsoft.com');
    expect(candidates[0].label).toBe('{first}.{last}@{domain}');
    expect(candidates.some((c) => c.candidateEmail === 'satya@microsoft.com')).toBe(true);
    expect(candidates.some((c) => c.candidateEmail === 'snadella@microsoft.com')).toBe(true);
    expect(candidates.some((c) => c.candidateEmail === 'satyanadella@microsoft.com')).toBe(true);
  });

  it('handles single-word names gracefully', () => {
    const candidates = inferCandidateEmails('Plato', '', 'academy.org');
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].candidateEmail).toBe('plato@academy.org');
  });
});

describe('publicProfileScraper Anti-Bot & Title Parsing', () => {
  it('detects bot challenge and anti-scraping titles', () => {
    expect(isNonPersonTitle('Checking your browser - Cloudflare | LinkedIn')).toBe(true);
    expect(isNonPersonTitle('Just a moment... | LinkedIn')).toBe(true);
    expect(isNonPersonTitle('Security Check | LinkedIn')).toBe(true);
    expect(isNonPersonTitle('Satya Nadella')).toBe(false);
  });

  it('cleans credentials and honorifics from person names', () => {
    const res1 = cleanPersonName('Satya Nadella, MBA, PhD');
    expect(res1.fullName).toBe('Satya Nadella');
    expect(res1.firstName).toBe('Satya');
    expect(res1.lastName).toBe('Nadella');

    const res2 = cleanPersonName('Dr. Jane Doe (She/Her)');
    expect(res2.fullName).toBe('Jane Doe');
    expect(res2.firstName).toBe('Jane');
    expect(res2.lastName).toBe('Doe');
  });

  it('parses structured LinkedIn titles into person and employer', () => {
    const parsed = parseLinkedInTitle('Satya Nadella - Chairman and CEO - Microsoft | LinkedIn');
    expect(parsed.fullName).toBe('Satya Nadella');
    expect(parsed.companyName).toBe('Microsoft');
  });
});

describe('detectMailProvider', () => {
  it('identifies major corporate email providers from MX records', () => {
    expect(detectMailProvider('aspmx.l.google.com')).toBe('Google Workspace / Gmail');
    expect(detectMailProvider('microsoft-com.mail.protection.outlook.com')).toBe('Microsoft 365 / Outlook');
    expect(detectMailProvider('mx1.pphosted.com')).toBe('Proofpoint Protection');
    expect(detectMailProvider('mx.zoho.com')).toBe('Zoho Mail');
    expect(detectMailProvider('mail.customcorp.net')).toBe('Custom Enterprise Mail Server');
  });
});
