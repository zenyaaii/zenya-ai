import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  const email = req.headers.get('x-user-email') || ''
  if (!email) return NextResponse.json({ status: 'guest' })
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ status: 'active' }) // Demo mode always active
  }

  try {
    const supabase = getSupabase()
    const { data } = await supabase.from('subscriptions').select('status').eq('email', email).single()
    return NextResponse.json({ status: data?.status || 'free' })
  } catch {
    return NextResponse.json({ status: 'free' })
  }
}
