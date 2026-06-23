import { ImageResponse } from 'next/og'

// Browser-tab favicon — Next renders a 32x32 PNG at build/request time.
// We draw the rightmost glyph of the زينيا wordmark (vectorized from the brand
// artwork) in white on the brand-indigo tile, so the tab icon IS the logo.
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
export const runtime = 'edge'

// The glyph as an inline SVG data URI (viewBox 0 0 101 102).
const GLYPH =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 101 102' fill='%23fff'>" +
  "<rect x='85' y='1' width='16' height='16'/>" +
  "<rect x='0' y='17' width='16' height='85'/>" +
  "<rect x='85' y='43' width='16' height='43'/>" +
  "<rect x='42' y='86' width='59' height='16'/>" +
  '</svg>'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #5e6ad2 0%, #7c83e8 100%)',
          borderRadius: 6,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={19} height={19} alt="زينيا" src={`data:image/svg+xml;utf8,${GLYPH}`} />
      </div>
    ),
    size
  )
}
