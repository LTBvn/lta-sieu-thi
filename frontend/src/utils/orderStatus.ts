import { OrderStatus, PaymentMethod } from '../types'

export const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  pending: { label: 'Chờ xác nhận', tone: 'bg-amber-100 text-amber-800' },
  awaiting_payment: { label: 'Chờ thanh toán', tone: 'bg-sky-100 text-sky-800' },
  confirmed: { label: 'Đang chuẩn bị', tone: 'bg-indigo-100 text-indigo-800' },
  delivering: { label: 'Đang giao', tone: 'bg-violet-100 text-violet-800' },
  completed: { label: 'Hoàn tất', tone: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã hủy', tone: 'bg-gray-200 text-gray-600' }
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: 'Tiền mặt khi nhận hàng',
  bank: 'Chuyển khoản ngân hàng',
  momo: 'Ví MoMo'
}

/** Các bước hiển thị trên thanh tiến trình (đơn COD không có bước thanh toán) */
export const stepsFor = (payment: PaymentMethod): OrderStatus[] =>
  payment === 'cod'
    ? ['pending', 'confirmed', 'delivering', 'completed']
    : ['pending', 'awaiting_payment', 'confirmed', 'delivering', 'completed']

/** Phần shop chỉnh thêm/bớt sau khi cân hàng thực tế (0 nếu không chỉnh) */
export const adjustmentOf = (o: { subtotal: number; shipping: number; discount: number; total: number }) =>
  o.total - Math.max(0, o.subtotal + o.shipping - o.discount)

export const formatTime = (iso: string) =>
  new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z').toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
