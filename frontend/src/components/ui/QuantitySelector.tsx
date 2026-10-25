import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { formatQty, roundQty } from '../../utils/format'

type Props = {
  value: number
  onChange: (n: number) => void
  step?: number
  /** Giá trị nhỏ nhất; nút "-" ở mức này sẽ gọi onChange(0) nếu allowZero */
  min?: number
  allowZero?: boolean
  size?: 'sm' | 'md'
}

export default function QuantitySelector({ value, onChange, step = 1, min = step, allowZero = false, size = 'md' }: Props) {
  const pad = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const dec = () => {
    const next = roundQty(value - step)
    if (next >= min) onChange(next)
    else if (allowZero) onChange(0)
  }

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-white">
      <button type="button" aria-label="Giảm" className={`${pad} grid place-items-center text-gray-600 hover:bg-gray-50 disabled:opacity-40`} onClick={dec} disabled={!allowZero && value <= min}>
        <Minus size={16} />
      </button>
      <div className={`min-w-[2.5rem] px-1 text-center font-semibold ${size === 'sm' ? 'text-sm' : ''}`}>{formatQty(value)}</div>
      <button type="button" aria-label="Tăng" className={`${pad} grid place-items-center text-primary hover:bg-primary-light`} onClick={() => onChange(roundQty(value + step))}>
        <Plus size={16} />
      </button>
    </div>
  )
}
