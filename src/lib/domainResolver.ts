// ============================================================
// Autonomous Company Domain Resolver
// Resolves company names to verified domains without paid APIs
// ============================================================

import { normalizeCompanyName, extractRootDomain } from './normalization';
import { resolveDomainMx } from './dnsResolver';

export interface ResolvedDomainResult {
  domain: string;
  confidence: number;
  source: 'direct_match' | 'curated_directory' | 'clearbit' | 'search_snippet' | 'dns_probe';
}

// Curated dictionary of common companies for instant, accurate matching
const POPULAR_COMPANIES: Record<string, string> = {
  microsoft: 'microsoft.com',
  apple: 'apple.com',
  google: 'google.com',
  alphabet: 'google.com',
  amazon: 'amazon.com',
  meta: 'meta.com',
  facebook: 'meta.com',
  openai: 'openai.com',
  anthropic: 'anthropic.com',
  netflix: 'netflix.com',
  tesla: 'tesla.com',
  nvidia: 'nvidia.com',
  stripe: 'stripe.com',
  uber: 'uber.com',
  airbnb: 'airbnb.com',
  spotify: 'spotify.com',
  salesforce: 'salesforce.com',
  adobe: 'adobe.com',
  oracle: 'oracle.com',
  ibm: 'ibm.com',
  intel: 'intel.com',
  cisco: 'cisco.com',
  github: 'github.com',
  linkedin: 'linkedin.com',
  twitter: 'x.com',
  x: 'x.com',
  slack: 'slack.com',
  figma: 'figma.com',
  notion: 'notion.so',
  dropbox: 'dropbox.com',
  zoom: 'zoom.us',
  datadog: 'datadoghq.com',
  snowflake: 'snowflake.com',
  cloudflare: 'cloudflare.com',
  atlassian: 'atlassian.com',
  shopify: 'shopify.com',
  canva: 'canva.com',
  bytedance: 'bytedance.com',
  tiktok: 'tiktok.com',
  palantir: 'palantir.com',
  linear: 'linear.app',
  vercel: 'vercel.com',
  supabase: 'supabase.com',
  prisma: 'prisma.io',
  mongodb: 'mongodb.com',
  redis: 'redis.io',
  docker: 'docker.com',
  hubspot: 'hubspot.com',
  twilio: 'twilio.com',
  square: 'squareup.com',
  block: 'block.xyz',
  paypal: 'paypal.com',
  plaid: 'plaid.com',
  brex: 'brex.com',
  ramp: 'ramp.com',
  coinbase: 'coinbase.com',
  binance: 'binance.com',
  robinhood: 'robinhood.com',
  revolut: 'revolut.com',
  instacart: 'instacart.com',
  doordash: 'doordash.com',
  affirm: 'affirm.com',
  klarna: 'klarna.com',
  asana: 'asana.com',
  monday: 'monday.com',
  clickup: 'clickup.com',
  gitlab: 'gitlab.com',
  hashicorp: 'hashicorp.com',
  elastic: 'elastic.co',
  confluent: 'confluent.io',
  postman: 'postman.com',
  zapier: 'zapier.com',
  airtable: 'airtable.com',
  webflow: 'webflow.com',
  miro: 'miro.com',
  loom: 'loom.com',
  gusto: 'gusto.com',
  rippling: 'rippling.com',
  deel: 'deel.com',
  check: 'checkhq.com',
  scale: 'scale.com',
  huggingface: 'huggingface.co',
  midjourney: 'midjourney.com',
  jasper: 'jasper.ai',
  grammarly: 'grammarly.com',
  duolingo: 'duolingo.com',
  coursera: 'coursera.org',
  udemy: 'udemy.com',
};

const EXCLUDED_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'aol.com', 'protonmail.com', 'live.com',
  'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
  'youtube.com', 'wikipedia.org', 'crunchbase.com', 'glassdoor.com',
  'indeed.com', 'github.com', 'medium.com', 'bloomberg.com',
  'forbes.com', 'techcrunch.com', 'reuters.com', 'nytimes.com',
]);

