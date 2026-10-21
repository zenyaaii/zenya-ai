import { ImageResponse } from 'next/og'
import { lookupPublishedTheme } from '@/lib/public-site'
import { resolveSeo } from '@/lib/seo'

/**
 * A customer site's tab icon: slug.beynoun.com/site-icon, and /favicon.ico,
 * which middleware maps here. It is the logo the owner uploaded on the SEO
 * page, fitted into a square at the asked size. A site with no logo has no
 * icon: this answers 404 and the browser draws its own blank one. Never a
 * letter, never Zenya's mark.
 *
 * `?s=` is the pixel size: 32 for the tab, 48 for /favicon.ico, 180 for the
 * iPhone home screen, 192 for Android and Google.
 */
export const revalidate = 3600

const SIZES = new Set([16, 32, 48, 180, 192, 512])
const CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'

function none() {
  return new Response(null, { status: 404, headers: { 'Cache-Control': CACHE } })
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const theme = await lookupPublishedTheme(params.slug)
  if (!theme) return none()
  const { logo } = resolveSeo({
    product_name: theme.product_name,
    slug: theme.slug,
    content: theme.content,
    template_type: theme.template_type,
    is_published: true,
  })
  if (!logo) return none()

  const asked = Number(new URL(req.url).searchParams.get('s'))
  const size = SIZES.has(asked) ? asked : 32

  try {
    const res = new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={logo} width={size} height={size} style={{ objectFit: 'contain', width: size, height: size }} />
        </div>
      ),
      { width: size, height: size, headers: { 'Cache-Control': CACHE } },
    )
    // ImageResponse renders lazily; read it here so a logo format the
    // renderer cannot draw falls through to the original file below.
    const body = await res.arrayBuffer()
    return new Response(body, { headers: { 'Content-Type': 'image/png', 'Cache-Control': CACHE } })
  } catch {
    const raw = await fetch(logo).catch(() => null)
    if (!raw || !raw.ok) return none()
    return new Response(raw.body, {
      headers: { 'Content-Type': raw.headers.get('content-type') || 'image/png', 'Cache-Control': CACHE },
    })
  }
}
