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
  CandidatePermutation,
} from '@/types';

import { resolveDomainMx } from '@/lib/dnsResolver';
import { verifyEmailViaSmtp, detectMailProvider, checkSmtpMailbox } from '@/lib/smtpVerifier';
import { inferCandidateEmails, detectDomainEmailFormat } from '@/lib/patternInference';
import { extractLinkedInSlug } from '@/lib/validation';
import { extractPublicProfileMeta, cleanPersonName } from '@/lib/publicProfileScraper';
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

    const primaryMx = mxResult.primaryMx;
    const mailProvider = detectMailProvider(primaryMx);

    // 2. Generate weighted pattern candidates
    const inferred = inferCandidateEmails(firstName, lastName, cleanDomain);
    if (inferred.length === 0) return null;

    // 3. Try to detect domain-wide format preference from public page
    const detectedFormat = await detectDomainEmailFormat(cleanDomain);
    if (detectedFormat) {
      const preferred = inferred.find((c) => c.pattern === detectedFormat);
      if (preferred) {
        preferred.weight += 50; // Boost weight of detected format
        inferred.sort((a, b) => b.weight - a.weight);
      }
    }

    // Build candidate list
    const candidateList: CandidatePermutation[] = inferred.map((item, idx) => ({
      email: item.candidateEmail,
      pattern: item.pattern,
      label: item.label,
      confidence: Math.max(30, Math.min(95, 80 - idx * 5)),
      status: 'unverified' as EmailStatus,
      tested: false,
    }));

    // 4. Test candidate emails sequentially via direct SMTP handshake
    let verifiedEmail: string | null = null;
    let verifiedStatus: EmailStatus = 'probable';
    let isCatchAll = false;
    let verifiedCode: number | null = null;

    // Test up to top 3 candidates
    const candidatesToTest = candidateList.slice(0, 3);

    for (const cand of candidatesToTest) {
      try {
        cand.tested = true;
        const smtpRes = await verifyEmailViaSmtp(cand.email, 1800);

        cand.smtpStatusCode = smtpRes.statusCode;

        if (smtpRes.smtpValid) {
          isCatchAll = smtpRes.isCatchAll;
          cand.status = isCatchAll ? 'catch_all' : 'verified';
          cand.confidence = isCatchAll ? 78 : 96;

          verifiedEmail = cand.email;
          verifiedStatus = cand.status;
          verifiedCode = smtpRes.statusCode;
          break; // Found working mailbox!
        } else if (smtpRes.statusCode && smtpRes.statusCode >= 500 && smtpRes.statusCode < 600) {
          cand.status = 'invalid';
          cand.confidence = 10;
        } else {
          cand.status = 'probable';
        }
      } catch {
        // Socket probe skipped or timeout
        cand.status = 'probable';
      }
    }

    // Determine final selected candidate
    const top = candidateList[0];
    const finalEmail = verifiedEmail ?? top.email;
    const finalStatus = verifiedEmail ? verifiedStatus : 'probable';
    const finalConfidence = verifiedEmail ? (isCatchAll ? 78 : 96) : 80;

    return {
      email: finalEmail,
      status: finalStatus,
      confidence: finalConfidence,
      providerName: verifiedEmail ? 'In-House SMTP Verifier' : 'In-House Engine (MX & Pattern Validated)',
      raw: {
        pattern: top.pattern,
        candidates: candidateList,
        mailServer: {
          primaryMx,
          allMx: mxResult.records,
          providerName: mailProvider,
          isCatchAll,
          smtpStatusCode: verifiedCode,
        },
      },
    };
  },
};

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

    // 1. Try public profile metadata extraction (DDG, Bing, OpenGraph)
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
        location: publicMeta.location,
      };
    }

    // 2. Fallback: Parse human name & infer company from slug
    const cleaned = slug
      .replace(/^[a-z]{2,3}-[a-z]{2,3}-/i, '') // strip country prefixes
      .replace(/-[a-f0-9]{6,}$/i, '') // strip trailing random hashes
      .replace(/-\d+$/i, ''); // strip trailing numeric IDs

    const parts = cleaned.split('-').filter((p) => !/^\d+$/.test(p) && p.length > 0);

    if (parts.length >= 2) {
      const firstName = capitalize(parts[0]);
      const lastName = parts.slice(1).map(capitalize).join(' ');
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
    }

    if (parts.length === 1 && parts[0].length >= 3) {
      // Single word slug like 'satyanadella' or 'williamhgates'
      const singleWord = parts[0];
      const guessed = splitCompoundName(singleWord);

      return {
        linkedinUrl,
        linkedinSlug: slug,
        firstName: guessed.firstName,
        lastName: guessed.lastName,
        fullName: guessed.fullName,
        jobTitle: 'Professional',
        currentCompany: inferCompanyFromSlug(slug),
        headline: 'Professional Profile',
      };
    }

    return null;
  },
};

function splitCompoundName(word: string): { fullName: string; firstName: string; lastName: string } {
  // Check common split lengths
  if (word.length <= 6) {
    const fn = capitalize(word);
    return { fullName: fn, firstName: fn, lastName: '' };
  }

  // Split roughly midway or at common English name boundary
  const splitIdx = Math.floor(word.length / 2);
  const first = capitalize(word.substring(0, splitIdx));
  const last = capitalize(word.substring(splitIdx));
  return {
    fullName: `${first} ${last}`,
    firstName: first,
    lastName: last,
  };
}

function inferCompanyFromSlug(slug: string): string {
  const parts = slug.split('-').filter((p) => !/^\d+$/.test(p));
  if (parts.length > 2) {
    return capitalize(parts[parts.length - 1]);
  }
  return 'Enterprise';
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
