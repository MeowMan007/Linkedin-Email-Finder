// ============================================================
// LinkedIn URL Validation & Normalization
// ============================================================

import { ValidationResult } from '@/types';

// Matches standard and country-subdomain LinkedIn profile URLs
// e.g. https://www.linkedin.com/in/john-doe
//      https://in.linkedin.com/in/john-doe
//      http://linkedin.com/in/john-doe/
//      linkedin.com/in/john-doe
const LINKEDIN_PROFILE_REGEX =
  /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_.%]+)(?:\/.*|\?.*)?$/i;

const LINKEDIN_HOST_REGEX =
  /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?(?:www\.)?linkedin\.com/i;

/**
 * Clean and ensure scheme for any URL or URL-like input
 */
export function sanitizeUrlInput(url: string): string {
  let trimmed = (url ?? '').trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Normalize a LinkedIn profile URL:
 * - Strips query params, fragments, and tracking attributes
 * - Normalizes scheme to https://www.linkedin.com/in/<slug>/
 * - Lowercases the slug
 */
export function normalizeLinkedInUrl(url: string): string {
  const cleanInput = sanitizeUrlInput(url);
  const match = cleanInput.match(LINKEDIN_PROFILE_REGEX);
  if (!match) return url;
  const slug = match[1].toLowerCase().replace(/\/$/, '');
  return `https://www.linkedin.com/in/${slug}/`;
}

/**
 * Extract the profile slug (identifier) from a LinkedIn URL.
 * e.g. "https://in.linkedin.com/in/john-doe?param=1" → "john-doe"
 */
export function extractLinkedInSlug(url: string): string | null {
  const cleanInput = sanitizeUrlInput(url);
  const match = cleanInput.match(LINKEDIN_PROFILE_REGEX);
  if (!match) return null;
  return match[1].toLowerCase().replace(/\/$/, '');
}

/**
 * Validate that the provided string is a valid LinkedIn personal profile URL.
 *
 * Rejects:
 *   - Empty/missing input
 *   - Non-URL strings
 *   - Non-LinkedIn domains
 *   - Company, job, school pages (/company/, /jobs/, /school/)
 *   - Malformed /in/ paths
 */
export function validateLinkedInUrl(url: string): ValidationResult {
  const trimmed = (url ?? '').trim();

  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter a LinkedIn profile URL.',
    };
  }

  const fullUrl = sanitizeUrlInput(trimmed);

  // Must look like a URL
  let parsed: URL;
  try {
    parsed = new URL(fullUrl);
  } catch {
    return {
      valid: false,
      error:
        'That doesn\'t look like a valid URL. Please paste the full LinkedIn profile link.',
    };
  }

  // Must be LinkedIn host
  if (!LINKEDIN_HOST_REGEX.test(fullUrl)) {
    return {
      valid: false,
      error:
        'Please enter a LinkedIn profile URL (linkedin.com/in/...).',
    };
  }

  // Must not be a company/job/school/post page
  const pathname = parsed.pathname.toLowerCase();
  if (
    pathname.startsWith('/company/') ||
    pathname.startsWith('/jobs/') ||
    pathname.startsWith('/school/') ||
    pathname.startsWith('/pub/') ||
    pathname.startsWith('/posts/') ||
    pathname.startsWith('/feed/') ||
    pathname.startsWith('/pulse/')
  ) {
    return {
      valid: false,
      error:
        'Please enter a personal profile URL (linkedin.com/in/...), not a company, job, or feed page.',
    };
  }

  // Must match the /in/<slug> pattern
  const match = fullUrl.match(LINKEDIN_PROFILE_REGEX);
  if (!match) {
    return {
      valid: false,
      error:
        'Please enter a personal LinkedIn profile URL in the format: linkedin.com/in/firstname-lastname',
    };
  }

  const slug = match[1].toLowerCase().replace(/\/$/, '');

  // Slug must not be empty or too short
  if (slug.length < 2) {
    return {
      valid: false,
      error: 'The LinkedIn profile identifier appears to be too short.',
    };
  }

  const normalized = `https://www.linkedin.com/in/${slug}/`;

  return {
    valid: true,
    normalizedUrl: normalized,
    slug,
  };
}

/**
 * Validate an email address syntax according to RFC 5322 basics.
 */
export function validateEmailSyntax(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  const [local, domain] = email.split('@');
  if (!local || !domain || local.length > 64 || domain.length > 253) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return true;
}
