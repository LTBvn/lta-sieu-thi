import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = { page: number; total: number; onChange: (page: number) => void }

export default function Pagination({ page, total, onChange }: Props) {
  if (total <= 1) return null
  const btn = 'grid h-10 min-w-[2.5rem] place-items-center rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-40'

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Phân trang">
      <button className={`${btn} border-border bg-white hover:border-primary`} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map(n => (
        <button key={n} onClick={() => onChange(n)} className={`${btn} ${n === page ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:border-primary'}`}>
          {n}
        </button>
      ))}
      <button className={`${btn} border-border bg-white hover:border-primary`} disabled={page === total} onClick={() => onChange(page + 1)} aria-label="Trang sau">
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
