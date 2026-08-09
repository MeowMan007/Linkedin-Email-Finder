import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from common avatar providers (for OAuth profiles)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Ensure server-only modules don't leak to client
  serverExternalPackages: ['@neondatabase/serverless'],
};

export default nextConfig;
