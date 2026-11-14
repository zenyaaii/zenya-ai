#!/usr/bin/env python3
"""أسئلة البناء لكل نيش — what the build wizard should ask each kind of business.

Cheap on purpose (Anas 2026-11-12): Google reviews (Places) + the homepages of
top places that DO have a site (plain fetch, free) -> one Haiku call per niche
-> a JSON sheet in the shape of utils/services/kinds.ts KindText + extras.

  google_places_api_key=... ANTHROPIC_API_KEY="$BEYNOUN_ANTHROPIC_KEY" \
  ANTHROPIC_BASE_URL=https://api.anthropic.com python3 -I build_questions.py [niche ...]
Cached in ../raw-niche/<niche>/ ; sheets in ../niche-questions/<niche>.json
"""
import html as H, json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(ROOT, "raw-niche")
OUT = os.path.join(ROOT, "niche-questions")
MODEL = os.environ.get("QUESTIONS_MODEL", "claude-haiku-5-5")
BASE = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
CITIES = ["الرياض", "جدة", "دبي", "الكويت", "القاهرة", "عمّان"]

NICHES = {
 "spa": "سبا", "massage": "مركز مساج", "nails": "صالون أظافر", "beauty": "صالون تجميل نسائي",
 "dental": "عيادة أسنان", "derma": "عيادة جلدية", "physio": "مركز علاج طبيعي",
 "car": "ورشة صيانة سيارات", "carwash": "مغسلة سيارات", "photo": "استوديو تصوير",
 "tailor": "خياط", "laundry": "مغسلة ملابس", "pet": "عيادة بيطرية ومحل حيوانات", "florist": "محل ورد",
}

SHAPE = """أعد JSON فقط بهذا الشكل (كل النصوص بالعربية الفصحى المبسطة):
{
 "label": "اسم النوع كما يختاره صاحب المحل",
 "place": "اسم المكان في جملة، مثل: الصالون",
 "team": "عنوان قسم الأشخاص، مثل: الحلاقون", "one": "مفرد الشخص", "role": "الدور الافتراضي",
 "names_in_reviews": {"share": "نسبة تقريبية من التقييمات تذكر شخصًا بالاسم", "examples": ["أدوار مذكورة: طبيب، أخصائية…"]},
 "audiences": ["خيارات الجمهور إن وُجدت، مثل: رجال، نساء، عائلات"],
 "tags": ["٦–٩ مهارات أو تخصصات يُعرف بها الشخص"],
 "services": [{"name": "خدمة", "duration": "مدة نموذجية أو فارغ", "on": true, "evidence": "كم مرة ذُكرت أو من أين"}],
 "price_unit": "كيف يُسعَّر هذا النشاط: للخدمة، بالساعة، بالكيلو، بالباقة، بعد الفحص…",
 "faqs": ["٦–٨ أسئلة يسألها الزبون فعلًا، من التقييمات"],
 "terms": [{"label": "شرط يجب أن يكتبه صاحب المحل", "placeholder": "مثال", "why": "الغضب الذي يمنعه، من التقييمات"}],
 "wizard_questions": [{"q": "سؤال المعالج لصاحب المحل", "type": "text|choice|list|photos|hours|link|yesno", "why": "لماذا"}],
 "extras": [{"section": "قسم أو ميزة خاصة بهذا النوع لا تكون في القوالب العادية", "why": "الدليل من التقييمات أو المواقع"}],
 "never_show": ["ما يجب ألا يظهر في موقع هذا النوع"],
 "hero_photo": "أفضل صورة للواجهة لهذا النوع",
 "visitor": {"who": "من الزائر بالإنجليزية", "want": "ماذا يريد بالإنجليزية", "checks": ["٥ أسئلة يفحص بها الزائر الذكي الموقع، بالعربية"]},
 "praise_top": ["أكثر ٤ أشياء يمدحها الزبائن، مع عدد تقريبي"],
 "anger_top": ["أكثر ٤ أشياء تغضبهم، مع عدد تقريبي"],
 "photo_rule_note": "تنبيه إن كانت صور هذا النوع غالبًا فيها نساء أو وشوم (قاعدتنا: لا نساء ولا وشوم في الصور)"
}
wizard_questions: ٨–١٢ سؤالًا بالترتيب. السؤال الأول دائمًا رابط خرائط جوجل (يملأ الاسم والعنوان والهاتف والساعات والتقييمات تلقائيًا)، فلا تكرر ما يأتي منه.
services: ٦–١٠، والأكثر ذكرًا on=true."""

SYSTEM = """أنت تصمم أسئلة معالج بناء المواقع في «بينون» لنوع نشاط واحد. استند فقط إلى التقييمات ونصوص المواقع المعطاة، ثم إلى المعرفة العامة الواضحة عن هذا النوع. لا تخترع أرقامًا. أعد JSON صالحًا فقط، ولا تستخدم علامة " داخل النصوص أبدًا (استعمل « » بدلها)."""


STR = {"type": "string"}
ARR = {"type": "array", "items": STR}
def OBJS(*keys):
    return {"type": "array", "items": {"type": "object", "properties": {k: (BOOL if k == "on" else STR) for k in keys}, "required": list(keys)}}
