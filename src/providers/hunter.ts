// ============================================================
// Hunter.io Provider Adapter
// Docs: https://hunter.io/api-documentation/v2
// ============================================================

import {
  EmailEnrichmentProvider,
  ProfileEnrichmentProvider,
  ProviderInput,
  ProviderResult,
  LinkedInProfile,
  EmailStatus,
} from '@/types';

const HUNTER_BASE = 'https://api.hunter.io/v2';

function getApiKey(): string | null {
  return process.env.HUNTER_API_KEY ?? null;
}

// ----------------------------
// Email Finder
// ----------------------------

export const HunterEmailProvider: EmailEnrichmentProvider = {
  name: 'Hunter.io',

  isConfigured() {
    return !!getApiKey();
  },

  async findEmail(input: ProviderInput): Promise<ProviderResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const params = new URLSearchParams({
      api_key: apiKey,
      first_name: input.firstName,
      last_name: input.lastName,
      domain: input.companyDomain,
    });

    if (input.linkedinUrl) {
      params.set('linkedin_url', input.linkedinUrl);
    }

    const url = `${HUNTER_BASE}/email-finder?${params.toString()}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Hunter email-finder responded with ${response.status}`);
    }

    const json = await response.json();
    const data = json?.data;

    if (!data?.email) return null;

    // Map Hunter confidence (0–100) to our status
    const confidence: number = data.score ?? 0;
    const status = mapHunterStatus(data.smtp_valid, confidence);

    return {
      email: data.email,
      status,
      confidence,
      providerName: 'Hunter.io',
      raw: data,
    };
  },
};

// ----------------------------
// Profile Enrichment (People Find)
// ----------------------------

export const HunterProfileProvider: ProfileEnrichmentProvider = {
  name: 'Hunter.io',

  isConfigured() {
    return !!getApiKey();
  },

  async enrichProfile(linkedinUrl: string): Promise<Partial<LinkedInProfile> | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    // Extract just the slug/handle from the URL
    const slugMatch = linkedinUrl.match(/linkedin\.com\/in\/([^/?#]+)/);
    const slug = slugMatch?.[1];
    if (!slug) return null;

    const params = new URLSearchParams({
      api_key: apiKey,
      linkedin: slug,
    });

    const url = `${HUNTER_BASE}/people/find?${params.toString()}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Hunter people/find responded with ${response.status}`);
    }

    const json = await response.json();
    const data = json?.data;

    if (!data) return null;

    const firstName: string = data.first_name ?? '';
    const lastName: string = data.last_name ?? '';

    // Find current position
    const employment = (data.employment ?? []) as Array<{
      current?: boolean;
      title?: string;
      name?: string;
      domain?: string;
      start?: number;
    }>;

    const current = employment.find((e) => e.current);

    return {
      linkedinUrl,
      linkedinSlug: slug,
      firstName,
      lastName,
      fullName: data.display_name ?? `${firstName} ${lastName}`.trim(),
      headline: data.headline ?? undefined,
      jobTitle: current?.title ?? undefined,
      currentCompany: current?.name ?? undefined,
      companyUrl: current?.domain ? `https://${current.domain}` : undefined,
      location: data.city
        ? [data.city, data.country].filter(Boolean).join(', ')
        : undefined,
      raw: data,
    };
  },
};

// ----------------------------
// Email Verification
// ----------------------------

export async function verifyEmailWithHunter(email: string): Promise<{
  valid: boolean;
  status: EmailStatus;
  details: {
    syntaxValid?: boolean;
    mxValid?: boolean;
    disposable?: boolean;
    catchAll?: boolean;
    mailboxStatus?: string;
  };
} | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const params = new URLSearchParams({ api_key: apiKey, email });
  const url = `${HUNTER_BASE}/email-verifier?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const json = await response.json();
  const data = json?.data;

  if (!data) return null;

  const resultStatus = data.result; // 'deliverable' | 'undeliverable' | 'risky' | 'unknown'
  const emailStatus = mapVerifierStatus(resultStatus, data.gibberish, data.disposable);

  return {
    valid: resultStatus === 'deliverable',
    status: emailStatus,
    details: {
      syntaxValid: data.regexp ?? undefined,
      mxValid: data.mx_records ?? undefined,
      disposable: data.disposable ?? undefined,
      catchAll: data.accept_all ?? undefined,
      mailboxStatus: data.smtp_server
        ? data.smtp_check
          ? 'valid'
          : 'invalid'
        : 'unknown',
    },
  };
}

// ----------------------------
// Internal helpers
// ----------------------------

function mapHunterStatus(smtpValid: boolean | null, confidence: number): EmailStatus {
  if (smtpValid === true && confidence >= 80) return 'verified';
  if (smtpValid === true && confidence >= 50) return 'probable';
  if (confidence >= 50) return 'probable';
  if (confidence > 0) return 'unverified';
  return 'not_found';
}

function mapVerifierStatus(
  result: string,
  gibberish: boolean,
  disposable: boolean
): EmailStatus {
  if (disposable || gibberish) return 'invalid';
  switch (result) {
    case 'deliverable': return 'verified';
    case 'risky': return 'probable';
    case 'unknown': return 'unverified';
    case 'undeliverable': return 'invalid';
    default: return 'unverified';
  }
}
