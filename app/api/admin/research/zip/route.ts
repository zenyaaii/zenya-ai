import { readFile } from 'fs/promises'
import path from 'path'
import JSZip from 'jszip'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { filesIn } from '@/lib/research'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Research files as one zip, keeping their sorted folders (admin only).
 * GET ?g=all | 3-niches | 3-niches/barber | 4-market-data/reviews …
 */
export async function GET(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const g = req.nextUrl.searchParams.get('g') || 'all'
  const files = filesIn(g)
  if (!files.length) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const zip = new JSZip()
  const root = path.join(process.cwd(), 'content', 'research')
  for (const f of files) zip.file(`beynoun-research/${f.p}`, await readFile(path.join(root, f.p)), { date: new Date(`${f.date || '2026-11-14'}T12:00:00Z`) })
  const buf = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  const name = `beynoun-research-${g === 'all' ? 'all' : g.replace(/^\d-/, '').replace(/\//g, '-')}.zip`
  return new NextResponse(buf as unknown as BodyInit, {
    headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'private, no-store' },
  })
}
