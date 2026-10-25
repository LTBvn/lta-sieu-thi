import React, { useEffect, useState } from 'react'
import { Loader2, Phone, Terminal } from 'lucide-react'
import { authApi, errorMessage, OtpPurpose } from '../../services/api'
import OtpInput from './OtpInput'

type Props = {
  purpose: OtpPurpose
  /** Số điện thoại cố định (vd: đã nhập ở bước trước); không truyền thì cho khách nhập */
  phone?: string
  submitLabel: string
  otpSimulated?: boolean
  /** Gọi khi khách bấm xác nhận; trả về câu lỗi nếu thất bại */
  onSubmit: (phone: string, otp: string) => Promise<string | null>
  /** Báo cho trang cha biết số này đã có tài khoản chưa (dùng khi liên kết) */
  onSent?: (info: { existing: boolean }) => void
  children?: React.ReactNode
}

const PHONE = /^0\d{9}$/

/** Bước xác minh số điện thoại: nhập SĐT → gửi mã → nhập 6 số → xác nhận */
export default function PhoneOtpStep({ purpose, phone: fixedPhone, submitLabel, otpSimulated, onSubmit, onSent, children }: Props) {
  const [phone, setPhone] = useState(fixedPhone ?? '')
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function send() {
    if (!PHONE.test(phone)) return setError('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0')
    setBusy(true)
    setError('')
    try {
      const r = await authApi.sendOtp(phone, purpose)
      setSent(true)
      setOtp('')
      setCooldown(r.retryAfter)
      onSent?.({ existing: r.existing })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return setError('Vui lòng nhập đủ 6 số')
    setBusy(true)
    setError('')
    const err = await onSubmit(phone, otp)
    setBusy(false)
    if (err) {
      setError(err)
      setOtp('')
    }
  }

  if (!sent) {
    return (
      <div className="space-y-4">
        {!fixedPhone && (
          <div className="relative">
            <Phone size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), send())}
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              placeholder="Số điện thoại (VD: 0901234567)"
              className="input py-3 pl-10 text-base"
            />
          </div>
        )}
        {children}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="button" onClick={send} disabled={busy} className="btn-primary w-full py-3 text-base">
          {busy ? <Loader2 size={18} className="animate-spin" /> : null} Gửi mã xác minh
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={confirm} className="space-y-4">
      <p className="text-sm text-gray-600">
        Nhập mã 6 số vừa gửi tới <b className="text-text">{phone}</b>{' '}
        {!fixedPhone && <button type="button" onClick={() => { setSent(false); setError('') }} className="font-semibold text-primary hover:underline">Đổi số</button>}
      </p>
      {otpSimulated && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <Terminal size={16} className="shrink-0" />
          <span>Chế độ phát triển: chưa gửi SMS thật. Mã OTP được in trong terminal đang chạy <code>npm run dev</code> (dòng <b>[OTP giả lập]</b>).</span>
        </p>
      )}
      <OtpInput value={otp} onChange={setOtp} disabled={busy} />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy || otp.length !== 6} className="btn-primary w-full py-3 text-base">
        {busy ? <Loader2 size={18} className="animate-spin" /> : null} {submitLabel}
      </button>
      <p className="text-center text-sm text-gray-500">
        Chưa nhận được mã?{' '}
        {cooldown > 0 ? <span>Gửi lại sau {cooldown}s</span> : <button type="button" onClick={send} className="font-semibold text-primary hover:underline">Gửi lại mã</button>}
      </p>
    </form>
  )
}
