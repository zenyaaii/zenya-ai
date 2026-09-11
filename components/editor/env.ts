'use client'

import { createContext, useContext } from 'react'

/**
 * What the editor is connected to.
 *
 * `offline` is true when ThemeEditor runs on an injected store instead of the
 * database — today only the /demo/editor candidate. The two pieces of the
 * editor that call a service on their own, the AI rewrite and the image
 * gallery, read this and stop at an honest door instead of fetching:
 * a demo must not call /api/ai/rewrite, /api/gallery or /api/upload.
 *
 * The default is the live editor, so a field used anywhere else behaves
 * exactly as it always has.
 */
export type EditorEnv = { offline: boolean }

const EditorEnvContext = createContext<EditorEnv>({ offline: false })

export const EditorEnvProvider = EditorEnvContext.Provider

export function useEditorEnv(): EditorEnv {
  return useContext(EditorEnvContext)
}
