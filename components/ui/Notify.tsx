'use client'

/**
 * Zenya's in-app notification layer — a branded replacement for the browser's
 * native `alert()` / `confirm()` dialogs (which render as ugly, host-labelled
 * Chrome popups like "dashboard.zenyaai.co says…").
 *
 * Two primitives, exposed through `useNotify()`:
 *   • toast({ type, message, description? })  — transient bottom notification
 *   • confirm({ title, message, … })          — Promise-based modal; can carry
 *                                                an optional checkbox (used by
 *                                                the delete-site flow to ask
 *                                                whether to also delete images)
 *
 * Mount <NotifyProvider> once, high in the tree (root layout). RTL-aware and
 * styled with the app's design tokens. Everything renders null when idle, so
 * it's safe to mount globally — including on customer sites.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: number
  type: ToastType
  message: string
  description?: string
}

export type ConfirmOptions = {
  title: string
  message?: ReactNode
  confirmText?: string
  cancelText?: string
  /** `danger` paints the confirm button red — for destructive actions. */
  tone?: 'default' | 'danger'
  /** Optional extra opt-in shown as a checkbox inside the dialog. */
  checkbox?: { label: string; defaultChecked?: boolean }
}

export type ConfirmResult = { confirmed: boolean; checked: boolean }

type NotifyApi = {
  toast: (t: Omit<Toast, 'id'>) => void
  confirm: (opts: ConfirmOptions) => Promise<ConfirmResult>
}

const NotifyContext = createContext<NotifyApi | null>(null)

/** Hook used by any client component to raise toasts / confirmations. */
export function useNotify(): NotifyApi {
  const ctx = useContext(NotifyContext)
  if (!ctx) {
    // Fail soft: if the provider isn't mounted (shouldn't happen), fall back to
    // the native primitives so callers never crash.
    return {
      toast: ({ message }) => {
        if (typeof window !== 'undefined') window.alert(message)
      },
      confirm: async ({ message, title, checkbox }) => {
        const ok =
          typeof window !== 'undefined'
            ? window.confirm([title, typeof message === 'string' ? message : '']
                .filter(Boolean)
                .join('\n\n'))
            : false
        return { confirmed: ok, checked: !!checkbox?.defaultChecked }
      },
    }
  }
  return ctx
}

const TOAST_ICON: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const TOAST_TINT: Record<ToastType, { fg: string; bg: string; ring: string }> = {
  success: { fg: '#15803d', bg: 'rgba(39,166,68,0.10)', ring: 'rgba(39,166,68,0.30)' },
  error:   { fg: '#b91c1c', bg: 'rgba(220,38,38,0.08)',  ring: 'rgba(220,38,38,0.28)' },
  warning: { fg: '#b45309', bg: 'rgba(217,119,6,0.10)',  ring: 'rgba(217,119,6,0.30)' },
  info:    { fg: '#5e6ad2', bg: 'rgba(94,106,210,0.10)', ring: 'rgba(94,106,210,0.30)' },
}

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)
  const [checked, setChecked] = useState(false)
  const resolverRef = useRef<((r: ConfirmResult) => void) | null>(null)
  const idRef = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { ...t, id }])
    // Errors linger a little longer so they can be read.
    const ttl = t.type === 'error' ? 6000 : 4000
    setTimeout(() => removeToast(id), ttl)
  }, [removeToast])

  const confirm = useCallback((opts: ConfirmOptions) => {
    setChecked(!!opts.checkbox?.defaultChecked)
    setConfirmState(opts)
    return new Promise<ConfirmResult>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settle = useCallback((confirmed: boolean) => {
    resolverRef.current?.({ confirmed, checked })
    resolverRef.current = null
    setConfirmState(null)
  }, [checked])

  const api = useMemo<NotifyApi>(() => ({ toast, confirm }), [toast, confirm])

  // Portal target only exists on the client; gate on mount to avoid a
  // hydration mismatch between the server (no portal) and first client render.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Escape cancels the confirm dialog, matching native confirm() behaviour.
  useEffect(() => {
    if (!confirmState) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmState, settle])

  return (
    <NotifyContext.Provider value={api}>
      {children}

      {mounted && createPortal(
        <>
          {/* ── Toasts ─────────────────────────────────────────────────── */}
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4 print:hidden">
            <AnimatePresence initial={false}>
              {toasts.map((t) => {
                const Icon = TOAST_ICON[t.type]
                const tint = TOAST_TINT[t.type]
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-token bg-white/95 px-4 py-3 backdrop-blur-md"
                    style={{ boxShadow: '0 12px 32px -12px rgba(28,28,28,0.28), 0 0 0 1px rgba(28,28,28,0.04)' }}
                    dir="rtl"
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: tint.bg, color: tint.fg }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold leading-snug text-foreground">{t.message}</p>
                      {t.description && (
                        <p className="mt-0.5 text-[12px] leading-snug text-muted">{t.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeToast(t.id)}
                      aria-label="إغلاق"
                      className="-me-1 -mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-muted/60 transition hover:bg-black/5 hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* ── Confirm modal ──────────────────────────────────────────── */}
          <AnimatePresence>
            {confirmState && (
              <motion.div
                className="fixed inset-0 z-[130] flex items-center justify-center p-4 print:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                dir="rtl"
              >
                <div
                  className="absolute inset-0 bg-[rgba(15,15,20,0.42)] backdrop-blur-[2px]"
                  onClick={() => settle(false)}
                  aria-hidden
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={confirmState.title}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full max-w-md rounded-2xl bg-white p-6 text-start"
                  style={{ boxShadow: '0 24px 70px -20px rgba(28,28,28,0.40), 0 0 0 1px rgba(28,28,28,0.06)' }}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                      style={
                        confirmState.tone === 'danger'
                          ? { background: 'rgba(220,38,38,0.08)', color: '#b91c1c' }
                          : { background: 'rgba(94,106,210,0.10)', color: '#5e6ad2' }
                      }
                    >
                      {confirmState.tone === 'danger'
                        ? <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={2} />
                        : <Info className="h-[18px] w-[18px]" strokeWidth={2} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[16px] font-bold tracking-tight text-foreground">
                        {confirmState.title}
                      </h2>
                      {confirmState.message && (
                        <div className="mt-1.5 text-[13.5px] leading-[1.7] text-muted">
                          {confirmState.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {confirmState.checkbox && (
                    <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-token bg-surface px-3.5 py-3 text-[13px] leading-snug text-foreground transition-colors hover:bg-black/[0.02]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0"
                        style={{ accentColor: '#5e6ad2' }}
                      />
                      <span>{confirmState.checkbox.label}</span>
                    </label>
                  )}

                  <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => settle(false)}
                      className="rounded-lg border border-token bg-white px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-black/5 hover:text-foreground"
                    >
                      {confirmState.cancelText || 'إلغاء'}
                    </button>
                    <button
                      type="button"
                      autoFocus
                      onClick={() => settle(true)}
                      className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                      style={
                        confirmState.tone === 'danger'
                          ? { background: '#dc2626', boxShadow: '0 8px 20px -8px rgba(220,38,38,0.55)' }
                          : { background: '#5e6ad2', boxShadow: '0 8px 20px -8px rgba(94,106,210,0.55)' }
                      }
                    >
                      {confirmState.confirmText || 'تأكيد'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body,
      )}
    </NotifyContext.Provider>
  )
}
