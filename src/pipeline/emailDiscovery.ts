// ============================================================
// Email Discovery — Stage 3
// Runs the provider waterfall to find a professional email
// ============================================================

import { LinkedInProfile, CompanyInfo, EmailResult, CandidatePermutation, MailServerDetails } from '@/types';
import { WaterfallEngine } from '@/providers';
import { InHouseEmailProvider } from '@/providers/inhouse';
import { HunterEmailProvider } from '@/providers/hunter';
import { ApolloEmailProvider } from '@/providers/apollo';
import { SnovEmailProvider } from '@/providers/snov';
import { FindymailEmailProvider } from '@/providers/findymail';
import { ProspeoEmailProvider } from '@/providers/prospeo';
import { logger } from '@/lib/logger';

// Register email providers in priority order — InHouse first!
const emailEngine = new WaterfallEngine(
  [
    InHouseEmailProvider,   // Self-contained in-house DNS/SMTP/Pattern engine
    ProspeoEmailProvider,   // Prospeo API if key present
    ApolloEmailProvider,    // Apollo API if key present
    HunterEmailProvider,    // Hunter API if key present
    SnovEmailProvider,      // Snov API if key present
    FindymailEmailProvider, // Findymail fallback
  ],
  70 // Stop threshold — stop if confidence >= 70
);

export interface EmailDiscoveryResult {
  email: EmailResult | null;
  tried: string[];
  warnings: string[];
}

/**
 * Attempt to discover a professional email for a person at a company.
 * Runs providers in waterfall order, stopping on first high-confidence result.
 */
export async function discoverEmail(
  profile: LinkedInProfile,
  company: CompanyInfo,
  requestId?: string
): Promise<EmailDiscoveryResult> {
  const start = Date.now();

  const { result, tried, warnings } = await emailEngine.run(
    {
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.fullName,
      companyName: company.name,
      companyDomain: company.domain,
      linkedinUrl: profile.linkedinUrl,
    },
    requestId
  );

  const duration = Date.now() - start;

  if (!result) {
    logger.info('email_discovery_no_result', {
      operation: 'email_discovery',
      request_id: requestId,
      duration_ms: duration,
      status: 'error',
    });

    return {
      email: null,
      tried,
      warnings,
    };
  }

  logger.info('email_discovery_success', {
    operation: 'email_discovery',
    provider: result.providerName,
    request_id: requestId,
    duration_ms: duration,
    status: 'success',
  });

  const raw = result.raw as {
    pattern?: string;
    candidates?: CandidatePermutation[];
    mailServer?: MailServerDetails;
  } | undefined;

  return {
    email: {
      address: result.email,
      status: result.status,
      confidence: result.confidence,
      provider: result.providerName,
      pattern: raw?.pattern,
      candidates: raw?.candidates,
      verification: {
        syntaxValid: true,
        domainExists: true,
        mxValid: true,
        mailboxStatus: result.status === 'verified' ? 'valid' : (result.status === 'catch_all' ? 'catch_all' : 'unknown'),
        catchAll: raw?.mailServer?.isCatchAll,
        mailServer: raw?.mailServer,
      },
    },
    tried,
    warnings,
  };
}
