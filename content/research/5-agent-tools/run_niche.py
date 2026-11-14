#!/usr/bin/env python3
"""وكيل التحليلات لكل نيش — Beynoun content engine.

Runs the eight modules of the 2026-11-09 report on ONE niche and writes an
Arabic report in the same style:
  reviews  Google Places reviews in 8 cities (+ share of top places with no website)
  ads      Meta Ad Library, niche keywords x countries          (Apify)
  tiktok   TikTok search, niche owner talk                      (Apify)
  trends   Google Trends, 12 months, niche search terms         (Apify)
  news     Google News RSS, niche sector news                   (free)
  sites    niche competitor / booking-software sites            (Apify)
  insta    niche competitor Instagram posts                     (Apify)
  template what the Beynoun template for this niche must show, + posts (Claude, from the above)

Every collected file is cached under raw-niche/<niche>/, so a second run spends
nothing on collection. Every Claude answer is cached too.

  APIFY_TOKEN=... google_places_api_key=... \
  ANTHROPIC_API_KEY="$BEYNOUN_ANTHROPIC_KEY" ANTHROPIC_BASE_URL=https://api.anthropic.com \
  python3 -I run_niche.py barber [--collect-only] [--only reviews,ads]

  python3 -I run_niche.py --master   # cross-niche report from all niche reports

Costs are logged to raw-niche/<niche>/cost.json (token prices are env-configurable).
"""
import json, os, re, sys, time, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(ROOT, "raw-niche")
OUT = os.path.join(ROOT, "niche-reports")
MODEL = os.environ.get("ANALYZER_MODEL", "claude-sonnet-5-5")
BASE = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
PRICE_IN = float(os.environ.get("PRICE_IN_PER_MTOK", "3"))
PRICE_OUT = float(os.environ.get("PRICE_OUT_PER_MTOK", "15"))

CITIES = {"الرياض": "SA", "جدة": "SA", "دبي": "AE", "الكويت": "KW", "القاهرة": "EG", "عمّان": "JO", "بغداد": "IQ", "الدار البيضاء": "MA"}
AD_COUNTRIES = ["SA", "AE", "KW", "EG", "JO", "IQ", "MA"]

