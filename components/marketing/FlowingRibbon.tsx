'use client'

/**
 * FlowingRibbon - a twisting 3D ribbon, rebuilt from the Spline reference.
 *
 * The reference is a flat band that follows a travelling sine curve while
 * rotating about its own axis, so it pinches to an edge-on line at the twist
 * points and opens to a wide face between them. That geometry, plus an
 * iridescent material read off the surface normal, is the whole effect.
 *
 * Rebuilt here in three.js rather than embedded as an iframe so that:
 *   - the palette is ours (indigo to violet to periwinkle, from globals.css)
 *   - it can be told where the reader is (see `progress`)
 *   - it is ~0 network cost on top of the three we already ship
 *
 * three is imported statically. A dynamic import blanks the canvas in this
 * project (same trap as LiveUsersGlobe).
 *
 * All shading is analytic in the fragment shader, so the scene carries no
 * lights and no textures: one mesh, one draw call.
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  /** Ribbon travels along its length. 'vertical' rotates the whole scene. */
  orientation?: 'horizontal' | 'vertical'
  /** How many full twists across the visible length. */
  twists?: number
  /** How many wave crests across the visible length. */
  waves?: number
  /** Band width in world units. */
  width?: number
  /** Wave height in world units. */
  amplitude?: number
  /** Animation speed multiplier. 0 freezes it. */
  speed?: number
  className?: string
}

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uWidth;
  uniform float uTwists;
  uniform float uWaves;
  uniform float uLength;

  varying vec3 vNormal;
  varying vec3 vView;
  varying float vU;
  varying float vV;
  varying float vPhi;

  const float TAU = 6.28318530718;

  /* The centreline. Two harmonics so the wave is not a plain sine, plus a
     shallower one in z so the band swings toward and away from the camera. */
  vec3 curve(float u, float t) {
    float x = (u - 0.5) * uLength;
    float y = sin(u * TAU * uWaves + t) * uAmp
            + sin(u * TAU * uWaves * 2.3 + t * 0.7) * uAmp * 0.28;
    float z = sin(u * TAU * uWaves * 0.6 + t * 0.45) * uAmp * 0.85;
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

    /* The twist. This is the part that makes it read as a ribbon rather than
       a tube: the band's width vector rotates around the tangent. */
    float phi = u * TAU * uTwists + t * 0.35;
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
       airiness of the reference is lost. abs() lights both faces. */
    float lambert = abs(dot(N, L));
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);

    /* The gradient baked across the band's own width: one long edge pale, the
       other saturated. This is the trait that carries the reference. Because
       it is fixed to the material, the twist flips which edge you are seeing,
       and the band reads two-tone without any per-face colouring. */
    float edge = smoothstep(0.0, 1.0, vV);

    /* Iridescence: walk the palette by facing angle rather than by position,
       which is what makes the colour shift as the band turns. The constant
       term is the ambient lift that keeps the darkest face a muted indigo
       instead of a black-blue. */
    float k = clamp(
      0.14 + edge * 0.34 + lambert * 0.32 + fres * 0.26 + sin(vPhi) * 0.05,
      0.0, 1.0);

    vec3 col = mix(uC1, uC2, smoothstep(0.05, 0.40, k));
    col = mix(col, uC3, smoothstep(0.36, 0.66, k));
    col = mix(col, uC4, smoothstep(0.60, 0.98, k));

    /* A breath of violet where the band grazes the eye. This is the colour
       shift that makes it read as iridescent rather than painted. */
    col = mix(col, uC5, smoothstep(0.55, 1.0, fres) * 0.45);

    vec3 H = normalize(L + V);
    float spec = pow(clamp(dot(N, H), 0.0, 1.0), 40.0);
    col += spec * 0.28;

    /* Dissolve at both ends so it enters and leaves the frame instead of
       stopping at a cut edge. */
    float ends = smoothstep(0.0, 0.13, vU) * (1.0 - smoothstep(0.87, 1.0, vU));
    float alpha = (0.70 + fres * 0.30) * ends;

    gl_FragColor = vec4(col, alpha);
  }
`

export default function FlowingRibbon({
  orientation = 'horizontal',
  twists = 2.4,
  waves = 1.6,
  width = 0.40,
  amplitude = 0.42,
  speed = 1,
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

    /* Long and thin: segments along the length carry the wave and the twist,
       so they need to be dense. The width now carries a colour gradient too,
       so it needs more than a couple of spans. */
    const geometry = new THREE.PlaneGeometry(1, 1, 520, 12)

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: amplitude },
      uWidth: { value: width },
      uTwists: { value: twists },
      uWaves: { value: waves },
      uLength: { value: 6.4 },
      /* Built out from globals.css --primary / --primary-400 / --primary-300.
         uC1 is a muted indigo rather than a dark one: in the reference the
         face turned away from the light is still light. uC4 is the near-white
         the band goes at grazing angles, uC5 the violet it flushes with. */
      uC1: { value: new THREE.Color('#7d84c4') },
      uC2: { value: new THREE.Color('#5e6ad2') },
      uC3: { value: new THREE.Color('#8b86ff') },
      uC4: { value: new THREE.Color('#ecebff') },
      uC5: { value: new THREE.Color('#b79bf0') },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    const mesh = new THREE.Mesh(geometry, material)
    if (orientation === 'vertical') mesh.rotation.z = Math.PI / 2
    scene.add(mesh)

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

    if (reduce) {
      /* One frame, held. The shape is the point; the travel is not. */
      uniforms.uTime.value = 1.2
      renderer.render(scene, camera)
    } else {
      const tick = () => {
        raf = requestAnimationFrame(tick)
        if (!onScreen) return
        uniforms.uTime.value = clock.getElapsedTime() * 0.55 * speed
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [orientation, twists, waves, width, amplitude, speed])

  return (
    <div
      ref={host}
      aria-hidden
      className={`pointer-events-none ${className}`}
    />
  )
}
