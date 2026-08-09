// ============================================================
// Core Types for Resolve — LinkedIn-to-Email Enrichment App
// ============================================================

export type EmailStatus =
  | 'verified'
  | 'probable'
  | 'unverified'
  | 'catch_all'
  | 'invalid'
  | 'not_found';

export type ConfidenceBand =
  | 'Very High'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Insufficient';

// ----------------------------
// LinkedIn Profile
// ----------------------------

export interface LinkedInProfile {
  linkedinUrl: string;
  linkedinSlug: string;
  fullName: string;
  firstName: string;
  lastName: string;
  headline?: string;
  jobTitle?: string;
  currentCompany?: string;
  companyUrl?: string;
  location?: string;
  raw?: Record<string, unknown>;
}

// ----------------------------
// Company Information
// ----------------------------

export interface CompanyInfo {
  name: string;
  domain: string;
  website: string;
  confidence: number; // 0–1
}

// ----------------------------
// Email Verification Details
// ----------------------------

export interface EmailVerificationDetails {
  syntaxValid: boolean;
  domainExists?: boolean;
  mxValid?: boolean;
  mailboxStatus?: 'valid' | 'invalid' | 'unknown' | 'catch_all';
  disposable?: boolean;
  roleBased?: boolean;
  catchAll?: boolean;
  providerVerified?: boolean;
}

// ----------------------------
// Email Result
// ----------------------------

export interface EmailResult {
  address: string;
  status: EmailStatus;
  confidence: number; // 0–100
  provider?: string;
  pattern?: string;
  verification?: EmailVerificationDetails;
}

// ----------------------------
// Confidence Breakdown
// ----------------------------

export interface ConfidenceSignals {
  identityMatched: boolean;
  currentCompanyMatched: boolean;
  domainMatched: boolean;
  emailFromProvider: boolean;
  emailVerified: boolean;
}

export interface ConfidenceBreakdown {
  total: number;
  band: ConfidenceBand;
  signals: ConfidenceSignals;
  scores: {
    identityMatch: number;
    currentCompanyMatch: number;
    domainMatch: number;
    emailFromProvider: number;
    emailVerification: number;
  };
  explanations: string[];
}

// ----------------------------
// Full Enrichment Result
// ----------------------------

export interface EnrichmentResult {
  id?: string;
  person: {
    name: string;
    firstName: string;
    lastName: string;
    title?: string;
    company: string;
    linkedinUrl: string;
    location?: string;
  };
  company: CompanyInfo;
  email: EmailResult | null;
  confidence: ConfidenceBreakdown;
  sources: string[];
  warnings?: string[];
  timestamp: string;
  cached?: boolean;
}

// ----------------------------
// Search Record (stored in DB)
// ----------------------------

export interface SearchRecord {
  id: string;
  linkedinUrl: string;
  linkedinUrlHash: string;
  personName: string | null;
  personTitle: string | null;
  companyName: string | null;
  companyDomain: string | null;
  email: string | null;
  emailStatus: EmailStatus | null;
  confidence: number | null;
  sources: string[];
  resultData: EnrichmentResult;
  userId?: string | null;
  createdAt: string;
}

// ----------------------------
// Provider Interface
// ----------------------------

export interface ProviderInput {
  firstName: string;
  lastName: string;
  fullName?: string;
  companyName: string;
  companyDomain: string;
  linkedinUrl?: string;
}

export interface ProviderResult {
  email: string;
  status: EmailStatus;
  confidence: number; // 0–100
  providerName: string;
  raw?: Record<string, unknown>;
}

export interface EmailEnrichmentProvider {
  name: string;
  isConfigured(): boolean;
  findEmail(input: ProviderInput): Promise<ProviderResult | null>;
}

// ----------------------------
// Profile Enrichment Provider Interface
// ----------------------------

export interface ProfileEnrichmentProvider {
  name: string;
  isConfigured(): boolean;
  enrichProfile(linkedinUrl: string): Promise<Partial<LinkedInProfile> | null>;
}

// ----------------------------
// API Response Types
// ----------------------------

export interface EnrichApiRequest {
  linkedinUrl: string;
}

export interface EnrichApiResponse {
  success: true;
  data: EnrichmentResult;
}

export interface EnrichApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface StatsResponse {
  total: number;
  verified: number;
  probable: number;
  catchAll: number;
  notFound: number;
  avgConfidence: number;
}

// ----------------------------
// Validation
// ----------------------------

export interface ValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  slug?: string;
  error?: string;
}

// ----------------------------
// Rate Limit
// ----------------------------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

// ----------------------------
// Pipeline Stage Status
// ----------------------------

export type PipelineStageStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

export interface PipelineStage {
  id: string;
  label: string;
  status: PipelineStageStatus;
  detail?: string;
}
