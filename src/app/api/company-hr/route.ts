// ============================================================
// POST /api/company-hr
// Company HR & Recruiter Lead Discovery & Email Verification
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { searchCompanyHrProfiles } from '@/lib/hrScraper';
import { resolveCompanyDomain } from '@/lib/domainResolver';
import { inferCandidateEmails } from '@/lib/patternInference';
import { verifyEmailViaSmtp, detectMailProvider } from '@/lib/smtpVerifier';
import { resolveDomainMx } from '@/lib/dnsResolver';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CompanyHrSearchResponse, HrLead, EmailStatus, CandidatePermutation } from '@/types';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = getClientIp(request);

  // Auth & Rate Limiting
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const rateLimit = await checkRateLimit({ ip, authenticated: !!userId });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Daily search limit reached. Please try again tomorrow.',
        },
      },
      { status: 429 }
    );
  }

  // Parse Body
  let companyName = '';
  let companyDomain = '';
  try {
    const body = await request.json();
    companyName = body?.companyName?.trim?.() ?? '';
    companyDomain = body?.companyDomain?.trim?.() ?? '';
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_BODY',
          message: 'Request body must be valid JSON with a "companyName" field.',
        },
      },
      { status: 400 }
    );
  }

  if (!companyName && !companyDomain) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_COMPANY',
          message: 'Please provide a company name or company domain.',
        },
      },
      { status: 400 }
    );
  }

  logger.info('company_hr_search_request', {
    operation: 'api_company_hr',
    request_id: requestId,
    company: companyName,
    domain: companyDomain,
  });

  try {
    // 1. Resolve Corporate Domain
    const domainRes = await resolveCompanyDomain(companyName, companyDomain);
    const domain = domainRes?.domain || companyDomain || `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    // 2. Resolve MX & Mail Provider
    const mxRes = await resolveDomainMx(domain);
    const primaryMx = mxRes.primaryMx;
    const mailProvider = detectMailProvider(primaryMx);

    // 3. Scrape HR & Recruiter Profiles
    const discoveredPeople = await searchCompanyHrProfiles(companyName || domain, 8);

    // 4. Generate Permutations & Verify SMTP in parallel for each HR person
    const leads: HrLead[] = await Promise.all(
      discoveredPeople.map(async (person) => {
        const patterns = inferCandidateEmails(person.firstName, person.lastName, domain);
        const permutations: CandidatePermutation[] = patterns.map((p) => ({
          email: p.candidateEmail,
          pattern: p.pattern,
          label: p.label,
          confidence: p.weight,
          status: 'probable',
        }));

        const topCandidate = permutations[0];
        const primaryEmail = topCandidate?.email || `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}@${domain}`;

        // Live SMTP Probe
        let emailStatus: EmailStatus = 'probable';
        let isCatchAll = false;
        let statusCode: number | null = null;

        try {
          const smtpRes = await verifyEmailViaSmtp(primaryEmail, 2000);
          statusCode = smtpRes.statusCode;
          isCatchAll = smtpRes.isCatchAll;

          if (smtpRes.smtpValid && !smtpRes.isCatchAll) {
            emailStatus = 'verified';
          } else if (smtpRes.isCatchAll) {
            emailStatus = 'catch_all';
          } else if (statusCode === 550 || statusCode === 553 || statusCode === 554) {
            emailStatus = 'invalid';
          }
        } catch {
          emailStatus = 'probable';
        }

        return {
          id: randomUUID(),
          fullName: person.fullName,
          firstName: person.firstName,
          lastName: person.lastName,
          jobTitle: person.jobTitle,
          location: person.location,
          profileUrl: person.profileUrl,
          primaryEmail,
          emailStatus,
          smtpStatusCode: statusCode,
          confidence: emailStatus === 'verified' ? 95 : emailStatus === 'catch_all' ? 85 : 75,
          isCatchAll,
          permutations,
        };
      })
    );

    const responseData: CompanyHrSearchResponse = {
      companyName: companyName || domain,
      companyDomain: domain,
      mailProvider,
      mxServer: primaryMx,
      isCatchAll: leads.some((l) => l.isCatchAll),
      totalFound: leads.length,
      leads,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Company HR search failed';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'COMPANY_HR_FAILED',
          message: msg,
        },
      },
      { status: 500 }
    );
  }
}
