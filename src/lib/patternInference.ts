// ============================================================
// Pattern Inference & Footprint Extraction Engine
// Discovers domain-wide email patterns without paid API keys
// ============================================================

import { generateEmailPatterns } from './normalization';
import { logger } from './logger';

export interface InferredPattern {
  pattern: string;
  candidateEmail: string;
  weight: number;
}

/**
 * Infer candidate emails for a person based on company domain and name heuristics.
 * Uses weighted scoring based on industry standard pattern prevalence:
 *   1. firstname.lastname@domain.com (45% of enterprise)
 *   2. firstname@domain.com (25% of startups/SMBs)
 *   3. firstinitiallastname@domain.com (15% of corporate)
 *   4. firstnamelastname@domain.com (8%)
 *   5. lastname@domain.com (4%)
 *   6. firstname_lastname@domain.com (3%)
 */
export function inferCandidateEmails(
  firstName: string,
  lastName: string,
  domain: string
): InferredPattern[] {
  const patterns = generateEmailPatterns(firstName, lastName, domain);
  
  const patternWeights: Record<string, number> = {
    'firstname.lastname': 45,
    'firstname': 25,
    'flastname': 15,
    'firstnamelastname': 8,
    'lastname': 4,
    'firstname_lastname': 3,
    'firstnamel': 2,
    'f.lastname': 2,
    'fl': 1,
  };

  return patterns.map((p) => ({
    pattern: p.pattern,
    candidateEmail: p.email,
    weight: patternWeights[p.pattern] ?? 1,
  })).sort((a, b) => b.weight - a.weight);
}

/**
 * Attempt to infer company email format by fetching public company contact pages.
 */
export async function detectDomainEmailFormat(domain: string): Promise<string | null> {
  try {
    const url = `https://${domain}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ResolveBot/1.0' },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const emailRegex = new RegExp(`[a-zA-Z0-9._%+\\-]+@${domain.replace('.', '\\.')}`, 'gi');
    const matches = html.match(emailRegex);

    if (!matches || matches.length === 0) return null;

    // Deduce structure from sample public emails
    for (const match of matches) {
      const local = match.split('@')[0].toLowerCase();
      if (local.includes('.')) return 'firstname.lastname';
      if (local.includes('_')) return 'firstname_lastname';
    }

    return 'firstname';
  } catch {
    return null;
  }
}
