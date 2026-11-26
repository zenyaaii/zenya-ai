'use client'

import type { ReactNode } from 'react'
import { useIsAdmin } from '@/lib/use-is-admin'

/** Shows `admin` to signed-in admins and `others` to everyone else (and while loading). */
export default function AdminSwap({ admin, others }: { admin: ReactNode; others: ReactNode }) {
  return <>{useIsAdmin() === true ? admin : others}</>
}