# One entry per niche. Keywords are what owners and customers actually type.
NICHES = {
 "barber": {"ar": "صالون الحلاقة", "places": "صالون حلاقة رجالي",
   "ads": ["صالون حلاقة", "حلاق", "حجز موعد حلاقة", "برنامج حجز صالون"],
   "tiktok": ["صاحب صالون حلاقة", "حلاق مشروع", "افتتاح صالون حلاقة", "زبائن الحلاق"],
   "trends": ["حلاق قريب", "صالون حلاقة", "حجز حلاق", "حلاقة رجالي"],
   "news": ["صالونات الحلاقة السعودية", "قطاع الحلاقة تنظيم", "صالونات رجالية استثمار"],
   "sites": ["https://www.fresha.com/ar", "https://booksy.com/en-us/", "https://www.setmore.com/", "https://rewaatech.com/"],
   "insta": ["fresha", "booksy", "setmore"]},
 "gym": {"ar": "النادي الرياضي", "places": "نادي رياضي جيم",
   "ads": ["نادي رياضي", "اشتراك جيم", "عرض اشتراك نادي", "برنامج إدارة نادي رياضي"],
   "tiktok": ["صاحب جيم", "افتتاح جيم", "مشروع نادي رياضي", "اشتراك جيم"],
   "trends": ["جيم قريب", "اشتراك نادي رياضي", "نادي رياضي نسائي", "أسعار الجيم"],
   "news": ["الأندية الرياضية الخاصة السعودية", "قطاع اللياقة البدنية الخليج", "سلاسل الأندية الرياضية استثمار"],
   "sites": ["https://www.fresha.com/ar", "https://www.glofox.com/", "https://www.mindbodyonline.com/"],
   "insta": ["glofox", "mindbody"]},
 "restaurant": {"ar": "المطعم", "places": "مطعم",
   "ads": ["منيو إلكتروني", "طلبات مطعم بدون عمولة", "نظام مطاعم", "موقع مطعم"],
   "tiktok": ["صاحب مطعم", "مشروع مطعم", "تكلفة فتح مطعم", "خسارة مطعم"],
   "trends": ["مطعم قريب", "منيو", "طلب أكل", "حجز مطعم"],
   "news": ["قطاع المطاعم السعودية", "تطبيقات التوصيل عمولة", "سجلات المطاعم"],
   "sites": ["https://www.foodics.com/ar/", "https://zyda.com/", "https://eatapp.co/ar"],
   "insta": ["foodics", "zyda.eg", "eatapp"]},
 "cafe": {"ar": "المقهى", "places": "كافيه مقهى",
   "ads": ["كافيه", "منيو كافيه", "نظام كاشير كافيه", "افتتاح كافيه"],
   "tiktok": ["صاحب كافيه", "مشروع كافيه", "تكلفة فتح كافيه", "كوفي شوب مشروع"],
   "trends": ["كافيه قريب", "كافيه هادئ للدراسة", "كوفي", "مقهى"],
   "news": ["قطاع المقاهي السعودية", "سوق القهوة الخليج", "المقاهي المختصة"],
   "sites": ["https://www.foodics.com/ar/", "https://marn.com/", "https://rewaatech.com/"],
   "insta": ["foodics", "marncashier"]},
 "beauty": {"ar": "مركز التجميل", "places": "مركز تجميل",
   "ads": ["مركز تجميل", "عيادة تجميل عرض", "حجز موعد تجميل", "برنامج حجز مراكز التجميل"],
   "tiktok": ["صاحبة مركز تجميل", "مشروع صالون تجميل", "افتتاح مركز تجميل"],
   "trends": ["مركز تجميل قريب", "عيادة تجميل", "ليزر", "فيلر"],
   "news": ["قطاع التجميل السعودية", "سوق التجميل الخليج", "عيادات التجميل تنظيم"],
   "sites": ["https://www.fresha.com/ar", "https://booksy.com/en-us/"],
   "insta": ["fresha", "booksy"]},
 "dental": {"ar": "عيادة الأسنان", "places": "عيادة أسنان",
   "ads": ["عيادة أسنان", "تقويم أسنان عرض", "تبييض أسنان", "زراعة أسنان"],
   "tiktok": ["طبيب أسنان عيادة", "افتتاح عيادة أسنان", "تكلفة فتح عيادة أسنان"],
   "trends": ["عيادة أسنان قريبة", "تقويم الأسنان", "زراعة أسنان", "تبييض الأسنان"],
   "news": ["قطاع طب الأسنان السعودية", "العيادات الخاصة الخليج", "التأمين الطبي الأسنان"],
   "sites": ["https://www.vezeeta.com/ar", "https://www.okadoc.com/ar-ae/", "https://www.doctoruna.com/ar"],
   "insta": ["vezeeta", "okadoc"]},
 "clinic": {"ar": "العيادة الجلدية", "places": "عيادة جلدية",
   "ads": ["عيادة جلدية", "ليزر إزالة الشعر عرض", "علاج حب الشباب", "طبيب جلدية"],
   "tiktok": ["طبيب جلدية", "عيادة جلدية تجربة"],
   "trends": ["دكتور جلدية", "عيادة جلدية", "ليزر", "حب الشباب علاج"],
   "news": ["العيادات الخاصة السعودية", "قطاع الجلدية والتجميل الخليج"],
   "sites": ["https://www.vezeeta.com/ar", "https://www.okadoc.com/ar-ae/"],
   "insta": ["vezeeta", "okadoc"]},
 "car": {"ar": "ورشة السيارات", "places": "ورشة صيانة سيارات",
   "ads": ["صيانة سيارات", "ورشة سيارات", "فحص سيارة", "تغيير زيت عرض"],
   "tiktok": ["صاحب ورشة سيارات", "مشروع ورشة", "ميكانيكي"],
   "trends": ["ورشة قريبة", "صيانة سيارات", "فحص دوري", "تغيير زيت"],
   "news": ["قطاع صيانة السيارات السعودية", "ما بعد البيع السيارات الخليج"],
   "sites": ["https://www.carseer.com/ar", "https://www.sayartech.com/"],
   "insta": []},
 "sweets": {"ar": "محل الحلويات", "places": "محل حلويات",
   "ads": ["حلويات", "طلب حلويات مناسبات", "كيك مناسبات", "صواني حلى"],
   "tiktok": ["صاحب محل حلويات", "مشروع حلويات", "حلويات منزلية مشروع"],
   "trends": ["حلويات قريبة", "كيك", "حلويات عربية", "صواني حلى"],
   "news": ["قطاع الحلويات السعودية", "المخابز والحلويات الخليج"],
   "sites": ["https://zyda.com/", "https://www.foodics.com/ar/"],
   "insta": ["zyda.eg"]},
 "photo": {"ar": "استوديو التصوير", "places": "استوديو تصوير",
   "ads": ["استوديو تصوير", "تصوير مناسبات", "مصور أعراس", "جلسة تصوير"],
   "tiktok": ["مصور مشروع", "صاحب استوديو تصوير", "مصور مستقل"],
   "trends": ["مصور قريب", "استوديو تصوير", "مصور مناسبات", "تصوير منتجات"],
   "news": ["قطاع التصوير الإبداعي السعودية", "صناعة المحتوى الخليج"],
   "sites": ["https://www.pixieset.com/", "https://www.format.com/"],
   "insta": ["pixieset"]},
 "fashion": {"ar": "محل الملابس", "places": "محل ملابس",
   "ads": ["محل ملابس", "متجر ملابس أونلاين", "عبايات", "ملابس رجالي"],
   "tiktok": ["صاحب محل ملابس", "مشروع ملابس", "بوتيك مشروع"],
   "trends": ["محل ملابس", "متجر ملابس", "عبايات", "تخفيضات ملابس"],
   "news": ["قطاع التجزئة الملابس السعودية", "التجارة الإلكترونية الأزياء الخليج"],
   "sites": ["https://salla.com/", "https://zid.sa/", "https://youcan.shop/ar"],
   "insta": ["sallaapp", "zidappcom", "youcandotshop"]},
}

