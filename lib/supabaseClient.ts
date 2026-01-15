import { createClient } from '@supabase/supabase-js'

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Demo Mode: If keys are missing, return a mock client
  if (!url || !key) {
    return {
      auth: {
        signInWithOtp: async () => ({ error: null }),
        signOut: async () => ({ error: null }),
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            order: async () => ({ data: [], error: null })
          }),
          single: async () => ({ data: null, error: null })
        }),
        insert: async (data: any) => ({ 
          data: { ...data, id: 'demo-' + Date.now() }, 
          error: null,
          select: () => ({ single: async () => ({ data: { ...data, id: 'demo-' + Date.now() }, error: null }) })
        }),
        upsert: async () => ({ error: null })
      })
    } as any
  }
  
  return createClient(url, key)
}
