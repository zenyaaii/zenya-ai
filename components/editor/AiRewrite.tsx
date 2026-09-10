'use client'

/* ────────────────────────────────────────────────────────────────────── *
 * Inline AI copywriter for the theme editor.                              *
 *                                                                         *
 * Every text / textarea field gets a small AI trigger. Clicking it opens *
 * an inline panel with rewrite modes (Improve, Shorter, Punchier, …) and  *
 * a free-form instruction box. We hand the API the brand identity + a     *
 * sample of the site's existing copy so the rewrite matches the theme's   *
 * established voice instead of reading like generic AI filler.            *
 *                                                                         *
 * Theme context flows through <AiCopyProvider>. The provider value is     *
 * stable (getters read a live ref) so wiring it in doesn't re-render      *
 * every field on each keystroke.                                          *
 *                                                                         *
 * OFFLINE (the /demo/editor candidate, see ./env): the trigger and the    *
 * panel still render, so the design can be judged, but nothing can call   *
 * /api/ai/rewrite. The panel says so where the instruction box would be,  *
 * and run() returns before it could fetch.                                *
 * ────────────────────────────────────────────────────────────────────── */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useT } from '@/components/i18n/LocaleProvider'
import type { Messages } from '@/lib/i18n/messages'
import { Sparkles, RotateCcw, X } from 'lucide-react'
import { useEditorEnv } from './env'

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
 * Hook used by FieldText / FieldTextArea. Returns a `trigger` (the AI button
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
  const { offline } = useEditorEnv()
  const [open, setOpen] = useState(false)

  if (!ctx) return { available: false, trigger: null, panel: null }

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      title={t.editor.aiRewriteTitle}
      aria-label={`${t.editor.aiRewriteTitle}: ${opts.fieldLabel}`}
      aria-expanded={open}
      className="ze-ai"
    >
      <Sparkles strokeWidth={2} aria-hidden />
      <bdi dir="ltr">AI</bdi>
    </button>
  )

  const panel = open ? (
    <AiRewritePanel
      ctx={ctx}
      offline={offline}
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
  ctx, offline, fieldLabel, panelLabel, multiline, current, onChange, onClose,
}: {
  ctx: AiCopyContextValue
  offline: boolean
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
    if (offline || loading) return
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
    <div className="ze-aipanel">
      <div className="ze-aipanel-h">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <Sparkles strokeWidth={2} aria-hidden style={{ width: 15, height: 15 }} /> {t.editor.aiRewriteHeading}
        </span>
        <button type="button" onClick={onClose} className="ze-icon" aria-label={t.editor.closeAiRewrite}>
          <X strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="ze-chips">
        {buildModes(t).map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={loading || offline}
            onClick={() => run(m.id)}
            className="ze-chip"
          >
            {m.label}
          </button>
        ))}
      </div>

      {offline ? (
        <p className="ze-note" data-tone="door">{t.editor.aiOffline}</p>
      ) : (
        <div className="ze-row2">
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run('custom') } }}
            placeholder={t.editor.tellAiPlaceholder}
            aria-label={t.editor.tellAiPlaceholder}
            disabled={loading}
            dir="auto"
            className="ze-input"
          />
          <button type="button" disabled={loading} onClick={() => run('custom')} className="ze-btn" data-tone="accent" aria-busy={loading}>
            {loading ? <span className="ze-spin" aria-hidden /> : t.editor.run}
          </button>
        </div>
      )}

      {err && <p className="ze-err">{err}</p>}

      {loading && variants.length === 0 && (
        <p className="ze-hint" role="status">{t.editor.writingInStyle}</p>
      )}

      {variants.length > 0 && (
        <div className="ze-items">
          <div className="ze-card-h">
            <span className="ze-hint">{t.editor.clickOneToUse}</span>
            <button type="button" disabled={loading} onClick={() => run('improve')} className="ze-link">
              <RotateCcw aria-hidden /> {t.editor.regenerate}
            </button>
          </div>
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(v); onClose() }}
              className="ze-variant"
              dir="auto"
            >
              {v.replace(/\\n/g, '\n')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
