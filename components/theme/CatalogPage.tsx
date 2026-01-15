"use client"
import { useState } from 'react'

export default function CatalogPage({ 
  primaryColor, 
  productName,
  onProductClick 
}: { 
  primaryColor: string
  productName: string
  onProductClick: () => void 
}) {
  const [sort, setSort] = useState('featured')

  return (
    <div className="min-h-screen bg-white pb-20 pt-10 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="mb-8 text-4xl font-extrabold tracking-tight text-slate-900">All Products</h1>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
            <div>
              <h3 className="mb-4 font-bold text-slate-900">Availability</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300" defaultChecked />
                  In Stock (14)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300" />
                  Out of Stock (2)
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8">
              <h3 className="mb-4 font-bold text-slate-900">Price</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300" />
                  Under $50 (4)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300" />
                  $50 - $100 (8)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300" />
                  Over $100 (4)
                </label>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
             <div className="mb-6 flex items-center justify-between">
               <span className="text-sm text-slate-500">Showing 16 products</span>
               <select 
                 className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                 value={sort}
                 onChange={(e) => setSort(e.target.value)}
               >
                 <option value="featured">Featured</option>
                 <option value="price-asc">Price: Low to High</option>
                 <option value="price-desc">Price: High to Low</option>
                 <option value="newest">Newest</option>
               </select>
             </div>

             <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
               {[...Array(9)].map((_, i) => (
                 <div key={i} className="group cursor-pointer" onClick={onProductClick}>
                   <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100 mb-4">
                     <div className="absolute inset-0 bg-slate-200 transition duration-500 group-hover:scale-110" />
                     {/* Dummy Image Overlay */}
                     <div className="absolute inset-0 flex items-center justify-center text-slate-300 opacity-30">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     {i === 2 && <div className="absolute top-2 left-2 bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Sold Out</div>}
                   </div>
                   <h3 className="text-sm font-medium text-slate-900 group-hover:underline">{productName} {String.fromCharCode(65+i)}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-slate-900">$49.00</span>
                   </div>
                 </div>
               ))}
             </div>

             {/* Pagination */}
             <div className="mt-12 flex justify-center gap-2">
               <button className="h-10 w-10 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-900 hover:text-slate-900">1</button>
               <button className="h-10 w-10 rounded border border-transparent flex items-center justify-center text-slate-900 font-bold bg-slate-100">2</button>
               <button className="h-10 w-10 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-900 hover:text-slate-900">3</button>
               <span className="flex items-end px-2 text-slate-400">...</span>
               <button className="h-10 w-10 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-900 hover:text-slate-900">→</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
