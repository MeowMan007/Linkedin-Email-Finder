export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    // Match all paths except static files and NextAuth internals
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
