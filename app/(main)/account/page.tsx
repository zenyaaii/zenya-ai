"use client"
import { useEffect, useState } from 'react'

export default function AccountPage() {
  const [email, setEmail] = useState('')
  useEffect(() => {
    setEmail(localStorage.getItem('zenya_email') || '')
  }, [])
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">Account</h1>
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="text-sm text-gray-600">Signed in as</div>
        <div className="text-lg font-semibold">{email || 'Guest'}</div>
      </div>
    </main>
  )
}
