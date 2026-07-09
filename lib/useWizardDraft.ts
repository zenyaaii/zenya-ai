'use client'
import { useEffect, useRef } from 'react'

/**
 * Persist a wizard's form state to localStorage so it survives a signup
 * redirect. On mount, hydrates once from the stored draft (if any); after that,
 * writes on every form change. Clear the draft after a successful save with
 * `clearWizardDraft(key)`.
 */
export function useWizardDraft<T extends object>(
  key: string,
  form: T,
  setForm: (patch: T) => void,
) {
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const raw = localStorage.getItem(`zenya:wizard:${key}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setForm({ ...form, ...parsed })
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(`zenya:wizard:${key}`, JSON.stringify(form))
    } catch {}
  }, [key, form])
}

export function clearWizardDraft(key: string) {
  try {
    localStorage.removeItem(`zenya:wizard:${key}`)
  } catch {}
}
