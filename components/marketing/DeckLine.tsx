'use client'

/**
 * DeckLine - one continuous field of light for the whole /demo/home deck.
 *
 * Why a single canvas, and why this replaces a per-panel one:
 * the previous version mounted one <canvas class="zn-line"> per panel, each
 * with its own GL context sized to its own panel, and tried to stitch the
 * panels back together inside the shader with `p.y + (uDeck - 2.0)`. That
 * stitch runs the wrong way. gl_FragCoord.y grows upward while the panel
 * index grows downward, so rather than tiling into one field, every boundary
 * jumped the pattern by two panel heights. That is the break you can see
 * between screens, and no amount of tuning the bands hides it.
 *
 * So the fix is structural rather than arithmetic. There is one canvas, fixed
 * to the viewport, and the along-page axis is the document's own scroll
 * position measured in panels. One field, sampled continuously, leaves no
 * boundary for the beams to break across.
 *
 * The field tracks the page 1:1, so it reads as light lying on the document
 * rather than a parallax layer moving against it.
 *
 * Layering contract: the canvas paints at z-1. Panel backgrounds sit below it
 * at z-auto, panel content above it at z-10.
 */

import { useEffect, useRef } from 'react'

export type DeckStop = {
  /** Beam colour for this panel, sRGB 0-255. */
  accent: [number, number, number]
  /** 1 where the panel sits on a dark ground, 0 on paper. */
  dark: number
}

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }`

/* The band/shade/fan model is kept as it was. Only the coordinate the field
   is sampled in has changed, because that is where the fault was. */
const FRAG = `precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uScroll;
uniform vec3  uAcc;
uniform float uDark;

vec2 rot(vec2 p, float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c)*p; }

vec3 shade(vec3 a, float k){
  vec3 dark = a * 0.72;
  vec3 lite = mix(a, vec3(1.0), 0.62);
  return k < 0.5 ? mix(dark, a, k * 2.0) : mix(a, lite, (k - 0.5) * 2.0);
}

void band(inout vec3 acc, inout float al, vec2 p, float fan,
          float off, float amp, float freq, float sp, float ph, float th, float k, vec3 A, float t){
  float y = off*fan + amp*sin(freq*p.x + t*sp + ph) + 0.05*sin(2.3*p.x + t*0.21 + ph);
  float m = smoothstep(th*fan, 0.0, abs(p.y - y));
  m *= m;
  acc += shade(A, k) * m;
  al  += m;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p  = uv - 0.5;
  p.x *= uRes.x / uRes.y;
  float t = uTime;

  /* The along-page axis belongs to the document, not to a panel. uScroll
     counts panels and is continuous, so this coordinate never restarts.
     Centring on +2.0 spreads a five panel deck across the fan's useful
     range, which is what the old (uDeck - 2.0) term was reaching for. */
  float gy = (uv.y - 0.5) - uScroll;
  vec2 q = rot(vec2(gy + 2.0, p.x), 0.10);

  float fan = 0.55 + 0.45 * smoothstep(-2.6, 2.6, q.x);
  vec3 a = vec3(0.0); float al = 0.0;
  band(a, al, q, fan, -0.34, 0.24, 0.55, 0.10, 0.0, 0.165, 0.10, uAcc, t);
  band(a, al, q, fan, -0.10, 0.27, 0.48, 0.13, 1.7, 0.185, 0.42, uAcc, t);
  band(a, al, q, fan,  0.16, 0.25, 0.60, 0.09, 3.3, 0.175, 0.72, uAcc, t);
  band(a, al, q, fan,  0.40, 0.28, 0.44, 0.12, 4.9, 0.195, 0.95, uAcc, t);

  vec3 col = a / max(al, 0.0001);
  col = mix(col, vec3(1.0), smoothstep(1.15, 2.5, al) * 0.38);
  float alpha = clamp(al, 0.0, 1.0) * 0.95;

  col = mix(col, mix(col, vec3(1.0), 0.30), uDark);
  alpha *= mix(0.72, 0.95, uDark);
  gl_FragColor = vec4(col, alpha);
}`

type Props = {
  /** One entry per panel, in document order. */
  stops: DeckStop[]
}

export default function DeckLine({ stops }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const stopsRef = useRef(stops)
  stopsRef.current = stops

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
    if (!gl) return

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)
      if (!sh) return null
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null
    }

    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const u = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = u('uRes')
    const uTime = u('uTime')
    const uScroll = u('uScroll')
    const uAcc = u('uAcc')
    const uDark = u('uDark')

    /* Panel height is measured off a real panel rather than innerHeight: the
       panels are sized in svh, and the two disagree while a mobile URL bar is
       retracting. Re-measured on resize, not per frame. */
    let panelH = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      const measured = document.querySelector('[data-panel]')?.getBoundingClientRect().height ?? 0
      panelH = measured > 1 ? measured : window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const smooth = (f: number) => f * f * (3 - 2 * f)

    let raf = 0
    let lastScroll = Number.NaN
    const start = performance.now()

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)

      const list = stopsRef.current
      if (!list.length) return
      const max = list.length - 1
      const s = window.scrollY / (panelH || window.innerHeight)

      /* Reduced motion holds one frame of the drift. The field still follows
         the page, which is position rather than animation, and repainting is
         skipped entirely while nothing has moved. */
      if (still.matches && Math.abs(s - lastScroll) < 0.0005) return
      lastScroll = s

      const c = Math.max(0, Math.min(max, s))
      const i = Math.min(Math.floor(c), Math.max(0, max - 1))
      const f = smooth(Math.max(0, Math.min(1, c - i)))
      const a = list[i] ?? list[0]
      const b = list[i + 1] ?? a

      gl.uniform1f(uTime, still.matches ? 6 : ((now - start) / 1000) * 0.16)
      gl.uniform1f(uScroll, c)
      gl.uniform3f(
        uAcc,
        (a.accent[0] + (b.accent[0] - a.accent[0]) * f) / 255,
        (a.accent[1] + (b.accent[1] - a.accent[1]) * f) / 255,
        (a.accent[2] + (b.accent[2] - a.accent[2]) * f) / 255,
      )
      gl.uniform1f(uDark, a.dark + (b.dark - a.dark) * f)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(draw)

    /* Without preventDefault a lost context never restores and the canvas
       stays blank for the rest of the session. */
    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  )
}
