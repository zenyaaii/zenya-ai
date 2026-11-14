"use client"

import { useEffect, useState } from 'react'
import RestaurantWizard from '@/components/zenya/build/wizards/RestaurantWizard'
import KindPicker from '@/components/zenya/build/KindPicker'

/**
 * The restaurant builder: the /demo/build design, generating for real.
 * It opens with «مشروعك أيّ واحد؟» (restaurant, café, sweets) after the
 * owner pressed «ابنِ»; the pick starts the wizard with the place's type.
 */
export default function RestaurantWizardPage() {
  const [kind, setKind] = useState<string | null | undefined>(undefined)
  useEffect(() => { setKind(new URLSearchParams(window.location.search).get('kind')) }, [])
  const choose = (id: string | null) => {
    const u = new URL(window.location.href)
    if (id) u.searchParams.set('kind', id); else u.searchParams.delete('kind')
    window.history.replaceState(null, '', u.toString())
    setKind(id)
    window.scrollTo({ top: 0 })
  }
  if (kind === undefined) return null
  return (
    <>
      <RestaurantWizard key={kind || 'none'} kind={kind || undefined} onBack={kind ? () => choose(null) : undefined} />
      {kind ? null : <KindPicker group="restaurant" onPick={choose} />}
    </>
  )
}
