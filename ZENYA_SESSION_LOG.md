# ZENYA AI — SESSION LOG
# READ THIS FIRST when starting a new session with musannef

---

## WHO IS THE USER
- Name: Anas Al-Musannef (musannef@outlook.com)
- Business: Zenya AI — Arabic AI-powered website builder SaaS
- Website: zenyaai.co
- Location: Slagharen, Netherlands (Dutch eenmanszaak / sole trader)
- Address: Vergouwlaan 14, 7776BA Slagharen, NL
- Stage: Pre-revenue, product is live, no paying customers yet
- Stack: Next.js 14 App Router, Arabic RTL, Supabase, Stripe, Vercel

## THE PRODUCT
- AI generates a full Arabic website from one sentence or URL
- 8 templates: one_product, restaurant, atlas, lookbook, collective, studio, services, wellness
- Shopify OS 2.0 export (ZIP) or hosted site
- Pricing (LIVE): Free (1 gen) → Starter $14.99/mo → Pro $24.99/mo with hosting + 5 months free domain
- Primary market: Egypt, Saudi Arabia, Arabic-speaking entrepreneurs

## BRAND COLORS
- Primary (purple): #5e6ad2
- Background (cream): #f7f4ed
- Amber: #d97706
- Dark: #1c1c1c
- Muted: #5f5f5d
- Green: #27a644
- Fonts: Tajawal (Arabic UI), Cairo (display), Inter (Latin)

## KEY FILES IN THIS FOLDER
- ZENYA_COMPANY_PROFILE.md — full product details
- ZENYA_MARKETING_STRATEGY.md — full marketing plan
- ZENYA_EGYPT_MARKET_ANALYSIS.md — Egyptian market deep dive
- ZENYA_SESSION_LOG.md — this file, update after every session

## STRIPE ACCOUNT
- Account ID: acct_1S6xSCRU9GTtkovX
- Current balance: €8.45
- Q2 revenue: €0 real customers (1 test payment by owner)
- 2 HOT LEADS who tried to pay but failed:
  - UAE customer (tried €19.99/mo): cus_UekrNQs6NMz1wP
  - NL customer (tried $4.99/mo): cus_Udxa6TVFy0mtZW
  - Dashboard: https://dashboard.stripe.com/charges

