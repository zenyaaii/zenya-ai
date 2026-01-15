"use client"
import { useState } from 'react'

const items = [
  { q: 'How does Zenya AI generate content?', a: 'We use OpenAI to craft persuasive copy based on your product name and audience. You can edit before saving.' },
  { q: 'Can I use my own images?', a: 'Yes. You can select images after scraping or upload your own in upcoming updates.' },
  { q: 'Is there a free plan?', a: 'Yes. You can create up to 3 themes on Free. Pro unlocks more with a 14-day trial.' }
]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold">FAQ</h1>
      <div className="mt-6 divide-y divide-border">
        {items.map((item, i) => (
          <button key={i} className="w-full text-left py-4 focus-visible:ring-2 focus-visible:ring-primary rounded-lg" aria-expanded={open===i} onClick={()=>setOpen(open===i?null:i)}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">{item.q}</div>
              <div className="text-subtle">{open===i ? '-' : '+'}</div>
            </div>
            {open===i && <div className="mt-2 text-muted">{item.a}</div>}
          </button>
        ))}
      </div>
    </main>
  )
}
