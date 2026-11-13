"use client"

/**
 * Shake to report (Anas, 2026-11-12, option C «اسأل أولًا»).
 *
 * On a phone, three quick shakes take a picture of the screen at that moment
 * and drop a small pill from the top: «تريد أن تبلّغ عن مشكلة؟ نعم / لا». It
 * leaves by itself after six seconds, so a shake in a pocket costs nothing.
 * «نعم» opens a sheet with the picture attached: a line of text, a camera
 * photo instead if they want, and «أرسل». The report lands in /api/report and
 * shows in the admin dashboard's «الزوار» tab.
 *
 * Where there is a mouse there is nothing to shake, so a quiet «بلّغ عن مشكلة»
 * button sits in the bottom-left corner instead and opens the same sheet.
 *
 * iPhone lets a page feel motion only after a tap that asks for it, so iPhone
 * visitors see a one-time strip with «فعّل». It waits until the cookie banner
 * is answered, so the two never stack at the bottom of the screen.
 *
 * Mounted in the root layout on every Beynoun surface; never on a customer's
 * own site. Self-contained night palette, so it reads the same over the light
 * dashboard and the dark site.
 */

import { useCallback, useEffect, useRef, useState } from "react"

type Phase = "idle" | "ask" | "sheet"
type Attach = { src: string; kind: "screen" | "camera" } | null

const SEEN = "beynoun_shake_ios"

/** The page as the visitor sees it: rendered, then cropped to the screen. */
async function captureScreen(): Promise<string | null> {
  /* Two things the renderer gets wrong, put right for the moment of the shot
     and undone after: an entrance animation is replayed from its first frame
     (a card at opacity 0), and a fixed header is drawn at the top of the whole
     page instead of the top of the screen. */
  const still = document.createElement("style")
  still.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"
  const pinned: Array<[HTMLElement, string]> = []
  try {
    const { toCanvas } = await import("html-to-image")
    const y = window.scrollY, w = window.innerWidth, h = window.innerHeight
    document.head.appendChild(still)
    // Fixed and sticky parts are placed by hand where the visitor sees them:
    // move each to its parent's flow at 0,0, measure where that lands, then shift.
    const els = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .filter((el) => el.dataset.rpSkip !== "1" && !el.closest("[data-rp-skip]"))
      .map((el) => [el, getComputedStyle(el).position] as const)
      .filter(([, p]) => p === "fixed" || p === "sticky")
      .map(([el, p]) => [el, p, el.getBoundingClientRect()] as const)
      .filter(([, , r]) => r.width > 0 && r.height > 0)
    for (const [el, p, r] of els) {
      pinned.push([el, el.getAttribute("style") ?? ""])
      const set = (k: string, v: string) => el.style.setProperty(k, v, "important")
      if (p === "fixed") {
        set("position", "absolute"); set("right", "auto"); set("bottom", "auto"); set("margin", "0")
        set("width", r.width + "px"); set("height", r.height + "px"); set("transform", "none")
      } else {
        set("position", "relative"); set("bottom", "auto"); set("right", "auto")
      }
      set("top", "0px"); set("left", "0px")
      const o = el.getBoundingClientRect()
      set("top", r.top - o.top + "px"); set("left", r.left - o.left + "px")
    }
    const bg = getComputedStyle(document.body).backgroundColor
    const full = await toCanvas(document.body, {
      pixelRatio: 1,
      backgroundColor: bg && bg !== "rgba(0, 0, 0, 0)" ? bg : "#0F0D0A",
      filter: (n) => !(n instanceof HTMLElement && n.dataset.rpSkip === "1"),
      // Images from other hosts (Google photos, storage) may refuse to be read; skip them, keep the page.
      imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    })
    const out = document.createElement("canvas")
    out.width = w; out.height = h
    out.getContext("2d")!.drawImage(full, 0, y, w, h, 0, 0, w, h)
    return out.toDataURL("image/jpeg", 0.72)
  } catch {
    return null
  } finally {
    for (const [el, st] of pinned) { if (st) el.setAttribute("style", st); else el.removeAttribute("style") }
    still.remove()
  }
}

