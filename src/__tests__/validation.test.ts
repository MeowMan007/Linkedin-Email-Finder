// ============================================================
// URL Validation Tests
// ============================================================

import { validateLinkedInUrl, extractLinkedInSlug, normalizeLinkedInUrl } from '../lib/validation';

describe('validateLinkedInUrl', () => {
  describe('valid URLs', () => {
    const validUrls = [
      'https://www.linkedin.com/in/john-doe',
      'https://www.linkedin.com/in/john-doe/',
      'https://linkedin.com/in/john-doe',
      'http://www.linkedin.com/in/john-doe',
      'https://www.linkedin.com/in/jane_smith-123',
    ];

    test.each(validUrls)('accepts: %s', (url) => {
      const result = validateLinkedInUrl(url);
      expect(result.valid).toBe(true);
      expect(result.slug).toBeTruthy();
      expect(result.normalizedUrl).toMatch(/^https:\/\/www\.linkedin\.com\/in\//);
    });
  });

  describe('invalid URLs', () => {
    it('rejects empty string', () => {
      expect(validateLinkedInUrl('').valid).toBe(false);
    });

    it('rejects non-URL string', () => {
      expect(validateLinkedInUrl('john doe').valid).toBe(false);
    });

    it('rejects non-LinkedIn URL', () => {
      expect(validateLinkedInUrl('https://google.com/in/profile').valid).toBe(false);
    });

    it('rejects company page', () => {
      expect(validateLinkedInUrl('https://www.linkedin.com/company/microsoft').valid).toBe(false);
    });

    it('rejects job posting', () => {
      expect(validateLinkedInUrl('https://www.linkedin.com/jobs/view/123456').valid).toBe(false);
    });

    it('rejects school page', () => {
      expect(validateLinkedInUrl('https://www.linkedin.com/school/mit').valid).toBe(false);
    });
  });

  describe('URL normalization', () => {
    it('strips query params', () => {
      const result = validateLinkedInUrl('https://www.linkedin.com/in/john-doe?trk=share');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://www.linkedin.com/in/john-doe/');
    });

    it('normalizes to lowercase slug', () => {
      const result = validateLinkedInUrl('https://www.linkedin.com/in/John-Doe');
      expect(result.normalizedUrl).toBe('https://www.linkedin.com/in/john-doe/');
    });

    it('adds trailing slash', () => {
      const result = validateLinkedInUrl('https://www.linkedin.com/in/profile');
      expect(result.normalizedUrl?.endsWith('/')).toBe(true);
    });
  });
});

describe('extractLinkedInSlug', () => {
  it('extracts slug from full URL', () => {
    expect(extractLinkedInSlug('https://www.linkedin.com/in/john-doe/')).toBe('john-doe');
  });

  it('returns null for invalid URL', () => {
    expect(extractLinkedInSlug('https://google.com')).toBeNull();
  });
});

describe('normalizeLinkedInUrl', () => {
  it('normalizes to canonical form', () => {
    expect(normalizeLinkedInUrl('https://linkedin.com/in/John-Doe?trk=abc'))
      .toBe('https://www.linkedin.com/in/john-doe/');
  });
});