BOOL = {"type": "boolean"}
SCHEMA = {"type": "object", "properties": {
 "label": STR, "place": STR, "team": STR, "one": STR, "role": STR,
 "names_in_reviews": {"type": "object", "properties": {"share": STR, "examples": ARR}, "required": ["share", "examples"]},
 "audiences": ARR, "tags": ARR,
 "services": OBJS("name", "duration", "on", "evidence"),
 "price_unit": STR, "faqs": ARR,
 "terms": OBJS("label", "placeholder", "why"),
 "wizard_questions": OBJS("q", "type", "why"),
 "extras": OBJS("section", "why"),
 "never_show": ARR, "hero_photo": STR,
 "visitor": {"type": "object", "properties": {"who": STR, "want": STR, "checks": ARR}, "required": ["who", "want", "checks"]},
 "praise_top": ARR, "anger_top": ARR, "photo_rule_note": STR}}
SCHEMA["required"] = list(SCHEMA["properties"])


def http_json(url, body, headers, timeout=300):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"content-type": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def reviews(ar):
    key = os.environ["google_places_api_key"]
    rows, sites = [], []
    for city in CITIES:
        res = http_json("https://places.googleapis.com/v1/places:searchText",
                        {"textQuery": f"{ar} في {city}", "languageCode": "ar", "maxResultCount": 8},
                        {"X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.websiteUri,places.reviews"})
        for p in res.get("places", []):
            if (p.get("userRatingCount") or 0) < 20:
                continue
            if p.get("websiteUri"):
                sites.append(p["websiteUri"])
            for r in p.get("reviews", []):
                t = ((r.get("text") or r.get("originalText") or {}).get("text") or "").replace("\n", " ").strip()
                if len(t) > 25:
                    rows.append({"c": city, "s": r.get("rating"), "t": t[:450]})
    return {"reviews": rows, "sites": sites}


def page_text(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"})
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read(600000).decode("utf-8", "replace")
        raw = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", raw)
        txt = H.unescape(re.sub(r"<[^>]+>", " ", raw))
        txt = re.sub(r"\s+", " ", txt).strip()
        return txt[:2500] if len(re.findall(r"[؀-ۿ]", txt)) > 80 else ""
    except Exception:
        return ""


def ask(prompt):
    body = {"model": MODEL, "max_tokens": 16000, "system": SYSTEM, "messages": [{"role": "user", "content": prompt}]}
    d = http_json(BASE.rstrip("/") + "/v1/messages", body, {"x-api-key": os.environ["ANTHROPIC_API_KEY"], "anthropic-version": "2023-06-01"})
    t = "".join(b.get("text", "") for b in d["content"]).strip()
    t = t[t.find("{"): t.rfind("}") + 1]
    try:
        sheet = json.loads(t)
    except json.JSONDecodeError:
        from json_repair import repair_json  # Haiku sometimes leaves a stray quote inside Arabic text
        sheet = json.loads(repair_json(t))
    return sheet, d.get("usage", {})


def run(niche):
    ar = NICHES[niche]
    d = os.path.join(RAW, niche)
    os.makedirs(d, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    rp = os.path.join(d, "q_reviews.json")
    if not os.path.exists(rp):
        json.dump(reviews(ar), open(rp, "w"), ensure_ascii=False)
    data = json.load(open(rp))
    sp = os.path.join(d, "q_sites.json")
    if not os.path.exists(sp):
        texts = []
        for u in dict.fromkeys(data["sites"]):
            if "instagram.com" in u or "facebook.com" in u:
                continue
            t = page_text(u)
            if t:
                texts.append({"url": u, "text": t})
            if len(texts) >= 6:
                break
        json.dump(texts, open(sp, "w"), ensure_ascii=False)
    sites = json.load(open(sp))
    out = os.path.join(OUT, f"{niche}.json")
    if os.path.exists(out):
        return json.load(open(out)).get("_usage", {})
    revs = "\n".join(f"[{r['s']}★ {r['c']}] {r['t']}" for r in data["reviews"])
    st = "\n\n".join(f"{s['url']}\n{s['text']}" for s in sites) or "لا توجد"
    sheet, usage = ask(f"نوع النشاط: «{ar}».\n\nتقييمات جوجل الحقيقية ({len(data['reviews'])}):\n{revs}\n\nنصوص مواقع أفضل المحلات من هذا النوع:\n{st}\n\n{SHAPE}")
    sheet["_niche"], sheet["_reviews"], sheet["_sites"], sheet["_usage"] = niche, len(data["reviews"]), len(sites), usage
    json.dump(sheet, open(out, "w"), ensure_ascii=False, indent=1)
    return usage


if __name__ == "__main__":
    tot_in = tot_out = 0
    for n in (sys.argv[1:] or list(NICHES)):
        try:
            u = run(n)
            tot_in += u.get("input_tokens", 0); tot_out += u.get("output_tokens", 0)
            print("ok", n, u, flush=True)
        except Exception as e:
            print("FAIL", n, str(e)[:300], flush=True)
    print("tokens in/out", tot_in, tot_out)
