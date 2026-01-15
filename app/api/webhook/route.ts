import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
  
  const buf = await req.text()
  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }
  
  // Use Service Role Key for Admin Access to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const userId = session.client_reference_id
      const customerId = session.customer
      const subscriptionId = session.subscription
      
      if (userId && subscriptionId) {
        const { error } = await supabase.from('subscriptions').upsert({ 
          id: subscriptionId,
          user_id: userId, 
          status: 'active',
          stripe_customer_id: customerId,
        })
        
        if (error) {
            console.error('Error upserting subscription:', error)
            return NextResponse.json({ error: 'db_error' }, { status: 500 })
        }
      }
    }
    
    if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      const sub = event.data.object as any
      const subscriptionId = sub.id
      const status = sub.status
      
      const { error } = await supabase.from('subscriptions')
        .update({ 
          status,
          stripe_customer_id: sub.customer
        })
        .eq('id', subscriptionId)
        
      if (error) {
        console.error('Error updating subscription:', error)
        return NextResponse.json({ error: 'db_error' }, { status: 500 })
      }
    }
  } catch (err: any) {
      console.error('Webhook processing error:', err)
      return NextResponse.json({ error: 'processing_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
