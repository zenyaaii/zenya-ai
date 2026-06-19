"use client"

export default function LogoList({ 
  title = "ظهرنا في",
  logos = ["Forbes", "TechCrunch", "GQ", "Vogue", "Wired", "Inc."]
}: { 
  title?: string
  logos?: string[] 
}) {
  return (
    <section className="bg-white py-12 border-y border-slate-100">
      <div className="container mx-auto px-6 text-center">
        {title && (
          <p className="mb-8 text-sm font-bold uppercase tracking-widest text-slate-400">
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale md:gap-16">
          {logos.map((brand, i) => (
            <div key={i} className="text-2xl font-black text-slate-800 flex items-center justify-center min-w-[100px]">
               {/* Placeholder for actual logo image */}
               {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
