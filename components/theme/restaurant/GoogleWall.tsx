'use client'
// Google photos + Google reviews, moving (content.google_wall, filled by the
// build system from the place's own Google data). a = two rows drifting
// right→left (home); b = staggered columns falling with soft edges (reviews
// page). Pauses on hover; still for "reduce motion". A review card puts the
// name first, so a long review can never push the name out of its box.

type Review = { name: string; rating: number; text: string; when?: string }
type Wall = { photos: string[]; reviews: Review[] }
type Item = { photo?: string; review?: Review }

const CSS = `
@keyframes gw-x { from { transform: translate3d(0,0,0) } to { transform: translate3d(-50%,0,0) } }
@keyframes gw-y { from { transform: translate3d(0,-50%,0) } to { transform: translate3d(0,0,0) } }
.gw-row { display:flex; gap:var(--gw-gap); width:max-content; animation: gw-x var(--gw-dur,70s) linear infinite; will-change: transform }
.gw-col { display:flex; flex-direction:column; gap:var(--gw-gap); animation: gw-y var(--gw-dur,60s) linear infinite; will-change: transform }
.gw:hover .gw-row, .gw:hover .gw-col { animation-play-state: paused }
.gw-ph { position:relative; overflow:hidden; background: var(--rb-surface) }
.gw-ph img { width:100%; height:100%; object-fit:cover; display:block; transition: transform 1.2s cubic-bezier(.22,1,.36,1), filter .6s; filter: saturate(.95) }
.gw-ph:hover img { transform: scale(1.06); filter: saturate(1.05) }
.gw-ph::after { content:''; position:absolute; inset:0; box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), inset 0 -60px 60px -40px rgba(0,0,0,.45); pointer-events:none }
.gw-rv { position:relative; display:flex; flex-direction:column; justify-content:space-between; gap:14px; direction:rtl;
  background: linear-gradient(160deg, color-mix(in srgb, var(--rb-accent) 9%, var(--rb-surface)) 0%, var(--rb-surface) 70%);
  border:1px solid color-mix(in srgb, var(--rb-accent) 28%, transparent) }
.gw-q { position:absolute; top:6px; left:14px; font-family: Georgia, serif; font-size:64px; line-height:1; color: var(--rb-accent); opacity:.22 }
.gw-txt { color: var(--rb-text); line-height:1.75; display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden }
.gw-who { display:flex; align-items:center; gap:10px; min-width:0 }
.gw-av { flex:0 0 auto; width:32px; height:32px; border-radius:999px; display:grid; place-items:center; font-size:13px; font-weight:600;
  color: var(--rb-bg); background: var(--rb-accent) }
.gw-nm { color: var(--rb-text); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.gw-src { color: var(--rb-muted); font-size:11.5px; display:flex; align-items:center; gap:5px }
@media (max-width:640px){ .gw-txt { font-size:13.5px !important; line-height:1.7 } .gw-q { display:none } .gw-row .gw-txt { -webkit-line-clamp:3 !important } }
@media (prefers-reduced-motion: reduce) { .gw-row, .gw-col { animation: none } }
`

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} من 5`} style={{ color: 'var(--rb-accent)', letterSpacing: 3, fontSize: 13 }}>
      {'★★★★★'.slice(0, n)}<span style={{ opacity: 0.25 }}>{'★★★★★'.slice(n)}</span>
    </span>
  )
}

function GoogleMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function ReviewCard({ r, lines, pad, style }: { r: Review; lines: number; pad: number; style?: React.CSSProperties }) {
  return (
    <div className="gw-rv" style={{ padding: pad, justifyContent: 'flex-start', gap: 12, ...style }}>
      <span className="gw-q" aria-hidden="true">”</span>
      <div className="gw-who">
        <span className="gw-av" aria-hidden="true">{(r.name.trim()[0] || '؟').toUpperCase()}</span>
        <div style={{ display: 'grid', minWidth: 0 }}>
          <span className="gw-nm">{r.name}</span>
          <span className="gw-src"><GoogleMark /> تقييم على جوجل{r.when ? ` · ${r.when}` : ''}</span>
        </div>
      </div>
      <Stars n={r.rating} />
      <p className="gw-txt" style={{ WebkitLineClamp: lines, fontSize: 14 }}>{r.text}</p>
    </div>
  )
}

function mix(w: Wall, offset = 0, every = 3, rOff = offset): Item[] {
  const out: Item[] = []
  let p = offset, r = rOff
  const n = w.photos.length + Math.min(w.reviews.length, Math.ceil(w.photos.length / (every - 1)))
  for (let i = 0; i < n; i++) {
    if (i % every === every - 1 && w.reviews.length) out.push({ review: w.reviews[r++ % w.reviews.length] })
    else out.push({ photo: w.photos[p++ % w.photos.length] })
  }
  return out
}

function Head({ rating, count, eyebrow, title }: { rating?: number; count?: string; eyebrow: string; title: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 px-6">
      <p className="text-[0.7rem] uppercase mb-5" style={{ color: 'var(--rb-accent)', fontWeight: 500 }}>{eyebrow}</p>
      <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'var(--rb-heading-font)', fontWeight: 'var(--rb-heading-weight)' as any, color: 'var(--rb-text)', lineHeight: 1.12 }}>{title}</h2>
      {rating ? (
        <div className="mt-6 inline-flex items-center gap-3 px-4 py-2" style={{ border: '1px solid var(--rb-border)' }}>
          <GoogleMark />
          <span style={{ color: 'var(--rb-text)', fontFamily: 'var(--rb-heading-font)', fontSize: '1.15rem' }}>{rating.toFixed(1)}</span>
          <Stars n={Math.round(rating)} />
          <span style={{ color: 'var(--rb-muted)', fontSize: 13 }}>{count} تقييم</span>
        </div>
      ) : null}
    </div>
  )
}

export default function GoogleWall({ wall, variant, rating, count, brand }: { wall: Wall; variant: 'a' | 'b'; rating?: number; count?: string; brand?: string }) {
  if (variant === 'a') {
    const row1 = mix(wall, 0, 3, 0), row2 = mix(wall, 5, 3, 2)
    const fade = 'linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)'
    const tile = 'clamp(190px, 22vw, 290px)'
    const Row = ({ items, dur }: { items: Item[]; dur: string }) => (
      <div className="gw-row" style={{ ['--gw-dur' as any]: dur }}>
        {[...items, ...items].map((t, i) =>
          t.photo ? (
            <div key={i} className="gw-ph" style={{ width: tile, height: tile, flex: '0 0 auto' }}>
              <img src={t.photo} alt="" loading="lazy" />
            </div>
          ) : (
            <ReviewCard key={i} r={t.review!} lines={5} pad={18} style={{ width: `calc(${tile} * 1.35)`, height: tile, flex: '0 0 auto' }} />
          )
        )}
      </div>
    )
    return (
      <section data-section="google_wall" className="gw py-24 md:py-32 overflow-hidden" style={{ ['--gw-gap' as any]: '14px' }}>
        <style>{CSS}</style>
        <Head rating={rating} count={count} eyebrow="من خرائط جوجل" title="صور ضيوفنا وآراؤهم" />
        <div style={{ WebkitMaskImage: fade, maskImage: fade, direction: 'ltr', display: 'grid', gap: 14 }}>
          <Row items={row1} dur="80s" />
          <Row items={row2} dur="105s" />
        </div>
      </section>
    )
  }

  const P = wall.photos, R = wall.reviews
  const ph = (i: number): Item => ({ photo: P[i % P.length] })
  const rv = (i: number): Item => (R.length ? { review: R[i % R.length] } : ph(i + 7))
  const cols: Item[][] = [0, 1, 2, 3].map((c) => c % 2
    ? [rv(c), ph(c * 3 + 1), ph(c * 3 + 2), rv(c + 2), ph(c * 3 + 6)]
    : [ph(c * 3), rv(c), ph(c * 3 + 4), ph(c * 3 + 8), rv(c + 2)])
  const fadeY = 'linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)'
  return (
    <section data-section="google_wall" className="gw pt-24 md:pt-32 pb-10 overflow-hidden" style={{ ['--gw-gap' as any]: '14px' }}>
      <style>{CSS}</style>
      <Head rating={rating} count={count} eyebrow="من خرائط جوجل" title={brand ? `لحظات من ${brand}` : "لحظات من ضيوفنا"} />
      <div className="mx-auto max-w-[1280px] px-4 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-[14px]"
        style={{ height: 'min(760px, 120vw)', overflow: 'hidden', WebkitMaskImage: fadeY, maskImage: fadeY }}>
        {cols.map((col, c) => (
          <div key={c} className={`gw-col ${c > 1 ? 'hidden md:flex' : ''}`}
            style={{ ['--gw-dur' as any]: `${[64, 82, 72, 90][c]}s`, marginTop: c % 2 ? 48 : 0 }}>
            {[...col, ...col].map((t, i) =>
              t.photo ? (
                <div key={i} className="gw-ph" style={{ width: '100%', aspectRatio: i % 3 === 1 ? '4 / 5' : '1' }}>
                  <img src={t.photo} alt="" loading="lazy" />
                </div>
              ) : (
                <ReviewCard key={i} r={t.review!} lines={7} pad={18} />
              )
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
