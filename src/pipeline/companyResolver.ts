// ============================================================
// Company Resolver — Stage 2
// Resolves current employer and company domain
// ============================================================

import { LinkedInProfile, CompanyInfo } from '@/types';
import { normalizeDomain } from '@/lib/normalization';
import { resolveCompanyDomain } from '@/lib/domainResolver';
import { logger } from '@/lib/logger';

export interface CompanyResolverResult {
  company: CompanyInfo | null;
  warnings: string[];
  error?: string;
}

/**
 * Resolve the company domain from the profile's company information.
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

  const domainResult = await resolveCompanyDomain(
    companyName,
    profile.companyUrl,
    requestId
  );

  const duration = Date.now() - start;

  if (!domainResult || !domainResult.domain) {
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

  const normalizedDomain = normalizeDomain(domainResult.domain);

  logger.info('company_resolver_success', {
    operation: 'resolve_company',
    request_id: requestId,
    domain: normalizedDomain,
    source: domainResult.source,
    confidence: domainResult.confidence,
    duration_ms: duration,
    status: 'success',
  });

  return {
    company: {
      name: companyName,
      domain: normalizedDomain,
      website: `https://${normalizedDomain}`,
      confidence: domainResult.confidence,
    },
    warnings,
  };
}
