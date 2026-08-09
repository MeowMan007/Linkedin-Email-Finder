// ============================================================
// Confidence Scoring Tests
// ============================================================

import { calculateConfidence, classifyConfidenceBand } from '../lib/confidence';

describe('calculateConfidence', () => {
  it('returns 100 when all signals are true', () => {
    const result = calculateConfidence({
      identityMatched: true,
      currentCompanyMatched: true,
      domainMatched: true,
      emailFromProvider: true,
      emailVerified: true,
    });
    expect(result.total).toBe(100);
    expect(result.band).toBe('Very High');
  });

  it('returns 0 when no signals are true', () => {
    const result = calculateConfidence({
      identityMatched: false,
      currentCompanyMatched: false,
      domainMatched: false,
      emailFromProvider: false,
      emailVerified: false,
    });
    expect(result.total).toBe(0);
    expect(result.band).toBe('Insufficient');
  });

  it('identity + company = 50', () => {
    const result = calculateConfidence({
      identityMatched: true,
      currentCompanyMatched: true,
      domainMatched: false,
      emailFromProvider: false,
      emailVerified: false,
    });
    expect(result.total).toBe(50);
    expect(result.band).toBe('Medium');
  });

  it('generates explanations for each signal', () => {
    const result = calculateConfidence({
      identityMatched: true,
      currentCompanyMatched: false,
      domainMatched: false,
      emailFromProvider: false,
      emailVerified: false,
    });
    expect(result.explanations).toHaveLength(5);
    expect(result.explanations[0]).toContain('matched');
    expect(result.explanations[1]).toContain('could not');
  });

  it('includes score breakdown', () => {
    const result = calculateConfidence({
      identityMatched: true,
      currentCompanyMatched: true,
      domainMatched: true,
      emailFromProvider: false,
      emailVerified: false,
    });
    expect(result.scores.identityMatch).toBe(25);
    expect(result.scores.currentCompanyMatch).toBe(25);
    expect(result.scores.domainMatch).toBe(15);
    expect(result.scores.emailFromProvider).toBe(0);
    expect(result.scores.emailVerification).toBe(0);
    expect(result.total).toBe(65);
  });
});

describe('classifyConfidenceBand', () => {
  test.each([
    [100, 'Very High'],
    [90,  'Very High'],
    [89,  'High'],
    [75,  'High'],
    [74,  'Medium'],
    [50,  'Medium'],
    [49,  'Low'],
    [25,  'Low'],
    [24,  'Insufficient'],
    [0,   'Insufficient'],
  ])('score %i → %s', (score, expected) => {
    expect(classifyConfidenceBand(score)).toBe(expected);
  });
});
