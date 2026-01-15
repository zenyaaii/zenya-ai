import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
