// ============================================================
// Prospeo Provider Adapter
// Docs: https://prospeo.io/api
// ============================================================

import {
  EmailEnrichmentProvider,
  ProviderInput,
  ProviderResult,
  EmailStatus,
} from '@/types';

const PROSPEO_BASE = 'https://api.prospeo.io';

function getApiKey(): string | null {
  return process.env.PROSPEO_API_KEY ?? null;
}

export const ProspeoEmailProvider: EmailEnrichmentProvider = {
  name: 'Prospeo',

  isConfigured() {
    return !!getApiKey();
  },

  async findEmail(input: ProviderInput): Promise<ProviderResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    // Prospeo has a dedicated LinkedIn email-finder endpoint
    if (input.linkedinUrl) {
      const result = await findViaLinkedIn(apiKey, input.linkedinUrl);
      if (result) return result;
    }

    // Fallback: domain + name
    return findViaDomain(apiKey, input);
  },
};

async function findViaLinkedIn(
  apiKey: string,
  linkedinUrl: string
): Promise<ProviderResult | null> {
  const response = await fetch(`${PROSPEO_BASE}/linkedin-email-finder`, {
    method: 'POST',
    headers: {
      'X-KEY': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ url: linkedinUrl }),
  });

  if (!response.ok) {
    if (response.status === 404 || response.status === 422) return null;
    throw new Error(`Prospeo LinkedIn finder responded with ${response.status}`);
  }

  const json = await response.json();
  if (!json?.response?.email) return null;

  const emailData = json.response;
  const status = mapProspeoVerification(emailData.verification?.status);

  return {
    email: emailData.email,
    status,
    confidence: status === 'verified' ? 85 : 60,
    providerName: 'Prospeo',
    raw: emailData,
  };
}

async function findViaDomain(
  apiKey: string,
  input: ProviderInput
): Promise<ProviderResult | null> {
  const response = await fetch(`${PROSPEO_BASE}/email-finder`, {
    method: 'POST',
    headers: {
      'X-KEY': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      first_name: input.firstName,
      last_name: input.lastName,
      company: input.companyDomain,
    }),
  });

  if (!response.ok) {
    if (response.status === 404 || response.status === 422) return null;
    throw new Error(`Prospeo email-finder responded with ${response.status}`);
  }

  const json = await response.json();
  if (!json?.response?.email) return null;

  const emailData = json.response;
  const status = mapProspeoVerification(emailData.verification?.status);

  return {
    email: emailData.email,
    status,
    confidence: status === 'verified' ? 80 : 55,
    providerName: 'Prospeo',
    raw: emailData,
  };
}

function mapProspeoVerification(status?: string): EmailStatus {
  switch ((status ?? '').toLowerCase()) {
    case 'valid':
      return 'verified';
    case 'accept_all':
    case 'catch_all':
      return 'catch_all';
    case 'invalid':
      return 'invalid';
    default:
      return 'probable';
  }
}
