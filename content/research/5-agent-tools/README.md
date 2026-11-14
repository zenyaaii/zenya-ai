# وكيل السوق — Beynoun content engine

Scripts (run from a scratch dir; keys from cloud env, never commit them):
- analyze_posts.py — tone/empathy of each competitor IG post (Claude).
- analyze_strategy.py — design/copy/management/pillars from post IMAGES + captions (Claude).
- synthesize.py <module> <data.json> <out.md> — Arabic report section per module (templates, agencies, ads, tiktok, trends, news, sites). Keep MAX_TOKENS ≤ 20000 (non-streaming limit).

Data sources (2026-11-09):
1. IG profiles/posts/comments — Apify apify~instagram-profile-scraper / instagram-scraper / instagram-comment-scraper. Handles: see ../2026-11-09-competitor-map.md.
2. App Store reviews — free RSS itunes.apple.com/sa/rss/customerreviews/page=N/id=ID/sortby=mostrecent/json (Salla 1148458340, Zid 6443907047, Foodics AI 6505032835).
3. Meta Ad Library — apify~facebook-ads-scraper with ads/library keyword URLs. Brand-name keywords are noisy (سلة، زد، منصتي); next: use page IDs.
4. Google reviews — Places API (New) searchText, key in env as lowercase `google_places_api_key` (UPPERCASE one is empty). 5 reviews per place.
5. TikTok — clockworks~tiktok-scraper searchQueries.
6. Google Trends — apify~google-trends-scraper (timeRange "" = 12 months).
7. News — Google News RSS (news.google.com/rss/search?q=...&hl=ar&gl=SA&ceid=SA:ar). Very noisy; Claude filters.
8. Sites/pricing — apify~website-content-crawler; speed via Playwright iPhone emulation (PageSpeed API quota is 0 without a key).
X/Twitter — apidojo~tweet-scraper returned only 10 tweets; weak. Note: in Gulf Arabic «موقع لمطعم» usually means a physical LOCATION, so search «موقع إلكتروني».
Cost of the 2026-11-09 full run: Apify ≈ $2, Claude ≈ $3–5 (estimate).

## run_niche.py — the per-niche analytics agent (2026-11-10)
Anas wants the 2026-11-09 modules report, but PER NICHE (11 niches) + a cross-niche master. API spend is allowed for this agent.
  python3 -I run_niche.py <niche> [--collect-only] [--only reviews,news]
  python3 -I run_niche.py --master
Niches: barber gym restaurant cafe beauty dental clinic car sweets photo fashion (keywords in NICHES at the top of the file).
Raw data cached in ../raw-niche/<niche>/ (rerun spends nothing on cached parts); reports in ../niche-reports/.
Tested 2026-11-10: reviews (310 barber reviews, 62 places, 24 without website) and news work. Apify modules untested: account over its $5 free limit until 2026-12-07.
