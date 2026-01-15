"use client"
import { useState, useEffect } from 'react'
import { motion, useScroll } from 'framer-motion'

export default function StoreNavbar({ 
  name, 
  primaryColor,
  onNavigate,
  onOpenCart
}: { 
  name: string
  primaryColor: string
  onNavigate: (view: 'home' | 'product') => void
  onOpenCart: () => void
}) {
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 10)
    })
  }, [scrollY])

  return (
    <>
      <motion.header 
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled || mobileMenuOpen ? 'bg-white shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Mobile Menu Icon */}
          <button 
            className="text-slate-800 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Logo */}
          <div 
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className="cursor-pointer text-xl font-extrabold tracking-tighter text-slate-900 md:text-2xl"
          >
            {name}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
            <button onClick={() => onNavigate('home')} className="transition hover:text-slate-900">Home</button>
            <button onClick={() => onNavigate('product')} className="transition hover:text-slate-900">Shop</button>
            <button onClick={() => onNavigate('home')} className="transition hover:text-slate-900">About Us</button>
            <button onClick={() => onNavigate('home')} className="transition hover:text-slate-900">Contact</button>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4 text-slate-800">
            {/* Search - Hidden for now or can be a product search */}
            {/* 
            <button className="hidden md:block hover:text-slate-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button> 
            */}
            
            {/* Cart */}
            <button 
              className="relative hover:text-slate-600"
              onClick={onOpenCart}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span 
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                1
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 h-screen bg-white px-6 py-4 shadow-lg md:hidden">
            <nav className="flex flex-col gap-6 text-lg font-medium text-slate-800">
              <button onClick={() => { onNavigate('home'); setMobileMenuOpen(false) }} className="text-left border-b border-slate-100 pb-4">Home</button>
              <button onClick={() => { onNavigate('product'); setMobileMenuOpen(false) }} className="text-left border-b border-slate-100 pb-4">Shop Now</button>
              <button onClick={() => { onNavigate('home'); setMobileMenuOpen(false) }} className="text-left border-b border-slate-100 pb-4">About Us</button>
              <button onClick={() => { onNavigate('home'); setMobileMenuOpen(false) }} className="text-left border-b border-slate-100 pb-4">Contact</button>
              <button onClick={() => setMobileMenuOpen(false)} className="text-left text-slate-500">Close Menu</button>
            </nav>
          </div>
        )}
      </motion.header>
    </>
  )
}
