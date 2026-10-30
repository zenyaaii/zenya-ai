'use client'

import { createContext, useContext } from 'react'
import type { EditorConfig } from '@/utils/theme-editor-types'
import type { Doc, Check } from './model'

/** A view in the panel's stack: the tabs, a section, an item of a list, the check, the history. */
export type View =
  | { v: 'root'; scroll?: number }
  | { v: 'sec'; id: string; scroll?: number }
  | { v: 'item'; list: string; i: number; panel: string; scroll?: number }
  | { v: 'check'; scroll?: number }
  | { v: 'history'; scroll?: number }

export type SetOpts = { label?: string; key?: string | null; src?: 'panel' | 'inline' }

/** Everything the panel and its fields need from the editor. */
export type Ed = {
  config: EditorConfig
  doc: Doc
  setC: (path: string, val: any, o?: SetOpts) => void
  setDoc: (fn: (d: Doc) => Doc, label: string, key?: string | null) => void
  openAt: (panel: string, path?: string | null, o?: { anim?: string | null; scroll?: boolean; focus?: boolean }) => void
  push: (v: View) => void
  openPicker: (path: string) => void
  setImage: (path: string, val: string) => void
  uploadTo: (path: string, file: File) => void
  suggest: (anchor: HTMLElement, path: string, label: string) => void
  addItem: (path: string) => void
  moveItem: (path: string, from: number, to: number) => void
  hidden: (id: string) => boolean
  toggleHidden: (id: string) => void
  /** Open a dashboard page (a new tab in the product, a toast in the demo). */
  dash: (to: 'seo' | 'reviews' | 'domains', label: string) => void
  phone: string
  currency: string
  siteHost: string | null
  checks: Check[]
  offline: boolean
  /** The config marks the fields that offer «اقترح صياغة». */
  suggestMarked: boolean
}

export const EdCtx = createContext<Ed | null>(null)
export const useEd = () => useContext(EdCtx)!