SYSTEM = """أنت محلل سوق ومحتوى لصالح «بينون»: منصة عربية تبني مواقع لأصحاب المحلات الصغيرة (مطاعم، مقاهٍ، حلاقون، نوادٍ، عيادات، ورش، وغيرها) وتديرها وتنشرها، بقالب جاهز لكل نوع نشاط، وتبني موقع المحل قبل أن يطلبه.
اكتب بالعربية الفصحى المبسطة، بجمل قصيرة وكلمات سهلة. استند فقط إلى البيانات المعطاة، واذكر الأرقام والاقتباسات الحرفية. لا تخترع. إذا كانت البيانات ضعيفة أو فيها ضوضاء فقل ذلك صراحة.
لا تقترح أبدًا ذكر منافس أو شركة بالاسم في منشوراتنا. أخرج Markdown فقط، بلا مقدمة ولا خاتمة."""

BRIEFS = {
 "reviews": """هذه تقييمات جوجل حقيقية لأفضل محلات «{ar}» في ٨ مدن عربية، ومعها هل للمحل موقع إلكتروني.
اكتب:
### نسبة المحلات بلا موقع (لكل مدينة وإجمالًا)
### ما يمدحه الزبائن (أكثر ٦ أشياء، مع عدد تقريبي واقتباس حرفي لكل واحد)
### ما يغضبهم (أكثر ٥، مع اقتباسات)
### الأشخاص: هل يذكر الزبائن أسماء العاملين؟ كم مرة؟ ومن هم (حلاق، طبيب، مدرب…)؟
### الكلمات التي يستعملها الزبائن (١٢ كلمة أو عبارة حرفية)
### فروق بين المدن
### قصص ألم تصلح منشورات (٥ قصص قصيرة، بلا أسماء محلات)""",
 "ads": """هذه إعلانات نشطة الآن في مكتبة إعلانات ميتا عن «{ar}»، مجمعة حسب كلمة البحث والبلد، مع عدد الأيام منذ بدء الإعلان (الإعلان الطويل يربح غالبًا). تجاهل ما لا علاقة له بهذا النشاط وقل ذلك.
اكتب: ### من يعلن (أصحاب المحلات أنفسهم؟ أم شركات برامج تبيع لهم؟) ### الزاوية الأقوى (مع نصوص قصيرة حرفية) ### العروض والأسعار المذكورة ### أطول الإعلانات عمرًا ولماذا تنجح ### ماذا نتعلم لإعلانات بينون لهذا النشاط ### ما الذي ينقص البيانات""",
 "tiktok": """هذه نتائج بحث تيك توك بالعربية عن أصحاب «{ar}»، مع المشاهدات والإعجابات والتعليقات. تجاهل الضوضاء.
اكتب: ### ما الذي ينتشر (بأرقام وروابط) ### صيغ الفيديو الناجحة ### ماذا يقول أصحاب هذا النشاط عن أنفسهم ومخاوفهم ومصاريفهم ### ١٠ أفكار ريلز لبينون موجهة لهذا النشاط (كل فكرة: الخطاف في أول ثانيتين + المحتوى + لماذا ستنجح)""",
 "trends": """هذه بيانات Google Trends لسنة كاملة لكلمات بحث عن «{ar}»، مع الاستعلامات المرتبطة والصاعدة. تجاهل الضوضاء.
اكتب: ### اتجاه كل كلمة (صاعد/هابط/موسمي، مع الذروة) ### المواسم المهمة لهذا النشاط (رمضان، الأعياد، الصيف، المدارس…) ### ماذا يبحث الزبون قبل أن يختار ### كلمات يجب أن تظهر في موقع هذا النشاط ومنشوراته""",
 "news": """هذه أخبار من Google News عن قطاع «{ar}» في المنطقة. فيها ضوضاء كثيرة؛ تجاهلها.
اكتب: ### أهم الأخبار المتعلقة فقط (مع التاريخ والرابط) ### أرقام القطاع (عدد المحلات، النمو، الأنظمة الجديدة) ### ماذا يعني هذا لبينون ### منشوران مستوحيان من الأخبار، دون ذكر أي شركة""",
 "sites": """هذه نصوص الصفحات الرئيسية لبرامج ومنصات يستعملها أصحاب «{ar}» (حجز، إدارة، مواقع).
اكتب: **جدول**: المنصة | أول جملة | الوعد الأساسي | السعر المذكور | المجاني · ثم ### ما يقوله الجميع (فلا يميّزنا) ### ما لا يقوله أحد (فرصة لبينون) ### تنبيه على أي منصة تقدم عرضًا قريبًا من عرض بينون""",
 "insta": """هذه منشورات إنستغرام لمنصات تخدم أصحاب «{ar}»، مع الإعجابات والتعليقات والمشاهدات.
اكتب: ### إيقاع النشر لكل حساب ### المنشورات التي تفوقت على متوسط حسابها (مع الرابط والنص) ### ما يحبه هذا الجمهور ### ما يتجنبه ### شيء نأخذه، وشيء نتجنبه""",
 "template": """هذه أقسام تحليل كامل لنشاط «{ar}» (تقييمات، إعلانات، تيك توك، بحث، أخبار، منصات، إنستغرام).
قالب بينون له ٨ أجزاء ثابتة: الواجهة، الشخص، الخدمة والسعر والمدة، الحجز، الدليل، الصور الحقيقية، المخاوف، الطريق والساعات.
اكتب:
### الخلاصة في ٥ أسطر
### قالب «{ar}»: ماذا يضع في كل جزء من الأجزاء الثمانية (جدول: الجزء | ماذا يُظهر | لماذا، من البيانات)
### أسئلة البناء: ما الذي يجب أن يسأله معالج البناء لصاحب هذا النشاط (٨–١٢ سؤالًا، بالترتيب)
### أسئلة الزائر الذكي: ٦ أسئلة يفحص بها الموقع بعد بنائه كأنه زبون
### ما يجب ألا يظهر أبدًا في موقع هذا النشاط
### ١٠ منشورات جاهزة لهذا النشاط (لكل منشور: العنوان على الصورة + نص من ٢–٤ جمل + سطر الدعوة). بلا وعود لا نعرفها، وضع ⚠ على أي وعد.
### ٣ فيديوهات (الخطاف، المشاهد، الختام)""",
}

