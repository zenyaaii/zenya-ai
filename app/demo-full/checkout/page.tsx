"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function CheckoutPage() {
  const [step, setStep] = useState(1) // 1: Info, 2: Shipping, 3: Payment
  
  return (
    <div className="min-h-screen bg-white">
      {/* Checkout Layout: 2 Columns */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Column: Form (60%) */}
        <div className="w-full lg:w-[58%] pt-12 pb-12 px-6 lg:px-12 lg:pr-16 order-2 lg:order-1 border-r border-slate-200">
            {/* Header / Breadcrumbs */}
            <div className="max-w-xl mx-auto lg:mx-0 lg:ml-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Zenya Store</h1>
                    <div className="flex items-center text-xs space-x-2 text-slate-500">
                        <span className={step >= 1 ? "text-blue-600 font-medium" : ""}>Cart</span>
                        <span className="text-slate-300">/</span>
                        <span className={step >= 1 ? "text-blue-600 font-medium" : ""}>Information</span>
                        <span className="text-slate-300">/</span>
                        <span className={step >= 2 ? "text-blue-600 font-medium" : ""}>Shipping</span>
                        <span className="text-slate-300">/</span>
                        <span className={step >= 3 ? "text-blue-600 font-medium" : ""}>Payment</span>
                    </div>
                </div>

                {/* Express Checkout */}
                {step === 1 && (
                    <div className="mb-8">
                        <div className="flex flex-col items-center border-b border-slate-200 pb-8">
                            <p className="text-slate-500 text-sm mb-4">Express checkout</p>
                            <div className="flex gap-2 w-full max-w-sm">
                                <button className="flex-1 bg-[#5A31F4] text-white py-3 rounded hover:bg-[#4825C9] transition font-bold text-sm">Shop Pay</button>
                                <button className="flex-1 bg-[#FFC439] text-black py-3 rounded hover:bg-[#F4BB2E] transition font-bold text-sm">PayPal</button>
                                <button className="flex-1 bg-black text-white py-3 rounded hover:bg-slate-800 transition font-bold text-sm">GPay</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Fields */}
                <form className="space-y-6">
                    {/* Contact */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-medium text-slate-900">Contact</h2>
                            <Link href="#" className="text-sm text-blue-600 hover:underline">Log in</Link>
                        </div>
                        <input type="email" placeholder="Email or mobile phone number" className="w-full border border-slate-300 rounded-md px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                        <div className="mt-2 flex items-center">
                             <input type="checkbox" id="news" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                             <label htmlFor="news" className="ml-2 text-sm text-slate-600">Email me with news and offers</label>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="pt-4">
                        <h2 className="text-lg font-medium text-slate-900 mb-3">Shipping address</h2>
                        <div className="space-y-3">
                            <select className="w-full border border-slate-300 rounded-md px-4 py-3 text-slate-900 bg-white">
                                <option>United States</option>
                                <option>Canada</option>
                                <option>United Kingdom</option>
                            </select>
                            <div className="flex gap-3">
                                <input type="text" placeholder="First name" className="w-1/2 border border-slate-300 rounded-md px-4 py-3 text-slate-900" />
                                <input type="text" placeholder="Last name" className="w-1/2 border border-slate-300 rounded-md px-4 py-3 text-slate-900" />
                            </div>
                            <input type="text" placeholder="Address" className="w-full border border-slate-300 rounded-md px-4 py-3 text-slate-900" />
                            <input type="text" placeholder="Apartment, suite, etc. (optional)" className="w-full border border-slate-300 rounded-md px-4 py-3 text-slate-900" />
                            <div className="flex gap-3">
                                <input type="text" placeholder="City" className="w-1/3 border border-slate-300 rounded-md px-4 py-3 text-slate-900" />
                                <select className="w-1/3 border border-slate-300 rounded-md px-4 py-3 text-slate-900 bg-white">
                                    <option>State</option>
                                    <option>California</option>
                                    <option>New York</option>
                                </select>
                                <input type="text" placeholder="ZIP code" className="w-1/3 border border-slate-300 rounded-md px-4 py-3 text-slate-900" />
                            </div>
                            <div className="mt-2 flex items-center">
                             <input type="checkbox" id="save" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                             <label htmlFor="save" className="ml-2 text-sm text-slate-600">Save this information for next time</label>
                        </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-6 mt-6">
                        <Link href="/demo-full" className="text-blue-600 hover:underline text-sm flex items-center">
                            <span className="mr-2">←</span> Return to cart
                        </Link>
                        <button type="button" onClick={() => setStep(2)} className="bg-blue-600 text-white px-8 py-4 rounded-md font-medium hover:bg-blue-700 transition shadow-sm">
                            Continue to shipping
                        </button>
                    </div>
                </form>
                
                <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 flex gap-4">
                    <a href="#" className="hover:underline">Refund policy</a>
                    <a href="#" className="hover:underline">Shipping policy</a>
                    <a href="#" className="hover:underline">Privacy policy</a>
                    <a href="#" className="hover:underline">Terms of service</a>
                </div>
            </div>
        </div>

        {/* Right Column: Order Summary (40%) */}
        <div className="w-full lg:w-[42%] bg-slate-50 border-l border-slate-200 pt-12 pb-12 px-6 lg:px-12 order-1 lg:order-2">
            <div className="max-w-md mx-auto lg:mx-0">
                {/* Product List */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between gap-4">
                         <div className="relative">
                            <div className="w-16 h-16 border border-slate-200 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" />
                            </div>
                            <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">1</span>
                         </div>
                         <div className="flex-1">
                            <h3 className="text-sm font-medium text-slate-900">Zenya Vacuum V2</h3>
                            <p className="text-xs text-slate-500">Black / Pro</p>
                         </div>
                         <div className="text-sm font-medium text-slate-900">$49.99</div>
                    </div>
                </div>

                {/* Discount Code */}
                <div className="flex gap-2 mb-8 border-b border-slate-200 pb-8">
                    <input type="text" placeholder="Discount code or gift card" className="flex-1 border border-slate-300 rounded-md px-4 py-3 text-sm" />
                    <button className="bg-slate-200 text-slate-500 font-medium px-4 rounded-md hover:bg-slate-300 transition text-sm disabled:opacity-50">Apply</button>
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm text-slate-600 mb-6">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-900">$49.99</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="text-xs text-slate-500">Calculated at next step</span>
                    </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 pt-6">
                    <span className="text-base font-medium text-slate-900">Total</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xs text-slate-500">USD</span>
                        <span className="text-2xl font-bold text-slate-900">$49.99</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
