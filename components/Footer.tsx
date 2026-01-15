import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-token bg-surface/50 pt-16 pb-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-4 lg:gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-primary/10">
                <Image src="/logo.png" alt="Zenya Logo" fill className="object-cover" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-primary bg-clip-text text-transparent">Zenya</span>
            </Link>
            <p className="mt-4 text-sm text-muted leading-relaxed">
              Generate trustworthy, high-converting themes for one-product stores in minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-token bg-elevated px-2.5 py-0.5 text-xs font-medium text-subtle">SSL Secured</span>
              <span className="inline-flex items-center rounded-full border border-token bg-elevated px-2.5 py-0.5 text-xs font-medium text-subtle">Stripe Payments</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/about" className="text-muted transition hover:text-primary">About</Link></li>
              <li><Link href="/contact" className="text-muted transition hover:text-primary">Contact</Link></li>
              <li><Link href="/pricing" className="text-muted transition hover:text-primary">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/privacy" className="text-muted transition hover:text-primary">Privacy</Link></li>
              <li><Link href="/terms" className="text-muted transition hover:text-primary">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Product</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/theme/new" className="text-muted transition hover:text-primary">Create Theme</Link></li>
              <li><Link href="/dashboard" className="text-muted transition hover:text-primary">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-token pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-subtle">© {new Date().getFullYear()} Zenya AI. All rights reserved.</p>
          <div className="flex gap-4">
            {/* Social icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  )
}
