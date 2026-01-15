import Image from 'next/image'

const logos = [
  'https://dummyimage.com/120x32/ddd/000.png&text=Stripe',
  'https://dummyimage.com/120x32/ddd/000.png&text=OpenAI',
  'https://dummyimage.com/120x32/ddd/000.png&text=Supabase',
  'https://dummyimage.com/120x32/ddd/000.png&text=Vercel'
]

export default function Logos() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-center text-sm font-medium text-muted uppercase tracking-wider mb-8">Powered by modern commerce stack</p>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale transition duration-500 hover:grayscale-0 hover:opacity-100">
        {/* Stripe */}
        <svg className="h-8" viewBox="0 0 60 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M59.64 10.28c0-5.3-3.95-9.67-9.67-9.67-6.03 0-9.87 4.2-9.87 9.87 0 3.3 1.3 5.76 3.4 7.3l-2.07 3.3c-2.4-1.9-4.3-5.5-4.3-10.6C37.13 4.2 41.53 0 47.97 0c8.2 0 13.8 5.7 13.8 13.6 0 1.2-.1 2.3-.3 3.3H41.53c.4 4.1 3.5 6.4 7.4 6.4 2.5 0 4.5-1 5.9-2.6l2.7 2.8c-2.1 2.5-5.2 3.8-8.7 3.8-6.3 0-11.6-4.5-11.6-10.8 0-6.2 5.2-10.8 11.5-10.8 4.6 0 8.3 2.7 10 7.2h-29.2v20.4h4.4v-3.7h.1c1.5 2.5 4.3 4.2 7.7 4.2 5.9 0 10.3-4.5 10.3-10.6 0-6-4.4-10.6-10.3-10.6-3.4 0-6.1 1.7-7.7 4.2H31.7V.6h-4.4v28.6h4.4V19.4zM48.8 19.3c-2.8 0-5.1-2.2-5.1-5.1 0-2.8 2.2-5.1 5.1-5.1 2.8 0 5.1 2.2 5.1 5.1 0 2.8-2.3 5.1-5.1 5.1zm-28.7-5.1c0 2.8-2.3 5.1-5.1 5.1-2.8 0-5.1-2.2-5.1-5.1 0-2.8 2.3-5.1 5.1-5.1 2.8 0 5.1 2.2 5.1 5.1zm-18.4 6.6L4.77 5.5l-3.3 1.2-.87 4.1L4.8 12.6l-3.3 1.2.9 3.3 3.3-1.2.9 3.3 3.3-1.2-.9-3.3 3.3 1.2-.9-3.3-3.3 1.2.9-3.3z" /></svg>
        {/* OpenAI (Text only as SVG for simplicity) */}
        <span className="text-xl font-bold tracking-tight">OpenAI</span>
        {/* Supabase */}
        <span className="text-xl font-bold tracking-tight text-green-500">Supabase</span>
        {/* Next.js */}
        <span className="text-xl font-bold tracking-tight">Next.js</span>
      </div>
    </section>
  )
}