MASTER_BRIEF = """هذه تقارير تحليل كاملة لعدة أنواع نشاط، كل تقرير لنوع.
اكتب تقريرًا جامعًا:
### جدول المقارنة: النوع | نسبة بلا موقع | أقوى مدح | أقوى غضب | هل الأسماء تبيع | أقوى زاوية إعلان | الموسم
### القانون المشترك بين كل الأنواع
### أين نبدأ؟ ترتيب الأنواع حسب الفرصة لبينون، مع السبب
### الرسالة العامة التي تصلح لكل الأنواع (فيديو عام)
### الفروق التي تجعل كل نوع يحتاج رسالة خاصة"""


# ── helpers ───────────────────────────────────────────────────────────────
def http_json(url, body=None, headers=None, timeout=600):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json", **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def cached(path, fn):
    if os.path.exists(path):
        return json.load(open(path, encoding="utf-8"))
    data = fn()
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False)
    return data


def apify(actor, inp):
    tok = os.environ["APIFY_TOKEN"]
    url = f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items?token={tok}&timeout=540"
    return http_json(url, inp, timeout=600)


def days_since(s):
    try:
        if isinstance(s, (int, float)):
            return (time.time() - s) // 86400
        return (date.today() - date.fromisoformat(str(s)[:10])).days
    except Exception:
        return None


