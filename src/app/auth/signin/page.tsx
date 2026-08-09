import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Sign In' };

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  return (
    <div style={{
      maxWidth: '380px',
      margin: '80px auto',
      padding: '0 24px',
    }}>
      <div className="card-raised">
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Sign in to Resolve
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.6 }}>
          Sign in to track your searches, access history across sessions, and increase your daily limit.
        </p>

        {/* GitHub OAuth */}
        <form action="/api/auth/signin/github" method="POST" style={{ marginBottom: '10px' }}>
          <button
            type="submit"
            id="signin-github-button"
            style={{
              width: '100%',
              padding: '11px 16px',
              background: 'var(--color-900)',
              color: 'var(--color-white)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Continue with GitHub
          </button>
        </form>

        {/* Google OAuth */}
        <form action="/api/auth/signin/google" method="POST" style={{ marginBottom: '24px' }}>
          <button
            type="submit"
            id="signin-google-button"
            style={{
              width: '100%',
              padding: '11px 16px',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M15.68 8.18c0-.57-.05-1.11-.15-1.64H8v3.1h4.31a3.68 3.68 0 01-1.6 2.42v2.01h2.59c1.52-1.4 2.38-3.45 2.38-5.89z" fill="#4285F4"/>
              <path d="M8 16c2.16 0 3.97-.71 5.3-1.93l-2.59-2.01c-.72.48-1.63.77-2.71.77-2.09 0-3.86-1.41-4.49-3.31H.84v2.08A8 8 0 008 16z" fill="#34A853"/>
              <path d="M3.51 9.52A4.8 4.8 0 013.26 8c0-.53.09-1.04.25-1.52V4.4H.84A8 8 0 000 8c0 1.29.31 2.51.84 3.6l2.67-2.08z" fill="#FBBC05"/>
              <path d="M8 3.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3C11.97.71 10.16 0 8 0A8 8 0 00.84 4.4l2.67 2.08C4.14 4.6 5.91 3.18 8 3.18z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
          By signing in, you agree to professional use of this tool only.
        </p>
      </div>
    </div>
  );
}
