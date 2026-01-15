"use client"
export default function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      {Array.from({ length: total }).map((_, i) => (
        <div 
          key={i} 
          className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
            i < step 
              ? 'bg-primary shadow-[0_0_10px_rgba(79,70,229,0.3)]' 
              : 'bg-muted/20'
          }`} 
        />
      ))}
    </div>
  )
}
