export default function TrustBadges() {
  const badges = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      title: 'Free Shipping',
      desc: 'On all orders'
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Lifetime Warranty',
      desc: 'We stand by our quality'
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: '30-Day Returns',
      desc: 'Hassle-free returns'
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Secure Checkout',
      desc: '100% Encrypted'
    }
  ]

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-6 sm:grid-cols-4">
      {badges.map((badge, i) => (
        <div key={i} className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
            {badge.icon}
          </div>
          <div className="text-xs font-bold text-slate-900">{badge.title}</div>
          <div className="text-[10px] text-slate-500">{badge.desc}</div>
        </div>
      ))}
    </div>
  )
}
