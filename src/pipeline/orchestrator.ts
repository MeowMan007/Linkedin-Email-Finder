// ============================================================
// Pipeline Orchestrator
// Coordinates all enrichment stages end-to-end
// ============================================================

import { EnrichmentResult } from '@/types';
import { validateLinkedInUrl } from '@/lib/validation';
import { hashLinkedInUrl } from '@/lib/normalization';
import { calculateConfidence } from '@/lib/confidence';
import { getCachedResult, saveSearchRecord } from '@/lib/db';
import { logger } from '@/lib/logger';
import { resolveProfile } from './profileResolver';
import { resolveCompany } from './companyResolver';
import { discoverEmail } from './emailDiscovery';
import { verifyEmail } from './emailVerification';

const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS ?? '24', 10);

export interface OrchestratorResult {
  result: EnrichmentResult | null;
  error?: string;
  httpStatus?: number;
}

/**
 * Run the full enrichment pipeline for a LinkedIn URL.
 *
 * Stages:
 *   1. Validate + normalize URL
 *   2. Cache lookup
 *   3. Profile resolution
 *   4. Company resolution
 *   5. Email discovery (waterfall)
 *   6. Email verification
 *   7. Confidence scoring
 *   8. Cache store + DB save
 */
export async function runEnrichmentPipeline(
  rawUrl: string,
  options: {
    requestId?: string;
    userId?: string | null;
    skipCache?: boolean;
  } = {}
): Promise<OrchestratorResult> {
  const { requestId, userId, skipCache = false } = options;

  // ── Stage 1: Validate ──────────────────────────────────────
  const validation = validateLinkedInUrl(rawUrl);
  if (!validation.valid) {
    return {
      result: null,
      error: validation.error,
      httpStatus: 400,
    };
  }

  const normalizedUrl = validation.normalizedUrl!;
  const urlHash = hashLinkedInUrl(normalizedUrl);

  logger.info('pipeline_start', {
    operation: 'enrichment_pipeline',
    request_id: requestId,
    linkedin_url_hash: urlHash,
  });

  // ── Stage 2: Cache lookup ──────────────────────────────────
  if (!skipCache) {
    const cached = await getCachedResult(urlHash, CACHE_TTL_HOURS);
    if (cached) {
      logger.info('pipeline_cache_hit', {
        operation: 'enrichment_pipeline',
        request_id: requestId,
        linkedin_url_hash: urlHash,
        status: 'cached',
      });
      return {
        result: { ...cached, cached: true },
      };
    }
  }

  const allSources: string[] = [];
  const allWarnings: string[] = [];

  // ── Stage 3: Profile Resolution ────────────────────────────
  const profileResult = await resolveProfile(normalizedUrl, requestId);

  if (profileResult.warnings.length) allWarnings.push(...profileResult.warnings);

  if (!profileResult.profile) {
    return {
      result: null,
      error: profileResult.error ?? 'Could not resolve profile information.',
      httpStatus: 404,
    };
  }

  if (profileResult.providerUsed) allSources.push(profileResult.providerUsed);
  const profile = profileResult.profile;

  // ── Stage 4: Company Resolution ────────────────────────────
  const companyResult = await resolveCompany(profile, requestId);

  if (companyResult.warnings.length) allWarnings.push(...companyResult.warnings);

  if (!companyResult.company) {
    // Still return partial result even if company couldn't be resolved
    const partialConfidence = calculateConfidence({
      identityMatched: !!profile.fullName,
      currentCompanyMatched: false,
      domainMatched: false,
      emailFromProvider: false,
      emailVerified: false,
    });

    return {
      result: null,
      error: companyResult.error ?? 'Could not resolve company domain.',
      httpStatus: 422,
    };
  }

  const company = companyResult.company;
  if (!allSources.includes('Clearbit')) {
    allSources.push('Clearbit Company Registry');
  }

  // ── Stage 5: Email Discovery ───────────────────────────────
  const discoveryResult = await discoverEmail(profile, company, requestId);

  if (discoveryResult.warnings.length) allWarnings.push(...discoveryResult.warnings);
  if (discoveryResult.tried.length > 0) {
    for (const provider of discoveryResult.tried) {
      if (!allSources.includes(provider)) allSources.push(provider);
    }
  }

  // ── Stage 6: Email Verification ────────────────────────────
  let emailResult = discoveryResult.email;

  if (emailResult) {
    const verificationResult = await verifyEmail(emailResult, requestId);
    emailResult = verificationResult.email;
    if (!allSources.includes('Email Verification')) {
      allSources.push('Hunter.io Email Verification');
    }
  }

  // ── Stage 7: Confidence Scoring ────────────────────────────
  const confidence = calculateConfidence({
    identityMatched: !!profile.fullName,
    currentCompanyMatched: !!company.name,
    domainMatched: !!company.domain,
    emailFromProvider: !!emailResult,
    emailVerified:
      emailResult?.status === 'verified' || emailResult?.status === 'probable',
  });

  // ── Stage 8: Assemble + Store ──────────────────────────────
  const enrichmentResult: EnrichmentResult = {
    person: {
      name: profile.fullName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      title: profile.jobTitle,
      company: company.name,
      linkedinUrl: normalizedUrl,
      location: profile.location,
    },
    company,
    email: emailResult,
    confidence,
    sources: allSources,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
    timestamp: new Date().toISOString(),
  };

  // Save to DB (non-blocking — don't let DB failure stop the response)
  saveSearchRecord({
    linkedinUrl: normalizedUrl,
    linkedinUrlHash: urlHash,
    result: enrichmentResult,
    userId,
  }).catch((err) => {
    logger.error('pipeline_save_failed', {
      operation: 'enrichment_pipeline',
      request_id: requestId,
      error_type: err instanceof Error ? err.constructor.name : 'unknown',
    });
  });

  logger.info('pipeline_complete', {
    operation: 'enrichment_pipeline',
    request_id: requestId,
    linkedin_url_hash: urlHash,
    status: 'success',
  });

  return { result: enrichmentResult };
}

