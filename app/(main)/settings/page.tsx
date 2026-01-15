"use client"
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const val = localStorage.getItem('zenya_theme') === 'dark'
    setDark(val)
    document.documentElement.classList.toggle('dark', val)
  }, [])
  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('zenya_theme', next ? 'dark' : 'light')
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold">Settings</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-token bg-elevated p-6 shadow-soft-md">
          <div className="font-semibold">Appearance</div>
          <label className="mt-3 flex items-center gap-3">
            <input type="checkbox" checked={dark} onChange={toggleDark} className="h-5 w-5 rounded border-token" />
            <span>Dark mode</span>
          </label>
          <div className="mt-3 text-subtle">Toggles the site between light and dark. Respects saved preference.</div>
        </div>
      </div>
    </main>
  )
}
