import { Sparkles } from 'lucide-react'
import Link from 'next/link'

/**
 * Required under the EU AI Act (Art. 50) for generative-AI services:
 * users must be informed that they're interacting with AI-generated
 * content. Use anywhere we surface generated output.
 */
export default function AIDisclosure({
  className = '',
  variant = 'inline',
}: {
  className?: string
  variant?: 'inline' | 'banner'
}) {
  if (variant === 'banner') {
    return (
      <div
        className={`flex items-start gap-2.5 rounded-lg border border-token bg-background px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-muted ${className}`}
        role="note"
        aria-label="إشعار بمحتوى مولَّد بالذكاء الاصطناعي"
      >
        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" strokeWidth={2} />
        <p>
          <strong className="text-foreground">محتوى مولَّد بالذكاء الاصطناعي.</strong>{' '}
          القوالب والنصوص والصور في هذه الصفحة من إنتاج نماذج لغوية كبيرة وقد تحتوي
          على أخطاء. راجِعها قبل النشر — انظر{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            الشروط §10
          </Link>
          .
        </p>
      </div>
    )
  }
  return (
    <p
      className={`inline-flex items-center gap-1.5 text-[11.5px] text-muted ${className}`}
      role="note"
    >
      <Sparkles className="h-3 w-3 text-primary" strokeWidth={2} />
      مولَّد بالذكاء الاصطناعي — راجِعه قبل النشر.
    </p>
  )
}
