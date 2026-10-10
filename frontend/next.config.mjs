const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.beyondbrawn.store').replace(/\/$/, '');
const api = new URL(API_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: api.protocol.replace(':', ''), hostname: api.hostname, port: api.port || '' },
    ],
  },
  // Browser requests go to /api/* on this origin and are proxied to Express, so auth cookies stay first-party.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
