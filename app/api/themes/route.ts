import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { themeCreateSchema } from '@/utils/validators'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // 1. Authenticate User
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Validate Body
  const body = await req.json()
  const parsed = themeCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  // 3. Check Limits (Subscription or Credits)
  // Check active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()
    
  const isActive = !!sub

  if (!isActive) {
    const { count } = await supabase.from('themes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((count || 0) >= 3) return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
  }

  // 4. Insert Theme
  const { data, error } = await supabase.from('themes').insert({
    user_id: user.id, // Link to auth user
    // email: user.email, // Optional: keep for legacy/backup
    product_url: parsed.data.productUrl,
    product_name: parsed.data.productName,
    images: parsed.data.images,
    primary_color: parsed.data.primaryColor,
    secondary_color: parsed.data.secondaryColor,
    content: parsed.data.content
  }).select('*').single()

  if (error) {
    console.error('Theme insert error:', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  
  const { data } = await supabase
    .from('themes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ themes: data || [] })
}
