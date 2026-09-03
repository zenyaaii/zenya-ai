'use client'

/**
 * FlowingRibbon - a twisting 3D ribbon.
 *
 * Built from two references, and they teach different things.
 *
 * The Spline scene gives the OBJECT: a flat band following a sine curve while
 * rotating about its own axis, so it pinches edge-on at the twist points and
 * opens to a wide face between them, carrying a gradient across its own width
 * that the twist keeps flipping. That flip is what makes it read as a ribbon
 * and not a painted noodle.
 *
 * Stripe's hero gives the COMPOSITION, and it is the more disciplined of the
 * two: one broad lazy sweep rather than a repeating wave, anchored in a corner
 * and running off the edges of the frame, several translucent strands fanning
 * together instead of one band, and motion so slow you only notice it if you
 * stare. A busy wave reads as a screensaver. A single slow sweep reads as
 * expensive.
 *
 * So the curve here stays under one full period across the visible length. The
 * previous build stacked a 2.3x harmonic at 0.28 and a z swing at 0.85 of the
 * fundamental on top of a 1.6-crest wave, which compounded into something
 * restless. Those are now 1.9 at 0.09 and 0.5 at 0.5.
 *
 * three is imported statically. A dynamic import blanks the canvas in this
 * project (same trap as LiveUsersGlobe).
 *
 * All shading is analytic in the fragment shader, so the scene carries no
 * lights and no textures: one draw call per strand.
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  /** How many strands fan together. Stripe uses several; one reads thin. */
  strands?: number
  /** Full twists across the visible length. */
  twists?: number
  /** Wave crests across the visible length. Below 1 gives a single sweep. */
  waves?: number
  /** Band width in world units. */
  width?: number
  /** Wave height in world units. */
  amplitude?: number
  /** Animation speed. 0 freezes it. */
  speed?: number
  /** Degrees of rotation, for a corner-anchored diagonal sweep. */
  tilt?: number
  className?: string
}

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uWidth;
  uniform float uTwists;
  uniform float uWaves;
  uniform float uLength;
  uniform float uPhase;

  varying vec3 vNormal;
  varying vec3 vView;
  varying float vU;
  varying float vV;
  varying float vPhi;

  const float TAU = 6.28318530718;

  /* The centreline. One dominant sweep; the second harmonic is kept faint and
     the z swing shallow. Those two terms are what made the old build busy. */
  vec3 curve(float u, float t) {
    float x = (u - 0.5) * uLength;
    float y = sin(u * TAU * uWaves + t + uPhase) * uAmp
            + sin(u * TAU * uWaves * 1.9 + t * 0.55 + uPhase) * uAmp * 0.09;
    float z = sin(u * TAU * uWaves * 0.5 + t * 0.3 + uPhase) * uAmp * 0.5;
    return vec3(x, y, z);
  }

  void main() {
    float u = uv.x;
    float v = uv.y - 0.5;
    float t = uTime;

    /* Frame the curve: tangent by finite difference, then two perpendiculars. */
    float du = 0.0015;
    vec3 p0 = curve(u, t);
    vec3 p1 = curve(u + du, t);
    vec3 T = normalize(p1 - p0);

    vec3 ref = vec3(0.0, 0.0, 1.0);
    vec3 N0 = normalize(cross(T, ref));
    vec3 B0 = normalize(cross(T, N0));

    /* The twist: the band's width vector rotates around the tangent. */
    float phi = u * TAU * uTwists + t * 0.22 + uPhase;
    vec3 W = normalize(cos(phi) * N0 + sin(phi) * B0);

    /* Band normal is perpendicular to both the tangent and the width. */
    vec3 nrm = normalize(cross(T, W));

    vec3 pos = p0 + W * (v * uWidth);

    vNormal = normalize(normalMatrix * nrm);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vView = -mv.xyz;
    vU = u;
    vV = uv.y;
    vPhi = phi;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform vec3 uC4;
  uniform vec3 uC5;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vView;
  varying float vU;
  varying float vV;
  varying float vPhi;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);

    /* The band is one sheet seen from both sides, so flip the normal on back
       faces or the far side of every twist goes flat. */
    if (!gl_FrontFacing) N = -N;

    vec3 L = normalize(vec3(0.35, 0.75, 0.62));

    /* Two-sided lighting. A ribbon is a sheet, not a solid: if only the face
       toward the light is lit, every other face crushes to a dark slab and the
       airiness of both references is lost. */
    float lambert = abs(dot(N, L));
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);

    /* The gradient baked across the band's own width: one long edge pale, the
       other saturated. Because it is fixed to the material, the twist flips
       which edge you see, and the band reads two-tone with no per-face work. */
    float edge = smoothstep(0.0, 1.0, vV);

    float k = clamp(
      0.14 + edge * 0.34 + lambert * 0.32 + fres * 0.26 + sin(vPhi) * 0.05,
      0.0, 1.0);

    vec3 col = mix(uC1, uC2, smoothstep(0.05, 0.40, k));
    col = mix(col, uC3, smoothstep(0.36, 0.66, k));
    col = mix(col, uC4, smoothstep(0.60, 0.98, k));

    /* A breath of violet where the band grazes the eye: the colour shift that
       makes it read as iridescent rather than painted. */
    col = mix(col, uC5, smoothstep(0.55, 1.0, fres) * 0.45);

    vec3 H = normalize(L + V);
    float spec = pow(clamp(dot(N, H), 0.0, 1.0), 40.0);
    col += spec * 0.26;

    /* Dissolve at both ends so it enters and leaves the frame instead of
       stopping at a cut edge. Stripe's never shows a terminating edge. */
    float ends = smoothstep(0.0, 0.16, vU) * (1.0 - smoothstep(0.84, 1.0, vU));
    float alpha = (0.46 + fres * 0.28) * ends * uOpacity;

    gl_FragColor = vec4(col, alpha);
  }
