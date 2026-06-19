import { CheckCircle2 } from 'lucide-react'

/**
 * OAuth landing page: the Shopify install flow redirects here (via the
 * zenya_return_to cookie) after the store is connected. The original
 * /build tab is polling the connection endpoint, so the user just
 * closes this tab and continues there.
 */
export default function ShopifyConnectedPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md rounded-3xl border border-token bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(21,128,61,0.10)]">
          <CheckCircle2 className="h-7 w-7 text-[#15803d]" />
        </div>
        <h1 className="mt-4 text-[20px] font-bold text-foreground">تم ربط المتجر</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          أصبح متجر Shopify الخاص بك مرتبطًا بزينيا الآن. عُد إلى التبويب الذي كنت تبني فيه
          قالبك — سيلتقط الاتصال تلقائيًا.
        </p>
        <p className="mt-4 text-[12px] text-muted">يمكنك إغلاق هذا التبويب.</p>
      </div>
    </div>
  )
}
