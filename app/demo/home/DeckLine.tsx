"use client"

/**
 * DeckLine - the line, one slice per panel.
 *
 * Five styles, switchable on the real page with ?line=, the same way ?accent=
 * and ?ground= already work here. Chosen by looking, not in the abstract.
 *
 * WHERE IT SITS. Each .zn-panel carries transform: translateZ(0), so it is its
 * own stacking context. That makes z-index:-1 on an absolutely positioned child
 * land in exactly one place in the paint order: above the panel's own
 * background, below every one of its contents. So the line goes behind the
 * screen's copy without a single change to any panel's markup. Nothing here
 * paints over type.
 *
 * WHY ONE CANVAS PER PANEL. The deck already translates the track, so a slice
 * pinned inside each panel travels for free and stays welded to its screen. The
 * alternative, one fixed canvas panned by the deck value, has to re-derive the
 * deck's own easing curve and drifts against it during the 1020ms move. Five
 * contexts is well inside the browser's limit and only the live one runs a
 * frame loop; the rest hold a single painted frame.
 *
 * THE COLOUR. Nothing invented. Each panel hands the line the colour it already
 * owns: the primary on the two paper screens, ادر's violet, انشر's green,
 * الختام's brushed gold. That is the whole point of the exercise - the line is
 * how the screens say they belong to one site.
 */

import { useEffect, useRef } from "react"

export type LineStyle = "edge" | "band" | "thread" | "glow" | "spectrum"

export const LINE_STYLES: LineStyle[] = [
  "edge",
  "band",
  "thread",
  "glow",
  "spectrum",
]

const STYLE_INDEX: Record<LineStyle, number> = {
  edge: 0,
  band: 1,
  thread: 2,
  glow: 3,
  spectrum: 4,
}

/* Read off the panels themselves. Screens one and two sit on bare paper and own
   no colour, so they take the brand primary and its brighter step. */
const ACCENT: Array<[number, number, number]> = [
  [0x5e, 0x6a, 0xd2],
  [0x71, 0x70, 0xff],
  [0x8b, 0x86, 0xff],
  [0x4a, 0xde, 0x80],
  [0xc8, 0xa9, 0x6a],
]

/* How dark the ground under each panel is. A line that reads on paper vanishes
   on obsidian, so it lifts. */
const DARK = [0, 0, 1, 1, 1]

/* ONE clock for all five slices. Per-instance epochs put neighbouring panels at
   different times, and since the band positions are a function of t, the two
   sides of a seam then never line up no matter how right the geometry is. */
let EPOCH = 0
function sharedTime() {
  if (!EPOCH) EPOCH = performance.now()
  return ((performance.now() - EPOCH) / 1000) * 0.16
}

const VS = "attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }"

