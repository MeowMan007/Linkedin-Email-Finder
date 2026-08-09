// ============================================================
// Provider Waterfall Tests
// ============================================================

import { WaterfallEngine } from '../providers';
import { EmailEnrichmentProvider, ProviderInput, ProviderResult } from '@/types';

function makeMockProvider(
  name: string,
  result: ProviderResult | null,
  shouldThrow = false
): EmailEnrichmentProvider {
  return {
    name,
    isConfigured: () => true,
    findEmail: async (_input: ProviderInput) => {
      if (shouldThrow) throw new Error(`${name} error`);
      return result;
    },
  };
}

const SAMPLE_INPUT: ProviderInput = {
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Acme Corp',
  companyDomain: 'acme.com',
};

describe('WaterfallEngine', () => {
  it('returns result from first provider if confidence is high enough', async () => {
    const p1 = makeMockProvider('P1', {
      email: 'john@acme.com',
      status: 'verified',
      confidence: 85,
      providerName: 'P1',
    });
    const p2 = makeMockProvider('P2', {
      email: 'jdoe@acme.com',
      status: 'probable',
      confidence: 60,
      providerName: 'P2',
    });

    const engine = new WaterfallEngine([p1, p2], 70);
    const { result, tried } = await engine.run(SAMPLE_INPUT);

    expect(result?.email).toBe('john@acme.com');
    expect(tried).toEqual(['P1']); // stopped after P1
  });

  it('falls through to second provider when first returns null', async () => {
    const p1 = makeMockProvider('P1', null);
    const p2 = makeMockProvider('P2', {
      email: 'john@acme.com',
      status: 'probable',
      confidence: 75,
      providerName: 'P2',
    });

    const engine = new WaterfallEngine([p1, p2], 70);
    const { result, tried } = await engine.run(SAMPLE_INPUT);

    expect(result?.email).toBe('john@acme.com');
    expect(tried).toContain('P1');
    expect(tried).toContain('P2');
  });

  it('returns null when all providers fail', async () => {
    const p1 = makeMockProvider('P1', null);
    const p2 = makeMockProvider('P2', null);
    const p3 = makeMockProvider('P3', null);

    const engine = new WaterfallEngine([p1, p2, p3], 70);
    const { result, tried } = await engine.run(SAMPLE_INPUT);

    expect(result).toBeNull();
    expect(tried).toHaveLength(3);
  });

  it('continues waterfall when provider throws', async () => {
    const p1 = makeMockProvider('P1', null, true); // throws
    const p2 = makeMockProvider('P2', {
      email: 'john@acme.com',
      status: 'probable',
      confidence: 75,
      providerName: 'P2',
    });

    const engine = new WaterfallEngine([p1, p2], 70);
    const { result, warnings } = await engine.run(SAMPLE_INPUT);

    expect(result?.email).toBe('john@acme.com');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('skips unconfigured providers', async () => {
    const p1: EmailEnrichmentProvider = {
      name: 'P1',
      isConfigured: () => false,
      findEmail: async () => { throw new Error('Should not be called'); },
    };
    const p2 = makeMockProvider('P2', {
      email: 'john@acme.com',
      status: 'verified',
      confidence: 80,
      providerName: 'P2',
    });

    const engine = new WaterfallEngine([p1, p2], 70);
    const { result, tried } = await engine.run(SAMPLE_INPUT);

    expect(result?.email).toBe('john@acme.com');
    expect(tried).not.toContain('P1');
    expect(tried).toContain('P2');
  });

  it('returns no providers warning when none configured', async () => {
    const p1: EmailEnrichmentProvider = {
      name: 'P1',
      isConfigured: () => false,
      findEmail: async () => null,
    };

    const engine = new WaterfallEngine([p1], 70);
    const { result, warnings } = await engine.run(SAMPLE_INPUT);

    expect(result).toBeNull();
    expect(warnings[0]).toContain('No providers configured');
  });
});