/**
 * Resolve company name to domain using multiple progressive strategies
 */
export async function resolveCompanyDomain(
  companyName: string,
  hintUrl?: string,
  requestId?: string
): Promise<ResolvedDomainResult | null> {
  const cleanName = companyName.trim();
  if (!cleanName) return null;

  const normalized = normalizeCompanyName(cleanName);

  // Strategy 1: Hint URL provided
  if (hintUrl) {
    const root = extractRootDomain(hintUrl);
    if (root && !EXCLUDED_DOMAINS.has(root) && !root.includes('linkedin.com')) {
      const mx = await resolveDomainMx(root);
      if (mx.hasMx) {
        return { domain: root, confidence: 0.95, source: 'direct_match' };
      }
    }
  }

  // Strategy 2: Check curated enterprise & tech dictionary
  if (POPULAR_COMPANIES[normalized]) {
    const domain = POPULAR_COMPANIES[normalized];
    return { domain, confidence: 0.98, source: 'curated_directory' };
  }

  // Check partial key matches
  const singleWord = normalized.split(' ')[0];
  if (singleWord && POPULAR_COMPANIES[singleWord]) {
    const domain = POPULAR_COMPANIES[singleWord];
    return { domain, confidence: 0.92, source: 'curated_directory' };
  }

  // Strategy 3: Clearbit Public Autocomplete API
  try {
    const clearbitDomain = await resolveViaClearbit(cleanName, requestId);
    if (clearbitDomain && !EXCLUDED_DOMAINS.has(clearbitDomain)) {
      return { domain: clearbitDomain, confidence: 0.9, source: 'clearbit' };
    }
  } catch {
    // continue to next strategy
  }

  // Strategy 4: Web Search Snippets (DuckDuckGo search for official domain)
  try {
    const searchDomain = await resolveViaSearch(cleanName);
    if (searchDomain && !EXCLUDED_DOMAINS.has(searchDomain)) {
      return { domain: searchDomain, confidence: 0.85, source: 'search_snippet' };
    }
  } catch {
    // continue to next strategy
  }

  // Strategy 5: DNS MX probing for plausible TLDs
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (slug.length >= 3) {
    const tlds = ['.com', '.io', '.co', '.ai', '.org', '.net', '.tech'];
    for (const tld of tlds) {
      const candidateDomain = `${slug}${tld}`;
      try {
        const mx = await resolveDomainMx(candidateDomain);
        if (mx.hasMx && mx.primaryMx) {
          return { domain: candidateDomain, confidence: 0.75, source: 'dns_probe' };
        }
      } catch {
        // probe failed, try next tld
      }
    }
  }

  return null;
}

/**
 * Use Clearbit's free public autocomplete API to resolve a company domain.
 */
async function resolveViaClearbit(
  companyName: string,
  requestId?: string
): Promise<string | null> {
  const encoded = encodeURIComponent(companyName);
  const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encoded}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(4000),
    next: { revalidate: 3600 },
  });

  if (!response.ok) return null;
  const results: Array<{ name: string; domain: string }> = await response.json();
  if (!results || results.length === 0) return null;

  const normalizedQuery = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const best = results.find((r) => {
    const n = (r.name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return n === normalizedQuery || n.includes(normalizedQuery) || normalizedQuery.includes(n);
  });

  return best?.domain ?? results[0]?.domain ?? null;
}

/**
 * Extract company website domain from search engine results
 */
async function resolveViaSearch(companyName: string): Promise<string | null> {
  const query = `${companyName} official website company`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) return null;
  const html = await response.text();

  // Extract URLs from results
  const linkRegex = /<a[^>]*class="result__url"[^>]*href="([^"]+)"/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    let rawUrl = match[1];
    if (rawUrl.includes('uddg=')) {
      const decoded = decodeURIComponent(rawUrl.split('uddg=')[1]?.split('&')[0] ?? '');
      rawUrl = decoded;
    }

    const domain = extractRootDomain(rawUrl);
    if (domain && !EXCLUDED_DOMAINS.has(domain)) {
      return domain;
    }
  }

  return null;
}
