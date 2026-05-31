import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `Subprocessors — ${COMPANY.BRAND_NAME}`,
  description: `Third-party service providers that process data on behalf of ${COMPANY.PRODUCT_NAME}.`,
  alternates: { canonical: '/subprocessors' },
}

const SUBPROCESSORS = [
  {
    name: 'Supabase',
    role: 'Database, authentication, file storage',
    data: 'User account data, generated themes, scrape history, subscription records',
    location: 'Ireland (EU)',
    safeguard: 'EU-hosted; SCCs in DPA',
    url: 'https://supabase.com/privacy',
  },
  {
    name: 'Vercel',
    role: 'Hosting, edge CDN, deployment',
    data: 'All HTTP traffic, request logs, deployment metadata',
    location: 'USA (with EU edge)',
    safeguard: 'EU-U.S. Data Privacy Framework + SCCs',
    url: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'Stripe',
    role: 'Payment processing, subscription billing, customer portal',
    data: 'Name, email, billing address, payment-method details (card via Stripe, not us), transaction history',
    location: 'USA / Ireland (EU subsidiary)',
    safeguard: 'EU-U.S. Data Privacy Framework + SCCs',
    url: 'https://stripe.com/privacy',
  },
  {
    name: 'OpenAI',
    role: 'Large-language-model generation of theme content',
    data: 'The business brief you submit (no account identifiers attached)',
    location: 'USA',
    safeguard: 'API data not used for training (per OpenAI API ToS) + SCCs',
    url: 'https://openai.com/policies/privacy-policy',
  },
  {
    name: 'ScraperAPI',
    role: 'Product-page scraping (only when direct fetch fails)',
    data: 'The product URL you submit',
    location: 'USA',
    safeguard: 'SCCs',
    url: 'https://www.scraperapi.com/privacy-policy',
  },
  {
    name: 'Shopify',
    role: 'OAuth + product/theme APIs (only if you connect a store)',
    data: 'Shop domain, shop owner email, product data, theme data',
    location: 'Canada (adequacy decision under GDPR Art. 45)',
    safeguard: 'EU-Canada Adequacy Decision',
    url: 'https://www.shopify.com/legal/privacy',
  },
] as const

export default function SubprocessorsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 prose prose-neutral">
      <h1>Subprocessors</h1>
      <p className="text-sm text-muted">Last updated: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        {COMPANY.PRODUCT_NAME} engages the following third-party services to
        operate the Service. Each acts as a data processor under EU GDPR.
        Personal data is shared only to the extent necessary, governed by a
        Data Processing Agreement (DPA) where applicable, and protected with
        appropriate transfer safeguards.
      </p>

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
              <td><a href={s.url} target="_blank" rel="noopener">link</a></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Changes</h2>
      <p>
        We notify customers of new subprocessors by updating this page at
        least <strong>15 days</strong> before they begin processing personal
        data, allowing time to object via{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>.
      </p>
    </main>
  )
}
