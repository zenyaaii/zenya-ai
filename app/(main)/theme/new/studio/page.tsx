"use client"

/**
 * «موقع علامة تجارية وقصة»: the links-first questions (Anas, 2026-11-20).
 * The old one-page form lived here until this rebuild; it is in git history.
 */
import { useRouter } from 'next/navigation'
import BrandWizard from '@/components/zenya/build/BrandWizard'

export default function NewStudioPage() {
  const router = useRouter()
  return <BrandWizard onBack={() => router.push('/theme/new')} />
}
