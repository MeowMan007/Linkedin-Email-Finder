// ============================================================
// Provider System — Interface + Waterfall Engine
// ============================================================

import { EmailEnrichmentProvider, ProviderInput, ProviderResult } from '@/types';
import { logger } from '@/lib/logger';

export type { EmailEnrichmentProvider, ProviderInput, ProviderResult };

/**
 * WaterfallEngine runs providers in priority order.
 * Stops as soon as a sufficiently confident result is obtained.
 * Never crashes the pipeline if one provider fails.
 */
export class WaterfallEngine {
  private providers: EmailEnrichmentProvider[];
  private stopThreshold: number;

  constructor(providers: EmailEnrichmentProvider[], stopThreshold: number = 70) {
    this.providers = providers;
    this.stopThreshold = stopThreshold;
  }

  async run(
    input: ProviderInput,
    requestId?: string
  ): Promise<{
    result: ProviderResult | null;
    tried: string[];
    warnings: string[];
  }> {
    const tried: string[] = [];
    const warnings: string[] = [];

    const configured = this.providers.filter((p) => p.isConfigured());

    if (configured.length === 0) {
      logger.warn('waterfall_no_providers', {
        operation: 'waterfall_run',
        request_id: requestId,
        message: 'No email enrichment providers are configured',
      });
      return { result: null, tried: [], warnings: ['No providers configured'] };
    }

    for (const provider of configured) {
      tried.push(provider.name);
      const start = Date.now();

      try {
        logger.info('provider_attempt', {
          operation: 'provider_find_email',
          provider: provider.name,
          request_id: requestId,
        });

        const result = await provider.findEmail(input);

        const duration = Date.now() - start;

        if (result) {
          logger.info('provider_success', {
            operation: 'provider_find_email',
            provider: provider.name,
            request_id: requestId,
            duration_ms: duration,
            status: 'success',
          });

          // If confidence meets threshold, stop waterfall
          if (result.confidence >= this.stopThreshold) {
            return { result, tried, warnings };
          }

          // Lower confidence — keep result but continue looking
          logger.info('provider_low_confidence', {
            operation: 'provider_find_email',
            provider: provider.name,
            request_id: requestId,
            message: `Confidence ${result.confidence} below threshold ${this.stopThreshold}, continuing waterfall`,
          });
        } else {
          logger.info('provider_no_result', {
            operation: 'provider_find_email',
            provider: provider.name,
            request_id: requestId,
            duration_ms: duration,
            status: 'skipped',
          });
        }
      } catch (err) {
        const duration = Date.now() - start;
        const errorType = err instanceof Error ? err.constructor.name : 'unknown';
        
        logger.error('provider_error', {
          operation: 'provider_find_email',
          provider: provider.name,
          request_id: requestId,
          duration_ms: duration,
          status: 'error',
          error_type: errorType,
        });

        warnings.push(
          `We couldn't retrieve data from ${provider.name}. We tried another available source.`
        );
      }
    }

    return { result: null, tried, warnings };
  }
}

/**
 * Profile enrichment waterfall (for resolving person info from LinkedIn URL).
 */
import { ProfileEnrichmentProvider, LinkedInProfile } from '@/types';

export class ProfileWaterfallEngine {
  private providers: ProfileEnrichmentProvider[];

  constructor(providers: ProfileEnrichmentProvider[]) {
    this.providers = providers;
  }

  async run(
    linkedinUrl: string,
    requestId?: string
  ): Promise<{
    profile: Partial<LinkedInProfile> | null;
    providerUsed: string | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    const configured = this.providers.filter((p) => p.isConfigured());

    for (const provider of configured) {
      const start = Date.now();
      try {
        logger.info('profile_provider_attempt', {
          operation: 'profile_enrich',
          provider: provider.name,
          request_id: requestId,
        });

        const profile = await provider.enrichProfile(linkedinUrl);
        const duration = Date.now() - start;

        if (profile && (profile.fullName || profile.firstName)) {
          logger.info('profile_provider_success', {
            operation: 'profile_enrich',
            provider: provider.name,
            request_id: requestId,
            duration_ms: duration,
            status: 'success',
          });
          return { profile, providerUsed: provider.name, warnings };
        }
      } catch (err) {
        const errorType = err instanceof Error ? err.constructor.name : 'unknown';
        logger.error('profile_provider_error', {
          operation: 'profile_enrich',
          provider: provider.name,
          request_id: requestId,
          error_type: errorType,
        });
        warnings.push(
          `Profile enrichment via ${provider.name} was unavailable.`
        );
      }
    }

    return { profile: null, providerUsed: null, warnings };
  }
}
