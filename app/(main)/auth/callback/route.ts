import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

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
    if (!error) return redirect(request, origin, next)
  }

  // PKCE flow: ?code=... (must be opened on the same device that initiated auth).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return redirect(request, origin, next)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

function redirect(request: Request, origin: string, next: string) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  if (isLocalEnv) return NextResponse.redirect(`${origin}${next}`)
  if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${next}`)
  return NextResponse.redirect(`${origin}${next}`)
}
