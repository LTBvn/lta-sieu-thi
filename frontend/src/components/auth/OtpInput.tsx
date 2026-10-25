import React, { useRef } from 'react'

type Props = { value: string; onChange: (v: string) => void; disabled?: boolean }

/** 6 ô nhập mã OTP: tự nhảy ô, dán cả mã cũng được */
export default function OtpInput({ value, onChange, disabled }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  function setAt(i: number, d: string) {
    const next = digits.slice()
    next[i] = d
    onChange(next.join('').slice(0, 6))
  }

  return (
    <div className="flex justify-between gap-2" onPaste={e => {
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
      if (pasted) {
        e.preventDefault()
        onChange(pasted)
        refs.current[Math.min(pasted.length, 5)]?.focus()
      }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Số thứ ${i + 1} của mã OTP`}
          className="h-14 w-full min-w-0 rounded-xl border-2 border-border bg-white text-center text-2xl font-bold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(-1)
            setAt(i, v)
            if (v) refs.current[i + 1]?.focus()
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !d) refs.current[i - 1]?.focus()
            if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus()
            if (e.key === 'ArrowRight') refs.current[i + 1]?.focus()
          }}
        />
      ))}
    </div>
  )
}
