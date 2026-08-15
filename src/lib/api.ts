import {
  EnrichmentResult,
  SearchRecord,
  StatsResponse,
  SmtpPingResult,
  CompanyHrSearchResponse,
} from '@/types';

/**
 * Search for HR / Recruiter profiles at a company and generate/verify their corporate emails.
 */
export async function searchCompanyHr(params: {
  companyName: string;
  companyDomain?: string;
}): Promise<CompanyHrSearchResponse> {
  const response = await fetch('/api/company-hr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const msg = data?.error?.message ?? 'Company HR discovery failed.';
    throw new ApiError(msg, response.status, data?.error?.code);
  }

  return data.data as CompanyHrSearchResponse;
}

/**
 * Perform live direct SMTP mailbox verification and pinging for any email address.
 */
export async function pingEmailSmtp(email: string): Promise<SmtpPingResult> {
  const response = await fetch('/api/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const msg = data?.error?.message ?? 'SMTP ping verification failed.';
    throw new ApiError(msg, response.status, data?.error?.code);
  }

  return data.data as SmtpPingResult;
}

/**
 * Submit a LinkedIn URL for enrichment.
 * Returns the full enrichment result or throws a typed error.
 */
export async function enrichProfile(linkedinUrl: string): Promise<EnrichmentResult> {
  const response = await fetch('/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkedinUrl }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const msg =
      data?.error?.message ??
      getDefaultErrorMessage(response.status);
    throw new ApiError(msg, response.status, data?.error?.code);
  }

  return data.data as EnrichmentResult;
}

/**
 * Submit direct name and company details for enrichment without LinkedIn scraping.
 */
export async function enrichDirect(params: {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  companyName?: string;
  companyDomain?: string;
}): Promise<EnrichmentResult> {
  const response = await fetch('/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const msg =
      data?.error?.message ??
      getDefaultErrorMessage(response.status);
    throw new ApiError(msg, response.status, data?.error?.code);
  }

  return data.data as EnrichmentResult;
}

/**
 * Get paginated search history.
 */
export async function getHistory(page: number = 1): Promise<{
  records: SearchRecord[];
  total: number;
  page: number;
  pages: number;
}> {
  const response = await fetch(`/api/history?page=${page}`);
  if (!response.ok) throw new Error('Failed to fetch history');
  const data = await response.json();
  return { ...data, pages: data.pages ?? 1 };
}

/**
 * Delete a single search record.
 */
export async function deleteRecord(id: string): Promise<boolean> {
  const response = await fetch(`/api/history/${id}`, { method: 'DELETE' });
  return response.ok;
}

/**
 * Clear all search history.
 */
export async function clearHistory(): Promise<boolean> {
  const response = await fetch('/api/history', { method: 'DELETE' });
  return response.ok;
}

/**
 * Get dashboard statistics.
 */
export async function getStats(): Promise<StatsResponse> {
  const response = await fetch('/api/stats');
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

/**
 * Get a specific search record by ID.
 */
export async function getRecordById(id: string): Promise<SearchRecord | null> {
  const response = await fetch(`/api/history/${id}`);
  if (!response.ok) return null;
  return response.json();
}

// ----------------------------
// Error Types
// ----------------------------

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'The LinkedIn URL appears to be invalid. Please check and try again.';
    case 404:
      return 'We couldn\'t find a person or company for this profile.';
    case 422:
      return 'We couldn\'t gather enough information to complete the enrichment.';
    case 429:
      return 'You\'ve reached the daily search limit. Please try again tomorrow.';
    case 500:
      return 'Something went wrong on our end. Please try again in a moment.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
