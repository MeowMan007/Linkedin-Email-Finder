import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history',   label: 'History' },
  { href: '/settings',  label: 'Settings' },
];

export async function Navigation() {
  const session = await auth();

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 24px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
      }}>
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}
          aria-label="Resolve home"
        >
          Resolve
        </Link>

        {/* Nav */}
        <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                padding: '6px 10px',
                borderRadius: '5px',
                transition: 'color 120ms ease, background 120ms ease',
              }}
            >
              {item.label}
            </Link>
          ))}

          {/* Auth */}
          {session?.user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {session.user.email}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-strong)',
                borderRadius: '5px',
                padding: '5px 12px',
                marginLeft: '8px',
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
