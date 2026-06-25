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
          },
          // Force HTTPS for 2 years incl. subdomains — kills SSL-strip / downgrade.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Stop browsers MIME-sniffing a response into something executable.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak full URLs (with tokens/paths) to third parties.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Deny powerful browser APIs we never use.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
        ]
      }
    ]
  },
  async redirects() {
    // The embedded Shopify app entry point (application_url) is /app, which used
    // to be the old download-only wizard. The current one-click install flow
    // lives under /shopify. Point the entry at the new flow so opening (or
    // reinstalling) the app lands on the install wizard, not the stale zip page.
    // Next.js passes the original query string (host, shop, embedded, ...) through
    // automatically, so App Bridge still initializes correctly.
    // Gate on the `host` param: Shopify always sends it when loading an embedded
    // app in Admin, but the storefront app-proxy (apps/zenya -> /app) does not,
    // so this can't hijack proxy traffic.
    return [
      {
        source: '/app',
        has: [{ type: 'query', key: 'host' }],
        destination: '/shopify',
        permanent: false,
      },
      {
        source: '/app/create',
        has: [{ type: 'query', key: 'host' }],
        destination: '/shopify/new',
        permanent: false,
      },
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