## CANVA ASSETS
- Logo asset ID: MAHOFTWCkgE (uploaded from zenyaai.co/logo.png)
- BK-2 brand card: https://www.canva.com/d/CkqXHLoToCXVBgp
- AR-1 (hook/cover slide style): https://www.canva.com/d/WG2VJvrdbQbXIKZ
- AR-4 (content slide style): https://www.canva.com/d/WkOSohmZhWUO-Bj
- Hook slides H-1 to H-4 (user hasn't picked yet):
  - H-1: https://www.canva.com/d/keKKIu8JnC8tPFw
  - H-2: https://www.canva.com/d/phJiHQD2E5_7gHq
  - H-3: https://www.canva.com/d/JjD6b7sjxB3UQ67
  - H-4: https://www.canva.com/d/jRpIHSiTXDAfr6V

## ACTIVE AUTOMATIONS (scheduled tasks)
- Daily 8am: Stripe revenue morning brief
- Monday 9am: Weekly industry report (AI website builder space)
- Monday 9:30am: Weekly customer research + algorithm signals
- July 2, 10am: Canva carousel continuation (one-time — generates slides 2,3,4)

## DUTCH TAX / ACCOUNTING
- BTW (VAT): quarterly, Q2 2026 FILED ✅ (zero return, July 1)
- Next BTW deadline: Q3 → October 31, 2026
- Income tax: zelfstandigenaftrek €3,750 + startersaftrek €2,123 + MKB 13.31%
- Zvw health: ~5.32% of profit (paid yearly)
- WBSO (R&D tax credit): NOT applied yet — high priority, apply at rvo.nl/wbso
- Accounting tool: Shine (shine.co/en-nl) — not fully set up yet

---

## SESSION HISTORY

---

### SESSION 1 + 2 (before July 1 — pre-compaction)
**Done:**
- Read all website files (globals.css, Hero, Features, Steps, Stats, CTA, Testimonials)
- Fixed Reveal.tsx viewport margins (whileInView fix)
- Added Footer to homepage (app/(main)/page.tsx)
- Created social media launch posts (saved: social-media-launch-posts.md)
- Generated Canva brand assets: BK-2, AR-1, AR-4, Hook slides H-1 to H-4
- Built full marketing strategy document (ZENYA_MARKETING_STRATEGY.md)
- Deep Egypt market analysis (ZENYA_EGYPT_MARKET_ANALYSIS.md)
- Set up 4 growth automations (revenue brief, industry report, customer research, carousel reminder)

**Pending from this session:**
- Git push + Vercel deploy (Reveal.tsx + Footer fixes done locally, NOT live)
- User pick hook slide from H-1 to H-4
- Canva carousel slides 2,3,4 (July 2 automation)

---

### SESSION 3 (July 1, 2026)
**Done:**
- Saved ZENYA_EGYPT_MARKET_ANALYSIS.md to folder
- Researched user demographics by segment (ages, platforms, psychology)
- Platform algorithm guide per segment (TikTok, Instagram, Facebook, YouTube)
- Pricing recommendation: remove $9.99 lifetime → Starter $14.99 / Pro $24.99
- Full cost comparison (what users pay without Zenya vs with Zenya)
- Cheapest possible alternative route analysis
- Stripe audit: €8.45 balance, €0 real Q2 revenue, found 2 failed payment leads
- Dutch BTW Q2 filed ✅ (zero return, submitted July 1)
- Dutch tax overview: BTW + Inkomstenbelasting + Zvw + WBSO explained

**Pending from this session:**
- Personally reach out to 2 failed Stripe customers (UAE + NL)
- Git push + Vercel deploy (still not done)
- Update pricing on live website
- Apply for WBSO at rvo.nl/wbso
- Set up more automations (website health, daily Arabic content idea, Friday brief)
- Canva brand kit manual setup at canva.com → Brand Hub → Create kit "Zenya AI"
- Pick hook slide H-1 to H-4

---

### SESSION 4 (July 3, 2026)
**Done:**
- Pricing page fully rewritten: Free(1 gen) / Starter $14.99/mo / Pro $24.99/mo
  - Pro card has amber Globe badge: "نطاق مخصّص مجاني 5 أشهر"
  - Starter card has "الأكثر شيوعًا" badge
  - Checkout links: /checkout?plan=starter and /checkout?plan=pro
- Hero trust signals updated: removed "تصدير شوبيفاي OS 2.0" → added "نطاق مجاني 5 أشهر مع Pro"
- ReviewFloatingButton: hides on /dashboard, /theme, /editor, /builder (bug fix)
- Free plan generation limit: UI changed 3→1 in subscription route (DB trigger = real limit)
- SEO: layout.tsx title + description + JSON-LD offers + Arabic keywords updated
- StatsSection: removed OS 2.0 stat → replaced with "مجاني / ابدأ بدون بطاقة ائتمان"
- 3 automations updated with new Starter/Pro pricing language
- Canva carousel automation (July 2) disabled after it ran
- Hook slides H-2, H-3, H-4 analyzed professionally. **H-3 is recommended** (Price Shock style: "كنت بدفع ٣٠٠٠ جنيه → دلوقتي في دقيقتين"). Score: 9.2/10
- Lead generation system built in `leads/` folder:
  - `google-maps-lead-finder.py` — searches Cairo, Alexandria, Riyadh, Dubai etc. for businesses with 4+ stars, 15+ reviews, NO website. Outputs CSV + JSON with personalized Arabic messages for each lead.
  - `OUTREACH_TEMPLATES.md` — 3 channels (WhatsApp, Email, Instagram DM) × 2-3 variants each. Human-sounding Arabic copy with exact review numbers, category-specific openers.
- WBSO explained: Dutch R&D tax credit (Wet Bevordering Speur- en Ontwikkelingswerk) at rvo.nl/wbso — Zenya qualifies as AI/software R&D. Can recover 32% of R&D wage costs. HIGH PRIORITY.

**Pending from this session:**
- Reach out to 2 failed Stripe customers (user handling himself)
- Git push + Vercel deploy (user doing himself)
- Pick hook slide H-3 (recommended) — confirm and build Canva slides 2,3,4 in AR-4 style
- Apply for WBSO at rvo.nl/wbso (HIGH PRIORITY — free money)
- Add Google Maps API key to `leads/google-maps-lead-finder.py` and run it
- DB migration to set `trial_themes_limit` default = 1 for ALL new users (currently only UI is updated)

---

## PENDING TASKS (all open items)

| Priority | Task | Status |
|----------|------|--------|
| 🔥 | Apply for WBSO at rvo.nl/wbso | Not done |
| 🔥 | Add API key to leads/google-maps-lead-finder.py + run | Not done |
| 🔥 | Confirm hook H-3 + build Canva slides 2,3,4 | Not done |
| 🔥 | Reach out to 2 failed Stripe customers | Not done (user handling) |
| 🔥 | Git push + Vercel deploy | Not done (user handling) |
| 📋 | DB migration: set trial_themes_limit default=1 | Not done |
| 📋 | Canva brand kit at canva.com → Brand Hub | Not done |
| 📋 | Sign up for Shine accounting (shine.co/en-nl) | Not done |
| 📋 | More automations (Friday brief, daily content idea) | Not done |

---

*Last updated: July 3, 2026 — Session 4*