const FS = [
  "precision highp float;",
  "uniform vec2  uRes;",
  "uniform float uTime;",
  "uniform float uDeck;",
  "uniform float uStyle;",
  "uniform vec3  uAcc;",
  "uniform vec3  uAccP;",
  "uniform vec3  uAccN;",
  "uniform float uDark;",
  "uniform float uDarkP;",
  "uniform float uDarkN;",

  "vec2 rot(vec2 p, float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c)*p; }",

  /* Six shades off the one accent. Monochrome per panel is what makes the line
     read as belonging to the screen rather than sitting on top of it. */
  "vec3 shade(vec3 a, float k){",
  "  vec3 dark = a * 0.72;",
  "  vec3 lite = mix(a, vec3(1.0), 0.62);",
  "  return k < 0.5 ? mix(dark, a, k * 2.0) : mix(a, lite, (k - 0.5) * 2.0);",
  "}",

  "void band(inout vec3 acc, inout float al, vec2 p, float fan,",
  "          float off, float amp, float freq, float sp, float ph, float th, float k, vec3 A, float t){",
  "  float y = off*fan + amp*sin(freq*p.x + t*sp + ph) + 0.05*sin(2.3*p.x + t*0.21 + ph);",
  "  float m = smoothstep(th*fan, 0.0, abs(p.y - y));",
  "  m *= m;",
  "  acc += shade(A, k) * m;",
  "  al  += m;",
  "}",

  "void main(){",
  "  vec2 uv = gl_FragCoord.xy / uRes;",
  "  vec2 p  = uv - 0.5;",
  "  p.x *= uRes.x / uRes.y;",
  "  float t = uTime;",
  "  float S = uStyle;",
  "  vec3 col = vec3(0.0);",
  "  float alpha = 0.0;",

  /* Colour blends toward the neighbouring screen as you approach the seam, so
     the hue crosses the boundary instead of snapping. At the very top this
     panel reads mix(mine, above, 0.5) and the panel above reads
     mix(above, mine, 0.5) at its foot: the same value, so the join is
     seamless while each screen still owns its colour through its middle. */
  "  float f = -p.y;",
  "  vec3  A = f < 0.0 ? mix(uAcc,  uAccP,  -f) : mix(uAcc,  uAccN,  f);",
  "  float D = f < 0.0 ? mix(uDark, uDarkP, -f) : mix(uDark, uDarkN, f);",

  /* 0 - the edge: the corner fan, in the panel's colour. */
  "  if (S < 0.5) {",
  "    vec2 q = rot(p, -0.40);",
  "    float fan = 0.34 + 0.95 * smoothstep(-1.15, 0.95, q.x);",
  "    vec3 a = vec3(0.0); float al = 0.0;",
  "    band(a, al, q, fan, -0.40, 0.070, 1.10, 0.150, 0.0, 0.150, 0.05, A, t);",
  "    band(a, al, q, fan, -0.20, 0.085, 0.95, 0.185, 1.1, 0.170, 0.30, A, t);",
  "    band(a, al, q, fan,  0.00, 0.075, 1.25, 0.135, 2.3, 0.160, 0.55, A, t);",
  "    band(a, al, q, fan,  0.20, 0.090, 1.05, 0.205, 3.4, 0.175, 0.75, A, t);",
  "    band(a, al, q, fan,  0.42, 0.095, 0.90, 0.125, 5.7, 0.185, 0.95, A, t);",
  "    col = a / max(al, 0.0001);",
  "    col = mix(col, vec3(1.0), smoothstep(1.2, 2.6, al) * 0.40);",
  "    alpha = clamp(al, 0.0, 1.0) * smoothstep(-1.45, -0.35, q.x);",
  "  }",

  /* 1 - the band: a hard-edged diagonal, its crossing point walking down the
     deck so each screen is cut at a different height. */
  "  else if (S < 1.5) {",
  "    vec2 q = rot(p, -0.26);",
  "    float centre = 0.40 - (uDeck / 4.0) * 0.86;",
  "    float d = q.y - centre;",
  "    float half_ = 0.11;",
  "    float inside = step(abs(d), half_);",
  "    float g = clamp((d + half_) / (2.0 * half_), 0.0, 1.0);",
  "    col = shade(A, g);",
  "    col = mix(col, vec3(1.0), smoothstep(0.45, 1.0, g) * 0.22);",
  "    alpha = inside * 0.92;",
  "  }",

  /* 2 - the thread: one fine luminous line down the gutter. The quietest. */
  "  else if (S < 2.5) {",
  "    float ar = uRes.x / uRes.y;",
  "    float xg = -ar * 0.5 + 0.16;",
  "    float wob = 0.055 * sin(p.y * 3.4 + t * 0.5) + 0.02 * sin(p.y * 7.1 - t * 0.31);",
  "    float d = abs(p.x - (xg + wob));",
  "    float core = smoothstep(0.007, 0.0, d);",
  "    float halo = smoothstep(0.075, 0.0, d) * 0.42;",
  "    float head = smoothstep(0.30, 0.0, abs(p.y - (0.55 - fract(t * 0.09) * 1.1)));",
  "    col = mix(shade(A, 0.45), vec3(1.0), core * 0.55 + head * 0.25);",
  "    alpha = clamp(core + halo * (0.45 + head * 0.75), 0.0, 1.0);",
  "  }",

  /* 3 - the glow: no line at all, a bloom of the screen's colour in the
     corner. The one that can never compete with type. */
  "  else if (S < 3.5) {",
  "    float ar = uRes.x / uRes.y;",
  "    vec2 c1 = vec2(-ar * 0.42, 0.34);",
  "    vec2 c2 = vec2(-ar * 0.20, 0.05);",
  "    float g1 = smoothstep(0.85, 0.0, length((p - c1) * vec2(0.62, 1.0)));",
  "    float g2 = smoothstep(0.62, 0.0, length((p - c2) * vec2(0.70, 1.0)));",
  "    g1 *= 0.8 + 0.2 * sin(t * 0.5);",
  "    g2 *= 0.8 + 0.2 * sin(t * 0.4 + 1.7);",
  "    float g = clamp(g1 + g2 * 0.8, 0.0, 1.0);",
  "    col = shade(A, 0.30 + g * 0.5);",
  "    alpha = g * 0.55;",
  "  }",

  /* 4 - the spectrum: one ribbon the length of the whole deck. Each panel
     renders its own slice, so the track's transform carries it and the five
     screens read as one object seen a screen at a time. */
  "  else {",
  /* Along the DECK axis: q.x walks the length of all five screens, q.y is
     horizontal position on screen.

     Note the MINUS on p.y. gl_FragCoord counts upward, the deck stacks
     downward. Adding p.y makes the ribbon run up inside a panel while running
     down between panels, so it reverses at every seam and the five screens
     read as five different decorations. Subtracting makes panel n cover
     [n-2.5, n-1.5] top to bottom and panel n+1 pick up exactly where it left
     off. This one sign is the difference between one line and five. */
  "    vec2 q = vec2((uDeck - 2.0) - p.y, p.x);",
  "    q = rot(q, 0.10);",
  "    float fan = 0.55 + 0.45 * smoothstep(-2.6, 2.6, q.x);",
  "    vec3 a = vec3(0.0); float al = 0.0;",
  "    band(a, al, q, fan, -0.40, 0.20, 0.55, 0.10, 0.0, 0.115, 0.10, A, t);",
  "    band(a, al, q, fan, -0.14, 0.22, 0.48, 0.13, 1.7, 0.130, 0.42, A, t);",
  "    band(a, al, q, fan,  0.16, 0.21, 0.60, 0.09, 3.3, 0.120, 0.72, A, t);",
  "    band(a, al, q, fan,  0.44, 0.23, 0.44, 0.12, 4.9, 0.135, 0.95, A, t);",
  "    col = a / max(al, 0.0001);",
  "    col = mix(col, vec3(1.0), smoothstep(1.15, 2.5, al) * 0.38);",
  "    alpha = clamp(al, 0.0, 1.0) * 0.86;",
  "  }",

  "  col = mix(col, mix(col, vec3(1.0), 0.30), D);",
  /* It sits behind the screen's copy, so it stays an accent. The first pass ran
     at 0.72/0.95 and swallowed the panels whole; halving thickness AND alpha
     AND this lift together then compounded down to a peak of 38/255, which is
     invisible. These land it around 100/255 at the brightest point. */
  "  alpha *= mix(0.62, 0.80, D);",

  "  gl_FragColor = vec4(col, alpha);",
  "}",
].join("\n")

