/**
 * The eight templates: [business_type key, public slug]. Mirrors key and slug
 * in lib/template-pages.tsx, which this file cannot import (it is CommonJS and
 * that is TSX). Change one, change the other.
 */
const TEMPLATE_ROUTES = [
  ['restaurant', 'restaurant'],
  ['atlas', 'app-landing-page'],
  ['lookbook', 'fashion-lookbook'],
  ['collective', 'online-store'],
  ['studio', 'brand-story'],
  ['services', 'services'],
  ['wellness', 'wellness'],
  ['one_product', 'one-product-store'],
]
const ZENYA_HOST = [{ type: 'host', value: '(?:(?:www\\.)?zenyaai\\.co|localhost)' }]

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
      // /themes IS NOW /templates. The page has always been the template
      // gallery; "themes" was the internal word for what a customer calls a
      // template, and the URL said the internal one.
      //
      // PERMANENT, unlike the two below it. This rename is not coming back,
      // and a 301 is what moves the page's search ranking to the new address
      // rather than splitting it across two. Every internal link was updated
      // in the same commit, so this redirect exists for the outside world:
      // links already shared, and anything Google has indexed.
      //
      // The :slug form is not needed — /themes never had children — but the
      // bare source also catches /themes/ with the trailing slash.
      {
        source: '/themes',
        destination: '/templates',
        permanent: true,
      },
      // The English route moved with it, for the same reason.
      {
        source: '/en/themes',
        destination: '/en/templates',
        permanent: true,
      },
      // ONE ADDRESS PER TEMPLATE (2026-10-04). Each template used to have
      // three indexed pages: /websites/<slug>, /why/<key> and /demo/<key>.
      // They are one page now, /templates/<slug>, with the demo under it. All
      // PERMANENT, for the same reason as /themes above: the 301 carries the
      // old page's ranking to the new one. Gated to Zenya's own host so a
      // customer site on a custom domain that happens to have a /demo path is
      // never sent here.
      ...TEMPLATE_ROUTES.flatMap(([key, slug]) => [
        { source: `/why/${key}`, destination: `/templates/${slug}`, permanent: true, has: ZENYA_HOST },
        { source: `/demo${key === 'one_product' ? '' : `/${key}`}`, destination: `/templates/${slug}/demo`, permanent: true, has: ZENYA_HOST },
      ]),
      { source: '/websites', destination: '/templates', permanent: true, has: ZENYA_HOST },
      { source: '/websites/:slug', destination: '/templates/:slug', permanent: true, has: ZENYA_HOST },
      // The embedded app's URL in shopify.app.zenya-ai.toml is /app. The app
      // itself lives under /shopify; the old builder that sat at /app was
      // retired, so these always forward (query string, including host and
      // shop, is kept). /app/license is the app proxy and is not matched.
      {
        source: '/app',
        destination: '/shopify',
        permanent: false,
      },
      {
        source: '/app/create',
        destination: '/shopify/new',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      // The demos still live under app/demo; this serves each one at its
      // template's address. Redirects run before rewrites, so the 301 from
      // /demo/<key> above does not loop back.
      ...TEMPLATE_ROUTES.map(([key, slug]) => ({
        source: `/templates/${slug}/demo`,
        destination: key === 'one_product' ? '/demo' : `/demo/${key}`,
      })),
      {
        source: '/app/api/webhooks/:path*',
        destination: '/api/webhooks/:path*',
      },
    ]
  }
}

module.exports = nextConfig
module.exports.TEMPLATE_ROUTES = TEMPLATE_ROUTES
