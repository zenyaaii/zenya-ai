'use client'

/**
 * LiveUsersGlobe — the interactive dot-globe that sits at the very bottom of the
 * marketing homepage and tucks ~40% under the footer, so the planet reads as
 * rising out of it.
 *
 * Land is a cloud of indigo dots; every country with real recent visitors to a
 * Zenya-built site gets one small orange "live" dot. All data comes from
 * /api/live-users (country-level counts only — see that route for the privacy
 * rationale). Nothing here is fabricated: no visitors → an honest empty state.
 *
 * Three.js, d3-geo and topojson are dynamically imported inside the effect so
 * they are client-only and code-split out of the initial bundle.
 */

import { useEffect, useRef, useState } from 'react'

type Country = { code: string; count: number; lat: number; lng: number; ar: string }
type Live = { active_now: number; window_min: number; countries: Country[] }

export default function LiveUsersGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  // setMarkers is created inside the three.js effect and called when data arrives.
  const setMarkersRef = useRef<((c: Country[]) => void) | null>(null)

  const [data, setData] = useState<Live | null>(null)

  // ── Poll the real live-users feed ──
  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const r = await fetch('/api/live-users', { cache: 'no-store' })
        if (!r.ok) return
        const j: Live = await r.json()
        if (stop) return
        setData(j)
        setMarkersRef.current?.(j.countries || [])
      } catch {
        /* silent — the globe just keeps spinning */
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  // ── Build the globe (once) ──
  useEffect(() => {
    const canvas = canvasRef.current
    const holder = holderRef.current
    const stage = stageRef.current
    const tip = tipRef.current
    if (!canvas || !holder || !stage || !tip) return

    let disposed = false
    let raf = 0
    let ro: ResizeObserver | null = null
    let renderer: any = null
    const cleanups: Array<() => void> = []

    ;(async () => {
      const THREE = await import('three')
      if (disposed) return

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
      let camDist = 4.9, baseDist = 4.9

      const world = new THREE.Group()
      scene.add(world)
      world.rotation.y = -0.6; world.rotation.x = 0.28

      // Ocean sphere with a soft vertical gradient
      const grad = document.createElement('canvas'); grad.width = 8; grad.height = 1024
      const gc = grad.getContext('2d')!
      const g = gc.createLinearGradient(0, 0, 0, 1024)
      g.addColorStop(0, '#eef0fc'); g.addColorStop(.35, '#e7eaf9'); g.addColorStop(.7, '#e6e6f0'); g.addColorStop(1, '#f3f1ea')
      gc.fillStyle = g; gc.fillRect(0, 0, 8, 1024)
      const oceanTex = new THREE.CanvasTexture(grad)
      oceanTex.generateMipmaps = false; oceanTex.minFilter = THREE.LinearFilter; oceanTex.magFilter = THREE.LinearFilter
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 64), new THREE.MeshBasicMaterial({ map: oceanTex })))

      // Atmosphere glow
      const rim = document.createElement('canvas'); rim.width = rim.height = 256
      const rc = rim.getContext('2d')!
      const rimG = rc.createRadialGradient(128, 128, 92, 128, 128, 128)
      rimG.addColorStop(0, 'rgba(94,106,210,.14)'); rimG.addColorStop(.62, 'rgba(94,106,210,.06)'); rimG.addColorStop(1, 'rgba(94,106,210,0)')
      rc.fillStyle = rimG; rc.fillRect(0, 0, 256, 256)
      const atmos = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(rim), transparent: true, depthWrite: false }))
      atmos.scale.set(2.5, 2.5, 1); scene.add(atmos)

      const llToVec = (lat: number, lng: number, r: number) => {
        const p = (90 - lat) * Math.PI / 180, t = (lng + 180) * Math.PI / 180
        return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t))
      }
      const discTexture = (color: string) => {
        const c = document.createElement('canvas'); c.width = c.height = 64
        const x = c.getContext('2d')!
        x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fillStyle = color; x.fill()
        return new THREE.CanvasTexture(c)
      }
      const pulseTexture = () => {
        const c = document.createElement('canvas'); c.width = c.height = 128
        const x = c.getContext('2d')!
        const rg2 = x.createRadialGradient(64, 64, 4, 64, 64, 64)
        rg2.addColorStop(0, 'rgba(255,214,153,.95)'); rg2.addColorStop(.18, 'rgba(217,119,6,.85)')
        rg2.addColorStop(.5, 'rgba(245,158,11,.30)'); rg2.addColorStop(1, 'rgba(245,158,11,0)')
        x.fillStyle = rg2; x.fillRect(0, 0, 128, 128)
        return new THREE.CanvasTexture(c)
      }

      // ── Live-user markers (rebuilt whenever data changes) ──
      const markerGroup = new THREE.Group(); world.add(markerGroup)
      const pulseTex = pulseTexture()
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xd97706 })
      const hitMat = new THREE.MeshBasicMaterial({ visible: false })
      let markers: any[] = []

      const setMarkers = (countries: Country[]) => {
        for (const m of markers) markerGroup.remove(m.node)
        markers = countries.map((u, i) => {
          const node = new THREE.Group(); node.position.copy(llToVec(u.lat, u.lng, 1.012))
          node.add(new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 10), dotMat))
          const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: pulseTex, transparent: true, depthWrite: false }))
          halo.scale.set(0.07, 0.07, 1); node.add(halo)
          const ping = new THREE.Sprite(new THREE.SpriteMaterial({ map: pulseTex, transparent: true, depthWrite: false, opacity: 0 }))
          node.add(ping)
          const hit = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), hitMat)
          hit.userData.index = i; node.add(hit)
          markerGroup.add(node)
          return { node, halo, ping, hit, phase: Math.random() * Math.PI * 2, user: u }
        })
      }
      setMarkersRef.current = setMarkers
      // If data arrived before the globe finished loading, apply it now.
      if (data?.countries?.length) setMarkers(data.countries)

      // ── Land dot cloud from the vendored world-atlas ──
      ;(async () => {
        try {
          const [{ geoEquirectangular, geoPath }, topojson, topoRes] = await Promise.all([
            import('d3-geo'),
            import('topojson-client'),
            fetch('/geo/countries-110m.json').then((r) => r.json()),
          ])
          if (disposed) return
          const land = (topojson as any).feature(topoRes, topoRes.objects.countries)
          const W = 2048, H = 1024
          const mask = document.createElement('canvas'); mask.width = W; mask.height = H
          const mx = mask.getContext('2d')!
          const proj = geoEquirectangular().translate([W / 2, H / 2]).scale(W / (2 * Math.PI))
          const path = geoPath(proj as any, mx)
          mx.fillStyle = '#000'; mx.beginPath(); path(land as any); mx.fill()
          const px = mx.getImageData(0, 0, W, H).data
          const isLand = (lat: number, lng: number) => {
            const x = Math.floor((lng + 180) / 360 * W), y = Math.floor((90 - lat) / 180 * H)
            return px[(y * W + x) * 4 + 3] > 128
          }
          const pts: number[] = [], step = 1.5
          for (let lat = -84; lat <= 84; lat += step) {
            const n = Math.max(6, Math.round(360 / step * Math.cos(lat * Math.PI / 180)))
            for (let i = 0; i < n; i++) {
              const lng = -180 + (360 * i) / n
              if (isLand(lat, lng)) pts.push(...llToVec(lat, lng, 1.004).toArray())
            }
          }
          const geo = new THREE.BufferGeometry()
          geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
          world.add(new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.0135, map: discTexture('#5e6ad2'), transparent: true, opacity: .85,
            alphaTest: .4, sizeAttenuation: true, depthWrite: false,
          })))
        } catch { /* land is decorative; markers still render */ }
      })()

      // ── Interaction ──
      let dragging = false, last: { x: number; y: number } | null = null
      const vel = { x: 0, y: 0 }, auto = 0.0012
      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      let hasPointer = false, hovered = -1

      const onDown = (e: PointerEvent) => { dragging = true; last = { x: e.clientX, y: e.clientY }; canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId) }
      const onUp = () => { dragging = false; canvas.classList.remove('dragging') }
      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect()
        pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
        hasPointer = true
        if (!dragging || !last) return
        const dx = e.clientX - last.x, dy = e.clientY - last.y
        last = { x: e.clientX, y: e.clientY }
        vel.y = dx * 0.005; vel.x = dy * 0.005
        world.rotation.y += vel.y
        world.rotation.x = Math.max(-1.05, Math.min(1.05, world.rotation.x + vel.x))
      }
      const onLeave = () => { hasPointer = false }
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointerup', onUp)
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerleave', onLeave)
      cleanups.push(() => {
        canvas.removeEventListener('pointerdown', onDown)
        canvas.removeEventListener('pointerup', onUp)
        canvas.removeEventListener('pointermove', onMove)
        canvas.removeEventListener('pointerleave', onLeave)
      })

      const showTip = (i: number) => {
        const u = markers[i].user as Country
        const label = u.count > 1 ? `${u.count} زائرًا الآن` : 'زائر الآن'
        tip.innerHTML = `<div class="zg-city"><span class="zg-d"></span>${u.ar}</div><div class="zg-live">${label}</div>`
        const v = markers[i].node.position.clone().applyMatrix4(world.matrixWorld).project(camera)
        const gr = stage.getBoundingClientRect(), hr = holder.getBoundingClientRect()
        tip.style.left = ((v.x * 0.5 + 0.5) * hr.width + (hr.left - gr.left)) + 'px'
        tip.style.top = ((-v.y * 0.5 + 0.5) * hr.height + (hr.top - gr.top)) + 'px'
        tip.classList.add('on')
      }

      const resize = () => {
        const w = holder.clientWidth, h = holder.clientHeight
        if (!w || !h) return
        renderer.setSize(w, h, false)
        camera.aspect = w / h; camera.updateProjectionMatrix()
        const R = 1.18, vFov = camera.fov * Math.PI / 180
        let d = R / Math.tan(vFov / 2)
        if (camera.aspect < 1) {
          const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
          d = R / Math.tan(hFov / 2)
        }
        baseDist = d
      }
      ro = new ResizeObserver(resize); ro.observe(holder); resize()

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let t = 0
      const frame = () => {
        t += 0.016
        if (!dragging) {
          vel.y *= 0.94; vel.x *= 0.94
          world.rotation.y += vel.y + (reduce || hovered >= 0 ? 0 : auto)
          world.rotation.x = Math.max(-1.05, Math.min(1.05, world.rotation.x + vel.x))
        }
        camDist += (baseDist - camDist) * 0.12
        camera.position.set(0, 0, camDist); camera.lookAt(0, 0, 0)

        for (let i = 0; i < markers.length; i++) {
          const m = markers[i]
          const k = Math.sin(t * 1.8 + m.phase) * 0.5 + 0.5
          const s = 0.062 + k * 0.016 + (i === hovered ? 0.03 : 0)
          m.halo.scale.set(s, s, 1)
          m.halo.material.opacity = (i === hovered ? 1 : 0.8) - k * 0.12
          const ring = ((t * 0.42 + m.phase) % (Math.PI * 2)) / (Math.PI * 2)
          m.ping.scale.setScalar(0.07 + ring * 0.18)
          m.ping.material.opacity = 0.32 * (1 - ring) * (1 - ring)
        }

        world.updateMatrixWorld()
        if (hasPointer && !dragging && markers.length) {
          raycaster.setFromCamera(pointer, camera)
          const hits = raycaster.intersectObjects(markers.map((m) => m.hit), false).filter((h: any) => {
            const n = h.object.parent.position.clone().applyMatrix4(world.matrixWorld).normalize()
            return n.dot(camera.position.clone().normalize()) > 0.15
          })
          hovered = hits.length ? hits[0].object.userData.index : -1
        } else if (dragging) hovered = -1

        canvas.classList.toggle('over', hovered >= 0)
        if (hovered >= 0 && hovered < markers.length) showTip(hovered); else tip.classList.remove('on')
        renderer.render(scene, camera)
        raf = requestAnimationFrame(frame)
      }
      frame()
      requestAnimationFrame(() => canvas.classList.add('in'))
    })()

    return () => {
      disposed = true
      setMarkersRef.current = null
      cancelAnimationFrame(raf)
      ro?.disconnect()
      for (const c of cleanups) c()
      renderer?.dispose?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeNow = data?.active_now ?? 0
  const reach = data?.countries?.length ?? 0
  const hasData = data != null
  const empty = hasData && reach === 0

  return (
    <section className="zg-section" aria-labelledby="zg-heading">
      <div className="zg-head">
        <div className="zg-live-badge">
          <span className="zg-dot" data-idle={activeNow === 0 ? '' : undefined} />
          {!hasData ? (
            <span className="zg-count">—</span>
          ) : activeNow > 0 ? (
            <><b className="zg-count">{activeNow.toLocaleString('ar-EG')}</b><span>مستخدم مباشر الآن</span></>
          ) : reach > 0 ? (
            <><b className="zg-count">{reach.toLocaleString('ar-EG')}</b><span>دولة يعمل فيها عملاء زينيا اليوم</span></>
          ) : (
            <span>حول العالم</span>
          )}
        </div>
        <h2 id="zg-heading">زينيا، مباشرةً حول العالم</h2>
        <p>كل نقطة برتقالية هي عميلٌ من زينيا يعمل الآن. اسحب الكرة لتستكشف من أين يزورون.</p>
      </div>

      <div className="zg-stage" ref={stageRef}>
        <div className="zg-holder" ref={holderRef}>
          <canvas ref={canvasRef} className="zg-globe" aria-label="كرة أرضية تفاعلية، كل نقطة برتقالية دولة فيها زوار مباشرون لمواقع زينيا" />
          {empty && (
            <div className="zg-empty">
              <b>لا يوجد زوّار مباشرون الآن</b>
              <span>ستضيء أول نقطة هنا لحظة دخول زائر إلى أحد مواقع زينيا</span>
            </div>
          )}
        </div>
        <div className="zg-tip" ref={tipRef} />
      </div>

      <style jsx>{`
        .zg-section { position: relative; display: flex; flex-direction: column; align-items: center; padding: 40px 24px 0; overflow: hidden; margin-bottom: -1px; }
        .zg-head { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; max-width: 640px; }
        .zg-live-badge { display: inline-flex; align-items: center; gap: 9px; font-size: 13.5px; color: var(--muted); }
        .zg-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--secondary); box-shadow: 0 0 0 3px rgba(217,119,6,.18); animation: zg-beat 1.8s ease-in-out infinite; }
        .zg-dot[data-idle] { animation: none; opacity: .5; }
        .zg-count { font-weight: 700; color: var(--foreground); font-variant-numeric: tabular-nums; }
        @keyframes zg-beat { 0%,100% { box-shadow: 0 0 0 3px rgba(217,119,6,.18) } 50% { box-shadow: 0 0 0 5px rgba(217,119,6,.05) } }
        .zg-head h2 { margin: 0; font-size: clamp(26px, 4vw, 40px); font-weight: 800; line-height: 1.2; color: var(--foreground); }
        .zg-head p { margin: 0; font-size: 15px; line-height: 1.85; color: var(--muted); }

        .zg-stage { position: relative; width: min(1120px, 96vw); height: clamp(300px, 46vh, 500px); margin-top: 22px; }
        .zg-holder { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: min(1120px, 96vw); height: clamp(500px, 76vh, 834px); }
        .zg-globe { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; touch-action: none; opacity: 0; transition: opacity .7s cubic-bezier(.22,1,.36,1); }
        .zg-globe:global(.dragging) { cursor: grabbing; }
        .zg-globe:global(.over) { cursor: pointer; }
        .zg-globe:global(.in) { opacity: 1; }

        .zg-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 22%; gap: 6px; color: var(--muted); font-size: 14px; text-align: center; }
        .zg-empty b { color: var(--foreground); font-weight: 700; }

        .zg-tip { position: absolute; z-index: 5; pointer-events: none; opacity: 0; transform: translate(50%, -100%) translateY(-9px); transition: opacity .15s cubic-bezier(.22,1,.36,1); background: var(--surface); border: 1px solid var(--border); border-radius: 11px; box-shadow: 0 12px 30px rgba(28,28,28,.14), 0 0 0 1px var(--border); padding: 7px 11px; }
        .zg-tip:global(.on) { opacity: 1; }
        .zg-tip :global(.zg-city) { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 700; color: var(--foreground); }
        .zg-tip :global(.zg-city .zg-d) { width: 6px; height: 6px; border-radius: 999px; background: var(--secondary); box-shadow: 0 0 0 3px rgba(217,119,6,.16); }
        .zg-tip :global(.zg-live) { font-size: 11.5px; color: var(--muted); margin-top: 1px; }
      `}</style>
    </section>
  )
}
