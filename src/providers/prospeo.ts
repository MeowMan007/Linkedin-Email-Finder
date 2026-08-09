// ============================================================
// Prospeo Provider Adapter
// Docs: https://prospeo.io/api
// ============================================================

import {
  EmailEnrichmentProvider,
  ProfileEnrichmentProvider,
  ProviderInput,
  ProviderResult,
  LinkedInProfile,
  EmailStatus,
} from '@/types';
import { logger } from '@/lib/logger';

const PROSPEO_BASE = 'https://api.prospeo.io';

function getApiKey(): string | null {
  return process.env.PROSPEO_API_KEY ?? null;
}

// ----------------------------
// Email Enrichment Provider
// ----------------------------

export const ProspeoEmailProvider: EmailEnrichmentProvider = {
  name: 'Prospeo',

  isConfigured() {
    return !!getApiKey();
  },

  async findEmail(input: ProviderInput): Promise<ProviderResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    // Direct LinkedIn email lookup
    if (input.linkedinUrl) {
      const result = await findViaLinkedIn(apiKey, input.linkedinUrl);
      if (result) return result;
    }

    // Fallback: domain + name
    return findViaDomain(apiKey, input);
  },
};

// ----------------------------
// Profile Enrichment Provider
// ----------------------------

export const ProspeoProfileProvider: ProfileEnrichmentProvider = {
  name: 'Prospeo',

  isConfigured() {
    return !!getApiKey();
  },

  async enrichProfile(linkedinUrl: string): Promise<Partial<LinkedInProfile> | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    try {
      const response = await fetch(`${PROSPEO_BASE}/linkedin-email-finder`, {
        method: 'POST',
        headers: {
          'X-KEY': apiKey,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ url: linkedinUrl }),
      });

      if (!response.ok) return null;

      const json = await response.json();
      const res = json?.response;
      if (!res) return null;

      const person = res.person ?? {};
      const company = res.company ?? {};

      const fullName = person.full_name ?? `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim();
      if (!fullName) return null;

      return {
        linkedinUrl,
        firstName: person.first_name ?? '',
        lastName: person.last_name ?? '',
        fullName,
        jobTitle: person.title ?? undefined,
        currentCompany: company.name ?? undefined,
        companyUrl: company.domain ? `https://${company.domain}` : undefined,
        location: person.location ?? undefined,
        raw: json,
      };
    } catch (err) {
      logger.warn('prospeo_profile_error', {
        operation: 'prospeo_profile',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return null;
    }
  },
};

// ----------------------------
// Internal Helpers
// ----------------------------

async function findViaLinkedIn(
  apiKey: string,
  linkedinUrl: string
): Promise<ProviderResult | null> {
  try {
    const response = await fetch(`${PROSPEO_BASE}/linkedin-email-finder`, {
      method: 'POST',
      headers: {
        'X-KEY': apiKey,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ url: linkedinUrl }),
    });

    if (!response.ok) return null;

    const json = await response.json();
    const res = json?.response;
    if (!res) return null;

    const emailStr =
      typeof res.email === 'string'
        ? res.email
        : res.email?.email ?? res.email?.address ?? null;

    if (!emailStr) return null;

    const rawStatus = res.email_status ?? res.email?.status ?? res.verification?.status;
    const status = mapProspeoVerification(rawStatus);

    return {
      email: emailStr,
      status,
      confidence: status === 'verified' ? 95 : 78,
      providerName: 'Prospeo',
      raw: json,
    };
  } catch {
    return null;
  }
}

async function findViaDomain(
  apiKey: string,
  input: ProviderInput
): Promise<ProviderResult | null> {
  try {
    const response = await fetch(`${PROSPEO_BASE}/email-finder`, {
      method: 'POST',
      headers: {
        'X-KEY': apiKey,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        first_name: input.firstName,
        last_name: input.lastName,
        company: input.companyDomain,
      }),
    });

    if (!response.ok) return null;

    const json = await response.json();
    const res = json?.response;
    if (!res) return null;

    const emailStr =
      typeof res.email === 'string'
        ? res.email
        : res.email?.email ?? res.email?.address ?? null;

    if (!emailStr) return null;

    const rawStatus = res.email_status ?? res.email?.status ?? res.verification?.status;
    const status = mapProspeoVerification(rawStatus);

    return {
      email: emailStr,
      status,
      confidence: status === 'verified' ? 90 : 75,
      providerName: 'Prospeo',
      raw: json,
    };
  } catch {
    return null;
  }
}

function mapProspeoVerification(status?: string): EmailStatus {
  switch ((status ?? '').toLowerCase()) {
    case 'valid':
    case 'deliverable':
    case 'verified':
      return 'verified';
    case 'accept_all':
    case 'catch_all':
    case 'risky':
      return 'catch_all';
    case 'invalid':
    case 'undeliverable':
      return 'invalid';
    default:
      return 'probable';
  }
}