export default function DeckLine({
  panel,
  style,
  deck,
}: {
  panel: number
  style: LineStyle
  /* Which screen the deck is on. A slice draws when it is the live screen or
     next to it, because during the move two panels are on screen at once and
     the seam between them is the whole thing being judged. */
  deck: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const deckRef = useRef(deck)
  deckRef.current = deck

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    })
    if (!gl) return

    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)
      if (!s) return null
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null
      return s
    }

    const vs = mk(gl.VERTEX_SHADER, VS)
    const fs = mk(gl.FRAGMENT_SHADER, FS)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const aPos = gl.getAttribLocation(prog, "aPos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const u = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = u("uRes")
    const uTime = u("uTime")
    const uDeck = u("uDeck")
    const uStyle = u("uStyle")
    const uAcc = u("uAcc")
    const uAccP = u("uAccP")
    const uAccN = u("uAccN")
    const uDark = u("uDark")
    const uDarkP = u("uDarkP")
    const uDarkN = u("uDarkN")

    const at = (i: number) => ACCENT[Math.max(0, Math.min(ACCENT.length - 1, i))]
    const dk = (i: number) => DARK[Math.max(0, Math.min(DARK.length - 1, i))]
    const set3 = (loc: WebGLUniformLocation | null, c: [number, number, number]) =>
      gl.uniform3f(loc, c[0] / 255, c[1] / 255, c[2] / 255)

    /* The ends clamp to themselves, so the first and last screens simply hold
       their own colour rather than blending toward nothing. */
    set3(uAcc, at(panel))
    set3(uAccP, at(panel - 1))
    set3(uAccN, at(panel + 1))
    gl.uniform1f(uDark, dk(panel))
    gl.uniform1f(uDarkP, dk(panel - 1))
    gl.uniform1f(uDarkN, dk(panel + 1))
    gl.uniform1f(uDeck, panel)
    gl.uniform1f(uStyle, STYLE_INDEX[style])

    const resize = () => {
      /* Cap at 1.5: this is a soft, low-frequency field. Nobody can see the
         difference at 2x and the fill cost is nearly double. */
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0

    const paint = (t: number) => {
      gl.uniform1f(uTime, t)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    if (reduce) {
      paint(6)
    } else {
      const tick = () => {
        raf = requestAnimationFrame(tick)
        /* Two panels at most are ever on screen, so the far ones keep their
           last frame instead of burning fill on a screen nobody can see. */
        if (Math.abs(panel - deckRef.current) > 1) return
        paint(sharedTime())
      }
      /* One frame immediately so a slice is never blank when it arrives. */
      paint(sharedTime())
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [panel, style])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="zn-line"
      /* z-index -1 inside the panel's own stacking context: above the panel's
         ground, below every one of its contents. */
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  )
}
