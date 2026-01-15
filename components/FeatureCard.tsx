import { ReactNode } from 'react'

export default function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl border border-token bg-elevated p-6 shadow-soft-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft-lg">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{desc}</p>
    </div>
  )
}
