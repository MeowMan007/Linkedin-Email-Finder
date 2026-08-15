// ============================================================
// Profile Resolver — Stage 1
// Resolves identity information from a LinkedIn URL
// ============================================================

import { LinkedInProfile } from '@/types';
import { validateLinkedInUrl, extractLinkedInSlug } from '@/lib/validation';
import { ProfileWaterfallEngine } from '@/providers';
import { ProspeoProfileProvider } from '@/providers/prospeo';
import { ApolloProfileProvider } from '@/providers/apollo';
import { HunterProfileProvider } from '@/providers/hunter';
import { InHouseProfileProvider } from '@/providers/inhouse';
import { logger } from '@/lib/logger';

// Register profile providers in priority order — InHouse first!
const profileEngine = new ProfileWaterfallEngine([
  InHouseProfileProvider, // Self-contained open search, OpenGraph & slug parsing
  ProspeoProfileProvider, // Prospeo API if key present
  ApolloProfileProvider,  // Apollo API if key present
  HunterProfileProvider,  // Hunter API if key present
]);

export interface ProfileResolverResult {
  profile: LinkedInProfile | null;
  providerUsed: string | null;
  warnings: string[];
  error?: string;
}

/**
 * Resolve a LinkedIn profile from a URL.
 * Returns null if the URL is invalid or no profile could be found.
 */
export async function resolveProfile(
  linkedinUrl: string,
  requestId?: string
): Promise<ProfileResolverResult> {
  const validation = validateLinkedInUrl(linkedinUrl);

  if (!validation.valid) {
    return {
      profile: null,
      providerUsed: null,
      warnings: [],
      error: validation.error,
    };
  }

  const normalizedUrl = validation.normalizedUrl!;
  const slug = validation.slug!;

  const start = Date.now();

  const { profile: raw, providerUsed, warnings } = await profileEngine.run(
    normalizedUrl,
    requestId
  );

  const duration = Date.now() - start;

  if (!raw) {
    logger.warn('profile_resolver_no_result', {
      operation: 'resolve_profile',
      request_id: requestId,
      duration_ms: duration,
      status: 'error',
    });
    return {
      profile: null,
      providerUsed: null,
      warnings,
      error:
        'We couldn\'t retrieve profile information for this LinkedIn URL. The profile may be private, removed, or not yet indexed.',
    };
  }

  // Ensure mandatory fields are present
  const firstName = raw.firstName ?? '';
  const lastName = raw.lastName ?? '';
  const fullName = raw.fullName ?? `${firstName} ${lastName}`.trim();

  if (!fullName) {
    return {
      profile: null,
      providerUsed,
      warnings,
      error: 'We couldn\'t identify the person\'s name from this profile.',
    };
  }

  const profile: LinkedInProfile = {
    linkedinUrl: normalizedUrl,
    linkedinSlug: slug,
    fullName,
    firstName,
    lastName,
    headline: raw.headline,
    jobTitle: raw.jobTitle,
    currentCompany: raw.currentCompany,
    companyUrl: raw.companyUrl,
    location: raw.location,
    raw: raw.raw,
  };

  logger.info('profile_resolver_success', {
    operation: 'resolve_profile',
    request_id: requestId,
    provider: providerUsed ?? undefined,
    duration_ms: duration,
    status: 'success',
  });

  return { profile, providerUsed, warnings };
}