# ── collectors ────────────────────────────────────────────────────────────
def c_reviews(n):
    key = os.environ["google_places_api_key"]
    rows = []
    for city in CITIES:
        res = http_json("https://places.googleapis.com/v1/places:searchText",
                        {"textQuery": f"{n['places']} في {city}", "languageCode": "ar", "maxResultCount": 8},
                        {"X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.websiteUri,places.reviews"})
        for p in res.get("places", []):
            if (p.get("userRatingCount") or 0) < 30:
                continue
            for r in p.get("reviews", []) or [{}]:
                rows.append({"c": city, "p": p["displayName"]["text"], "rating": p.get("rating"), "n": p.get("userRatingCount"),
                             "web": bool(p.get("websiteUri")), "s": r.get("rating"),
                             "t": ((r.get("text") or r.get("originalText") or {}).get("text") or "").replace("\n", " ")})
    return rows


def c_ads(n):
    urls = [{"url": "https://www.facebook.com/ads/library/?" + urllib.parse.urlencode(
        {"active_status": "active", "ad_type": "all", "country": cc, "q": kw, "search_type": "keyword_unordered", "media_type": "all"})}
        for kw in n["ads"] for cc in AD_COUNTRIES]
    items = apify("curious_coder~facebook-ads-library-scraper" if os.environ.get("ADS_ACTOR") == "alt" else "apify~facebook-ads-scraper",
                  {"startUrls": urls, "resultsLimit": 15})
    out = {}
    for it in items:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(it.get("inputUrl") or it.get("url") or "").query)
        k = f"{(q.get('q') or ['?'])[0]}|{(q.get('country') or ['?'])[0]}"
        snap = it.get("snapshot") or {}
        text = ((snap.get("body") or {}).get("text") or "")[:400]
        if text:
            out.setdefault(k, []).append([days_since(it.get("startDate") or it.get("start_date")), it.get("pageName") or snap.get("page_name"), text,
                                          it.get("publisherPlatform") or []])
    return out


