// ============================================================
// Public LinkedIn Profile Meta Extractor
// Extracts public OpenGraph title/description & company context
// Zero API keys required
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
}

/**
 * Extract public name, job title, and current company from LinkedIn profile URL.
 * Uses public OpenGraph tags and public HTML headers.
 */
export async function extractPublicProfileMeta(linkedinUrl: string): Promise<ExtractedPublicMeta | null> {
  const slug = extractLinkedInSlug(linkedinUrl);
  if (!slug) return null;

  // 1. Try fetching via DuckDuckGo HTML search for exact LinkedIn profile
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:linkedin.com/in/ "${slug}"`)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const html = await response.text();
      const meta = parseSearchResultHtml(html, slug);
      if (meta && meta.companyName) return meta;
    }
  } catch {
    // search fallback error
  }

  // 2. Direct OpenGraph fetch fallback
  try {
    const response = await fetch(linkedinUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const html = await response.text();
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
      const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);

      const title = ogTitleMatch?.[1];
      const desc = ogDescMatch?.[1];

      if (title) {
        return parseLinkedInTitle(title, desc);
      }
    }
  } catch {
    // direct fetch fallback error
  }

  return null;
}

/**
 * Parse DuckDuckGo search result snippet for LinkedIn title pattern:
 * e.g. "Satya Nadella - Chairman and CEO - Microsoft | LinkedIn"
 */
function parseSearchResultHtml(html: string, slug: string): ExtractedPublicMeta | null {
  // Extract snippet link text
  const linkRegex = /<a class="result__url" href="[^"]*linkedin\.com\/in\/([^"/]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1].toLowerCase() === slug.toLowerCase()) {
      // Found target result
      const titleMatch = html.match(/<a class="result__a"[^>]*>([^<]+)<\/a>/i);
      if (titleMatch?.[1]) {
        return parseLinkedInTitle(titleMatch[1]);
      }
    }
  }

  // Fallback: parse first result__a if present
  const firstTitle = html.match(/<a class="result__a"[^>]*>([^<]+)<\/a>/i);
  if (firstTitle?.[1]) {
    return parseLinkedInTitle(firstTitle[1]);
  }

  return null;
}

/**
 * Parses typical LinkedIn titles:
 * Format 1: "John Doe - Senior Manager - Microsoft | LinkedIn"
 * Format 2: "Jane Smith - Founder & CEO at Acme Corp | LinkedIn"
 */
export function parseLinkedInTitle(rawTitle: string, description?: string): ExtractedPublicMeta {
  const clean = rawTitle.replace(/\|?\s*LinkedIn$/i, '').trim();
  const parts = clean.split('-').map((p) => p.trim());

  let fullName = parts[0] ?? '';
  let jobTitle: string | undefined;
  let companyName: string | undefined;

  if (parts.length >= 3) {
    jobTitle = parts[1];
    companyName = parts[2];
  } else if (parts.length === 2) {
    // Check for "Title at Company" pattern
    const atMatch = parts[1].match(/(.+)\s+(?:at|@)\s+(.+)/i);
    if (atMatch) {
      jobTitle = atMatch[1].trim();
      companyName = atMatch[2].trim();
    } else {
      companyName = parts[1];
    }
  }

  if (fullName.includes(' at ')) {
    const atSplit = fullName.split(' at ');
    fullName = atSplit[0].trim();
    companyName = atSplit[1].trim();
  }

  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  return {
    fullName,
    firstName,
    lastName,
    jobTitle,
    companyName,
    headline: description,
  };
}
