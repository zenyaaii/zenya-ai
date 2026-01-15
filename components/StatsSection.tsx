'use client'

export default function StatsSection() {
  const stats = [
    { value: '10k+', label: 'Themes Generated' },
    { value: '2.5s', label: 'Avg. Load Time' },
    { value: '$40M+', label: 'Client Revenue' },
    { value: '24/7', label: 'AI Availability' },
  ]

  return (
    <section className="py-12 bg-primary text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-white/10 md:divide-x">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-4xl font-black tracking-tight mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-white/80 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
