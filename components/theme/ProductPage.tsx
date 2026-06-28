"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function ProductPage({
  primaryColor,
  productName = 'الباقة المميّزة',
  price = 49.99,
  originalPrice = 99.99,
  images = [],
  onBack,
  onAddToCart,
  content,
  actions,
}: {
  primaryColor: string
  productName?: string
  price?: number
  originalPrice?: number
  images?: string[]
  onBack: () => void
  onAddToCart: () => void
  content?: any
  actions?: { addToCartLabel?: string }
}) {
  const safeImages =
    Array.isArray(images) && images.length
      ? images
      : [
          'https://placehold.co/900x900/e2e8f0/1e293b?text=Product+Image',
          'https://placehold.co/900x900/f1f5f9/1e293b?text=Side+View',
          'https://placehold.co/900x900/f8fafc/1e293b?text=Detail+View',
        ]

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [selectedQuantity, setSelectedQuantity] = useState<1 | 2 | 3>(1)
  const [stock] = useState(14)
  const [timeLeft, setTimeLeft] = useState(12 * 60 * 60)
  const [visitors, setVisitors] = useState(24)
  const [isStickyVisible, setIsStickyVisible] = useState(false)
  const mainAtcRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const tick = window.setInterval(() => {
      setVisitors((v) => {
        const change = Math.floor(Math.random() * 3) - 1
        const next = v + change
        return Math.min(Math.max(next, 12), 45)
      })
    }, 4000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const el = mainAtcRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setIsStickyVisible(rect.top < 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const addToCartLabel = actions?.addToCartLabel || 'أضف إلى السلة'
  const unitPrice = Number(price) || 49.99
  const unitCompare = Number(originalPrice) || 0
  const discountPct = selectedQuantity === 2 ? 15 : selectedQuantity === 3 ? 25 : 0

  const totals = useMemo(() => {
    const regular = unitPrice * selectedQuantity
    const discounted = discountPct > 0 ? regular * (1 - discountPct / 100) : regular
    const savings = Math.max(0, regular - discounted)
    return { regular, discounted, savings }
  }, [unitPrice, selectedQuantity, discountPct])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}س ${m}د ${s}ث`
  }

  return (
    <div className="py-10 lg:py-20 bg-white">
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 z-50 lg:hidden"
        style={{ display: isStickyVisible ? undefined : 'none' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-500 font-medium">السعر الإجمالي</div>
            <div className="font-bold text-slate-900 text-lg">${totals.discounted.toFixed(2)}</div>
          </div>
          <button
            onClick={onAddToCart}
            className="flex-1 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:brightness-110 transition text-sm uppercase tracking-wide"
            style={{ backgroundColor: primaryColor }}
          >
            {addToCartLabel}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6">
        <nav className="mb-6 flex items-center text-sm text-slate-500">
          <button onClick={onBack} className="hover:text-slate-900 hover:underline">
            الرئيسية
          </button>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-900 line-clamp-1">{productName}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="hidden lg:block space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                <img
                  src={safeImages[currentMediaIndex]}
                  alt={productName}
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                {unitCompare > unitPrice ? (
                  <div className="absolute top-4 start-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm z-10">
                    تخفيض
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-6 gap-3">
                {safeImages.slice(0, 6).map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMediaIndex(idx)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition hover:border-slate-300 focus:ring-2 focus:ring-primary ${
                      currentMediaIndex === idx ? 'border-primary' : 'border-transparent'
                    }`}
                    style={currentMediaIndex === idx ? ({ borderColor: primaryColor } as any) : undefined}
                  >
                    <img src={src} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-4 lg:hidden">
              {safeImages.map((src, idx) => (
                <div key={idx} className="snap-center shrink-0 w-[85vw] relative aspect-square rounded-xl bg-slate-100 overflow-hidden shadow-sm">
                  <img src={src} alt={`${productName} ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  {idx === 0 && unitCompare > unitPrice ? (
                    <div className="absolute top-4 start-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                      تخفيض
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-400 text-sm">★★★★★</div>
                    <span className="text-xs font-bold text-slate-700">4.9/5</span>
                  </div>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs text-slate-500 underline decoration-slate-300 underline-offset-2">
                    {content?.product?.review_count || '1,234 تقييم'}
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">{productName}</h1>

                <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-full bg-green-100 text-green-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    متوفّر وجاهز للشحن
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-full bg-blue-100 text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    ضمان سنة كاملة
                  </div>
                </div>
              </div>

              <div className="mb-6 flex items-end gap-3 border-b border-slate-100 pb-6">
                <span className="text-4xl font-bold text-slate-900">${unitPrice.toFixed(2)}</span>
                {unitCompare > unitPrice ? (
                  <>
                    <span className="mb-1.5 text-xl text-slate-400 line-through">${unitCompare.toFixed(2)}</span>
                    <span className="mb-2 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                      وفّر ${(unitCompare - unitPrice).toFixed(2)}
                    </span>
                  </>
                ) : null}
              </div>

              <div className="mb-8 space-y-3 rounded-lg border border-red-100 bg-red-50 p-4 relative overflow-hidden">
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-600 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  {visitors} يشاهدون الآن
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-red-800 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    بقي {stock} قطعة فقط!
                  </div>
                  <div>
                    ينتهي خلال: <span className="tabular-nums" dir="ltr">{formatTime(timeLeft)}</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-red-200">
                  <div className="h-full rounded-full bg-red-500 transition-all duration-1000" style={{ width: `${(stock / 50) * 100}%` }} />
                </div>
              </div>

              <div className="my-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">اختر الكمية</span>
                  <span className="text-xs font-medium text-red-600 animate-pulse">🔥 طلب مرتفع</span>
                </div>

                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedQuantity(1)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      selectedQuantity === 1 ? 'bg-slate-50 shadow-md ring-1' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    style={selectedQuantity === 1 ? ({ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` } as any) : undefined}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                            selectedQuantity === 1 ? 'bg-primary' : 'border-slate-300 bg-transparent'
                          }`}
                          style={selectedQuantity === 1 ? ({ borderColor: primaryColor, backgroundColor: primaryColor } as any) : undefined}
                        >
                          {selectedQuantity === 1 ? <div className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">اشترِ 1</div>
                          <div className="text-xs text-slate-500">السعر العادي</div>
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 text-lg">${unitPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedQuantity(2)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      selectedQuantity === 2 ? 'bg-slate-50 shadow-md ring-1' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    style={selectedQuantity === 2 ? ({ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` } as any) : undefined}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white shadow-sm rounded-full uppercase tracking-wide"
                      style={{ backgroundColor: primaryColor }}
                    >
                      الأكثر شيوعًا
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                            selectedQuantity === 2 ? 'bg-primary' : 'border-slate-300 bg-transparent'
                          }`}
                          style={selectedQuantity === 2 ? ({ borderColor: primaryColor, backgroundColor: primaryColor } as any) : undefined}
                        >
                          {selectedQuantity === 2 ? <div className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">اشترِ 2</div>
                          <div className="text-xs font-bold text-green-600">وفّر 15%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-lg">${(unitPrice * 2 * 0.85).toFixed(2)}</div>
                        <div className="text-xs text-slate-400 line-through">${(unitPrice * 2).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedQuantity(3)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      selectedQuantity === 3 ? 'bg-slate-50 shadow-md ring-1' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    style={selectedQuantity === 3 ? ({ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` } as any) : undefined}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white shadow-sm rounded-full uppercase tracking-wide"
                      style={{ backgroundColor: primaryColor }}
                    >
                      أفضل قيمة
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                            selectedQuantity === 3 ? 'bg-primary' : 'border-slate-300 bg-transparent'
                          }`}
                          style={selectedQuantity === 3 ? ({ borderColor: primaryColor, backgroundColor: primaryColor } as any) : undefined}
                        >
                          {selectedQuantity === 3 ? <div className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">اشترِ 3</div>
                          <div className="text-xs font-bold text-green-600">وفّر 25%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-lg">${(unitPrice * 3 * 0.75).toFixed(2)}</div>
                        <div className="text-xs text-slate-400 line-through">${(unitPrice * 3).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                ref={mainAtcRef}
                id="main-atc-button"
                onClick={onAddToCart}
                className="w-full rounded-full py-4 text-xl font-bold text-white shadow-xl transition hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 bg-primary mt-6 mb-4"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{addToCartLabel}</span>
                {totals.savings > 0 ? <span className="text-sm opacity-90 font-normal">— وفّر ${totals.savings.toFixed(2)}</span> : null}
              </button>

              <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
                <details className="group py-3" open>
                  <summary className="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition">
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      الوصف
                    </span>
                    <span className="transition transform duration-200 group-open:rotate-180">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-sm leading-relaxed text-slate-600">
                    {content?.solution?.text || content?.hero?.subheadline || 'مصنوع ليمنحك إحساسًا فاخرًا من اليوم الأول.'}
                  </div>
                </details>

                <details className="group py-3">
                  <summary className="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition">
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3h18v13H3z"></path>
                        <path d="M16 21H8"></path>
                        <path d="M12 17v4"></path>
                      </svg>
                      الشحن
                    </span>
                    <span className="transition transform duration-200 group-open:rotate-180">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-sm leading-relaxed text-slate-600">
                    {content?.tabs?.find?.((t: any) => t?.title === 'الشحن')?.content || content?.tabs?.[1]?.content || 'إرسال سريع + توصيل مع تتبّع.'}
                  </div>
                </details>

                <details className="group py-3">
                  <summary className="flex w-full cursor-pointer items-center justify-between text-sm font-bold text-slate-900 hover:text-primary transition">
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      ضماننا
                    </span>
                    <span className="transition transform duration-200 group-open:rotate-180">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </summary>
                  <div className="mt-3 text-sm leading-relaxed text-slate-600">{content?.guarantee?.text || 'إرجاع خلال 30 يومًا. إجراء بسيط. بلا توتر.'}</div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-100 pt-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
                لماذا {productName}
              </h2>
              <p className="text-slate-600 mb-8 max-w-2xl">
                فوائد سريعة، وقراءة سهلة، ودليل يجعل المشترين يشعرون بالأمان.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                {(content?.features?.length ? content.features : []).slice(0, 6).map((f: any, i: number) => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}>
                      <span className="font-extrabold">★</span>
                    </div>
                    <div className="font-bold text-slate-900">{f?.title || 'ميزة'}</div>
                    <div className="mt-1 text-sm text-slate-600 leading-relaxed">{f?.desc || ''}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 shadow-sm">
                <div className="text-sm font-extrabold text-slate-900 mb-4">تسوّق بثقة</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white border border-slate-100 p-4">
                    <div className="text-xs font-bold text-slate-900">شحن مجاني</div>
                    <div className="text-xs text-slate-500 mt-1">توصيل مع تتبّع</div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-100 p-4">
                    <div className="text-xs font-bold text-slate-900">إرجاع سهل</div>
                    <div className="text-xs text-slate-500 mt-1">سياسة 30 يومًا</div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-100 p-4">
                    <div className="text-xs font-bold text-slate-900">دفع آمن</div>
                    <div className="text-xs text-slate-500 mt-1">مشفّر</div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-100 p-4">
                    <div className="text-xs font-bold text-slate-900">دعم سريع</div>
                    <div className="text-xs text-slate-500 mt-1">نردّ بسرعة</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white" id="reviews">
          <div className="border-t border-slate-100 pt-16">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-center text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mb-10">
                آراء العملاء
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {(content?.testimonials?.length ? content.testimonials : []).slice(0, 6).map((t: any, i: number) => (
                  <div key={i} className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-md transition">
                    <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
                    <div className="text-slate-700 leading-relaxed">&ldquo;{t?.text || ''}&rdquo;</div>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <div className="font-bold text-slate-900">{t?.name || 'عميل'}</div>
                      <div className="text-slate-500">{t?.location || 'مشترٍ موثّق'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white" id="faq">
          <div className="border-t border-slate-100 pt-16">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-center text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mb-10">
                الأسئلة الشائعة
              </h2>
              <div className="divide-y divide-slate-100 rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                {(content?.faq?.length ? content.faq : []).slice(0, 8).map((f: any, i: number) => (
                  <details key={i} className="group p-6" open={i === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-start font-extrabold text-slate-900">
                      <span>{f?.q || ''}</span>
                      <span className="transition transform duration-200 group-open:rotate-180">▼</span>
                    </summary>
                    <div className="mt-3 text-sm text-slate-600 leading-relaxed">{f?.a || ''}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-slate-50">
          <div className="border-t border-slate-100 pt-16 pb-16">
            <div className="mx-auto max-w-3xl text-center px-4">
              <div className="rounded-[2rem] bg-white border border-slate-100 shadow-xl p-10">
                <div className="text-6xl mb-6">🛡️</div>
                <div className="text-2xl font-extrabold text-slate-900">{content?.guarantee?.title || 'ضمان بلا مخاطرة'}</div>
                <div className="mt-4 text-slate-600 leading-relaxed">{content?.guarantee?.text || 'جرّبه دون مخاطرة. إن لم يعجبك، سنعيد لك أموالك.'}</div>
                <button
                  onClick={() => {
                    mainAtcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className="mt-8 inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-extrabold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {addToCartLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