def c_tiktok(n):
    items = apify("clockworks~tiktok-scraper", {"searchQueries": n["tiktok"], "resultsPerPage": 25, "shouldDownloadVideos": False})
    return [{"q": it.get("searchQuery"), "text": (it.get("text") or "")[:500], "views": it.get("playCount"), "likes": it.get("diggCount"),
             "comments": it.get("commentCount"), "url": it.get("webVideoUrl"), "date": (it.get("createTimeISO") or "")[:10],
             "author": (it.get("authorMeta") or {}).get("name")} for it in items]


def c_trends(n):
    items = apify("apify~google-trends-scraper", {"searchTerms": n["trends"], "timeRange": "", "geo": "SA", "isMultiple": False})
    out = []
    for it in items:
        tl = it.get("interestOverTime_timelineData") or []
        out.append({"term": it.get("searchTerm"),
                    "weekly": [[t.get("formattedAxisTime"), (t.get("value") or [None])[0]] for t in tl],
                    "related": [q.get("query") for q in (it.get("relatedQueries_top") or [])][:15],
                    "rising": [q.get("query") for q in (it.get("relatedQueries_rising") or [])][:15]})
    return out


def c_news(n):
    out = []
    for q in n["news"]:
        url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q, "hl": "ar", "gl": "SA", "ceid": "SA:ar"})
        with urllib.request.urlopen(url, timeout=60) as r:
            root = ET.fromstring(r.read())
        for i in root.iter("item"):
            out.append({"q": q, "title": i.findtext("title"), "date": i.findtext("pubDate"), "link": i.findtext("link")})
    return out


def c_sites(n):
    items = apify("apify~website-content-crawler", {"startUrls": [{"url": u} for u in n["sites"]], "maxCrawlPages": len(n["sites"]) * 2,
                                                     "maxCrawlDepth": 0, "crawlerType": "playwright:firefox"})
    return [{"url": it.get("url"), "text": (it.get("text") or "")[:4000]} for it in items]


def c_insta(n):
    if not n["insta"]:
        return []
    items = apify("apify~instagram-scraper", {"directUrls": [f"https://www.instagram.com/{h}/" for h in n["insta"]],
                                              "resultsType": "posts", "resultsLimit": 30})
    return [{"user": it.get("ownerUsername"), "date": (it.get("timestamp") or "")[:10], "type": it.get("type"),
             "likes": it.get("likesCount"), "comments": it.get("commentsCount"), "views": it.get("videoViewCount"),
             "url": it.get("url"), "caption": (it.get("caption") or "")[:500]} for it in items]


COLLECT = {"reviews": c_reviews, "ads": c_ads, "tiktok": c_tiktok, "trends": c_trends, "news": c_news, "sites": c_sites, "insta": c_insta}
TITLES = {"reviews": "تقييمات الزبائن", "ads": "الإعلانات المدفوعة", "tiktok": "تيك توك", "trends": "اتجاهات البحث",
          "news": "أخبار القطاع", "sites": "المنصات التي يستعملونها", "insta": "إنستغرام"}


