// ============================================================
// POST /api/enrich
// Main enrichment endpoint
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { runEnrichmentPipeline } from '@/pipeline/orchestrator';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { EnrichApiRequest } from '@/types';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = getClientIp(request);

  // Get session (optional auth)
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Rate limiting
  const rateLimit = await checkRateLimit({ ip, authenticated: !!userId });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message:
            'You\'ve reached the daily search limit. Please try again tomorrow or sign in to increase your limit.',
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt,
        },
      }
    );
  }

  // Parse body
  let body: EnrichApiRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_BODY',
          message: 'Request body must be valid JSON with a linkedinUrl field.',
        },
      },
      { status: 400 }
    );
  }

  const { linkedinUrl, firstName, lastName, fullName, companyName, companyDomain } = body ?? {};

  const isDirect = (firstName || fullName) && (companyName || companyDomain);
  const isUrl = linkedinUrl && typeof linkedinUrl === 'string' && linkedinUrl.trim().length > 0;

  if (!isUrl && !isDirect) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_INPUT',
          message: 'Please provide either a LinkedIn profile URL or a Person Name and Company Name.',
        },
      },
      { status: 400 }
    );
  }

  logger.info('enrich_request', {
    operation: 'api_enrich',
    request_id: requestId,
    mode: isDirect ? 'direct' : 'linkedin_url',
  });

  // Run pipeline
  const { result, error, httpStatus } = isDirect
    ? await (await import('@/pipeline/orchestrator')).runDirectEnrichmentPipeline(
        { firstName, lastName, fullName, companyName, companyDomain, linkedinUrl },
        { requestId, userId }
      )
    : await runEnrichmentPipeline(linkedinUrl!, { requestId, userId });

  if (!result || error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: mapErrorCode(httpStatus ?? 500),
          message: error ?? 'An unexpected error occurred. Please try again.',
        },
      },
      {
        status: httpStatus ?? 500,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  }

  return NextResponse.json(
    { success: true, data: result },
    {
      status: 200,
      headers: {
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    }
  );
}

function mapErrorCode(status: number): string {
  switch (status) {
    case 400: return 'INVALID_URL';
    case 404: return 'PROFILE_NOT_FOUND';
    case 422: return 'INSUFFICIENT_DATA';
    case 429: return 'RATE_LIMITED';
    default: return 'INTERNAL_ERROR';
  }
}
