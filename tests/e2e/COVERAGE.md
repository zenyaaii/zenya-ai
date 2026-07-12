# Zenya E2E — Full Coverage Map (A→Z)

Status legend: ✅ covered · 🟡 partial · ⬜ not yet · 🔒 needs test-mode keys · ⚠️ finding

## 1. Public site (anonymous)
- ✅ 13 marketing/legal pages render, no console errors, real content
- ✅ Pricing shows real $14.99 / $24.99
- ✅ Home CTA routes correctly
- ✅ Responsive: home + pricing have no horizontal overflow at 375px
- ✅ RTL: home/pricing/features/login render `dir="rtl"` `lang="ar"`
      (dark mode intentionally N/A — product is light-only by design)
- ⬜ Nav + footer links all resolve (no 404s)
- ⬜ `/compare/[slug]` for all 5 competitor pages
- ⬜ `/websites/[slug]` gallery pages
- ⬜ SEO: sitemap.xml, robots, llms.txt, per-page `<title>`/OG/JSON-LD
- ⬜ Visual regression snapshots (per-page pixel baseline)

## 2. Auth
- ✅ Sign-in (used by setup)
- ✅ Sign-up validation: terms required, weak password rejected, duplicate email handled
- ✅ Forgot-password / reset shows confirmation
- ✅ Logout: on a dedicated user — session cleared (authed API → 401 afterward).
      NOTE: /dashboard shell does NOT hard-redirect anonymous users; its data
      APIs 401 instead (RLS still protects data).
- ⬜ Auth callback + session persistence

## 3. Authenticated app
- ✅ Dashboard + 4 subpages load without bounce
- ✅ Editor backend: autosave (PATCH persists content+name), empty-patch rejected, AI rewrite returns Arabic variants
- ✅ Editor undo/redo: drives the real UI — edit → undo reverts → redo re-applies
- ⬜ Sites / gallery / analytics / visitors / SEO pages render with data
- ⬜ Account settings: edit, export, delete

## 4. Generators / themes
- ✅ All 8 reject malformed input
- ✅ 1 real generation (services) — well-formed, no fake data
- ✅ All 8 builder pages (/theme/new/* + /build) RENDER (Arabic content, no console errors)
- ⬜ Real generation for the OTHER 7 (only services is content-verified)
- ⬜ Restaurant menu-image OCR path
- ⬜ /build dropship flow: scrape → generate → preview → download ZIP
- ✅ Generation is public BY DESIGN (guest trial), bounded by edge rate-limit
      (60/min/IP, middleware.ts); real cap is on theme SAVE. Not a bug.

## 5. Entitlements (per plan)
- ✅ FREE capped at 2 saves (402 on 3rd)
- ✅ PRO unlimited saves
- ✅ STARTER unlimited saves
- ✅ Domain perk matrix (free/starter/pro/pro_hosting/pro_onetime/admin)
- ✅ FIXED: Starter no longer receives Pro-only free domain (isProProfile no
      longer keys off is_pro; pro_onetime added to PRO_PLANS to grandfather)
- ✅ Publish/hosting gate live: Starter → 402 hosting_required, Pro → 200
- ✅ Shopify export gate live: free → 402 pro_required, paid → clears gate
- ❓ INTENDED per-plan generation limits — needs product decision (see below)

## 6. Payments & webhooks  ✅ (Stripe TEST mode wired via .env.development.local)
- ✅ Auth guards on all money endpoints
- ✅ Unsigned webhook rejected + tampered payload rejected (signature verify)
- ✅ Checkout session creation — subscription (Pro redirect) + one-time API,
      both hit real test-mode checkout.stripe.com
- ✅ Signed webhook processing + idempotency (shared whsec)
- ⬜ Full checkout COMPLETION with test card 4242 → DB purchase  (needs `stripe
      listen --forward-to localhost:3000/api/webhook` running for delivery)
- ⬜ Subscription lifecycle: created → renewed → canceled → past_due
- ⬜ Refund → entitlement drop
- ⬜ Promo codes / free-domain 100%-off ($0 `no_payment_required`) path

## 7. Domains  ✅ (both Porkbun keys wired via .env.development.local)
- ✅ Auth guards + invalid-domain rejection
- ✅ Availability check — real Porkbun lookup returns well-formed result
- ✅ Purchase → real Porkbun pre-charge DRY-RUN + Stripe TEST checkout URL
      (stops before real registration — never registers/bills a domain)
- ⬜ Renewal flow
- ⬜ Refund-on-registration-failure path

## 8. Emails (lib/email.ts + Resend)
- ✅ Every template renders: receipts (onetime/starter/pro/hosting), domain
      purchased/refund/expiring, plan purchased, account deleted, announcement
      — Arabic + RTL, injected data present, no unresolved vars (undefined/NaN/${)
- ⬜ Trigger points fire (webhook → sendEmail) with correct data (needs test keys)

## 9. Shopify
- ⬜ Theme export-shopify entitlement + output validity
- ⬜ /build one-click publish (OAuth binding, write_themes)
- ⬜ License app-proxy gating

## 10. Infra / cross-cutting
- ⬜ Middleware redirects
- ⬜ Rate limiting (/api/scrape, log)
- ✅ RLS: user A cannot read/mutate user B's themes/domains — verified at BOTH
      the API surface AND raw PostgREST with A's own JWT (real database RLS)
- ⬜ Analytics tracking (site_views → /api/analytics)

---

### Open product decision blocking §5/§4
The app + pricing currently define **paid = unlimited generation**. If that is
the intent, §4/§5 tests above are correct as written. If generation should be
capped per plan (or gated behind login), that changes the assertions AND
requires new enforcement code (the generate-* endpoints today enforce nothing).
