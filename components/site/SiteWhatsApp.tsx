'use client'

import { useEffect, useState } from 'react'

/**
 * The floating WhatsApp button the owner turns on from the dashboard
 * («زر واتساب» on the Sites page). Bottom left, like the services template's
 * own: the Made with Beynoun badge holds bottom right. It shows once the
 * visitor has scrolled past the first screen.
 */
export default function SiteWhatsApp({ href }: { href: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > 520)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا على واتساب"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className="fixed left-4 z-50 inline-flex h-[52px] items-center gap-2 rounded-full pe-5 ps-4 text-sm font-bold text-white transition-all duration-300 motion-reduce:transition-opacity"
      style={{
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        background: '#25D366',
        boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
        opacity: show ? 1 : 0,
        transform: show ? 'none' : 'translateY(16px) scale(0.92)',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.91-2.19-.24-.58-.48-.5-.66-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.96-3.48-.23-.36a9.43 9.43 0 0 1-1.44-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.6 23.3l5.68-1.49a11.33 11.33 0 0 0 5.77 1.47h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.33-8.03z" />
      </svg>
      <span>واتساب</span>
    </a>
  )
}
