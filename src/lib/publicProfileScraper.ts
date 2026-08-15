// ============================================================
// Public LinkedIn Profile Meta Extractor
// Extracts public OpenGraph title/description & company context
// Zero paid API keys required!
// ============================================================

import { extractLinkedInSlug } from './validation';
import { logger } from './logger';

export interface ExtractedPublicMeta {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  companyName?: string;
  headline?: string;
  location?: string;
}

const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

export function getRandomUserAgent(): string {
  return BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
}

/**
 * Extract public name, job title, and current company from LinkedIn profile URL.
 * Uses public OpenGraph tags and multi-engine public search snippets.
 */
export async function extractPublicProfileMeta(linkedinUrl: string): Promise<ExtractedPublicMeta | null> {
  const slug = extractLinkedInSlug(linkedinUrl);
  if (!slug) return null;

  // 1. Try DuckDuckGo HTML Search
  try {
    const meta = await fetchDuckDuckGoSnippet(slug);
    if (meta && meta.fullName && !isNonPersonTitle(meta.fullName)) return meta;
  } catch {
    // search fallback error
  }

  // 2. Try DuckDuckGo Lite Search
  try {
    const meta = await fetchDuckDuckGoLiteSnippet(slug);
    if (meta && meta.fullName && !isNonPersonTitle(meta.fullName)) return meta;
  } catch {
    // lite search fallback error
  }

  // 3. Try Bing Public Search Snippet
  try {
    const meta = await fetchBingSnippet(slug);
    if (meta && meta.fullName && !isNonPersonTitle(meta.fullName)) return meta;
  } catch {
    // bing fallback error
  }

  // 4. Try Direct LinkedIn OpenGraph / Meta scraping
  try {
    const meta = await fetchDirectLinkedInMeta(linkedinUrl);
    if (meta && meta.fullName && !isNonPersonTitle(meta.fullName)) return meta;
  } catch {
    // direct fetch fallback error
  }

  return null;
}

/**
 * Fetch from DuckDuckGo HTML search
 * Searches for the exact LinkedIn profile URL to avoid false positives from people with the same name at different companies.
 */
async function fetchDuckDuckGoSnippet(slug: string): Promise<ExtractedPublicMeta | null> {
  // Use the full profile URL in quotes so search engines return this exact profile
  const exactQuery = `"linkedin.com/in/${slug}"`;
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(exactQuery)}`;
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) return null;
  const html = await response.text();
  return parseSearchResultHtml(html, slug);
}

/**
 * Fetch from DuckDuckGo Lite search
 */
async function fetchDuckDuckGoLiteSnippet(slug: string): Promise<ExtractedPublicMeta | null> {
  const exactQuery = `"linkedin.com/in/${slug}"`;
  const searchUrl = `https://lite.duckduckgo.com/lite/`;
  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `q=${encodeURIComponent(exactQuery)}`,
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) return null;
  const html = await response.text();
  return parseSearchResultHtml(html, slug);
}

/**
 * Fetch from Bing search snippet
 * Validates that the returned result URL contains the exact slug.
 */
