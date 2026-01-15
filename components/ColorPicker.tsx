"use client"
import { useState } from 'react'

export default function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [v, setV] = useState(value)
  function set(val: string) {
    setV(val)
    onChange(val)
  }
  return (
    <div className="space-y-2">
      <div className="text-sm text-[#B9C1D9]">{label}</div>
      <div className="flex items-center gap-3">
        <input type="color" value={v} onChange={(e) => set(e.target.value)} className="h-10 w-14 rounded" />
        <input value={v} onChange={(e) => set(e.target.value)} className="flex-1 rounded border border-[#243049] bg-transparent px-3 py-2" />
      </div>
    </div>
  )
}
