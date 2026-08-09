// ============================================================
// Findymail Provider Adapter
// Docs: https://app.findymail.com/api
// ============================================================

import {
  EmailEnrichmentProvider,
  ProviderInput,
  ProviderResult,
  EmailStatus,
} from '@/types';

const FINDYMAIL_BASE = 'https://app.findymail.com/api';

function getApiKey(): string | null {
  return process.env.FINDYMAIL_API_KEY ?? null;
}

export const FindymailEmailProvider: EmailEnrichmentProvider = {
  name: 'Findymail',

  isConfigured() {
    return !!getApiKey();
  },

  async findEmail(input: ProviderInput): Promise<ProviderResult | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const body: Record<string, string> = {
      name: `${input.firstName} ${input.lastName}`.trim(),
      domain: input.companyDomain,
    };

    if (input.linkedinUrl) {
      body.linkedin = input.linkedinUrl;
    }

    const response = await fetch(`${FINDYMAIL_BASE}/search/name`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 422) return null;
      throw new Error(`Findymail responded with ${response.status}`);
    }

    const json = await response.json();
    const email: string | undefined = json?.email;

    if (!email) return null;

    // Findymail only returns emails it's confident about
    return {
      email,
      status: 'probable',
      confidence: 65,
      providerName: 'Findymail',
      raw: json,
    };
  },
};
