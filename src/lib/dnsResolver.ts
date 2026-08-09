// ============================================================
// DNS MX Resolver Module
// Direct DNS resolution using Node.js builtin dns/promises
// ============================================================

import { resolveMx } from 'node:dns/promises';
import { logger } from '@/lib/logger';

export interface MxRecord {
  exchange: string;
  priority: number;
}

export interface DomainMxResult {
  hasMx: boolean;
  primaryMx: string | null;
  records: MxRecord[];
  error?: string;
}

/**
 * Resolve MX records for a company domain.
 * Returns sorted list of mail exchange servers (lowest priority number = highest preference).
 */
export async function resolveDomainMx(domain: string): Promise<DomainMxResult> {
  const cleanDomain = domain.toLowerCase().trim().replace(/^@/, '');

  try {
    const addresses = await resolveMx(cleanDomain);

    if (!addresses || addresses.length === 0) {
      return {
        hasMx: false,
        primaryMx: null,
        records: [],
        error: 'No MX records found for domain',
      };
    }

    // Sort by priority ascending (priority 10 is higher preference than priority 20)
    const sorted = [...addresses].sort((a, b) => a.priority - b.priority);
    const primaryMx = sorted[0]?.exchange ?? null;

    return {
      hasMx: true,
      primaryMx,
      records: sorted,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DNS lookup failed';
    logger.debug('dns_mx_lookup_error', {
      operation: 'resolve_domain_mx',
      domain: cleanDomain,
      message,
    });

    return {
      hasMx: false,
      primaryMx: null,
      records: [],
      error: message,
    };
  }
}
