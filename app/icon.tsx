import { ImageResponse } from 'next/og'

// Used as <link rel="icon"> — Next renders a 32x32 PNG at build/request time.
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
export const runtime = 'edge'

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
          color: 'white',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'system-ui',
          letterSpacing: -1,
          borderRadius: 6,
        }}
      >
        Z
      </div>
    ),
    size
  )
}
