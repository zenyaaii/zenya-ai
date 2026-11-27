import { readFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { findFile, titleOf, GROUPS, dateOf } from '@/lib/research'
import { researchPage } from '@/lib/research-view'

export const dynamic = 'force-dynamic'

const TYPE: Record<string, string> = { md: 'text/markdown', json: 'application/json', html: 'text/html', py: 'text/x-python' }

/**
 * One research file (admin only). GET ?p=<listed path>[&view=1]
 * view=1 opens it in the browser: markdown as a page to read (lib/research-view),
 * code as plain text, the newsroom page sandboxed; otherwise it downloads.
 */
export async function GET(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const sp = req.nextUrl.searchParams
  const f = findFile(sp.get('p') ?? '')
  if (!f) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const body = await readFile(path.join(process.cwd(), 'content', 'research', f.p))
  const view = sp.get('view') === '1'
  if (view && f.ext === 'md') {
    const { html } = researchPage(body.toString('utf8'), {
      fallbackTitle: titleOf(f), group: GROUPS[f.group]?.t ?? '', date: dateOf(f.date),
      back: '/dashboard/admin#research', download: `/api/admin/research/file?p=${encodeURIComponent(f.p)}`,
    })
    return new NextResponse(html, { headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      // A page to read, nothing more: no script runs, fonts only from Google.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
    } })
  }
  const type = view && f.ext !== 'html' && f.ext !== 'json' ? 'text/plain' : TYPE[f.ext] ?? 'application/octet-stream'
  const headers: Record<string, string> = {
    'Content-Type': `${type}; charset=utf-8`,
    'Content-Disposition': `${view ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    'Cache-Control': 'private, no-store',
  }
  // The newsroom page runs its own script, but never with this origin's cookies.
  if (f.ext === 'html') headers['Content-Security-Policy'] = 'sandbox allow-scripts allow-popups'
  return new NextResponse(new Uint8Array(body), { headers })
}
