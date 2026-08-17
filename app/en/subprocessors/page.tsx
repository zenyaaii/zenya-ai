import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Subprocessors',
  description: 'The third-party providers that process data on behalf of Zenya, what each receives, where it sits, and the transfer safeguard that applies.',
  alternates: {
    canonical: `${SITE}/en/subprocessors`,
    languages: {
      en: `${SITE}/en/subprocessors`,
      ar: `${SITE}/subprocessors`,
      'x-default': `${SITE}/subprocessors`,
    },
  },
  openGraph: {
    title: 'Zenya subprocessors',
    description: 'Every third-party processor Zenya uses, with location and transfer safeguard.',
    url: `${SITE}/en/subprocessors`,
    type: 'website',
    locale: 'en_US',
  },
}

/** English mirror of the table in app/(main)/subprocessors/page.tsx. Keep in sync. */
const SUBPROCESSORS = [
  {
    name: 'Supabase',
    role: 'Database, authentication, and file storage',
    data: 'User account data, generated templates, scrape history, subscription records',
    location: 'Ireland (EU)',
    safeguard: 'EU-hosted; standard contractual clauses in the data processing agreement',
    url: 'https://supabase.com/privacy',
  },
  {
    name: 'Vercel',
    role: 'Hosting, edge CDN, and deployment',
    data: 'All HTTP traffic, request logs, deployment metadata',
    location: 'United States (with EU edge)',
    safeguard: 'EU-US Data Privacy Framework plus standard contractual clauses',
    url: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'Stripe',
    role: 'Payment processing, subscription billing, and the customer portal',
    data: 'Name, email, billing address, payment method details (card handled by Stripe, not by us), transaction history',
    location: 'United States / Ireland (EU subsidiary)',
    safeguard: 'EU-US Data Privacy Framework plus standard contractual clauses',
    url: 'https://stripe.com/privacy',
  },
  {
    name: 'OpenAI',
    role: 'Generating template content via large language models',
    data: 'The business description you submit (sent without any account identifiers attached)',
    location: 'United States',
    safeguard: 'API data is not used for training (per the OpenAI API terms) plus standard contractual clauses',
    url: 'https://openai.com/policies/privacy-policy',
  },
  {
    name: 'ScraperAPI',
    role: 'Product page scraping (only when a direct fetch fails)',
    data: 'The product URL you submit',
    location: 'United States',
    safeguard: 'Standard contractual clauses',
    url: 'https://www.scraperapi.com/privacy-policy',
  },
  {
    name: 'Shopify',
    role: 'Authentication (OAuth) and product/theme APIs (only if you connect a store)',
    data: 'Store domain, store owner email, product data, theme data',
    location: 'Canada (adequacy decision under GDPR Article 45)',
    safeguard: 'EU-Canada adequacy decision',
    url: 'https://www.shopify.com/legal/privacy',
  },
] as const

export default function EnSubprocessors() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 prose prose-neutral">
      <h1>Subprocessors</h1>
      <p className="text-sm text-muted">
        Last updated: <strong>{COMPANY.LAST_UPDATED}</strong>
      </p>

      <p>
        Zenya relies on the third-party services below to operate. Each acts as a data processor under the
        EU General Data Protection Regulation (GDPR). Personal data is shared only to the extent necessary,
        is governed by a data processing agreement where applicable, and is protected by an appropriate
        transfer safeguard.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Role</th>
              <th>Data shared</th>
              <th>Location</th>
              <th>Safeguard</th>
              <th>Privacy</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name}>
                <td><strong>{s.name}</strong></td>
                <td>{s.role}</td>
                <td>{s.data}</td>
                <td>{s.location}</td>
                <td>{s.safeguard}</td>
                <td><a href={s.url} target="_blank" rel="noopener">Link</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Changes</h2>
      <p>
        We notify customers of any new subprocessor by updating this page at least{' '}
        <strong>15 days</strong> before they begin processing personal data, leaving time to object via{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>.
      </p>

      <hr />
      <p className="text-sm text-muted">
        This is an English translation provided for convenience. The Arabic version at{' '}
        <a href="/subprocessors">zenyaai.co/subprocessors</a> is the authoritative text; if the two differ,
        the Arabic version prevails.
      </p>
    </main>
  )
}
