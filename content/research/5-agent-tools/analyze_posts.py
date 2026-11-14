#!/usr/bin/env python3
"""محلّل منشورات المنافسين — Beynoun content engine.

Reads an Apify instagram-profile-scraper JSON (with latestPosts) and asks Claude
to judge, post by post, how each post talks to the reader. Writes one JSON
result per account.

Run:
  ANTHROPIC_API_KEY="$BEYNOUN_ANTHROPIC_KEY" python3 -I analyze_posts.py map.json out.json
"""
import json, os, sys, time, urllib.request, concurrent.futures as cf

MODEL = os.environ.get("ANALYZER_MODEL", "claude-sonnet-5-5")
BASE = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
KEY = os.environ["ANTHROPIC_API_KEY"]

SYSTEM = """أنت محلّل محتوى خبير في السوق العربي، تعمل لصالح «بينون» (منصة عربية تبني مواقع لأصحاب المطاعم والمقاهي والحلاقين والنوادي، وتديرها وتنشرها).
مهمتك: تقييم منشورات منافس على إنستغرام، منشورًا منشورًا، من زاوية واحدة: كيف يخاطب المنشور القارئ (صاحب المشروع الصغير)؟
كن صارمًا وصادقًا. لا تجامل. استند فقط إلى النص والأرقام المعطاة، ولا تخترع ما لم يُذكر.
أعد JSON فقط، بلا أي نص قبله أو بعده."""

SCHEMA = """أعد JSON صالحًا بهذا الشكل (empathy = هل يشعر بالقارئ ومشكلته؛ speaks_to_reader = هل يكلّمه مباشرة «أنت/مشروعك» أم يتكلم عن نفسه «نحن»؛ hook = قوة أول سطر في إيقاف التمرير). لا تستخدم علامة " داخل النصوص:
{
 "account": "...",
 "posts": [
  {
   "shortCode": "...",
   "empathy": 1-10,
   "speaks_to_reader": 1-10,
   "hook": 1-10,
   "clarity": 1-10,
   "tone": "دافئ|ودود|محايد|بيعي|متعالٍ|بارد|مستفز",
   "pain_touched": "الألم أو الرغبة التي لمسها، أو «لا شيء»",
   "cta": "نوع الدعوة لفعل، أو «لا يوجد»",
   "verdict": "جملة واحدة: لماذا نجح أو فشل مقارنة بتفاعله",
   "lesson_for_beynoun": "جملة واحدة: ماذا نتعلم أو نتجنب"
  }
 ],
 "account_summary": "٣ جمل: أسلوب الحساب في مخاطبة الناس، ما ينجح عنده، وما يفشل",
 "best_post": "shortCode", "worst_post": "shortCode"
}"""


def call(prompt):
    body = json.dumps({"model": MODEL, "max_tokens": 20000, "system": SYSTEM,
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request(BASE.rstrip("/") + "/v1/messages", data=body, headers={
        "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=240) as r:
                d = json.load(r)
            return "".join(b.get("text", "") for b in d["content"]), d.get("usage", {})
        except Exception as e:  # retry on rate limit / network
            if attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))


def analyze(profile):
    posts = profile.get("latestPosts") or []
    if not posts:
        return None
    lines = []
    for p in posts:
        lines.append({
            "shortCode": p.get("shortCode"), "date": (p.get("timestamp") or "")[:10],
            "type": p.get("type"), "pinned": p.get("isPinned"),
            "likes": p.get("likesCount"), "comments": p.get("commentsCount"),
            "caption": (p.get("caption") or "")[:1500],
        })
    prompt = (f"الحساب: @{profile.get('username')} — المتابعون: {profile.get('followersCount')}\n"
              f"النبذة: {profile.get('biography') or ''}\n\nالمنشورات:\n"
              + json.dumps(lines, ensure_ascii=False, indent=1) + "\n\n" + SCHEMA)
    text, usage = call(prompt)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    res = json.loads(text)
    res["_usage"] = usage
    res["_followers"] = profile.get("followersCount")
    eng = {p["shortCode"]: (max(p.get("likes") or 0, 0), p.get("comments") or 0, p["date"], p["type"]) for p in lines}
    for r in res.get("posts", []):
        if r.get("shortCode") in eng:
            r["likes"], r["comments"], r["date"], r["type"] = eng[r["shortCode"]]
            r["url"] = f"https://www.instagram.com/p/{r['shortCode']}/"
    return res


def main(src, out):
    profiles = [p for p in json.load(open(src)) if p.get("latestPosts")]
    results = {}
    with cf.ThreadPoolExecutor(4) as ex:
        futs = {ex.submit(analyze, p): p["username"] for p in profiles}
        for f in cf.as_completed(futs):
            u = futs[f]
            try:
                results[u] = f.result()
                print("ok", u, flush=True)
            except Exception as e:
                print("FAIL", u, e, flush=True)
    json.dump(results, open(out, "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