# ── Claude ────────────────────────────────────────────────────────────────
def claude(prompt, cost):
    key = os.environ["ANTHROPIC_API_KEY"]
    body = {"model": MODEL, "max_tokens": int(os.environ.get("MAX_TOKENS", "16000")), "system": SYSTEM,
            "messages": [{"role": "user", "content": prompt}]}
    for attempt in range(4):
        try:
            d = http_json(BASE.rstrip("/") + "/v1/messages", body,
                          {"x-api-key": key, "anthropic-version": "2023-06-01"}, timeout=500)
            u = d.get("usage", {})
            cost["in"] += u.get("input_tokens", 0)
            cost["out"] += u.get("output_tokens", 0)
            return "".join(b.get("text", "") for b in d["content"]).strip()
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")
            if "credit balance" in msg:
                sys.exit("STOP: Anthropic credit is empty. Top up before running analysis.")
            if attempt == 3:
                raise RuntimeError(msg)
        time.sleep(8 * (attempt + 1))


def usd(cost):
    return round(cost["in"] / 1e6 * PRICE_IN + cost["out"] / 1e6 * PRICE_OUT, 2)


def run(niche, collect_only=False, only=None):
    n = NICHES[niche]
    d = os.path.join(RAW, niche)
    os.makedirs(d, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    data = {}
    for m, fn in COLLECT.items():
        if only and m not in only:
            continue
        try:
            data[m] = cached(os.path.join(d, f"{m}.json"), lambda: fn(n))
            print("collected", m, len(data[m]), flush=True)
        except Exception as e:
            print("COLLECT FAIL", m, str(e)[:200], flush=True)
    if collect_only:
        return
    cost_path = os.path.join(d, "cost.json")
    cost = json.load(open(cost_path)) if os.path.exists(cost_path) else {"in": 0, "out": 0}
    parts = {}
    for m in COLLECT:
        if m not in data or not data[m]:
            continue
        p = os.path.join(d, f"{m}.md")
        if not os.path.exists(p):
            text = claude(BRIEFS[m].format(ar=n["ar"]) + "\n\nالبيانات:\n" + json.dumps(data[m], ensure_ascii=False)[:300000], cost)
            open(p, "w", encoding="utf-8").write(text)
            json.dump(cost, open(cost_path, "w"))
            print("analysed", m, "so far $", usd(cost), flush=True)
        parts[m] = open(p, encoding="utf-8").read()
    tp = os.path.join(d, "template.md")
    if not os.path.exists(tp):
        joined = "\n\n".join(f"## {TITLES[m]}\n{t}" for m, t in parts.items())
        open(tp, "w", encoding="utf-8").write(claude(BRIEFS["template"].format(ar=n["ar"]) + "\n\nالتحليل:\n" + joined, cost))
        json.dump(cost, open(cost_path, "w"))
    report = [f"# تحليل نشاط «{n['ar']}» — {date.today().isoformat()}", "",
              f"وكيل بينون للتحليلات. ٨ وحدات، بيانات حقيقية من Google وميتا وتيك توك وإنستغرام والأخبار. تكلفة Claude التقريبية: ${usd(cost)}.", "",
              "## القالب والمحتوى", open(tp, encoding="utf-8").read()]
    for m, t in parts.items():
        report += ["", f"## {TITLES[m]}", t]
    out = os.path.join(OUT, f"{date.today().isoformat()}-{niche}.md")
    open(out, "w", encoding="utf-8").write("\n".join(report))
    print("REPORT", out, "cost $", usd(cost))


def master():
    files = sorted(f for f in os.listdir(OUT) if re.match(r"\d{4}-\d\d-\d\d-[a-z]+\.md$", f))
    joined = "\n\n".join(open(os.path.join(OUT, f), encoding="utf-8").read()[:40000] for f in files)
    cost = {"in": 0, "out": 0}
    text = claude(MASTER_BRIEF + "\n\nالتقارير:\n" + joined, cost)
    out = os.path.join(OUT, f"{date.today().isoformat()}-master.md")
    open(out, "w", encoding="utf-8").write(f"# التقرير الجامع — {date.today().isoformat()}\n\n" + text)
    print("MASTER", out, "cost $", usd(cost))


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "--master":
        master()
    else:
        only = None
        if "--only" in a:
            only = set(a[a.index("--only") + 1].split(","))
        run(a[0], "--collect-only" in a, only)
