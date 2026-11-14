#!/usr/bin/env python3
"""محلّل الاستراتيجية والتصميم — Beynoun content engine.

For each competitor: computes the posting plan from the numbers (rate, mix,
hours) and sends Claude the post IMAGES + captions + engagement to judge
design, copy, management/consistency, content pillars and what the audience
likes.

Run:
  ANTHROPIC_API_KEY="$BEYNOUN_ANTHROPIC_KEY" python3 -I analyze_strategy.py map.json img_dir out.json
"""
import base64, io, json, os, sys, time, urllib.request, concurrent.futures as cf
from collections import Counter
from datetime import datetime
from PIL import Image

MODEL = os.environ.get("ANALYZER_MODEL", "claude-sonnet-5-5")
BASE = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
KEY = os.environ["ANTHROPIC_API_KEY"]

SYSTEM = """أنت مدير محتوى ومصمم خبير في السوق العربي، تعمل لصالح «بينون» (منصة عربية تبني مواقع لأصحاب المطاعم والمقاهي والحلاقين والنوادي، وتديرها وتنشرها).
تحلّل حساب منافس على إنستغرام من صور منشوراته الفعلية ونصوصها وأرقامها. كن صارمًا وصادقًا، واستند إلى ما تراه فقط.
أعد JSON صالحًا فقط، بلا أي نص قبله أو بعده، ولا تستخدم علامة " داخل النصوص."""

SCHEMA = """أعد JSON بهذا الشكل بالضبط (كل الدرجات من 10):
{
 "design": {"score": 0, "style": "وصف قصير للأسلوب البصري: الألوان، الخطوط، الصور أو الرسوم، الوجوه البشرية", "consistency": 0, "strengths": ["..."], "weaknesses": ["..."]},
 "copy": {"score": 0, "dialect": "فصحى|خليجي|مصري|مغربي|شامي|مختلط|إنجليزي", "strengths": ["..."], "weaknesses": ["..."]},
 "management": {"score": 0, "notes": "الانتظام، وضوح الخطة، توزيع المحاور، هل الحساب يُدار بخطة أم عشوائي"},
 "pillars": [{"name": "اسم المحور", "share": "نسبة تقريبية", "performance": "قوي|متوسط|ضعيف"}],
 "formats": "ما الأشكال المستخدمة: صورة واحدة، كاروسيل، ريلز، نص على صورة، صور منتجات، وجوه... وأيها ينجح",
 "audience_likes": ["ما يحبه جمهورهم فعلًا، استنادًا إلى أعلى المنشورات تفاعلًا"],
 "best_post": {"shortCode": "...", "why": "..."},
 "worst_post": {"shortCode": "...", "why": "..."},
 "steal": "شيء واحد نأخذه منهم",
 "avoid": "شيء واحد نتجنبه"
}"""


def img_block(path):
    im = Image.open(path).convert("RGB")
    im.thumbnail((512, 512))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=70)
    return {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg",
                                         "data": base64.b64encode(buf.getvalue()).decode()}}


def plan_stats(posts):
    ts = sorted(datetime.fromisoformat(p["timestamp"].replace("Z", "+00:00")) for p in posts if p.get("timestamp"))
    span = max((ts[-1] - ts[0]).days, 1) if len(ts) > 1 else None
    return {
        "posts_counted": len(posts),
        "per_week": round(len(ts) / span * 7, 1) if span else None,
        "span_days": span,
        "types": dict(Counter(p.get("type") for p in posts)),
        "hours_utc": dict(Counter(t.hour for t in ts).most_common(3)),
        "weekdays": dict(Counter(t.strftime("%a") for t in ts).most_common(3)),
        "avg_likes": round(sum(max(p.get("likesCount") or 0, 0) for p in posts) / max(len(posts), 1)),
        "avg_comments": round(sum(p.get("commentsCount") or 0 for p in posts) / max(len(posts), 1), 1),
    }


def call(content):
    body = json.dumps({"model": MODEL, "max_tokens": 12000, "system": SYSTEM,
                       "messages": [{"role": "user", "content": content}]}).encode()
    req = urllib.request.Request(BASE.rstrip("/") + "/v1/messages", data=body, headers={
        "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                d = json.load(r)
            return "".join(b.get("text", "") for b in d["content"]), d.get("usage", {})
        except Exception:
            if attempt == 3:
                raise
            time.sleep(8 * (attempt + 1))


def analyze(profile, img_dir):
    posts = profile.get("latestPosts") or []
    if not posts:
        return None
    stats = plan_stats(posts)
    content = [{"type": "text", "text":
                f"الحساب: @{profile['username']} — المتابعون: {profile.get('followersCount')}\n"
                f"النبذة: {profile.get('biography') or ''}\n"
                f"أرقام خطة النشر المحسوبة: {json.dumps(stats, ensure_ascii=False)}\n\n"
                "فيما يلي كل منشور: بياناته ثم صورته."}]
    for p in posts:
        meta = {"shortCode": p.get("shortCode"), "date": (p.get("timestamp") or "")[:10], "type": p.get("type"),
                "likes": p.get("likesCount"), "comments": p.get("commentsCount"),
                "caption": (p.get("caption") or "")[:600]}
        content.append({"type": "text", "text": json.dumps(meta, ensure_ascii=False)})
        f = os.path.join(img_dir, f"{profile['username']}_{p.get('shortCode')}.jpg")
        if os.path.exists(f):
            content.append(img_block(f))
    content.append({"type": "text", "text": SCHEMA})
    text, usage = call(content)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    res = json.loads(text)
    res["_stats"] = stats
    res["_usage"] = usage
    res["_followers"] = profile.get("followersCount")
    return res


def main(src, img_dir, out):
    profiles = [p for p in json.load(open(src)) if p.get("latestPosts")]
    results = json.load(open(out)) if os.path.exists(out) else {}
    todo = [p for p in profiles if p["username"] not in results]
    with cf.ThreadPoolExecutor(4) as ex:
        futs = {ex.submit(analyze, p, img_dir): p["username"] for p in todo}
        for f in cf.as_completed(futs):
            u = futs[f]
            try:
                results[u] = f.result()
                print("ok", u, flush=True)
            except Exception as e:
                print("FAIL", u, e, flush=True)
    json.dump(results, open(out, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(*sys.argv[1:4])
