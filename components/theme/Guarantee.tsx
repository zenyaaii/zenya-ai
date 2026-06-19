export default function Guarantee({ 
  guarantee, 
  primaryColor 
}: { 
  guarantee: { title: string; text: string; days: number }
  primaryColor: string 
}) {
  return (
    <section className="bg-slate-50 py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="relative rounded-3xl bg-white p-8 md:p-16 shadow-2xl border-4 border-slate-100 text-center overflow-hidden">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 border-4 border-slate-100 text-5xl shadow-inner">
              🛡️
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">{guarantee.title}</h2>
            <div className="mx-auto h-1 w-24 bg-slate-200 mb-8 rounded-full" />
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">{guarantee.text}</p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-6 py-3 text-green-800 font-bold text-sm border border-green-200 shadow-sm">
                ✅ {guarantee.days}-Day Money Back Guarantee
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-6 py-3 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm">
                🔒 دفع آمن بشهادة SSL
              </div>
            </div>
            
            {/* Signature Area (Visual Flair) */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center opacity-60">
              <span className="font-cursive text-2xl text-slate-400 rotate-[-5deg] mb-2">فريق الرضا</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">وعد رسمي</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
