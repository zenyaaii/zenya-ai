import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { sendWelcomeOnce } from '@/lib/lifecycle-email'

/**
 * Fire the once-only welcome email for a freshly-authenticated user.
 * Skipped for password-recovery links (those are always returning users, and
 * sendWelcomeOnce dedupes anyway). Awaited but never throws — a slow or failed
 * send must not block the redirect into the dashboard.
 */
async function welcome(supabase: ReturnType<typeof createClient>, type: EmailOtpType | null) {
  if (type === 'recovery') return
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await sendWelcomeOnce({
        id: user.id,
        email: user.email,
        fullName: (user.user_metadata as any)?.full_name ?? null,
      })
    }
  } catch (e) {
    console.error('[auth/callback] welcome email failed:', e)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = createClient()

  // Modern flow: token_hash + type (works across devices/browsers).
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      await welcome(supabase, type)
      return redirect(request, origin, next)
    }
  }

  // PKCE flow: ?code=... (must be opened on the same device that initiated auth).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await welcome(supabase, type)
      return redirect(request, origin, next)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

function redirect(request: Request, origin: string, next: string) {
  // Allow an absolute `next` as long as it stays within our own domain — this
  // lets the accounts portal send a confirmed user straight to
  // dashboard.zenyaai.co after email verification.
  if (/^https?:\/\//i.test(next)) {
    try {
      const u = new URL(next)
      const h = u.hostname.toLowerCase()
      if (h === 'zenyaai.co' || h.endsWith('.zenyaai.co')) {
        return NextResponse.redirect(next)
      }
    } catch { /* fall through to relative handling */ }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  if (isLocalEnv) return NextResponse.redirect(`${origin}${next}`)
  if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${next}`)
  return NextResponse.redirect(`${origin}${next}`)
}
