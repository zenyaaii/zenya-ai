import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

/* ─────────────────────────────────────────────────────────────────────────
   Where the composer's Save button writes.

   The composer used to write to localStorage and print CSS for a human to
   paste into page.tsx by hand. That is the "saving problem": nothing a
   reader did in the tool ever reached the page, and a browser that cleared
   its storage lost the composition.

   This writes the placement to app/demo/home/placement.json, which the page
   imports — so a save changes the real page, survives a reload, is committed
   with the rest of the source, and ships.

   THIS ROUTE IS DEVELOPMENT ONLY. It writes to the filesystem, so it must
   never answer in production: a deployed build returns 404 as though it did
   not exist, which is the honest answer, because on a read-only serverless
   filesystem it could not work anyway. Every field is validated and clamped
   before it is written, and the only path it can ever write is the one
   constant below.
   ───────────────────────────────────────────────────────────────────────── */

const FILE = path.join(process.cwd(), "app", "demo", "home", "placement.json")

const SECTIONS = ["build", "manage", "publish"] as const
const WIDTHS = ["wide", "narrow"] as const
type Section = (typeof SECTIONS)[number]
type Width = (typeof WIDTHS)[number]

/** Every field, with the range it is allowed to hold. */
const FIELDS = {
  appX: { min: -4000, max: 4000, nullable: false },
  appY: { min: -4000, max: 4000, nullable: false },
  appW: { min: 200, max: 4000, nullable: true },
  appH: { min: 120, max: 4000, nullable: true },
  wordX: { min: -4000, max: 4000, nullable: false },
  wordY: { min: -4000, max: 4000, nullable: false },
  wordSize: { min: 8, max: 2000, nullable: true },
} as const

type Layout = Record<keyof typeof FIELDS, number | null>

const ZERO: Layout = {
  appX: 0, appY: 0, appW: null, appH: null, wordX: 0, wordY: 0, wordSize: null,
}

const dev = () => process.env.NODE_ENV !== "production"

/** Reject anything that is not a finite number in range; clamp what is. */
function clean(raw: unknown): Layout {
  const out: Layout = { ...ZERO }
  if (!raw || typeof raw !== "object") return out
  const src = raw as Record<string, unknown>
  for (const k of Object.keys(FIELDS) as (keyof typeof FIELDS)[]) {
    const spec = FIELDS[k]
    const v = src[k]
    if (v == null) { out[k] = spec.nullable ? null : 0; continue }
    if (typeof v !== "number" || !Number.isFinite(v)) { out[k] = spec.nullable ? null : 0; continue }
    out[k] = Math.round(Math.min(spec.max, Math.max(spec.min, v)))
  }
  return out
}

function emptyStore() {
  const store: Record<Section, Record<Width, Layout>> = {} as never
  for (const s of SECTIONS) {
    store[s] = {} as Record<Width, Layout>
    for (const w of WIDTHS) store[s][w] = { ...ZERO }
  }
  return store
}

async function readStore() {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8"))
    const store = emptyStore()
    for (const s of SECTIONS) {
      for (const w of WIDTHS) store[s][w] = clean(parsed?.[s]?.[w])
    }
    return store
  } catch {
    return emptyStore()
  }
}

export async function GET() {
  if (!dev()) return new NextResponse(null, { status: 404 })
  return NextResponse.json(await readStore())
}

export async function POST(req: Request) {
  if (!dev()) return new NextResponse(null, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 })
  }

  const { section, width, layout } = (body ?? {}) as {
    section?: unknown; width?: unknown; layout?: unknown
  }
  if (!SECTIONS.includes(section as Section)) {
    return NextResponse.json({ ok: false, error: "unknown section" }, { status: 400 })
  }
  if (!WIDTHS.includes(width as Width)) {
    return NextResponse.json({ ok: false, error: "unknown width" }, { status: 400 })
  }

  /* Read, replace exactly one cell, write the whole thing back. The file is
     small and this is a single developer on localhost, so there is no reason
     to do anything cleverer — and it means a malformed file on disk is
     repaired rather than merged into. */
  const store = await readStore()
  store[section as Section][width as Width] = clean(layout)

  try {
    await fs.writeFile(FILE, JSON.stringify(store, null, 2) + "\n", "utf8")
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "write failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, saved: store[section as Section][width as Width] })
}
