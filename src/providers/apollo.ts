// ============================================================
// Apollo.io Provider Adapter
// Docs: https://apolloio.github.io/apollo-api-docs/
// ============================================================

import {
  EmailEnrichmentProvider,
  ProfileEnrichmentProvider,
  ProviderInput,
  ProviderResult,
  LinkedInProfile,
  EmailStatus,
} from '@/types';

const APOLLO_BASE = 'https://api.apollo.io/api/v1';

function getApiKey(): string | null {
  return process.env.APOLLO_API_KEY ?? null;
}

// ----------------------------
// Email Finder via People Match
// ----------------------------

export const ApolloEmailProvider: EmailEnrichmentProvider = {
  name: 'Apollo.io',

  isConfigured() {
    return !!getApiKey();
  },

  async findEmail(input: ProviderInput): Promise<ProviderResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const body: Record<string, unknown> = {
      api_key: apiKey,
      first_name: input.firstName,
      last_name: input.lastName,
      organization_name: input.companyName,
      domain: input.companyDomain,
      reveal_personal_emails: false,
    };

    if (input.linkedinUrl) {
      body.linkedin_url = input.linkedinUrl;
    }

    const response = await fetch(`${APOLLO_BASE}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 422) return null;
      throw new Error(`Apollo people/match responded with ${response.status}`);
    }

    const json = await response.json();
    const person = json?.person;

    if (!person?.email) return null;

    const emailStatus = person.email_status
      ? mapApolloEmailStatus(person.email_status)
      : 'probable';

    return {
      email: person.email,
      status: emailStatus,
      confidence: emailStatus === 'verified' ? 80 : 55,
      providerName: 'Apollo.io',
      raw: person,
    };
  },
};

// ----------------------------
// Profile Enrichment
// ----------------------------

export const ApolloProfileProvider: ProfileEnrichmentProvider = {
  name: 'Apollo.io',

  isConfigured() {
    return !!getApiKey();
  },

  async enrichProfile(linkedinUrl: string): Promise<Partial<LinkedInProfile> | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const slugMatch = linkedinUrl.match(/linkedin\.com\/in\/([^/?#]+)/);
    const slug = slugMatch?.[1];

    const body: Record<string, unknown> = {
      api_key: apiKey,
      reveal_personal_emails: false,
    };

    if (linkedinUrl) body.linkedin_url = linkedinUrl;

    const response = await fetch(`${APOLLO_BASE}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 422) return null;
      throw new Error(`Apollo profile enrichment responded with ${response.status}`);
    }

    const json = await response.json();
    const person = json?.person;

    if (!person) return null;

    return {
      linkedinUrl,
      linkedinSlug: slug ?? undefined,
      firstName: person.first_name ?? '',
      lastName: person.last_name ?? '',
      fullName: person.name ?? `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim(),
      headline: person.headline ?? undefined,
      jobTitle: person.title ?? undefined,
      currentCompany: person.organization?.name ?? undefined,
      companyUrl: person.organization?.website_url ?? undefined,
      location: person.city
        ? [person.city, person.country].filter(Boolean).join(', ')
        : undefined,
      raw: person,
    };
  },
};

// ----------------------------
// Internal helpers
// ----------------------------

function mapApolloEmailStatus(status: string): EmailStatus {
  switch (status.toLowerCase()) {
    case 'verified':
    case 'deliverable':
      return 'verified';
    case 'likely to engage':
    case 'questionable':
      return 'probable';
    case 'invalid':
    case 'undeliverable':
    case 'bounced':
      return 'invalid';
    default:
      return 'probable';
  }
}
