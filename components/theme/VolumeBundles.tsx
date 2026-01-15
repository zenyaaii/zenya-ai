'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function VolumeBundles({ 
  price, 
  originalPrice,
  primaryColor, 
  onChange 
}: { 
  price: number
  originalPrice?: number
  primaryColor: string
  onChange: (qty: number) => void
}) {
  const [selected, setSelected] = useState(2) // Default to Buy 2

  const options = [
    { qty: 1, discount: 0, label: 'Standard' },
    { qty: 2, discount: 15, label: 'Most Popular' },
    { qty: 3, discount: 25, label: 'Best Value' },
  ]

  const handleSelect = (qty: number) => {
    setSelected(qty)
    onChange(qty)
  }

  return (
    <div className="my-6 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">Select Quantity</span>
        <span className="text-xs font-medium text-red-600 animate-pulse">
          🔥 High demand
        </span>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const total = price * opt.qty * ((100 - opt.discount) / 100)
          const perItem = total / opt.qty
          const isSelected = selected === opt.qty

          return (
            <div
              key={opt.qty}
              onClick={() => handleSelect(opt.qty)}
              className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                isSelected 
                  ? 'bg-slate-50 shadow-md' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              style={{ borderColor: isSelected ? primaryColor : undefined }}
            >
              {/* Badge */}
              {opt.discount > 0 && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold text-white shadow-sm rounded-full"
                  style={{ backgroundColor: opt.label === 'Best Value' ? '#ef4444' : primaryColor }}
                >
                  {opt.label === 'Most Popular' ? 'MOST POPULAR' : `SAVE ${opt.discount}%`}
                </div>
              )}

              <div className="flex items-center justify-between">
                {/* Radio & Text */}
                <div className="flex items-center gap-3">
                  <div 
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected ? 'border-transparent' : 'border-slate-300'
                    }`}
                    style={{ backgroundColor: isSelected ? primaryColor : 'transparent' }}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      Buy {opt.qty}
                      {originalPrice && <span className="ml-2 text-xs font-normal text-slate-500 line-through">${(originalPrice * opt.qty).toFixed(2)}</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      ${perItem.toFixed(2)}/each
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="font-bold text-slate-900">${total.toFixed(2)}</div>
                  {opt.discount > 0 && (
                    <div className="text-xs font-bold text-green-600">
                      Save ${(price * opt.qty - total).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
