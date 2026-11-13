'use client'
import { useEffect, useState } from 'react'
import ServicesPreview from '@/components/theme/services/ServicesPreview'
export default function P() {
  const [s, setS] = useState<any>(null)
  useEffect(() => { try { setS(JSON.parse(sessionStorage.getItem('beynoun:demo-niche-site') || 'null')) } catch {} }, [])
  if (!s) return null
  return <ServicesPreview content={{ ...s.services, niche: 'barber' } as any} colorOverrides={s.color_overrides} presetId="graphite" />
}