/** A camera photo can be 12 MP; 1600 px on the long side is plenty to see a problem. */
function shrink(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height))
      const c = document.createElement("canvas")
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL("image/jpeg", 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

const consentGiven = () => {
  try { if (localStorage.getItem("zenya_consent")) return true } catch { /* blocked */ }
  return /(?:^|; )beynoun_consent=/.test(document.cookie)
}

export default function ShakeReport() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [shown, setShown] = useState(false) // drives the enter/leave transition
  const [attach, setAttach] = useState<Attach>(null)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [iosAsk, setIosAsk] = useState(false)
  const [hidden, setHidden] = useState(false) // while taking a shot from inside the sheet
  const phaseRef = useRef<Phase>("idle")
  const askTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const areaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => { phaseRef.current = phase }, [phase])

  /* Not inside a frame: the editor's live preview is our page in an iframe, and
     it must not grow a second button. */
  const [top, setTop] = useState(false)
  useEffect(() => { try { setTop(window.self === window.top) } catch { setTop(false) } }, [])

  const enter = (p: Phase) => {
    setPhase(p); setShown(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
  }
  const leave = useCallback(() => {
    setShown(false)
    setTimeout(() => { if (phaseRef.current !== "idle") { setPhase("idle") } }, 380)
  }, [])

  const openSheet = useCallback((a: Attach) => {
    setAttach(a); setErr(null); enter("sheet")
    setTimeout(() => areaRef.current?.focus({ preventScroll: true }), 400)
  }, [])

  const onShake = useCallback(async () => {
    if (phaseRef.current !== "idle") return
    phaseRef.current = "ask"
    const shot = await captureScreen()
    setAttach(shot ? { src: shot, kind: "screen" } : null)
    enter("ask")
    if (askTimer.current) clearTimeout(askTimer.current)
    askTimer.current = setTimeout(() => { if (phaseRef.current === "ask") { setAttach(null); leave() } }, 6000)
  }, [leave])

  /* Three shakes inside 1.6 s: six changes of direction above 14 m/s². */
  useEffect(() => {
    let peaks: number[] = [], sign = 0
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity || e.acceleration
      if (!a) return
      const x = a.x ?? 0, y = a.y ?? 0
      const v = Math.abs(x) > Math.abs(y) ? x : y
      if (Math.abs(v) < 14) return
      const s = v > 0 ? 1 : -1
      if (s === sign) return
      sign = s
      const now = Date.now()
      peaks = peaks.filter((t) => now - t < 1600)
      peaks.push(now)
      if (peaks.length >= 6) { peaks = []; onShake() }
    }
    if (!top) return
    window.addEventListener("devicemotion", onMotion)
    return () => window.removeEventListener("devicemotion", onMotion)
  }, [onShake, top])

  /* iPhone: ask once, after the cookie banner is out of the way. */
  useEffect(() => {
    const DME = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent
    const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
    if (!top || !apple || !DME?.requestPermission || !matchMedia("(pointer:coarse)").matches) return
    try { if (localStorage.getItem(SEEN)) return } catch { return }
    const t = setInterval(() => { if (consentGiven()) { clearInterval(t); setTimeout(() => setIosAsk(true), 2500) } }, 1500)
    return () => clearInterval(t)
  }, [top])
  const iosDone = (allow: boolean) => {
    try { localStorage.setItem(SEEN, "1") } catch { /* fine */ }
    setIosAsk(false)
    if (allow) {
      const DME = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent
      DME?.requestPermission?.().catch(() => {})
    }
  }

  const takeShot = async () => {
    setHidden(true)
    await new Promise((r) => setTimeout(r, 80))
    const s = await captureScreen()
    setHidden(false)
    if (s) setAttach({ src: s, kind: "screen" })
    else setErr("لم نستطع تصوير الشاشة. أرفق صورة بالكاميرا أو اكتب فقط.")
  }
  const onFile = async (f: File | undefined) => {
    if (!f) return
    const s = await shrink(f)
    if (s) setAttach({ src: s, kind: "camera" })
  }

  const send = async () => {
    if (!text.trim() && !attach) { setErr("اكتب ما حدث، أو أرفق صورة."); return }
    setBusy(true); setErr(null)
    try {
      const r = await fetch("/api/report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(), kind: attach?.kind ?? "text", image: attach?.src,
          page: location.pathname + location.search, title: document.title,
          vw: window.innerWidth, vh: window.innerHeight,
        }),
      })
      if (!r.ok) { setErr((await r.json().catch(() => null))?.error || "لم يصل البلاغ. حاول مرة أخرى."); return }
      setText(""); setAttach(null); leave()
      setToast(true); setTimeout(() => setToast(false), 2600)
    } catch {
      setErr("لا يوجد اتصال. حاول مرة أخرى.")
    } finally { setBusy(false) }
  }

  if (!top) return null

  return (
    <div className="rp-x" dir="rtl" data-rp-skip="1">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {phase === "idle" ? (
        <button type="button" className="rp-tab" onClick={() => openSheet(null)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></svg>
          بلّغ عن مشكلة
        </button>
      ) : null}

      {phase === "ask" ? (
        <div className="rp-ask" role="alert" data-on={shown ? "" : undefined}>
          <span>تريد أن تبلّغ عن مشكلة؟</span>
          <button type="button" className="y" onClick={() => { if (askTimer.current) clearTimeout(askTimer.current); openSheet(attach) }}>نعم</button>
          <button type="button" onClick={() => { if (askTimer.current) clearTimeout(askTimer.current); setAttach(null); leave() }}>لا</button>
        </div>
      ) : null}

      {phase === "sheet" ? (
        <>
          <div className="rp-scrim" data-on={shown ? "" : undefined} style={hidden ? { visibility: "hidden" } : undefined} onClick={leave} />
          <div className="rp-sheet" role="dialog" aria-modal="true" aria-labelledby="rp-h" data-on={shown ? "" : undefined}
            style={hidden ? { visibility: "hidden" } : undefined} onKeyDown={(e) => { if (e.key === "Escape") leave() }}>
            <div className="rp-grab" />
            <h2 className="rp-h" id="rp-h">بلّغ عن مشكلة</h2>
            <p className="rp-s">اكتب ما حدث. نراه نحن فقط، ونصلحه بسرعة.</p>
            {attach ? (
              <div className="rp-shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={attach.src} />
                <div><b>{attach.kind === "screen" ? "لقطة من الشاشة" : "صورة من الكاميرا"}</b><span>مرفقة مع البلاغ</span></div>
                <button type="button" className="rp-del" onClick={() => setAttach(null)}>احذفها</button>
              </div>
            ) : null}
            <label htmlFor="rp-text" className="rp-lb">ما المشكلة؟</label>
            <textarea id="rp-text" ref={areaRef} className="rp-ta" value={text} maxLength={2000}
              onChange={(e) => setText(e.target.value)} placeholder="مثلًا: زر التالي لا يعمل بعد إضافة الصور" />
            {err ? <p className="rp-err" role="alert">{err}</p> : null}
            <div className="rp-row">
              {attach?.kind !== "screen" ? (
                <button type="button" className="rp-btn" onClick={takeShot}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /></svg>
                  لقطة شاشة
                </button>
              ) : null}
              <button type="button" className="rp-btn" onClick={() => fileRef.current?.click()}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                صورة بالكاميرا
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden
                onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = "" }} />
              <button type="button" className="rp-btn go" onClick={send} disabled={busy}>{busy ? "أرسل…" : "أرسل"}</button>
            </div>
          </div>
        </>
      ) : null}

      {iosAsk && phase === "idle" ? (
        <div className="rp-ios">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="18" rx="2" /><path d="M4 8c-1 2-1 6 0 8M20 8c1 2 1 6 0 8" /></svg>
          <p>هزّ هاتفك متى رأيت مشكلة<span>نفتح لك نافذة التبليغ فورًا</span></p>
          <button type="button" onClick={() => iosDone(true)}>فعّل</button>
          <button type="button" className="no" onClick={() => iosDone(false)}>لاحقًا</button>
        </div>
      ) : null}

      {toast ? <div className="rp-toast" role="status">وصل البلاغ. شكرًا لك</div> : null}
    </div>
  )
}

