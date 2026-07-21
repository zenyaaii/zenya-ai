import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Google Search Console "HTML file" verification, served at
 * `slug.zenyaai.co/google<hash>.html`.
 *
 * Google issues each owner a unique file `google<hash>.html` whose body is
 * `google-site-verification: google<hash>.html`. We host it — but ONLY the
 * exact filename the site owner saved in their SEO settings, so nobody can
 * verify ownership of someone else's Zenya site.
 *
 * This is a catch-all for a single path segment under /s/[slug]; anything that
 * isn't the registered verification file returns 404 (brochure sites have no
 * other sub-paths). The static `sitemap.xml` / `robots.txt` routes take
 * priority over this dynamic segment.
 */

export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Verification must reflect the owner's latest saved file immediately —
      // bypass Next's fetch data cache so a just-saved token verifies right away.
      global: { fetch: (input: any, init: any) => fetch(input, { ...init, cache: 'no-store' }) },
    },
  )
}

const GOOGLE_FILE = /^google[a-z0-9]+\.html$/i

export async function GET(_req: Request, { params }: { params: { slug: string; gverify: string } }) {
  const file = (params.gverify || '').toLowerCase()
  if (!GOOGLE_FILE.test(file)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const slug = (params.slug || '').toLowerCase()
  const { data } = await admin()
    .from('themes')
    .select('content, is_published')
    .ilike('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  const stored =
    data?.content && typeof data.content === 'object'
      ? String((data.content as any)?.seo?.gscFile || '').toLowerCase()
      : ''

  if (!stored || stored !== file) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Exactly what Google's issued file contains.
  return new NextResponse(`google-site-verification: ${file}`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
