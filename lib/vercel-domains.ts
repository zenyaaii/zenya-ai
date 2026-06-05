/**
 * Thin typed wrapper around the Vercel Domains REST API for the domains
 * we host on behalf of users.
 *
 * Env required (all set in Vercel production):
 *   VERCEL_API_TOKEN   — personal/team token with project + domain scope
 *   VERCEL_PROJECT_ID  — the prj_… id of the Zenya project
 *   VERCEL_TEAM_ID     — the team_… id that owns the project (optional for
 *                        personal projects; required if the project lives
 *                        under a team like ours does)
 */

const VERCEL_BASE = 'https://api.vercel.com'

export class VercelDomainError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

function env() {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID
  if (!token) throw new VercelDomainError('VERCEL_API_TOKEN is not set', 500, 'missing_token')
  if (!projectId) throw new VercelDomainError('VERCEL_PROJECT_ID is not set', 500, 'missing_project')
  return { token, projectId, teamId }
}

function teamQuery(teamId?: string) {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : ''
}

async function vercelFetch<T = any>(
  path: string,
  init: RequestInit & { token: string }
): Promise<T> {
  const r = await fetch(`${VERCEL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${init.token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })
  const text = await r.text()
  let body: any = null
  try { body = text ? JSON.parse(text) : null } catch { body = { raw: text } }

  if (!r.ok) {
    const msg = body?.error?.message || body?.message || `Vercel API ${r.status}`
    const code = body?.error?.code || body?.code
    throw new VercelDomainError(msg, r.status, code)
  }
  return body as T
}

// -------- Types we care about --------------------------------------------

export type VercelDomain = {
  name: string
  apexName: string
  projectId: string
  redirect?: string | null
  redirectStatusCode?: number | null
  gitBranch?: string | null
  customEnvironmentId?: string | null
  updatedAt?: number
  createdAt?: number
  verified: boolean
  verification?: Array<{
    type: string
    domain: string
    value: string
    reason: string
  }>
}

export type VercelDomainConfig = {
  configuredBy?: 'CNAME' | 'A' | 'http' | null
  acceptedChallenges?: ('dns-01' | 'http-01')[]
  misconfigured: boolean
}

// -------- Public functions ------------------------------------------------

export async function addDomainToProject(domain: string): Promise<VercelDomain> {
  const { token, projectId, teamId } = env()
  return vercelFetch<VercelDomain>(
    `/v10/projects/${projectId}/domains${teamQuery(teamId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
      token,
    }
  )
}

export async function getProjectDomain(domain: string): Promise<VercelDomain> {
  const { token, projectId, teamId } = env()
  return vercelFetch<VercelDomain>(
    `/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${teamQuery(teamId)}`,
    { method: 'GET', token }
  )
}

export async function getDomainConfig(domain: string): Promise<VercelDomainConfig> {
  const { token, teamId } = env()
  return vercelFetch<VercelDomainConfig>(
    `/v6/domains/${encodeURIComponent(domain)}/config${teamQuery(teamId)}`,
    { method: 'GET', token }
  )
}

export async function verifyProjectDomain(domain: string): Promise<VercelDomain> {
  const { token, projectId, teamId } = env()
  // POST to /verify triggers an immediate verification re-check.
  return vercelFetch<VercelDomain>(
    `/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}/verify${teamQuery(teamId)}`,
    { method: 'POST', token }
  )
}

export async function removeProjectDomain(domain: string): Promise<void> {
  const { token, projectId, teamId } = env()
  await vercelFetch(
    `/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${teamQuery(teamId)}`,
    { method: 'DELETE', token }
  )
}

// -------- High-level status helper ---------------------------------------

export type DomainStatus =
  | 'pending_dns'   // DNS records haven't been added yet
  | 'pending_ssl'   // DNS resolved, SSL cert still issuing
  | 'live'          // verified + configured + SSL ok
  | 'error'         // misconfigured or other failure

export type DomainSummary = {
  status: DomainStatus
  verified: boolean
  misconfigured: boolean
  /** Records the user needs to add at their registrar. */
  required: Array<{ type: 'A' | 'CNAME' | 'TXT'; name: string; value: string; reason?: string }>
  errorMessage?: string
}

const APEX_REQUIRED_A = '76.76.21.21' // Vercel's documented apex A record
const APEX_REQUIRED_CNAME_TARGET = 'cname.vercel-dns.com'

export async function fetchDomainSummary(domain: string): Promise<DomainSummary> {
  const [info, config] = await Promise.all([
    getProjectDomain(domain).catch((e: VercelDomainError) => {
      if (e.status === 404) return null
      throw e
    }),
    getDomainConfig(domain).catch(() => null),
  ])

  if (!info) {
    return {
      status: 'pending_dns',
      verified: false,
      misconfigured: true,
      required: dnsHintsFor(domain),
      errorMessage: 'Domain not attached to the Zenya project.',
    }
  }

  const verified = !!info.verified
  const misconfigured = !!config?.misconfigured

  // Build required records: if Vercel returned verification challenges,
  // surface those (TXT-based ownership), otherwise default DNS hints.
  const required: DomainSummary['required'] =
    (info.verification && info.verification.length > 0)
      ? info.verification.map((v) => ({
          type: (v.type?.toUpperCase() === 'TXT' ? 'TXT' : 'CNAME') as 'TXT' | 'CNAME',
          name: v.domain,
          value: v.value,
          reason: v.reason,
        }))
      : dnsHintsFor(domain)

  let status: DomainStatus
  if (!verified) status = 'pending_dns'
  else if (misconfigured) status = 'pending_dns'
  else if (config && !config.configuredBy) status = 'pending_ssl'
  else status = 'live'

  return { status, verified, misconfigured, required }
}

/**
 * Default DNS records to recommend when Vercel hasn't given us specific
 * verification challenges (the common path when the domain isn't owned by
 * another Vercel team).
 */
function dnsHintsFor(domain: string): DomainSummary['required'] {
  const isApex = !domain.includes('.') || domain.split('.').length <= 2 && !domain.startsWith('www.')
  if (isApex) {
    return [{ type: 'A', name: '@', value: APEX_REQUIRED_A }]
  }
  // www.* or other subdomain → CNAME
  const sub = domain.split('.')[0]
  return [{ type: 'CNAME', name: sub, value: APEX_REQUIRED_CNAME_TARGET }]
}
