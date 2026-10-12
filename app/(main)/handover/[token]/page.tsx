import { AUTH_CSS } from '../../auth/styles'
import { handoverSiteName, handoverSiteUrl, isHandoverToken, serviceClient } from '@/lib/handover'
import HandoverAnswer from './HandoverAnswer'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'تسليم الموقع', robots: { index: false, follow: false } }

/**
 * Where "لا، فيه مشكلة" in the notification bell lands: /handover/<token>?a=no,
 * a short form for what went wrong. ?a=yes records a yes from the browser once
 * the page has loaded, never from the server on the request itself.
 */
export default async function HandoverPage({
  params,
  searchParams,
}: {
  params: { token: string }
  searchParams: { a?: string }
}) {
  const token = params.token
  let site: { name: string; url: string } | null = null
  if (isHandoverToken(token)) {
    const { data } = await serviceClient()
      .from('site_handovers')
      .select('theme:themes(id, slug, product_name, published_url)')
      .eq('token', token)
      .maybeSingle()
    const theme = (data as any)?.theme
    if (theme) site = { name: handoverSiteName(theme), url: handoverSiteUrl(theme) }
  }

  return (
    <main className="zs-wrap">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="zs-card">
        {site ? (
          <HandoverAnswer token={token} site={site} initial={searchParams.a === 'no' ? 'no' : 'yes'} />
        ) : (
          <div className="zs-top">
            <h1 className="zs-h1">الرابط غير صحيح</h1>
            <p className="zs-sub">لم نجد هذا التسليم. افتح الإشعار من الجرس في لوحة التحكم مرة أخرى.</p>
          </div>
        )}
      </div>
    </main>
  )
}
