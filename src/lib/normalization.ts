// ============================================================
// URL Normalization & Hashing Utilities
// ============================================================

import { normalizeLinkedInUrl } from './validation';

/**
 * Hash a LinkedIn URL for use as a cache/DB key.
 * Uses a fast, deterministic string hash (not cryptographic).
 */
export function hashLinkedInUrl(url: string): string {
  const normalized = normalizeLinkedInUrl(url);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32-bit integer
  }
  // Combine with a prefix for readability and to avoid negative values
  const positive = (hash >>> 0).toString(16).padStart(8, '0');
  return `li_${positive}`;
}

/**
 * Normalize a company name for matching purposes.
 * Strips common suffixes, lowercases, removes extra whitespace.
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|limited|co|gmbh|ag|sa|sas|plc|nv|bv|pty)\b\.?/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize a domain for matching.
 * Strips www, protocol, and paths.
 */
export function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim();
}

/**
 * Extract root domain from a URL or domain string.
 * e.g. "https://careers.microsoft.com/jobs" → "microsoft.com"
 */
export function extractRootDomain(url: string): string {
  const normalized = normalizeDomain(url);
  const parts = normalized.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return normalized;
}

/**
 * Generate possible email patterns from a name and domain.
 * Returns them in order from most common to least common.
 */
export function generateEmailPatterns(
  firstName: string,
  lastName: string,
  domain: string
): Array<{ email: string; pattern: string }> {
  const f = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const l = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const fi = f[0] ?? '';
  const li = l[0] ?? '';

  if (!f || !l || !domain) return [];

  return [
    { email: `${f}.${l}@${domain}`, pattern: 'firstname.lastname' },
    { email: `${f}@${domain}`, pattern: 'firstname' },
    { email: `${fi}${l}@${domain}`, pattern: 'flastname' },
    { email: `${f}${li}@${domain}`, pattern: 'firstnamel' },
    { email: `${l}@${domain}`, pattern: 'lastname' },
    { email: `${fi}.${l}@${domain}`, pattern: 'f.lastname' },
    { email: `${f}${l}@${domain}`, pattern: 'firstnamelastname' },
    { email: `${f}_${l}@${domain}`, pattern: 'firstname_lastname' },
    { email: `${fi}${li}@${domain}`, pattern: 'fl' },
  ];
}
