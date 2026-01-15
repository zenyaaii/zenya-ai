"use client"
import { useState } from 'react'

export default function ContactPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  function submit() {
    setSent(true)
  }
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold">Contact</h1>
      <p className="mt-2 text-gray-600">Reach out for support or partnerships.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-md border border-gray-200 bg-white px-4 py-3" />
          <textarea value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Your message" className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 h-32" />
          <button onClick={submit} className="rounded-full bg-brand px-5 py-3 text-white">Send</button>
          {sent && <div className="text-sm text-gray-600">Thanks! We&apos;ll get back to you.</div>}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="font-semibold">Email</div>
          <div className="mt-2 text-gray-600">support@zenya.ai</div>
        </div>
      </div>
    </main>
  )
}