const CSS = `
.rp-x{--rp-bg:#1A1713;--rp-bg2:#13110E;--rp-card:#24201A;--rp-ink:#F4EFE6;--rp-mut:#A39A8D;--rp-line:rgba(244,239,230,.16);--rp-acc:#E2532A;--rp-ok:#2F8F5B;
  font-family:inherit;color:var(--rp-ink);line-height:1.55}
.rp-x *,.rp-x *::before,.rp-x *::after{box-sizing:border-box}
.rp-x button{font:inherit;cursor:pointer}
.rp-scrim{position:fixed;inset:0;background:rgba(10,8,6,.5);z-index:2147483000;opacity:0;transition:opacity .25s}
.rp-scrim[data-on]{opacity:1}
.rp-sheet{position:fixed;z-index:2147483001;background:var(--rp-bg);color:var(--rp-ink);border:1px solid var(--rp-line);box-shadow:0 -10px 40px -10px rgba(0,0,0,.55);
  inset:auto 0 0 0;border-radius:22px 22px 0 0;padding:10px max(18px,env(safe-area-inset-right,0px)) calc(18px + env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));
  transform:translateY(105%);transition:transform .38s cubic-bezier(.22,1,.36,1);max-height:88vh;overflow:auto;text-align:right}
.rp-sheet[data-on]{transform:none}
@media (min-width:760px){.rp-sheet{inset:auto auto 24px 24px;width:400px;border-radius:20px;padding:18px;transform:translateY(16px);opacity:0;transition:transform .3s cubic-bezier(.22,1,.36,1),opacity .2s}
  .rp-sheet[data-on]{opacity:1;transform:none}}
.rp-grab{width:40px;height:4px;border-radius:9px;background:var(--rp-line);margin:0 auto 12px}
@media (min-width:760px){.rp-grab{display:none}}
.rp-h{font-size:22px;line-height:1.25;margin:0 0 4px;font-weight:700;color:var(--rp-ink)}
.rp-s{font-size:15px;color:var(--rp-mut);margin:0 0 14px}
.rp-lb{display:block;font-size:14px;color:var(--rp-mut);margin:0 0 6px}
.rp-shot{display:flex;gap:12px;align-items:center;background:var(--rp-card);border-radius:14px;padding:8px;margin-bottom:12px}
.rp-shot img{width:64px;height:110px;object-fit:cover;object-position:top;border-radius:9px;border:1px solid var(--rp-line);flex:none;background:#000}
@media (min-width:760px){.rp-shot img{width:120px;height:75px}}
.rp-shot b{display:block;font-size:15px}
.rp-shot span{font-size:13px;color:var(--rp-mut)}
.rp-shot .rp-del{margin-inline-start:auto;border:0;background:none;color:var(--rp-mut);font-size:13px;padding:6px}
.rp-ta{width:100%;min-height:92px;resize:vertical;border-radius:14px;border:1px solid var(--rp-line);background:var(--rp-bg2);color:var(--rp-ink);font:inherit;font-size:16px;padding:12px 14px;line-height:1.55}
.rp-ta:focus{outline:2px solid var(--rp-acc);outline-offset:1px}
.rp-err{margin:8px 0 0;font-size:14px;color:#F07A52}
.rp-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.rp-btn{display:inline-flex;align-items:center;gap:7px;border-radius:999px;border:1px solid var(--rp-line);background:transparent;color:var(--rp-ink);font-size:15px;padding:9px 15px;min-height:44px}
.rp-btn svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.7}
.rp-btn.go{background:var(--rp-acc);border-color:var(--rp-acc);color:#fff;font-weight:700;margin-inline-start:auto;min-width:88px;justify-content:center}
.rp-btn[disabled]{opacity:.6;cursor:default}
.rp-btn:focus-visible,.rp-tab:focus-visible,.rp-ask button:focus-visible,.rp-ios button:focus-visible{outline:2px solid var(--rp-acc);outline-offset:2px}
.rp-ask{position:fixed;z-index:2147483001;top:calc(12px + env(safe-area-inset-top,0px));left:50%;transform:translate(-50%,-160%);transition:transform .35s cubic-bezier(.22,1,.36,1);
  background:var(--rp-ink);color:#16120D;border-radius:999px;padding:6px 8px 6px 6px;display:flex;align-items:center;gap:6px;box-shadow:0 12px 30px -8px rgba(0,0,0,.5);white-space:nowrap;font-size:15px}
.rp-ask[data-on]{transform:translate(-50%,0)}
.rp-ask span{padding-inline:10px 4px}
.rp-ask button{border:0;border-radius:999px;font-size:14px;padding:7px 14px;background:transparent;color:inherit;min-height:36px}
.rp-ask button.y{background:var(--rp-acc);color:#fff;font-weight:700}
.rp-tab{position:fixed;z-index:2147482990;left:calc(16px + env(safe-area-inset-left,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));display:none;align-items:center;gap:7px;
  border-radius:999px;border:1px solid var(--rp-line);background:var(--rp-bg);color:var(--rp-mut);font-size:13.5px;padding:7px 13px;box-shadow:0 8px 24px -10px rgba(0,0,0,.45)}
.rp-tab svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.7}
.rp-tab:hover{color:var(--rp-ink)}
@media (hover:hover) and (pointer:fine) and (min-width:760px){.rp-tab{display:inline-flex}}
@media print{.rp-x{display:none}}
.rp-ios{position:fixed;z-index:2147482990;inset:auto 12px calc(12px + env(safe-area-inset-bottom,0px)) 12px;display:flex;align-items:center;gap:10px;background:var(--rp-bg);
  border:1px solid var(--rp-line);border-radius:16px;padding:10px 12px;font-size:14px;box-shadow:0 12px 30px -8px rgba(0,0,0,.5)}
.rp-ios svg{width:22px;height:22px;stroke:var(--rp-acc);fill:none;stroke-width:1.7;flex:none}
.rp-ios p{margin:0;flex:1;line-height:1.4}
.rp-ios p span{color:var(--rp-mut);display:block;font-size:12.5px}
.rp-ios button{border:0;border-radius:999px;background:var(--rp-acc);color:#fff;font-weight:700;font-size:14px;padding:8px 14px}
.rp-ios .no{background:none;color:var(--rp-mut);font-weight:400;padding:8px}
.rp-toast{position:fixed;z-index:2147483002;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--rp-ok);color:#fff;
  border-radius:999px;padding:10px 18px;font-size:15px;font-weight:700;white-space:nowrap;animation:rp-in .3s ease-out}
@keyframes rp-in{from{opacity:0;transform:translate(-50%,20px)}}
@media (prefers-reduced-motion:reduce){.rp-sheet,.rp-ask,.rp-scrim{transition:none}.rp-toast{animation:none}}
`
