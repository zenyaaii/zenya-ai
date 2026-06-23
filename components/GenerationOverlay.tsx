'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

/**
 * GenerationOverlay — the full-screen "building" animation shown while a theme
 * is generated. The brand word زينيا melts into liquid droplets that pool into
 * a ball, then build themselves up through a series of shapes (tower → page
 * layout → content rows) and re-form back into the word — a literal "we're
 * assembling your site" metaphor. Text and droplets live under one shared goo
 * filter, so the word and the blobs are the SAME liquid.
 *
 * Ported from the Cloud-Design "Build Sequence Loader". Self-contained and
 * theme-agnostic so it can front any generator (wellness wizard, /build,
 * future templates). Status copy cycles underneath so the wait feels alive.
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
// smootherstep — zero velocity AND acceleration at both ends = silky.
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

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

  const brandRef = useRef<SVGTextElement>(null)
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

    let alive = true
    let timer: number | undefined
    let raf: number | undefined

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

    const setPhase = (p: string) =>
      blobs.setAttribute('class', p === 'seed' ? 'zbuild-blobs zbuild-seed' : `zbuild-blobs zbuild-p${p}`)

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
          className="zbuild fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10"
          style={{ background: 'var(--background)', color: 'var(--foreground)' }}
          role="status"
          aria-live="polite"
          aria-label={title}
        >
          <style>{ZBUILD_CSS}</style>

          <div className="relative flex h-[340px] w-[340px] items-center justify-center sm:h-[380px] sm:w-[380px]">
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
                <text
                  ref={brandRef}
                  className="zbuild-brand"
                  x="190" y="210"
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="104" direction="rtl"
                  filter="url(#zmelt)"
                  style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
                >
                  زينيا
                </text>

                <g ref={blobsRef} className="zbuild-blobs zbuild-seed">
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Scoped CSS for the liquid loader. Blob position/size/radius are animated via
   CSS presentation attributes (x/y/width/height/rx) so the metaball morph is
   pure CSS transitions; the JS only swaps the phase class + drives the blur. */
const ZBUILD_CSS = `
.zbuild-brand{
  fill: currentColor; font-weight:900; letter-spacing:.01em;
  transform-box: fill-box; transform-origin:center; will-change:transform;
}
.zbuild-brand.settle{ animation: zbuild-settle 1s cubic-bezier(.32,1.5,.5,1); }
.zbuild-brand.breathe{ animation: zbuild-breathe 4s ease-in-out infinite; }
@keyframes zbuild-settle{ 0%{transform:scale(.94)} 55%{transform:scale(1.035)} 100%{transform:scale(1)} }
@keyframes zbuild-breathe{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.018)} }

.zbuild-b{
  fill: currentColor;
  transition:
    x 1.3s cubic-bezier(.42,.02,.18,1),
    y 1.3s cubic-bezier(.42,.02,.18,1),
    width 1.3s cubic-bezier(.42,.02,.18,1),
    height 1.3s cubic-bezier(.42,.02,.18,1),
    rx 1.1s ease-in-out;
}
.zbuild-b:nth-child(1){ transition-delay:0s }
.zbuild-b:nth-child(2){ transition-delay:.05s }
.zbuild-b:nth-child(3){ transition-delay:.02s }
.zbuild-b:nth-child(4){ transition-delay:.07s }
.zbuild-b:nth-child(5){ transition-delay:.03s }

.zbuild-seed .zbuild-b{ x:190px; y:194px; width:0; height:0; rx:0; }

.zbuild-p0 .zbuild-b{ rx:99px }
.zbuild-p0 .zbuild-b:nth-child(1){ x:158px; y:155px; width:56px; height:56px }
.zbuild-p0 .zbuild-b:nth-child(2){ x:184px; y:168px; width:46px; height:46px }
.zbuild-p0 .zbuild-b:nth-child(3){ x:150px; y:176px; width:50px; height:50px }
.zbuild-p0 .zbuild-b:nth-child(4){ x:186px; y:188px; width:46px; height:46px }
.zbuild-p0 .zbuild-b:nth-child(5){ x:167px; y:183px; width:48px; height:48px }

.zbuild-p1 .zbuild-b{ rx:14px }
.zbuild-p1 .zbuild-b:nth-child(1){ x:138px; y:270px; width:104px; height:26px }
.zbuild-p1 .zbuild-b:nth-child(2){ x:150px; y:238px; width:80px;  height:26px }
.zbuild-p1 .zbuild-b:nth-child(3){ x:163px; y:206px; width:54px;  height:26px }
.zbuild-p1 .zbuild-b:nth-child(4){ x:172px; y:174px; width:36px;  height:26px }
.zbuild-p1 .zbuild-b:nth-child(5){ x:178px; y:142px; width:24px;  height:26px }

.zbuild-p2 .zbuild-b{ rx:10px }
.zbuild-p2 .zbuild-b:nth-child(1){ x:100px; y:94px;  width:180px; height:26px }
.zbuild-p2 .zbuild-b:nth-child(2){ x:100px; y:132px; width:180px; height:62px }
.zbuild-p2 .zbuild-b:nth-child(3){ x:100px; y:206px; width:84px;  height:52px }
.zbuild-p2 .zbuild-b:nth-child(4){ x:196px; y:206px; width:84px;  height:52px }
.zbuild-p2 .zbuild-b:nth-child(5){ x:100px; y:270px; width:72px;  height:22px }

.zbuild-p3 .zbuild-b{ rx:10px }
.zbuild-p3 .zbuild-b:nth-child(1){ x:96px; y:108px; width:188px; height:20px }
.zbuild-p3 .zbuild-b:nth-child(2){ x:96px; y:140px; width:188px; height:20px }
.zbuild-p3 .zbuild-b:nth-child(3){ x:96px; y:172px; width:144px; height:20px }
.zbuild-p3 .zbuild-b:nth-child(4){ x:96px; y:204px; width:188px; height:20px }
.zbuild-p3 .zbuild-b:nth-child(5){ x:96px; y:236px; width:108px; height:20px }

.zbuild-p4 .zbuild-b{ rx:99px }
.zbuild-p4 .zbuild-b:nth-child(1){ x:246px; y:164px; width:74px; height:74px }
.zbuild-p4 .zbuild-b:nth-child(2){ x:200px; y:158px; width:82px; height:82px }
.zbuild-p4 .zbuild-b:nth-child(3){ x:150px; y:162px; width:80px; height:80px }
.zbuild-p4 .zbuild-b:nth-child(4){ x:102px; y:158px; width:82px; height:82px }
.zbuild-p4 .zbuild-b:nth-child(5){ x:58px;  y:164px; width:74px; height:74px }

@media (prefers-reduced-motion: reduce){ .zbuild-b{ transition:none } }
`
