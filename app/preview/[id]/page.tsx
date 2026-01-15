import { createClient } from '@/utils/supabase/server'
import ThemePreview from '@/components/ThemePreview'
import ThemeActions from '@/components/ThemeActions'
import Link from 'next/link'
import { Suspense } from 'react'

export default async function PreviewPage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()
  const { data: theme } = await supabase.from('themes').select('*').eq('id', params.id).single()
  
  if (!theme) return <div className="p-10 text-center">Theme not found</div>

  const { data: { user } } = await supabase.auth.getUser()
  let isPro = false
  
  // Check subscription
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()
      
    isPro = !!sub
  }

  // Developer Backdoor
  // Add ?dev=true to the URL to enable Pro features for testing
  if (searchParams.dev === 'true') {
    isPro = true
  }

  return (
    <main className="min-h-screen pb-24 md:pb-10">
      <div className="sticky top-0 z-10 border-b border-token bg-elevated/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tighter text-foreground">Zenya</Link>
            <span className="h-6 w-px bg-token" />
            <span className="text-sm font-medium text-muted">{theme.product_name}</span>
          </div>
          <div className="hidden md:block">
            <Suspense fallback={<div>Loading...</div>}>
              <ThemeActions 
                themeId={theme.id} 
                isPro={isPro}
                content={theme.content}
                colors={{ primary: theme.primary_color, secondary: theme.secondary_color }}
                name={theme.product_name}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <ThemePreview 
          name={theme.product_name} 
          images={theme.images || []} 
          primaryColor={theme.primary_color} 
          secondaryColor={theme.secondary_color} 
          content={theme.content} 
          price={theme.content?.price}
          originalPrice={theme.content?.originalPrice}
          shopName={theme.content?.shopName}
        />
      </div>

      <div className="md:hidden">
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeActions 
            themeId={theme.id} 
            isPro={isPro}
            content={theme.content}
            colors={{ primary: theme.primary_color, secondary: theme.secondary_color }}
            name={theme.product_name}
          />
        </Suspense>
      </div>
    </main>
  )
}
