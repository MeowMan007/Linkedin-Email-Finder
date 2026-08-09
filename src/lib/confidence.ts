// ============================================================
// Confidence Scoring Engine
// ============================================================

import {
  ConfidenceBreakdown,
  ConfidenceBand,
  ConfidenceSignals,
} from '@/types';

// Signal weights (must sum to 100)
const WEIGHTS = {
  identityMatch: 25,
  currentCompanyMatch: 25,
  domainMatch: 15,
  emailFromProvider: 20,
  emailVerification: 15,
} as const;

/**
 * Classify a raw confidence score into a band.
 */
export function classifyConfidenceBand(score: number): ConfidenceBand {
  if (score >= 90) return 'Very High';
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  if (score >= 25) return 'Low';
  return 'Insufficient';
}

/**
 * Calculate a transparent confidence score based on pipeline signals.
 *
 * Each signal has a fixed weight. The score is the sum of
 * weights for signals that were achieved.
 */
export function calculateConfidence(
  signals: ConfidenceSignals
): ConfidenceBreakdown {
  const scores = {
    identityMatch: signals.identityMatched ? WEIGHTS.identityMatch : 0,
    currentCompanyMatch: signals.currentCompanyMatched
      ? WEIGHTS.currentCompanyMatch
      : 0,
    domainMatch: signals.domainMatched ? WEIGHTS.domainMatch : 0,
    emailFromProvider: signals.emailFromProvider ? WEIGHTS.emailFromProvider : 0,
    emailVerification: signals.emailVerified ? WEIGHTS.emailVerification : 0,
  };

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const band = classifyConfidenceBand(total);

  const explanations: string[] = [];
  if (signals.identityMatched) {
    explanations.push('Name identified and matched');
  } else {
    explanations.push('Name could not be confirmed');
  }

  if (signals.currentCompanyMatched) {
    explanations.push('Current employer matched');
  } else {
    explanations.push('Current employer could not be confirmed');
  }

  if (signals.domainMatched) {
    explanations.push('Company domain resolved');
  } else {
    explanations.push('Company domain could not be resolved');
  }

  if (signals.emailFromProvider) {
    explanations.push('Professional email found via enrichment provider');
  } else {
    explanations.push('No email returned by enrichment providers');
  }

  if (signals.emailVerified) {
    explanations.push('Email passed verification checks');
  } else {
    explanations.push('Email could not be independently verified');
  }

  return {
    total,
    band,
    signals,
    scores,
    explanations,
  };
}

/**
 * Get the maximum possible confidence score given available signals.
 * Used to explain what's achievable vs what was achieved.
 */
export function getMaxPossibleScore(signals: Partial<ConfidenceSignals>): number {
  let max = 0;
  if (signals.identityMatched !== false) max += WEIGHTS.identityMatch;
  if (signals.currentCompanyMatched !== false) max += WEIGHTS.currentCompanyMatch;
  if (signals.domainMatched !== false) max += WEIGHTS.domainMatch;
  if (signals.emailFromProvider !== false) max += WEIGHTS.emailFromProvider;
  if (signals.emailVerified !== false) max += WEIGHTS.emailVerification;
  return max;
}