async function fetchBingSnippet(slug: string): Promise<ExtractedPublicMeta | null> {
  const exactQuery = `"linkedin.com/in/${slug}"`;
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(exactQuery)}&setlang=en`;
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) return null;
  const html = await response.text();

  // Strictly validate that result URL contains the exact slug
  const cleanSlug = slug.toLowerCase();
  const titleWithUrlRegex = /<h2[^>]*><a[^>]*href="([^"]*linkedin\.com\/in\/([^"/?#]+))[^>]*>([^<]+)<\/a><\/h2>/gi;
  let match: RegExpExecArray | null;

  while ((match = titleWithUrlRegex.exec(html)) !== null) {
    const foundSlug = match[2].toLowerCase().replace(/\/+$/, '');
    if (foundSlug === cleanSlug) {
      const snippetMatch = html.match(/<p class="b_lineclamp[^>]*>([^<]+)<\/p>/i)
        || html.match(/<div class="b_caption"[^>]*><p>([^<]+)<\/p><\/div>/i);
      return parseLinkedInTitle(match[3], snippetMatch?.[1]);
    }
  }

  return null;
}

/**
 * Fetch direct OpenGraph / JSON-LD metadata from LinkedIn URL
 */
async function fetchDirectLinkedInMeta(url: string): Promise<ExtractedPublicMeta | null> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(3000),
  });

  if (!response.ok) return null;
  const html = await response.text();

  // Try og:title
  const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+name=["']title["']\s+content=["']([^"']+)["']/i);
  
  const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

  if (ogTitle?.[1]) {
    return parseLinkedInTitle(ogTitle[1], ogDesc?.[1]);
  }

  // Try title tag
  const titleTag = html.match(/<title>([^<]+)<\/title>/i);
  if (titleTag?.[1]) {
    return parseLinkedInTitle(titleTag[1], ogDesc?.[1]);
  }

  return null;
}

/**
 * Parse search result HTML (e.g. DDG) for LinkedIn snippets.
 * CRITICAL: Only accepts results whose href exactly matches the requested slug.
 * This prevents false positives when multiple people share the same name.
 */
function parseSearchResultHtml(html: string, slug: string): ExtractedPublicMeta | null {
  const cleanSlug = slug.toLowerCase().replace(/\/+$/, '');

  // Strategy 1: Chunk HTML by opening <div and match slug + title within each chunk.
  // We split on <div to avoid the 's' (dotAll) regex flag which requires ES2018+.
  const divChunks = html.split('<div');
  for (const chunk of divChunks) {
    // Only process chunks that look like result blocks
    if (!chunk.includes('result')) continue;

    const linkInChunk = chunk.match(/href="[^"]*linkedin\.com\/in\/([^"/?#]+)/i);
    if (!linkInChunk) continue;

    const foundSlug = linkInChunk[1].toLowerCase().replace(/\/+$/, '');
    if (foundSlug !== cleanSlug) continue;

    // This chunk is for our exact slug — extract the title text
    const titleMatch = chunk.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([^<]+)<\/a>/i)
      || chunk.match(/<a[^>]*>([^<]+)<\/a>/i);
    const snippetMatch = chunk.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([^<]+)<\/a>/i)
      || chunk.match(/<span[^>]*class="[^"]*snippet[^"]*"[^>]*>([^<]+)<\/span>/i);

    if (titleMatch?.[1]) {
      const parsed = parseLinkedInTitle(titleMatch[1].trim(), snippetMatch?.[1]?.trim());
      if (parsed.fullName && !isNonPersonTitle(parsed.fullName)) {
        return parsed;
      }
    }
  }

  // Strategy 2: Flat anchor scan — only accept anchors whose href matches the exact slug
  const anchors = [...html.matchAll(/<a[^>]*href="([^"]*linkedin\.com\/in\/([^"/?#]+))[^"]*"[^>]*>([^<]+)<\/a>/gi)];
  for (const anchor of anchors) {
    const foundSlug = anchor[2].toLowerCase().replace(/\/+$/, '');
    if (foundSlug !== cleanSlug) continue;

    const titleText = anchor[3].trim();
    if (!titleText || isNonPersonTitle(titleText)) continue;

    const parsed = parseLinkedInTitle(titleText);
    if (parsed.fullName && !isNonPersonTitle(parsed.fullName)) {
      return parsed;
    }
  }

  // NO generic fallback — returning wrong company is worse than returning null
  return null;
}

const BOT_TITLE_PATTERNS = [
  'checking your browser',
  'just a moment',
  'attention required',
  'security check',
  'access denied',
  '403 forbidden',
  '404 not found',
  'sign in',
  'log in',
  'join linkedin',
  'welcome to linkedin',
  'page not found',
  'profile not found',
  'cloudflare',
  'captcha',
  'robot',
  'recaptcha',
  'unsupported browser',
];

export function isNonPersonTitle(text: string): boolean {
  if (!text || text.trim().length < 2) return true;
  const lower = text.toLowerCase().trim();
  return BOT_TITLE_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Clean person name from credentials, titles, and emojis
 * e.g. "Satya Nadella, MBA, PhD" -> "Satya Nadella"
 * e.g. "Dr. Jane Smith (She/Her)" -> "Jane Smith"
 */
export function cleanPersonName(rawName: string): { fullName: string; firstName: string; lastName: string } {
  if (isNonPersonTitle(rawName)) {
    return { fullName: '', firstName: '', lastName: '' };
  }

  let clean = rawName
    // Remove emojis and unicode symbols
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Remove pronoun indicators (He/Him), (She/Her), (They/Them)
    .replace(/\s*\((?:he\/him|she\/her|they\/them|he\/they|she\/they)\)/gi, '')
    // Remove common prefixes
    .replace(/^(?:dr\.|mr\.|mrs\.|ms\.|prof\.|professor)\s+/gi, '')
    // Remove common credential suffixes
    .replace(/,\s*(?:ph\.?d\.?|m\.?b\.?a\.?|pmp|cpa|m\.?d\.?|esq\.?|pe|cfa|ms|b\.?sc|b\.?tech|m\.?tech)\b.*$/gi, '')
    .replace(/\s+(?:ph\.?d\.?|m\.?b\.?a\.?|pmp|cpa|m\.?d\.?|esq\.?|pe|cfa)\b.*$/gi, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();

  if (isNonPersonTitle(clean)) {
    return { fullName: '', firstName: '', lastName: '' };
  }

  const nameParts = clean.split(' ').filter(Boolean);
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const fullName = clean;

  return { fullName, firstName, lastName };
}

/**
 * Parses typical LinkedIn titles and descriptions:
 * Format 1: "Satya Nadella - Chairman and CEO - Microsoft | LinkedIn"
 * Format 2: "Jane Smith - Founder & CEO at Acme Corp | LinkedIn"
 * Format 3: "Bill Gates - Co-chair, Bill & Melinda Gates Foundation | LinkedIn"
 * Format 4: "Sundar Pichai – CEO at Google & Alphabet – LinkedIn"
 */
export function parseLinkedInTitle(rawTitle: string, description?: string): ExtractedPublicMeta {
  if (isNonPersonTitle(rawTitle)) {
    return {};
  }
  // Decode HTML entities if any
  const decoded = rawTitle
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Clean trailing " | LinkedIn", " - LinkedIn", " – LinkedIn", " — LinkedIn"
  const clean = decoded.replace(/[|\-–—]\s*LinkedIn.*$/i, '').trim();

  // Split by common title delimiters: hyphen, en-dash, em-dash, pipe, bullet
  const parts = clean.split(/\s*[\-–—|•·]\s*/).map((p) => p.trim()).filter(Boolean);

  let rawName = parts[0] ?? '';
  let jobTitle: string | undefined;
  let companyName: string | undefined;

  if (parts.length >= 3) {
    // "Satya Nadella" | "Chairman and CEO" | "Microsoft"
    jobTitle = parts[1];
    companyName = parts[2];
  } else if (parts.length === 2) {
    // "Jane Smith" | "CEO at Acme" OR "Jane Smith" | "Microsoft"
    const atMatch = parts[1].match(/(.+)\s+(?:at|@|of)\s+(.+)/i);
    if (atMatch) {
      jobTitle = atMatch[1].trim();
      companyName = atMatch[2].trim();
    } else {
      // Check if second part looks like a job title or company
      const looksLikeTitle = /\b(engineer|developer|manager|director|vp|vice president|ceo|cto|cfo|cmo|founder|president|lead|architect|consultant|specialist|analyst|associate|intern)\b/i.test(parts[1]);
      if (looksLikeTitle) {
        jobTitle = parts[1];
      } else {
        companyName = parts[1];
      }
    }
  }

  // Check if rawName itself contains " at " (e.g. "John Doe at Stripe")
  if (rawName.toLowerCase().includes(' at ')) {
    const atSplit = rawName.split(/\s+at\s+/i);
    rawName = atSplit[0].trim();
    if (!companyName) companyName = atSplit[1].trim();
  }

  // If company is still not found, check description snippet
  if (!companyName && description) {
    const descCompanyMatch = description.match(/(?:at|for|joined)\s+([A-Z][a-zA-Z0-9\s&.,'-]+?)(?:\.|\s+as|\s+in|\s+since|\s+where|\s*$)/);
    if (descCompanyMatch?.[1]) {
      companyName = descCompanyMatch[1].trim();
    }
  }

  const { fullName, firstName, lastName } = cleanPersonName(rawName);

  return {
    fullName,
    firstName,
    lastName,
    jobTitle,
    companyName,
    headline: description,
  };
}

