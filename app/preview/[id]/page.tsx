import { createClient } from '@/utils/supabase/server'
import ThemeActions from '@/components/ThemeActions'
import Link from 'next/link'
import { Suspense } from 'react'
import FullScreenPreview from '@/components/FullScreenPreview';

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
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .maybeSingle()
    isPro = !!profile?.is_pro
  }

  // Developer Backdoor
  // Add ?dev=true to the URL to enable Pro features for testing
  if (searchParams.dev === 'true') {
    isPro = true
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24 md:pb-10">
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
                images={theme.images || []}
                price={theme.content?.price}
                originalPrice={theme.content?.originalPrice}
                description={theme.content?.hero?.subheadline}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <FullScreenPreview 
          name={theme.product_name} 
          images={theme.images || []} 
          primary={theme.primary_color} 
          secondary={theme.secondary_color} 
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
            images={theme.images || []}
            price={theme.content?.price}
            originalPrice={theme.content?.originalPrice}
            description={theme.content?.hero?.subheadline}
          />
        </Suspense>
      </div>
    </main>
  )
}
