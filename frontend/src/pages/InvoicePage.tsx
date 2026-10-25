import React, { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { errorMessage, orderApi } from '../services/api'
import { useAuth } from '../store/useAuth'
import { Order } from '../types'
import { formatPrice, formatQty } from '../utils/format'
import { adjustmentOf, PAYMENT_LABEL, STATUS } from '../utils/orderStatus'

/** Thông tin cửa hàng in trên hóa đơn: sửa tại đây cho đúng đăng ký kinh doanh */
const SHOP = {
  name: 'LTA GROUP - SIÊU THỊ THỰC PHẨM TƯƠI SỐNG',
  address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  phone: '1900 6868',
  taxCode: '0300000000'
}

/** Đọc số tiền thành chữ: 125000 → "Một trăm hai mươi lăm nghìn đồng" */
function moneyInWords(n: number) {
  if (n === 0) return 'Không đồng'
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
  const read3 = (num: number, full: boolean) => {
    const [h, t, u] = [Math.floor(num / 100), Math.floor((num % 100) / 10), num % 10]
    const out: string[] = []
    if (full || h) out.push(digits[h], 'trăm')
    if (t > 1) out.push(digits[t], 'mươi')
    else if (t === 1) out.push('mười')
    else if ((full || h) && u) out.push('lẻ')
    if (u === 1 && t > 1) out.push('mốt')
    else if (u === 5 && t > 0) out.push('lăm')
    else if (u === 4 && t > 1) out.push('tư')
    else if (u) out.push(digits[u])
    return out.join(' ')
  }
  const units = ['', 'nghìn', 'triệu', 'tỷ']
  const groups: number[] = []
  for (let x = Math.round(n); x > 0; x = Math.floor(x / 1000)) groups.push(x % 1000)
  const words: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    if (!groups[i]) continue
    words.push(read3(groups[i], i < groups.length - 1), units[i % 4])
  }
  const s = words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng'
}

const vnDate = (iso: string) => {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
  return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`
}

export default function InvoicePage() {
  const { code = '' } = useParams()
  const user = useAuth(s => s.user)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { if (user) orderApi.get(code).then(setOrder).catch(err => setError(errorMessage(err))) }, [code, user?.id])

  if (!user) return <Navigate to={`/login?redirect=/hoa-don/${code}`} replace />
  if (error) return <p className="p-10 text-center text-red-600">{error}</p>
  if (!order) return <p className="p-10 text-center text-gray-500">Đang tải hóa đơn...</p>

  const adj = adjustmentOf(order)
  const back = user.role === 'admin' ? `/admin/don-hang/${order.code}` : `/don-hang/${order.code}`

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
        <Link to={back} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary"><ArrowLeft size={16} /> Quay lại đơn</Link>
        <button onClick={() => window.print()} className="btn-primary"><Printer size={18} /> In / Lưu PDF</button>
      </div>

      <article className="printable mx-auto max-w-3xl bg-white p-6 text-[13px] leading-relaxed text-gray-900 shadow-card sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-gray-900 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-lg font-extrabold text-white">L</span>
              <span className="text-base font-extrabold">{SHOP.name}</span>
            </div>
            <div className="mt-2 text-gray-600">{SHOP.address}</div>
            <div className="text-gray-600">Hotline: {SHOP.phone} · MST: {SHOP.taxCode}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Số: <b className="text-gray-900">{order.code}</b></div>
            <div className="text-xs text-gray-500">{vnDate(order.createdAt)}</div>
          </div>
        </header>

        <h1 className="mt-6 text-center text-xl font-extrabold tracking-wide">HÓA ĐƠN BÁN HÀNG</h1>
        <p className="text-center text-xs text-gray-500">(Phiếu bán lẻ, không thay thế hóa đơn GTGT)</p>

        <section className="mt-5 grid grid-cols-1 gap-1 sm:grid-cols-2">
          <div>Khách hàng: <b>{order.customerName}</b></div>
          <div>Điện thoại: <b>{order.phone}</b></div>
          <div className="sm:col-span-2">Địa chỉ giao: {order.address}</div>
          <div>Thanh toán: {PAYMENT_LABEL[order.paymentMethod]}</div>
          <div>Trạng thái: {STATUS[order.status].label}</div>
        </section>

        <table className="mt-5 w-full border-collapse">
          <thead>
            <tr className="border-y border-gray-900 text-left">
              <th className="py-2 pr-2">STT</th>
              <th className="py-2 pr-2">Tên hàng</th>
              <th className="py-2 pr-2 text-right">SL</th>
              <th className="py-2 pr-2">ĐVT</th>
              <th className="py-2 pr-2 text-right">Đơn giá</th>
              <th className="py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, k) => (
              <tr key={i.productId} className="border-b border-gray-200">
                <td className="py-2 pr-2">{k + 1}</td>
                <td className="py-2 pr-2">{i.name}</td>
                <td className="py-2 pr-2 text-right">{formatQty(i.quantity)}</td>
                <td className="py-2 pr-2">{i.unit}</td>
                <td className="py-2 pr-2 text-right">{formatPrice(i.price)}</td>
                <td className="py-2 text-right">{formatPrice(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-full max-w-xs space-y-1">
          <div className="flex justify-between"><span>Cộng tiền hàng</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Phí giao hàng</span><span>{formatPrice(order.shipping)}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span>Giảm giá</span><span>-{formatPrice(order.discount)}</span></div>}
          {adj !== 0 && <div className="flex justify-between"><span>Điều chỉnh theo cân thực tế</span><span>{adj > 0 ? '+' : '-'}{formatPrice(Math.abs(adj))}</span></div>}
          <div className="flex justify-between border-t border-gray-900 pt-1 text-base font-extrabold"><span>TỔNG THANH TOÁN</span><span>{formatPrice(order.total)}</span></div>
        </div>
        <p className="mt-3 italic">Số tiền bằng chữ: {moneyInWords(order.total)}.</p>

        <footer className="mt-10 grid grid-cols-2 text-center">
          <div><b>Người mua hàng</b><div className="text-xs text-gray-500">(Ký, ghi rõ họ tên)</div></div>
          <div><b>Người bán hàng</b><div className="text-xs text-gray-500">(Ký, ghi rõ họ tên)</div></div>
        </footer>
        <p className="mt-16 text-center text-xs text-gray-500">Cảm ơn quý khách đã mua sắm tại LTA Group!</p>
      </article>
    </div>
  )
}
