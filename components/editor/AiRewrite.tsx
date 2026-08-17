'use client'

/* ────────────────────────────────────────────────────────────────────── *
 * Inline AI copywriter for the theme editor.                              *
 *                                                                         *
 * Every text / textarea field gets a small ✦ trigger. Clicking it opens  *
 * an inline panel with rewrite modes (Improve, Shorter, Punchier, …) and  *
 * a free-form instruction box. We hand the API the brand identity + a     *
 * sample of the site's existing copy so the rewrite matches the theme's   *
 * established voice instead of reading like generic AI filler.            *
 *                                                                         *
 * Theme context flows through <AiCopyProvider>. The provider value is     *
 * stable (getters read a live ref) so wiring it in doesn't re-render      *
 * every field on each keystroke.                                          *
 * ────────────────────────────────────────────────────────────────────── */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'
import { Sparkles, Loader2, RotateCcw, X } from 'lucide-react'

export type AiBrand = { name?: string; tagline?: string; category?: string }

export type AiCopyContextValue = {
  themeName: string
  businessType: string
  getBrand: () => AiBrand
  getVoiceSample: () => string[]
}

const AiCopyCtx = createContext<AiCopyContextValue | null>(null)

export function AiCopyProvider({
  value, children,
}: { value: AiCopyContextValue; children: ReactNode }) {
  return <AiCopyCtx.Provider value={value}>{children}</AiCopyCtx.Provider>
}

export function useAiCopy(): AiCopyContextValue | null {
  return useContext(AiCopyCtx)
}

type Mode = 'improve' | 'shorter' | 'longer' | 'punchier' | 'professional' | 'playful'

/** Tone presets, labelled in the active locale. */
function buildModes(t: Messages): Array<{ id: Mode; label: string }> {
  return [
    { id: 'improve',      label: t.editor.improve },
    { id: 'shorter',      label: t.editor.shorter },
    { id: 'longer',       label: t.editor.longer },
    { id: 'punchier',     label: t.editor.punchier },
    { id: 'professional', label: t.editor.professional },
    { id: 'playful',      label: t.editor.playful },
  ]
}

/**
 * Hook used by FieldText / FieldTextArea. Returns a `trigger` (the ✦ button
 * for the label row) and a `panel` (the expandable UI rendered under the
 * input). Both are null when there's no Ai context — so the field components
 * stay usable outside the editor.
 */
export function useAiRewrite(opts: {
  fieldLabel: string
  panelLabel?: string
  multiline: boolean
  current: string
  onChange: (v: string) => void
}): { available: boolean; trigger: ReactNode; panel: ReactNode } {
  const t = useT()
  const ctx = useAiCopy()
  const [open, setOpen] = useState(false)

  if (!ctx) return { available: false, trigger: null, panel: null }

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      title={t.editor.aiRewriteTitle}
      aria-label={t.editor.aiRewriteTitle}
      className={
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition ' +
        (open
          ? 'border-primary bg-[rgba(94,106,210,0.10)] text-primary'
          : 'border-token bg-white text-muted hover:border-primary/50 hover:text-primary')
      }
    >
      <Sparkles className="h-3 w-3" strokeWidth={2.25} />
      AI
    </button>
  )

  const panel = open ? (
    <AiRewritePanel
      ctx={ctx}
      fieldLabel={opts.fieldLabel}
      panelLabel={opts.panelLabel}
      multiline={opts.multiline}
      current={opts.current}
      onChange={opts.onChange}
      onClose={() => setOpen(false)}
    />
  ) : null

  return { available: true, trigger, panel }
}

function AiRewritePanel({
  ctx, fieldLabel, panelLabel, multiline, current, onChange, onClose,
}: {
  ctx: AiCopyContextValue
  fieldLabel: string
  panelLabel?: string
  multiline: boolean
  current: string
  onChange: (v: string) => void
  onClose: () => void
}) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [variants, setVariants] = useState<string[]>([])
  const [instruction, setInstruction] = useState('')

  async function run(mode: Mode | 'custom') {
    if (loading) return
    if (mode === 'custom' && !instruction.trim()) {
      setErr(t.editor.writeFirst)
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeName: ctx.themeName,
          businessType: ctx.businessType,
          brand: ctx.getBrand(),
          voiceSample: ctx.getVoiceSample(),
          panelLabel: panelLabel || '',
          fieldLabel,
          current,
          multiline,
          mode,
          instruction: mode === 'custom' ? instruction.trim() : undefined,
          variants: 3,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.message || j?.error || t.editor.rewriteFailed)
      const list: string[] = Array.isArray(j?.variants) ? j.variants : []
      if (list.length === 0) throw new Error(t.editor.noUsableText)
      setVariants(list)
    } catch (e: any) {
      setErr(e?.message || t.editor.rewriteFailedDot)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-1.5 rounded-lg border border-primary/30 bg-[rgba(94,106,210,0.05)] p-2.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3" strokeWidth={2.25} /> {t.editor.aiRewriteHeading}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-muted hover:text-foreground"
          aria-label={t.editor.closeAiRewrite}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {buildModes(t).map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={loading}
            onClick={() => run(m.id)}
            className="rounded-full border border-token bg-white px-2 py-0.5 text-[11px] font-medium text-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run('custom') } }}
          placeholder={t.editor.tellAiPlaceholder}
          disabled={loading}
          className="flex-1 rounded-md border border-token bg-white px-2 py-1 text-[12px] outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => run('custom')}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : t.editor.run}
        </button>
      </div>

      {err && (
        <p className="mt-2 rounded-md border border-[rgba(220,38,38,0.25)] bg-[rgba(220,38,38,0.06)] px-2 py-1.5 text-[11.5px] text-[#b91c1c]">
          {err}
        </p>
      )}

      {loading && variants.length === 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted">
          <Loader2 className="h-3 w-3 animate-spin" /> {t.editor.writingInStyle}
        </p>
      )}

      {variants.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {t.editor.clickOneToUse}
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={() => run('improve')}
              className="inline-flex items-center gap-1 text-[10.5px] font-medium text-muted hover:text-primary disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" /> {t.editor.regenerate}
            </button>
          </div>
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(v); onClose() }}
              className="block w-full rounded-md border border-token bg-white px-2.5 py-2 text-left text-[12.5px] leading-snug text-foreground transition hover:border-primary hover:bg-[rgba(94,106,210,0.04)]"
            >
              <span className="block whitespace-pre-line break-words">{v.replace(/\\n/g, '\n')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
