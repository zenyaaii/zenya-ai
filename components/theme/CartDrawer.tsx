"use client"
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useEffect } from 'react'

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  productName, 
  price, 
  image, 
  primaryColor 
}: { 
  isOpen: boolean
  onClose: () => void
  productName: string
  price: number
  image: string
  primaryColor: string
}) {
  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[70] h-full w-full max-w-md bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-lg font-bold text-slate-900">Your Cart (1)</h2>
                <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-slate-200">
                    <Image src={image} alt={productName} fill className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{productName}</h3>
                      <p className="text-sm text-slate-500">Color: Black / Size: M</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded border border-slate-300">
                        <button className="px-2 py-1 text-slate-600 hover:bg-slate-100">-</button>
                        <span className="px-2 text-sm font-medium">1</span>
                        <button className="px-2 py-1 text-slate-600 hover:bg-slate-100">+</button>
                      </div>
                      <span className="font-bold text-slate-900">${price}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t bg-slate-50 p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-bold text-slate-900">${price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-bold text-green-600">Free</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold border-t border-slate-200 pt-4">
                  <span className="text-slate-900">Total</span>
                  <span className="text-slate-900">${price}</span>
                </div>
                <button 
                  onClick={() => window.location.href = '/demo-full/checkout'}
                  className="w-full rounded-full py-4 text-lg font-bold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  Checkout Now
                </button>
                <p className="text-center text-xs text-slate-400">
                  Secure Checkout - SSL Encrypted
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
