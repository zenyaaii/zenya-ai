'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import ReviewOffer from '@/components/ReviewOffer'

/**
 * GenerationOverlay — the full-screen "building" animation shown while a theme
 * is generated. The Square-Kufic زينيا wordmark melts into liquid droplets that
 * pool into a ball, then build themselves up through a series of shapes (tower →
 * page layout → content rows) and re-form back into the word — a literal "we're
 * assembling your site" metaphor. The wordmark and droplets live under one
 * shared goo filter, so the word and the blobs are the SAME liquid.
 *
 * Ported 1:1 from the Cloud-Design "Build Sequence Loader". The wordmark is
 * traced as kufigraph rects (not a <text> glyph) and the blobs are tweened by
 * requestAnimationFrame attribute-animation with an organic per-droplet stagger
 * — CSS geometry props on <rect> aren't reliably honored, so geometry is driven
 * in JS. Self-contained and theme-agnostic so it can front any generator.
 *
 * Under prefers-reduced-motion it shows the word, calm and still, with a label.
 */

const DEFAULT_MESSAGES = [
  'نمزج أقسام موقعك معًا…',
  'نصوغ النصوص بالذكاء الاصطناعي…',
  'ننسّق الألوان والخطوط…',
  'نرتّب الصفحات والمعرض…',
  'نضيف اللمسات الأخيرة…',
]

type BlobGeom = { x: number; y: number; w: number; h: number; rx: number }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// smootherstep — zero velocity AND acceleration at both ends = silky.
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

// Blob phase targets — each is the 5 droplets' geometry for that shape.
const PHASES: Record<string, BlobGeom[]> = {
  seed: [0, 1, 2, 3, 4].map(() => ({ x: 190, y: 194, w: 0, h: 0, rx: 0 })),
  // p0 — round cluster / ball
  '0': [
    { x: 158, y: 155, w: 56, h: 56, rx: 28 }, { x: 184, y: 168, w: 46, h: 46, rx: 23 },
    { x: 150, y: 176, w: 50, h: 50, rx: 25 }, { x: 186, y: 188, w: 46, h: 46, rx: 23 },
    { x: 167, y: 183, w: 48, h: 48, rx: 24 },
  ],
  // p1 — tower
  '1': [
    { x: 138, y: 270, w: 104, h: 26, rx: 13 }, { x: 150, y: 238, w: 80, h: 26, rx: 13 },
    { x: 163, y: 206, w: 54, h: 26, rx: 13 }, { x: 172, y: 174, w: 36, h: 26, rx: 13 },
    { x: 178, y: 142, w: 24, h: 26, rx: 12 },
  ],
  // p2 — page layout
  '2': [
    { x: 100, y: 94, w: 180, h: 26, rx: 10 }, { x: 100, y: 132, w: 180, h: 62, rx: 10 },
    { x: 100, y: 206, w: 84, h: 52, rx: 10 }, { x: 196, y: 206, w: 84, h: 52, rx: 10 },
    { x: 100, y: 270, w: 72, h: 22, rx: 10 },
  ],
  // p3 — content rows
  '3': [
    { x: 96, y: 108, w: 188, h: 20, rx: 10 }, { x: 96, y: 140, w: 188, h: 20, rx: 10 },
    { x: 96, y: 172, w: 144, h: 20, rx: 10 }, { x: 96, y: 204, w: 188, h: 20, rx: 10 },
    { x: 96, y: 236, w: 108, h: 20, rx: 10 },
  ],
  // p4 — horizontal liquid bar matching the word's footprint
  '4': [
    { x: 246, y: 164, w: 74, h: 74, rx: 37 }, { x: 200, y: 158, w: 82, h: 82, rx: 41 },
    { x: 150, y: 162, w: 80, h: 80, rx: 40 }, { x: 102, y: 158, w: 82, h: 82, rx: 41 },
    { x: 58, y: 164, w: 74, h: 74, rx: 37 },
  ],
}
const STAGGER = [0, 70, 30, 90, 45] // ms — organic offset per droplet

// زينيا — Square-Kufic (kufigraph) wordmark, traced from the brand mark. Sits
// under the same melt + goo filters as the blobs so it liquefies like batter.
const BRAND_RECTS: Array<[number, number, number, number]> = [
  [40.0, 159.0, 9.9, 62.0], [92.1, 159.0, 64.5, 9.9], [186.3, 159.0, 9.9, 9.9],
  [226.0, 159.0, 62.0, 9.9], [330.1, 159.0, 9.9, 9.9], [92.1, 168.9, 9.9, 27.3],
  [146.6, 168.9, 9.9, 27.3], [226.0, 168.9, 9.9, 27.3], [278.0, 168.9, 9.9, 52.1],
  [67.3, 186.3, 24.8, 9.9], [119.3, 186.3, 9.9, 9.9], [156.5, 186.3, 24.8, 9.9],
  [198.7, 186.3, 27.3, 9.9], [250.7, 186.3, 9.9, 9.9], [330.1, 186.3, 9.9, 34.7],
  [67.3, 196.2, 9.9, 24.8], [171.4, 196.2, 9.9, 24.8], [198.7, 196.2, 9.9, 24.8],
  [49.9, 211.1, 17.4, 9.9], [119.3, 211.1, 9.9, 9.9], [181.3, 211.1, 17.4, 9.9],
  [250.7, 211.1, 9.9, 9.9], [305.3, 211.1, 24.8, 9.9],
]

