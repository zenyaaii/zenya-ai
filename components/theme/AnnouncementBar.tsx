"use client"

export default function AnnouncementBar({ 
  text = "Free Shipping Worldwide ✈️ + 50% OFF Today Only!",
  primaryColor 
}: { 
  text?: string
  primaryColor: string 
}) {
  return (
    <div 
      className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white sm:text-sm"
      style={{ backgroundColor: primaryColor }}
    >
      {text}
    </div>
  )
}
