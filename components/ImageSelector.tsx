"use client"
import { useState } from 'react'
import Image from 'next/image'

export default function ImageSelector({ images, selected, onChange }: { images: string[]; selected: string[]; onChange: (selected: string[]) => void }) {
  
  function toggle(url: string) {
    const next = selected.includes(url) ? selected.filter(i => i !== url) : [...selected, url]
    onChange(next)
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((src) => {
        const isSelected = selected.includes(src)
        return (
          <button 
            key={src} 
            onClick={() => toggle(src)} 
            className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-gray-200'}`}
          >
            <div className={`relative aspect-square transition-all duration-200 ${isSelected ? 'opacity-90' : 'group-hover:opacity-90'}`}>
              <Image src={src} alt="" fill className="object-cover" />
              
              {/* Selection Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center bg-primary/20 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-primary text-white rounded-full p-2 shadow-lg transform scale-100 transition-transform duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