export default function GenerationOverlay({
  open,
  title = 'جارٍ بناء موقعك',
  messages = DEFAULT_MESSAGES,
}: {
  open: boolean
  title?: string
  messages?: string[]
}) {
  const reduce = useReducedMotion()
  const [msgIndex, setMsgIndex] = useState(0)

  const brandRef = useRef<SVGGElement>(null)
  const blobsRef = useRef<SVGGElement>(null)
  const meltRef = useRef<SVGFEGaussianBlurElement>(null)
  const gooRef = useRef<SVGFEGaussianBlurElement>(null)

  // Cycle the status line.
  useEffect(() => {
    if (!open) { setMsgIndex(0); return }
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 2200)
    return () => clearInterval(id)
  }, [open, messages.length])

  // Lock body scroll while the overlay is up.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // The liquid loop. Runs only while open and not reduced-motion. Fully
  // cancellable: a flag stops the loop and any pending timer/frame is cleared.
  useEffect(() => {
    if (!open || reduce) return
    const brand = brandRef.current
    const blobs = blobsRef.current
    const melt = meltRef.current
    const goo = gooRef.current
    if (!brand || !blobs || !melt || !goo) return

    const BLOBS = Array.from(blobs.querySelectorAll<SVGRectElement>('.zbuild-b'))

    let alive = true
    let timer: number | undefined
    let raf: number | undefined
    let phaseToken = 0

    const wait = (ms: number) =>
      new Promise<void>((res) => { timer = window.setTimeout(res, ms) })

    const tween = (
      from: number, to: number, dur: number,
      fn: (v: number) => void, ease: (t: number) => number = (t) => t,
    ) =>
      new Promise<void>((res) => {
        const start = performance.now()
        const frame = (now: number) => {
          const t = Math.min((now - start) / dur, 1)
          fn(lerp(from, to, ease(t)))
          if (t < 1 && alive) raf = requestAnimationFrame(frame)
          else res()
        }
        raf = requestAnimationFrame(frame)
      })

    const applyBlob = (el: SVGRectElement, g: BlobGeom) => {
      el.setAttribute('x', g.x.toFixed(2))
      el.setAttribute('y', g.y.toFixed(2))
      el.setAttribute('width', Math.max(0, g.w).toFixed(2))
      el.setAttribute('height', Math.max(0, g.h).toFixed(2))
      el.setAttribute('rx', g.rx.toFixed(2))
    }
    const readBlob = (el: SVGRectElement): BlobGeom => ({
      x: +el.getAttribute('x')! || 0, y: +el.getAttribute('y')! || 0,
      w: +el.getAttribute('width')! || 0, h: +el.getAttribute('height')! || 0,
      rx: +el.getAttribute('rx')! || 0,
    })

    // seed everything immediately so the first frame isn't a flash.
    BLOBS.forEach((el) => applyBlob(el, { x: 190, y: 194, w: 0, h: 0, rx: 0 }))

    // Tween every droplet to the phase target with an organic per-droplet
    // stagger. A token guards against an earlier phase still running.
    const setPhase = (p: string) => {
      const target = PHASES[p]
      const fromGeom = BLOBS.map(readBlob)
      const dur = 1150
      const my = ++phaseToken
      const t0 = performance.now()
      const frame = (now: number) => {
        if (my !== phaseToken || !alive) return
        let done = true
        BLOBS.forEach((el, i) => {
          const t = Math.min(Math.max(now - t0 - STAGGER[i], 0) / dur, 1)
          if (t < 1) done = false
          const e = smooth(t), f = fromGeom[i], g = target[i]
          applyBlob(el, {
            x: lerp(f.x, g.x, e), y: lerp(f.y, g.y, e),
            w: lerp(f.w, g.w, e), h: lerp(f.h, g.h, e), rx: lerp(f.rx, g.rx, e),
          })
        })
        if (!done) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }

    // liquid amount 0..1 drives BOTH the letter-melt and metaball-fusion blur.
    const setLiquid = (a: number) => {
      melt.setAttribute('stdDeviation', (a * 5).toFixed(3))
      goo.setAttribute('stdDeviation', (a * 8).toFixed(3))
    }

    async function loop() {
      while (alive) {
        // 1. WORD — crisp, breathing.
        brand!.style.opacity = '1'
        setLiquid(0)
        setPhase('seed')
        brand!.classList.add('breathe')
        await wait(2200); if (!alive) return
        brand!.classList.remove('breathe')

        // 2. LIQUEFY — letters bleed; blobs swell into the same footprint.
        setPhase('4')
        await tween(0, 1, 1350, setLiquid, smooth); if (!alive) return
        await wait(260); if (!alive) return
        brand!.style.opacity = '0'
        await wait(360); if (!alive) return

        // 3. POOL → ball.
        setPhase('0'); await wait(1250); if (!alive) return
        // 4. TOWER.
        setPhase('1'); await wait(1600); if (!alive) return
        // 5. PAGE.
        setPhase('2'); await wait(1600); if (!alive) return
        // 6. ROWS.
        setPhase('3'); await wait(1450); if (!alive) return
        // 7. gather back to the ball.
        setPhase('0'); await wait(1150); if (!alive) return
        // 8. spread into the word footprint.
        setPhase('4'); await wait(1200); if (!alive) return

        // 9. RE-FORM — liquid word returns, droplets drain inward.
        setLiquid(1)
        brand!.style.opacity = '1'
        await wait(480); if (!alive) return
        setPhase('seed')
        await tween(1, 0, 1500, setLiquid, smooth); if (!alive) return

        brand!.classList.add('settle')
        await wait(1000); if (!alive) return
        brand!.classList.remove('settle')
      }
    }

    void loop()

    return () => {
      alive = false
      phaseToken++
      if (timer) clearTimeout(timer)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [open, reduce])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="zbuild fixed inset-0 z-[100] overflow-y-auto"
          style={{ background: 'var(--background)', color: 'var(--foreground)' }}
          role="status"
          aria-live="polite"
          aria-label={title}
        >
          <style>{ZBUILD_CSS}</style>
          {/* min-h-full ensures justify-center works correctly even when content
              overflows on small phones — without this the top is unreachable. */}
          <div className="flex min-h-full flex-col items-center justify-center gap-5 px-4 py-8 sm:gap-8">

          <div className="relative flex h-[260px] w-[260px] items-center justify-center sm:h-[340px] sm:w-[340px] lg:h-[380px] lg:w-[380px]">
            <svg viewBox="0 0 380 380" width="100%" height="100%" aria-hidden>
              <defs>
                {/* metaball goo over the whole group → text + blobs are one liquid */}
                <filter id="zgoo" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur ref={gooRef} in="SourceGraphic" stdDeviation="0" result="blur" />
                  <feColorMatrix
                    in="blur" mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
                    result="goo"
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
                {/* melt: blurs the letterforms so they round off into droplets */}
                <filter id="zmelt" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur ref={meltRef} in="SourceGraphic" stdDeviation="0" />
                </filter>
              </defs>

              <g filter="url(#zgoo)">
                {/* زينيا — kufigraph wordmark, melts under #zmelt like the blobs */}
                <g ref={brandRef} className="zbuild-brand" filter="url(#zmelt)">
                  {BRAND_RECTS.map(([x, y, w, h], i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} />
                  ))}
                </g>

                <g ref={blobsRef}>
                  <rect className="zbuild-b" />
                  <rect className="zbuild-b" />
                  <rect className="zbuild-b" />
                  <rect className="zbuild-b" />
                  <rect className="zbuild-b" />
                </g>
              </g>
            </svg>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
            <div className="relative h-6 w-full max-w-sm overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="text-sm text-muted"
                >
                  {reduce ? 'جارٍ بناء موقعك، لحظات…' : messages[msgIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Feedback-for-discount offer while they wait. */}
          <ReviewOffer />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Scoped CSS for the liquid loader. The wordmark and droplets share fill =
   currentColor so both pick up the overlay's foreground. Blob geometry is
   driven entirely in JS (see effect); CSS here only handles the wordmark's
   breathe/settle transforms. */
const ZBUILD_CSS = `
.zbuild-brand{
  fill: currentColor; transform-box: fill-box; transform-origin:center;
  will-change:transform;
}
.zbuild-brand.settle{ animation: zbuild-settle 1s cubic-bezier(.32,1.5,.5,1); }
.zbuild-brand.breathe{ animation: zbuild-breathe 4s ease-in-out infinite; }
@keyframes zbuild-settle{ 0%{transform:scale(.94)} 55%{transform:scale(1.035)} 100%{transform:scale(1)} }
@keyframes zbuild-breathe{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.018)} }

.zbuild-b{ fill: currentColor; }
`
