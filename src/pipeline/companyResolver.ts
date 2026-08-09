// ============================================================
// Company Resolver — Stage 2
// Resolves current employer and company domain
// ============================================================

import { LinkedInProfile, CompanyInfo } from '@/types';
import { normalizeDomain, extractRootDomain } from '@/lib/normalization';
import { logger } from '@/lib/logger';

export interface CompanyResolverResult {
  company: CompanyInfo | null;
  warnings: string[];
  error?: string;
}

/**
 * Resolve the company domain from the profile's company information.
 *
 * Priority:
 * 1. Domain provided directly in profile data
 * 2. Clearbit (public) company lookup
 * 3. Domain extracted from company URL in profile
 */
export async function resolveCompany(
  profile: LinkedInProfile,
  requestId?: string
): Promise<CompanyResolverResult> {
  const warnings: string[] = [];

  if (!profile.currentCompany) {
    return {
      company: null,
      warnings,
      error:
        'We couldn\'t confidently identify the person\'s current employer. Please check that the LinkedIn profile is public and lists a current employer.',
    };
  }

  const companyName = profile.currentCompany;
  const start = Date.now();

  // Try to extract domain from the profile's company URL
  let domainFromProfile: string | null = null;
  if (profile.companyUrl) {
    domainFromProfile = extractRootDomain(profile.companyUrl);
    // Skip if it's a LinkedIn URL itself
    if (domainFromProfile.includes('linkedin.com')) {
      domainFromProfile = null;
    }
  }

  // Try Clearbit (public, no key needed for basic lookup)
  let clearbitDomain: string | null = null;
  try {
    clearbitDomain = await resolveViaClearbit(companyName, requestId);
  } catch {
    warnings.push('Company domain lookup via public registry was unavailable.');
  }

  const domain = clearbitDomain ?? domainFromProfile;

  const duration = Date.now() - start;

  if (!domain) {
    logger.warn('company_resolver_no_domain', {
      operation: 'resolve_company',
      request_id: requestId,
      duration_ms: duration,
      status: 'error',
    });
    return {
      company: null,
      warnings,
      error:
        `We identified the employer as "${companyName}" but couldn't resolve their official domain. Email enrichment requires a verified company domain.`,
    };
  }

  const normalizedDomain = normalizeDomain(domain);

  // Sanity check — reject obvious personal email domains
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'live.com',
  ];
  if (personalDomains.includes(normalizedDomain)) {
    return {
      company: null,
      warnings,
      error: 'The resolved domain appears to be a personal email provider, not a company domain.',
    };
  }

  const confidence = clearbitDomain ? 0.9 : 0.65;

  logger.info('company_resolver_success', {
    operation: 'resolve_company',
    request_id: requestId,
    duration_ms: duration,
    status: 'success',
  });

  return {
    company: {
      name: companyName,
      domain: normalizedDomain,
      website: `https://${normalizedDomain}`,
      confidence,
    },
    warnings,
  };
}

/**
 * Use Clearbit's free public autocomplete API to resolve a company domain.
 * No API key required. Returns the best-matching domain or null.
 */
async function resolveViaClearbit(
  companyName: string,
  requestId?: string
): Promise<string | null> {
  const encoded = encodeURIComponent(companyName);
  const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encoded}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) return null;

  const results: Array<{ name: string; domain: string }> = await response.json();

  if (!results || results.length === 0) return null;

  // Find the best match by comparing normalized company names
  const normalizedQuery = companyName.toLowerCase().replace(/\s+/g, '');
  const best = results.find((r) => {
    const n = (r.name ?? '').toLowerCase().replace(/\s+/g, '');
    return n === normalizedQuery || n.includes(normalizedQuery) || normalizedQuery.includes(n);
  });

  logger.debug('clearbit_result', {
    operation: 'clearbit_lookup',
    request_id: requestId,
    message: best ? `Matched: ${best.name} → ${best.domain}` : 'No match',
  });

  return best?.domain ?? results[0]?.domain ?? null;
}
