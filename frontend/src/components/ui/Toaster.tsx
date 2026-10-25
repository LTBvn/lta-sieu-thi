import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useToast } from '../../store/useToast'

export default function Toaster() {
  const toasts = useToast(s => s.toasts)

  return (
    <div className="pointer-events-none fixed bottom-[8.5rem] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto flex animate-slide-in items-center gap-3 rounded-xl bg-gray-900 p-3 text-sm text-white shadow-lift">
          {t.image ? <img src={t.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : null}
          <span className="flex-1">{t.message}</span>
          <CheckCircle2 size={18} className="shrink-0 text-green-400" />
        </div>
      ))}
    </div>
  )
}
