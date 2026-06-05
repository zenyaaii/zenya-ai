/**
 * Per-registrar instructions for adding the Zenya DNS records.
 *
 * The hardest part of custom domains is the user not knowing where to
 * click. This file gives the modal a friendly per-registrar set of
 * directions instead of "add a CNAME" gibberish.
 */

export type RegistrarId =
  | 'godaddy'
  | 'namecheap'
  | 'cloudflare'
  | 'porkbun'
  | 'squarespace'
  | 'other'

export type RegistrarGuide = {
  id: RegistrarId
  name: string
  /** Direct link to where DNS records are managed, or the registrar home if not deep-linkable. */
  dashboardUrl: string
  /** Plain-language steps. Insert {RECORDS} as a placeholder where the modal will inject the actual records. */
  steps: string[]
  /** Optional gotchas / common mistakes. */
  notes?: string[]
}

export const REGISTRARS: RegistrarGuide[] = [
  {
    id: 'godaddy',
    name: 'GoDaddy',
    dashboardUrl: 'https://dcc.godaddy.com/manage/dns',
    steps: [
      'Sign in to your GoDaddy account and open Domain Portfolio.',
      'Click your domain, then click the DNS button at the top right.',
      'Add the records below. For the apex (root) record, GoDaddy calls the Name "@". TTL: leave default (600 sec or 1 hour).',
      'Save. Come back to this page — Zenya will detect the change automatically (usually within 5-15 minutes).',
    ],
    notes: [
      'If a conflicting A or CNAME record already exists, delete it before saving.',
      'GoDaddy sometimes shows "Pending" for a few minutes — that\'s normal.',
    ],
  },
  {
    id: 'namecheap',
    name: 'Namecheap',
    dashboardUrl: 'https://ap.www.namecheap.com/Domains/DomainControlPanel',
    steps: [
      'Sign in to Namecheap and click Domain List in the left sidebar.',
      'Find your domain and click Manage, then open the Advanced DNS tab.',
      'Under Host Records, click Add New Record and enter the values from below. Use "@" for the Host of an apex record. TTL: Automatic.',
      'Click the green checkmark to save each record. Wait a few minutes — Zenya checks automatically.',
    ],
    notes: [
      'Remove the default Parking Page CNAME on @ if Namecheap added one — it conflicts.',
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    dashboardUrl: 'https://dash.cloudflare.com/',
    steps: [
      'Sign in to Cloudflare and click on the domain you want to connect.',
      'In the left sidebar choose DNS → Records.',
      'Click Add record. Set the type and value from below. Use "@" as the Name for an apex record. Proxy status: turn OFF (DNS only — the grey cloud, not orange).',
      'Save. Zenya will verify automatically. Cloudflare DNS usually propagates in under a minute.',
    ],
    notes: [
      'IMPORTANT: keep the proxy OFF (grey cloud). Vercel issues its own SSL — Cloudflare proxy would conflict.',
      'If your nameservers point at Cloudflare, you do NOT need to change them — just add the records.',
    ],
  },
  {
    id: 'porkbun',
    name: 'Porkbun',
    dashboardUrl: 'https://porkbun.com/account/domainsSpeedy',
    steps: [
      'Sign in to Porkbun and click Details next to your domain.',
      'Scroll to the DNS Records section.',
      'Add the records below. Leave the "Host" field empty for an apex record (Porkbun fills "@" automatically). TTL: 600.',
      'Click Add. Zenya checks automatically — usually live within 5 minutes.',
    ],
  },
  {
    id: 'squarespace',
    name: 'Squarespace (formerly Google Domains)',
    dashboardUrl: 'https://account.squarespace.com/domains',
    steps: [
      'Sign in to Squarespace Domains and open the domain you want to connect.',
      'Click DNS in the left sidebar, then Custom Records at the bottom of the page.',
      'Click Add Record and enter the values from below. Use "@" for the Host of an apex record.',
      'Save. Squarespace propagation is usually within a few minutes.',
    ],
  },
  {
    id: 'other',
    name: 'Another registrar',
    dashboardUrl: '',
    steps: [
      'Sign in to your domain registrar\'s dashboard.',
      'Find the DNS / Nameservers / Records section for your domain.',
      'Add the records exactly as shown below. For an apex (root) domain, the Host or Name field is usually "@".',
      'Save. Zenya verifies automatically — usually within 5-30 minutes.',
    ],
    notes: [
      'If you\'re unsure, search your registrar\'s help center for "add CNAME record" or "add A record".',
    ],
  },
]

export function getRegistrar(id: RegistrarId): RegistrarGuide {
  return REGISTRARS.find((r) => r.id === id) || REGISTRARS[REGISTRARS.length - 1]
}
