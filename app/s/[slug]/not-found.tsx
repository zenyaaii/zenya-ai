import Link from 'next/link'

export default function PublicSiteNotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f7f4ed',
        color: '#1c1c1c',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <p
          style={{
            display: 'inline-block',
            background: 'rgba(94,106,210,0.10)',
            color: '#5e6ad2',
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          404 · Site not found
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15, marginBottom: 12 }}>
          This Zenya site isn’t live.
        </h1>
        <p style={{ color: '#6b6b6b', lineHeight: 1.6, marginBottom: 24 }}>
          It may have been unpublished, the slug may have changed, or you may have followed an old link.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#5e6ad2',
            color: 'white',
            padding: '10px 18px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(94,106,210,0.25)',
          }}
        >
          Build your own with Zenya →
        </Link>
      </div>
    </main>
  )
}
