/**
 * Floating "Made with Zenya" badge for free-tier hosted sites. Pro hosting
 * users get this hidden via the `hide` prop (server passes it in based on
 * the owner's profile.has_hosting flag).
 */
export default function MadeWithZenya({ hide = false }: { hide?: boolean }) {
  if (hide) return null
  return (
    <a
      href="https://zenyaai.co?ref=badge"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Made with Zenya"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 2147483000,
        background: 'rgba(15, 15, 18, 0.92)',
        color: '#f7f4ed',
        padding: '8px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        letterSpacing: 0.1,
        textDecoration: 'none',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06) inset',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        backdropFilter: 'saturate(140%) blur(6px)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background:
            'linear-gradient(135deg, #5e6ad2 0%, #c8a96a 100%)',
        }}
      />
      Made with <strong style={{ fontWeight: 600 }}>Zenya</strong>
    </a>
  )
}
