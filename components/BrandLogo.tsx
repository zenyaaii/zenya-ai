'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * BrandLogo — the official زينيا wordmark.
 *
 * Renders the brand logo image from `/brand/wordmark.svg` (drop the official
 * file there — SVG preferred, or change the extension to .png). Until that file
 * exists it gracefully falls back to a gradient Cairo rendering of زينيا, so the
 * brand never shows a broken image and auto-upgrades the moment the asset lands.
 *
 * `className` sizes the box; the image fills its width. Use anywhere the brand
 * mark appears (footer signature, payment screen, etc.).
 */

/** Drop the official logo here. Change to '/brand/wordmark.png' if you export PNG. */
const LOGO_SRC = '/brand/wordmark.svg'

export default function BrandLogo({
  className,
  /** Extra classes on the rendered image / fallback svg. */
  markClassName,
}: {
  className?: string
  markClassName?: string
}) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn('select-none', className)} aria-label="زينيا">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={LOGO_SRC}
          alt="زينيا"
          className={cn('block w-full', markClassName)}
          onError={() => setFailed(true)}
        />
      ) : (
        // Fallback: gradient Cairo زينيا as scalable SVG.
        <svg
          viewBox="0 0 1000 380"
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          className={cn('block w-full overflow-visible', markClassName)}
          style={{ filter: 'drop-shadow(0 12px 44px rgba(94,106,210,0.22))' }}
          aria-hidden
        >
          <defs>
            <linearGradient id="zenyaBrandMark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f5ab8" />
              <stop offset="30%" stopColor="#5e6ad2" />
              <stop offset="50%" stopColor="#b9b8ff" />
              <stop offset="70%" stopColor="#7170ff" />
              <stop offset="100%" stopColor="#4f5ab8" />
            </linearGradient>
          </defs>
          <text
            x="500"
            y="250"
            textAnchor="middle"
            direction="rtl"
            fontSize="240"
            fontWeight="800"
            className="font-brandmark"
            style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
            fill="url(#zenyaBrandMark)"
          >
            زينيا
          </text>
        </svg>
      )}
    </div>
  )
}
