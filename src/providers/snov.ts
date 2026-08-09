// ============================================================
// Snov.io Provider Adapter
// Docs: https://snov.io/api
// ============================================================

import {
  EmailEnrichmentProvider,
  ProviderInput,
  ProviderResult,
  EmailStatus,
} from '@/types';

const SNOV_BASE = 'https://api.snov.io/v1';

function getCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.SNOV_CLIENT_ID;
  const clientSecret = process.env.SNOV_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/**
 * Get a Snov.io OAuth2 access token.
 * Tokens expire after 1 hour; in production you'd cache this.
 */
async function getSnovToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch(`${SNOV_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Snov.io token request failed: ${response.status}`);
  }

  const json = await response.json();
  if (!json.access_token) throw new Error('No access token in Snov.io response');
  return json.access_token;
}

export const SnovEmailProvider: EmailEnrichmentProvider = {
  name: 'Snov.io',

  isConfigured() {
    return !!getCredentials();
  },

  async findEmail(input: ProviderInput): Promise<ProviderResult | null> {
    const creds = getCredentials();
    if (!creds) return null;

    const token = await getSnovToken(creds.clientId, creds.clientSecret);

    const body = new URLSearchParams({
      firstName: input.firstName,
      lastName: input.lastName,
      domain: input.companyDomain,
    });

    const response = await fetch(`${SNOV_BASE}/get-emails-from-names`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Snov.io email finder responded with ${response.status}`);
    }

    const json = await response.json();
    // Snov returns { data: { emails: [...] } }
    const emails: Array<{
      email: string;
      emailStatus: string;
      confidence: number;
    }> = json?.data?.emails ?? [];

    if (emails.length === 0) return null;

    // Take the highest-confidence result
    const best = emails.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];

    return {
      email: best.email,
      status: mapSnovStatus(best.emailStatus),
      confidence: best.confidence ?? 50,
      providerName: 'Snov.io',
      raw: best,
    };
  },
};

function mapSnovStatus(status: string): EmailStatus {
  switch ((status ?? '').toLowerCase()) {
    case 'valid':
      return 'verified';
    case 'accept_all':
    case 'catch_all':
      return 'catch_all';
    case 'invalid':
      return 'invalid';
    case 'unknown':
    default:
      return 'probable';
  }
}
