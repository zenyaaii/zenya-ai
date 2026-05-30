'use client'
import { useState } from 'react'

export default function Upsell({ 
  primaryColor,
  mainProductImage,
  onAdd,
  heading = 'Frequently Bought Together',
  product,
}: { 
  primaryColor: string
  mainProductImage: string
  onAdd: () => void
  heading?: string
  product?: { name: string; price: number; originalPrice: number; image: string }
}) {
  const [added, setAdded] = useState(false)

  const upsellProduct = product || {
    name: "Premium Protection Case",
    price: 14.99,
    originalPrice: 29.99,
    image: "https://images.unsplash.com/photo-1541140532154-b024d705b909?q=80&w=400&auto=format&fit=crop"
  }

  const handleAdd = () => {
    setAdded(true)
    onAdd()
  }

  if (added) return null

  return (
    <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <h3 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wide">
        {heading}
      </h3>
      
      <div className="flex items-center gap-4">
        {/* Images */}
        <div className="flex items-center gap-2">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img
              src={mainProductImage}
              alt="Main"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="text-slate-400 font-bold">+</span>
          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img
              src={upsellProduct.image}
              alt="Upsell"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-900 line-clamp-1">{upsellProduct.name}</div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-red-600">${upsellProduct.price}</span>
            <span className="text-xs text-slate-400 line-through">${upsellProduct.originalPrice}</span>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          Add +
        </button>
      </div>
      
      <div className="mt-3 text-xs text-slate-500">
        <span className="text-green-600 font-bold">✓ Free Shipping</span> applied to this bundle
      </div>
    </div>
  )
}
