"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    country: 'United States',
    zip: '',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      alert('Payment processing simulated! This would connect to Stripe in production.')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        <div className="mb-10">
          <Link href="/pricing" className="text-sm font-medium text-muted hover:text-primary transition-colors flex items-center gap-1">
            ← Back to Pricing
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Checkout
          </h1>
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              
              {/* Contact Info */}
              <div className="bg-elevated rounded-2xl p-6 shadow-soft-sm border border-token">
                <h2 className="text-xl font-bold text-foreground mb-4">Contact Information</h2>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-muted mb-1">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-elevated rounded-2xl p-6 shadow-soft-sm border border-token">
                <h2 className="text-xl font-bold text-foreground mb-4">Billing Address</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-1">
                    <label htmlFor="firstName" className="block text-sm font-medium text-muted mb-1">First Name</label>
                    <input 
                      type="text" 
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="lastName" className="block text-sm font-medium text-muted mb-1">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-muted mb-1">Address</label>
                    <input 
                      type="text" 
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="city" className="block text-sm font-medium text-muted mb-1">City</label>
                    <input 
                      type="text" 
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="zip" className="block text-sm font-medium text-muted mb-1">ZIP / Postal Code</label>
                    <input 
                      type="text" 
                      id="zip"
                      name="zip"
                      required
                      value={formData.zip}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="country" className="block text-sm font-medium text-muted mb-1">Country</label>
                    <select 
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option>United States</option>
                      <option>Canada</option>
                      <option>United Kingdom</option>
                      <option>Australia</option>
                      <option>Germany</option>
                      <option>France</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-elevated rounded-2xl p-6 shadow-soft-sm border border-token">
                <h2 className="text-xl font-bold text-foreground mb-4">Payment Details</h2>
                
                <div className="mb-6 flex gap-4">
                  <div className="flex-1 rounded-lg border-2 border-primary bg-primary/5 p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <svg className="h-6 w-6 text-primary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    <span className="text-sm font-bold text-foreground">Card</span>
                  </div>
                  <div className="flex-1 rounded-lg border border-token bg-surface p-4 flex flex-col items-center justify-center cursor-pointer hover:border-muted-token transition-all opacity-50">
                    <svg className="h-6 w-6 text-muted mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.274 0 5.874 0h14.746a.644.644 0 0 1 .643.75l-1.506 5.38h-8.22l-.76 4.793h7.625l-1.378 5.378h-6.24l-.946 5.036zm5.8-13.844l.875-5.38h6.72l.883-5.38h-8.478z"/></svg>
                    <span className="text-sm font-medium text-muted">PayPal</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium text-muted mb-1">Name on Card</label>
                    <input 
                      type="text" 
                      id="cardName"
                      name="cardName"
                      required
                      value={formData.cardName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-muted mb-1">Card Number</label>
                    <input 
                      type="text" 
                      id="cardNumber"
                      name="cardNumber"
                      required
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="0000 0000 0000 0000"
                      className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiry" className="block text-sm font-medium text-muted mb-1">Expiry Date</label>
                      <input 
                        type="text" 
                        id="expiry"
                        name="expiry"
                        required
                        value={formData.expiry}
                        onChange={handleInputChange}
                        placeholder="MM / YY"
                        className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="cvc" className="block text-sm font-medium text-muted mb-1">CVC</label>
                      <input 
                        type="text" 
                        id="cvc"
                        name="cvc"
                        required
                        value={formData.cvc}
                        onChange={handleInputChange}
                        placeholder="123"
                        className="w-full rounded-lg border border-token bg-surface px-4 py-2.5 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:sticky lg:top-8"
            >
              <div className="bg-elevated rounded-2xl p-8 shadow-soft-lg border border-token">
                <h2 className="text-2xl font-bold text-foreground mb-6">Order Summary</h2>
                
                <div className="flex items-start gap-4 mb-8">
                  <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-2xl shadow-lg">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Zenya Pro Plan</h3>
                    <p className="text-muted text-sm">Monthly Subscription</p>
                  </div>
                  <div className="ml-auto font-bold text-foreground">
                    $4.99
                  </div>
                </div>

                <div className="space-y-4 border-t border-token pt-6 mb-8">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span>$4.99</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground pt-4 border-t border-token">
                    <span>Total</span>
                    <span>$4.99</span>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay $4.99
                    </>
                  )}
                </button>
                
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Payments are secure and encrypted
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-3 gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                 {/* Placeholders for trust badges if needed, or just simple text/icons */}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
