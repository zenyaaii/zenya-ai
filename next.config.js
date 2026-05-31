/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Build speed optimization for CI/Vercel; lint remains available via npm run lint
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    // Image proxy: only sources we explicitly trust. The previous '**' wildcard
    // combined with dangerouslyAllowSVG turned next/image into an open SSRF +
    // SVG-XSS surface.
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '*.shopifycdn.com' },
      { protocol: 'https', hostname: 'ae01.alicdn.com' },
      { protocol: 'https', hostname: '*.alicdn.com' },
      // Supabase Storage (if/when we upload user assets there)
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    // SVG support stays off: SVGs can carry script and break CSP.
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        // CORS for /api/*: explicit allowlist + Vary so caches behave.
        // `Allow-Credentials: true` with `Allow-Origin: *` is invalid per spec
        // and was silently breaking cross-origin auth flows. Per-route handlers
        // can override via NextResponse if a stricter or different policy is
        // needed (e.g. /api/webhook should not have CORS at all — but Stripe
        // calls it server-to-server so headers are ignored there).
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "https://zenyaai.co" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
          { key: "Vary", value: "Origin" },
        ]
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com https://*.spin.dev;"
          }
        ]
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/app/api/webhooks/:path*',
        destination: '/api/webhooks/:path*',
      },
    ]
  }
}

module.exports = nextConfig