/**
 * Run enrichment directly using person name and company / domain (Zero LinkedIn scraping required)
 */
export async function runDirectEnrichmentPipeline(
  input: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    companyName?: string;
    companyDomain?: string;
    linkedinUrl?: string;
  },
  options: {
    requestId?: string;
    userId?: string | null;
  } = {}
): Promise<OrchestratorResult> {
  const { requestId, userId } = options;

  let fullName = (input.fullName ?? '').trim();
  let firstName = (input.firstName ?? '').trim();
  let lastName = (input.lastName ?? '').trim();

  if (!fullName && (firstName || lastName)) {
    fullName = `${firstName} ${lastName}`.trim();
  } else if (fullName && (!firstName || !lastName)) {
    const parts = fullName.split(' ');
    firstName = parts[0] ?? '';
    lastName = parts.slice(1).join(' ');
  }

  if (!fullName && !firstName) {
    return {
      result: null,
      error: 'Please provide a person\'s name (first and last name).',
      httpStatus: 400,
    };
  }

  const companyName = (input.companyName ?? '').trim();
  let domain = (input.companyDomain ?? '').trim();

  if (!companyName && !domain) {
    return {
      result: null,
      error: 'Please provide a company name or official website domain.',
      httpStatus: 400,
    };
  }

  const allSources: string[] = ['Direct Input'];
  const allWarnings: string[] = [];

  // Resolve company domain if not directly provided
  if (!domain && companyName) {
    const { resolveCompanyDomain } = await import('@/lib/domainResolver');
    const resolved = await resolveCompanyDomain(companyName, undefined, requestId);
    if (!resolved || !resolved.domain) {
      return {
        result: null,
        error: `Could not resolve official domain for company "${companyName}". Please provide their domain (e.g. acme.com).`,
        httpStatus: 422,
      };
    }
    domain = resolved.domain;
    allSources.push(resolved.source === 'curated_directory' ? 'Curated Enterprise Directory' : 'Autonomous Domain Resolver');
  }

  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

  const profile = {
    linkedinUrl: input.linkedinUrl ?? `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}/`,
    linkedinSlug: `${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    fullName,
    firstName,
    lastName,
    currentCompany: companyName || cleanDomain,
    jobTitle: 'Professional',
  };

  const company = {
    name: companyName || cleanDomain,
    domain: cleanDomain,
    website: `https://${cleanDomain}`,
    confidence: 0.95,
  };

  // Discover email & candidate permutations
  const discoveryResult = await discoverEmail(profile, company, requestId);
  if (discoveryResult.warnings.length) allWarnings.push(...discoveryResult.warnings);
  if (discoveryResult.tried.length) {
    for (const provider of discoveryResult.tried) {
      if (!allSources.includes(provider)) allSources.push(provider);
    }
  }

  let emailResult = discoveryResult.email;

  // Compute confidence
  const confidence = calculateConfidence({
    identityMatched: !!profile.fullName,
    currentCompanyMatched: !!company.name,
    domainMatched: !!company.domain,
    emailFromProvider: !!emailResult,
    emailVerified: emailResult?.status === 'verified' || emailResult?.status === 'probable',
  });

  const enrichmentResult: EnrichmentResult = {
    person: {
      name: profile.fullName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      title: profile.jobTitle,
      company: company.name,
      linkedinUrl: profile.linkedinUrl,
    },
    company,
    email: emailResult,
    confidence,
    sources: allSources,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
    timestamp: new Date().toISOString(),
  };

  // Save to DB (non-blocking)
  const urlHash = hashLinkedInUrl(profile.linkedinUrl);
  saveSearchRecord({
    linkedinUrl: profile.linkedinUrl,
    linkedinUrlHash: urlHash,
    result: enrichmentResult,
    userId,
  }).catch(() => {});

  return { result: enrichmentResult };
}
