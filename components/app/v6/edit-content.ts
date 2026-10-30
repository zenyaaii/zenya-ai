/**
 * Reads a theme as it is now, changes its content, and saves it: the
 * dashboard's small edits (a switch, the hours) that are not the editor's.
 * Reading first keeps a change made elsewhere in the meantime. Resolves with
 * the saved content, or null when it did not save.
 */
export async function editContent(id: string, fn: (c: any) => any): Promise<any | null> {
  try {
    const r = await fetch(`/api/themes/${id}`, { cache: 'no-store' })
    if (!r.ok) return null
    const { theme } = await r.json()
    const next = fn(theme?.content || {})
    const w = await fetch(`/api/themes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }),
    })
    return w.ok ? next : null
  } catch {
    return null
  }
}