`

/* One palette per strand. All of it sits in the brand's indigo-to-violet
   family from globals.css; the strands differ only in how far along that
   family they start, which is what lets them fan without turning into a
   rainbow. Order: away-face, core, bright, near-white, iridescent flush. */
const STRAND_PALETTES = [
  ['#7d84c4', '#5e6ad2', '#8b86ff', '#ecebff', '#b79bf0'],
  ['#8f8ad0', '#6f6ae0', '#9d8cff', '#f0edff', '#c9a6f5'],
  ['#a3a8dd', '#7f8ae8', '#a9a4ff', '#f5f4ff', '#d3c0f8'],
  ['#9aa0d8', '#6a76d8', '#948fff', '#efeeff', '#c0a8f2'],
]

export default function FlowingRibbon({
  strands = 3,
  twists = 1.5,
  waves = 0.85,
  width = 0.42,
  amplitude = 0.34,
  speed = 1,
  tilt = 0,
  className = '',
}: Props) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0, 3.4)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'

    const group = new THREE.Group()
    group.rotation.z = (tilt * Math.PI) / 180
    scene.add(group)

    const count = Math.max(1, Math.min(strands, STRAND_PALETTES.length))
    const disposables: Array<THREE.BufferGeometry | THREE.Material> = []
    const clocks: Array<{ value: number }> = []

    for (let i = 0; i < count; i++) {
      /* Segments along the length carry the wave and the twist, so they need
         to be dense. The width carries a colour gradient, so it needs more
         than a couple of spans. */
      const geometry = new THREE.PlaneGeometry(1, 1, 420, 10)
      const pal = STRAND_PALETTES[i]

      /* Each strand is detuned slightly. Identical strands moving in lockstep
         read as one thick band; the detune is what makes them fan. */
      const spread = count === 1 ? 0 : i / (count - 1) - 0.5

      const uTime = { value: 0 }
      const uniforms = {
        uTime,
        uAmp: { value: amplitude * (1 + spread * 0.3) },
        uWidth: { value: width * (1 - Math.abs(spread) * 0.28) },
        uTwists: { value: twists * (1 + spread * 0.22) },
        uWaves: { value: waves * (1 + spread * 0.16) },
        uLength: { value: 6.4 },
        uPhase: { value: i * 0.55 },
        uOpacity: { value: i === 0 ? 1 : 0.66 },
        uC1: { value: new THREE.Color(pal[0]) },
        uC2: { value: new THREE.Color(pal[1]) },
        uC3: { value: new THREE.Color(pal[2]) },
        uC4: { value: new THREE.Color(pal[3]) },
        uC5: { value: new THREE.Color(pal[4]) },
      }
      clocks.push(uTime)

      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.y = spread * 0.16
      mesh.position.z = -i * 0.05
      group.add(mesh)
      disposables.push(geometry, material)
    }

    const resize = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    /* Do not burn frames while the ribbon is off screen. */
    let onScreen = true
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting
      },
      { rootMargin: '120px' },
    )
    io.observe(el)

    let raf = 0
    const clock = new THREE.Clock()

    const setTime = (t: number) => {
      for (const c of clocks) c.value = t
    }

    if (reduce) {
      /* One frame, held. The shape is the point; the travel is not. */
      setTime(1.2)
      renderer.render(scene, camera)
    } else {
      const tick = () => {
        raf = requestAnimationFrame(tick)
        if (!onScreen) return
        /* Slow. Stripe's hero barely moves, and that restraint is most of why
           it reads as expensive rather than as a screensaver. */
        setTime(clock.getElapsedTime() * 0.22 * speed)
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      for (const d of disposables) d.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [strands, twists, waves, width, amplitude, speed, tilt])

  return (
    <div ref={host} aria-hidden className={`pointer-events-none ${className}`} />
  )
}
