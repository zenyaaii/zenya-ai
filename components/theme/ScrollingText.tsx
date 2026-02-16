"use client"

export default function ScrollingText({ 
  texts = ["Free Shipping Worldwide", "30-Day Money Back Guarantee", "Premium Quality Materials", "24/7 Customer Support"],
  primaryColor,
  textColor = "#ffffff"
}: { 
  texts?: string[]
  primaryColor: string
  textColor?: string
}) {
  // Duplicate texts for smooth infinite scroll
  const scrollItems = [...texts, ...texts, ...texts, ...texts]

  return (
    <div className="overflow-hidden py-4" style={{ backgroundColor: primaryColor }}>
      <div className="flex w-max animate-scroll gap-8">
        {scrollItems.map((text, i) => (
          <div key={i} className="flex items-center gap-8 font-bold uppercase tracking-wider" style={{ color: textColor }}>
            <span>{text}</span>
            <span className="opacity-50">•</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </div>
  )
}
