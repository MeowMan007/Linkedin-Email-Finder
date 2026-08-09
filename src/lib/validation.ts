// ============================================================
// LinkedIn URL Validation & Normalization
// ============================================================

import { ValidationResult } from '@/types';

const LINKEDIN_PROFILE_REGEX =
  /^https?:\/\/(www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_.%]+)\/?/;

const LINKEDIN_HOST_REGEX =
  /^https?:\/\/(www\.)?linkedin\.com/;

/**
 * Normalize a LinkedIn profile URL:
 * - Strips query params and fragments
 * - Normalizes scheme to https
 * - Adds trailing slash
 * - Lowercases the slug
 */
export function normalizeLinkedInUrl(url: string): string {
  const match = url.match(LINKEDIN_PROFILE_REGEX);
  if (!match) return url;
  const slug = match[2].toLowerCase().replace(/\/$/, '');
  return `https://www.linkedin.com/in/${slug}/`;
}

/**
 * Extract the profile slug (identifier) from a LinkedIn URL.
 * e.g. "https://www.linkedin.com/in/john-doe/" → "john-doe"
 */
export function extractLinkedInSlug(url: string): string | null {
  const match = url.match(LINKEDIN_PROFILE_REGEX);
  if (!match) return null;
  return match[2].toLowerCase().replace(/\/$/, '');
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

  // Must look like a URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error:
        'That doesn\'t look like a valid URL. Please paste the full LinkedIn profile link.',
    };
  }

  // Must be LinkedIn
  if (!LINKEDIN_HOST_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        'Please enter a LinkedIn profile URL (linkedin.com/in/...).',
    };
  }

  // Must not be a company/job/school page
  const pathname = parsed.pathname.toLowerCase();
  if (
    pathname.startsWith('/company/') ||
    pathname.startsWith('/jobs/') ||
    pathname.startsWith('/school/') ||
    pathname.startsWith('/pub/') ||
    pathname.startsWith('/posts/') ||
    pathname.startsWith('/feed/')
  ) {
    return {
      valid: false,
      error:
        'Please enter a personal profile URL (linkedin.com/in/...), not a company, job, or other page.',
    };
  }

  // Must match the /in/<slug> pattern
  const match = trimmed.match(LINKEDIN_PROFILE_REGEX);
  if (!match) {
    return {
      valid: false,
      error:
        'Please enter a personal LinkedIn profile URL in the format: linkedin.com/in/firstname-lastname',
    };
  }

  const slug = match[2].toLowerCase().replace(/\/$/, '');

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
 * Validate an email address syntax.
 */
export function validateEmailSyntax(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
