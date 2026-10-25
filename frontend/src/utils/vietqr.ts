import { useEffect, useState } from 'react'
import { PaymentSettings, settingsApi } from '../services/api'
import { MOMO_BIN } from '../data/banks'

type QrInput = { bin: string; accountNo: string; accountName: string; amount?: number; addInfo?: string }

/**
 * Ảnh mã QR chuyển khoản chuẩn VietQR (NAPAS) do img.vietqr.io tạo.
 * Quét được bằng mọi app ngân hàng và app MoMo; số tiền + nội dung điền sẵn.
 */
export function vietQrUrl({ bin, accountNo, accountName, amount, addInfo }: QrInput) {
  const params = new URLSearchParams({ accountName })
  if (amount) params.set('amount', String(Math.round(amount)))
  if (addInfo) params.set('addInfo', addInfo)
  return `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.svg?${params}`
}

export const momoQrUrl = (momo: PaymentSettings['momo'], amount?: number, addInfo?: string) =>
  vietQrUrl({ bin: MOMO_BIN, accountNo: momo.accountNo, accountName: momo.accountName, amount, addInfo })

let cache: PaymentSettings | null = null

/** Cài đặt nhận tiền của shop (null khi đang tải hoặc server không chạy) */
export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings | null>(cache)
  useEffect(() => {
    settingsApi.getPayment().then(s => { cache = s; setSettings(s) }).catch(() => {})
  }, [])
  return settings
}

/** Admin vừa lưu cài đặt: cập nhật bộ nhớ đệm để trang thanh toán dùng ngay */
export const setPaymentCache = (s: PaymentSettings) => { cache = s }
