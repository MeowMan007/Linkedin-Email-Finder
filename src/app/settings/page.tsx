import type { Metadata } from 'next';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure your Resolve account and enrichment preferences.',
};

const PROVIDERS = [
  { name: 'Hunter.io',  envKey: 'HUNTER_API_KEY',      docs: 'https://hunter.io/api-documentation/v2' },
  { name: 'Apollo.io',  envKey: 'APOLLO_API_KEY',       docs: 'https://apolloio.github.io/apollo-api-docs/' },
  { name: 'Snov.io',    envKey: 'SNOV_CLIENT_ID',       docs: 'https://snov.io/api' },
  { name: 'Findymail',  envKey: 'FINDYMAIL_API_KEY',    docs: 'https://app.findymail.com/api' },
  { name: 'Prospeo',    envKey: 'PROSPEO_API_KEY',      docs: 'https://prospeo.io/api' },
];

function isProviderConfigured(envKey: string): boolean {
  return !!(process.env[envKey]);
}

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ maxWidth: '560px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 4px' }}>
          Settings
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 40px' }}>
          Configuration status and account options.
        </p>

        {/* Account */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 14px', letterSpacing: '-0.01em' }}>
            Account
          </h2>
          <div style={{
            padding: '16px 18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            {session?.user ? (
              <>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                    {session.user.name ?? session.user.email}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                    {session.user.email}
                  </p>
                </div>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    style={{
                      padding: '7px 14px',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '5px',
                      fontSize: '13px',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                  Not signed in. History is not persistent.
                </p>
                <a
                  href="/auth/signin"
                  style={{
                    padding: '7px 14px',
                    background: 'var(--color-900)',
                    color: 'var(--color-white)',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  Sign in
                </a>
              </>
            )}
          </div>
        </section>

        {/* Rate limits */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 14px', letterSpacing: '-0.01em' }}>
            Rate limits
          </h2>
          <div style={{
            padding: '16px 18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Unauthenticated</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {process.env.RATE_LIMIT_UNAUTHENTICATED ?? 5} searches / day
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Authenticated</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {process.env.RATE_LIMIT_AUTHENTICATED ?? 50} searches / day
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Providers */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            Enrichment providers
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '0 0 14px' }}>
            Configure API keys in your <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'var(--bg-subtle)', padding: '1px 5px', borderRadius: '3px' }}>.env.local</code> file.
          </p>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            {PROVIDERS.map((provider, i) => {
              const configured = isProviderConfigured(provider.envKey);
              return (
                <div
                  key={provider.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: i < PROVIDERS.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--surface)',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {provider.name}
                    </span>
                    <a
                      href={provider.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}
                      aria-label={`${provider.name} API documentation`}
                    >
                      Docs ↗
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: configured ? 'var(--color-700)' : 'var(--color-200)',
                    }} />
                    <span style={{
                      fontSize: '12px',
                      color: configured ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    }}>
                      {configured ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Database */}
        <section>
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 14px', letterSpacing: '-0.01em' }}>
            Database
          </h2>
          <div style={{
            padding: '16px 18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Neon PostgreSQL</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: process.env.DATABASE_URL ? 'var(--color-700)' : 'var(--color-200)',
              }} />
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
