"use client"

export default function AnnouncementBar({ 
  text = "شحن مجاني لكل العالم ✈️ + خصم 50٪ اليوم فقط!",
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
