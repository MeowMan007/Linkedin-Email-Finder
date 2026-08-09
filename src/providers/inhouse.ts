// ============================================================
// Self-Contained In-House Provider Adapter
// Zero external paid API dependencies!
// Performs direct DNS MX lookups, pattern inference, and direct SMTP probes.
// ============================================================

import {
  EmailEnrichmentProvider,
  ProfileEnrichmentProvider,
  ProviderInput,
  ProviderResult,
  LinkedInProfile,
  EmailStatus,
} from '@/types';

import { resolveDomainMx } from '@/lib/dnsResolver';
import { verifyEmailViaSmtp } from '@/lib/smtpVerifier';
import { inferCandidateEmails, detectDomainEmailFormat } from '@/lib/patternInference';
import { extractLinkedInSlug } from '@/lib/validation';
import { logger } from '@/lib/logger';

// ----------------------------
// In-House Email Enrichment Provider
// ----------------------------

export const InHouseEmailProvider: EmailEnrichmentProvider = {
  name: 'In-House Engine',

  isConfigured() {
    // Always available and active by default!
    return true;
  },

  async findEmail(input: ProviderInput): Promise<ProviderResult | null> {
    const { firstName, lastName, companyDomain } = input;
    const cleanDomain = companyDomain.toLowerCase().trim();

    logger.info('inhouse_provider_start', {
      operation: 'inhouse_find_email',
      domain: cleanDomain,
    });

    // 1. Verify domain has valid MX records
    const mxResult = await resolveDomainMx(cleanDomain);
    if (!mxResult.hasMx || !mxResult.primaryMx) {
      logger.info('inhouse_no_mx', {
        operation: 'inhouse_find_email',
        domain: cleanDomain,
      });
      return null;
    }

    // 2. Generate weighted pattern candidates
    const candidates = inferCandidateEmails(firstName, lastName, cleanDomain);
    if (candidates.length === 0) return null;

    // 3. Try to detect domain-wide format preference from public page
    const detectedFormat = await detectDomainEmailFormat(cleanDomain);
    if (detectedFormat) {
      const preferred = candidates.find((c) => c.pattern === detectedFormat);
      if (preferred) {
        preferred.weight += 50; // Boost weight of detected format
        candidates.sort((a, b) => b.weight - a.weight);
      }
    }

    // 4. Test candidate emails against MX server via SMTP RCPT TO
    for (const candidate of candidates.slice(0, 4)) {
      const verification = await verifyEmailViaSmtp(candidate.candidateEmail);

      if (verification.smtpValid) {
        const status: EmailStatus = verification.isCatchAll ? 'catch_all' : 'verified';
        const confidence = verification.isCatchAll ? 72 : 92;

        logger.info('inhouse_email_found', {
          operation: 'inhouse_find_email',
          email: candidate.candidateEmail,
          status: 'success',
          emailStatus: status,
          confidence,
        });

        return {
          email: candidate.candidateEmail,
          status,
          confidence,
          providerName: 'In-House Engine',
          raw: {
            pattern: candidate.pattern,
            mxServer: verification.mxServer,
            isCatchAll: verification.isCatchAll,
            smtpStatusCode: verification.statusCode,
          },
        };
      }
    }

    // 5. Fallback: If domain is active and MX exists, return top probable pattern
    const topCandidate = candidates[0];
    return {
      email: topCandidate.candidateEmail,
      status: 'probable',
      confidence: 55,
      providerName: 'In-House Engine (Pattern Match)',
      raw: {
        pattern: topCandidate.pattern,
        mxServer: mxResult.primaryMx,
        fallback: true,
      },
    };
  },
};

import { extractPublicProfileMeta } from '@/lib/publicProfileScraper';

// ----------------------------
// In-House Profile Resolver
// ----------------------------

export const InHouseProfileProvider: ProfileEnrichmentProvider = {
  name: 'In-House Profile Engine',

  isConfigured() {
    return true;
  },

  async enrichProfile(linkedinUrl: string): Promise<Partial<LinkedInProfile> | null> {
    const slug = extractLinkedInSlug(linkedinUrl);
    if (!slug) return null;

    // 1. Try public profile metadata extraction
    const publicMeta = await extractPublicProfileMeta(linkedinUrl);

    if (publicMeta && publicMeta.fullName) {
      return {
        linkedinUrl,
        linkedinSlug: slug,
        firstName: publicMeta.firstName ?? '',
        lastName: publicMeta.lastName ?? '',
        fullName: publicMeta.fullName,
        jobTitle: publicMeta.jobTitle ?? 'Professional',
        currentCompany: publicMeta.companyName ?? inferCompanyFromSlug(slug),
        headline: publicMeta.headline ?? 'Professional Profile',
      };
    }

    // 2. Fallback: Parse human name & infer company from slug
    const parts = slug.split('-').filter((p) => !/^\d+$/.test(p));
    if (parts.length < 2) return null;

    const firstName = capitalize(parts[0]);
    const lastName = capitalize(parts[parts.length - 1]);
    const fullName = `${firstName} ${lastName}`;

    return {
      linkedinUrl,
      linkedinSlug: slug,
      firstName,
      lastName,
      fullName,
      jobTitle: 'Professional',
      currentCompany: inferCompanyFromSlug(slug),
      headline: 'Professional Profile',
    };
  },
};

function inferCompanyFromSlug(slug: string): string {
  // If slug contains corporate patterns or domain hints
  const parts = slug.split('-').filter((p) => !/^\d+$/.test(p));
  if (parts.length > 2) {
    return capitalize(parts[parts.length - 1]);
  }
  return 'Company';
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
