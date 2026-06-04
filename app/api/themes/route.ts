import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { themeCreateSchema } from '@/utils/validators'

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = themeCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('themes')
    .insert({
      user_id: user.id,
      product_url: parsed.data.productUrl || null,
      product_name: parsed.data.productName,
      images: parsed.data.images,
      primary_color: parsed.data.primaryColor,
      secondary_color: parsed.data.secondaryColor,
      content: parsed.data.content,
    })
    .select('id')
    .single()

  if (error) {
    // The enforce_theme_quota trigger raises P0001 with 'trial_limit_reached:'
    // when a free user hits their cap. Surface that as a 402 so the UI can
    // route them to /pricing.
    if (error.message?.startsWith('trial_limit_reached')) {
      return NextResponse.json(
        { error: 'limit_reached', message: error.message },
        { status: 402 }
      )
    }
    console.error('Theme insert error:', error)
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
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
