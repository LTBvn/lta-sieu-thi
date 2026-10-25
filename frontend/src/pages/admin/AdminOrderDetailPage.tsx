import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Printer, Send } from 'lucide-react'
import { errorMessage, orderApi, OrderAction } from '../../services/api'
import { useToast } from '../../store/useToast'
import { Order } from '../../types'
import { formatPrice, formatQty } from '../../utils/format'
import { adjustmentOf, formatTime, PAYMENT_LABEL, STATUS } from '../../utils/orderStatus'
import { usePaymentSettings } from '../../utils/vietqr'

export default function AdminOrderDetailPage() {
  const { code = '' } = useParams()
  const show = useToast(s => s.show)
  const settings = usePaymentSettings()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [total, setTotal] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    orderApi.get(code).then(o => { setOrder(o); setTotal(String(o.total)); setNote(o.adminNote) }).catch(err => setError(errorMessage(err)))
  }, [code])

  if (error) return <p className="text-red-600">{error}</p>
  if (!order) return <p className="text-gray-500">Đang tải...</p>

  async function act(action: OrderAction, message: string) {
    if (action === 'cancel' && !confirm(`Hủy đơn ${order!.code}?`)) return
    setBusy(true)
    try {
      const o = await orderApi.act(order!.code, action, {
        adminNote: note.trim() || undefined,
        total: action === 'request_payment' ? Number(total) : undefined
      })
      setOrder(o)
      setTotal(String(o.total))
      show(message)
    } catch (err) {
      show(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const isCod = order.paymentMethod === 'cod'
  const methodReady = order.paymentMethod === 'cod' || !!settings?.[order.paymentMethod].enabled
  const btn = 'btn-primary w-full py-3'

  return (
    <div className="max-w-5xl">
      <Link to="/admin/don-hang" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"><ArrowLeft size={16} /> Danh sách đơn</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Đơn {order.code}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS[order.status].tone}`}>{STATUS[order.status].label}</span>
        <Link to={`/hoa-don/${order.code}`} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary"><Printer size={16} /> Hóa đơn</Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="card p-5">
            <h2 className="font-bold">Sản phẩm cần chuẩn bị</h2>
            <ul className="mt-3 divide-y divide-border">
              {order.items.map(i => (
                <li key={i.productId} className="flex items-center gap-3 py-2.5 text-sm">
                  <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="font-semibold">{i.name}</div>
                    <div className="text-xs text-gray-500">{formatPrice(i.price)}/{i.unit}</div>
                  </div>
                  <div className="rounded-lg bg-gray-100 px-3 py-1 font-bold">{formatQty(i.quantity)} {i.unit}</div>
                  <div className="w-24 text-right font-semibold">{formatPrice(i.price * i.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phí giao hàng</span><span>{formatPrice(order.shipping)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span>-{formatPrice(order.discount)}</span></div>}
              {adjustmentOf(order) !== 0 && <div className="flex justify-between"><span className="text-gray-500">Điều chỉnh theo cân thực tế</span><span className="font-medium">{adjustmentOf(order) > 0 ? '+' : '-'}{formatPrice(Math.abs(adjustmentOf(order)))}</span></div>}
              <div className="flex justify-between pt-1 text-base font-bold"><span>Tổng</span><span className="text-primary">{formatPrice(order.total)}</span></div>
            </div>
          </section>

          <section className="card p-5 text-sm">
            <h2 className="mb-3 font-bold">Lịch sử đơn</h2>
            <ul className="space-y-2">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="flex gap-3"><span className="w-24 shrink-0 text-xs text-gray-400">{formatTime(h.at)}</span><span>{h.note}</span></li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="card space-y-1 p-5 text-sm">
            <h2 className="mb-2 font-bold">Khách hàng</h2>
            <div className="font-semibold">{order.customerName}</div>
            <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Phone size={14} /> {order.phone}</a>
            <div className="text-gray-600">{order.address}</div>
            <div className="text-gray-600">Giao: <b>{order.delivery}</b></div>
            <div className="text-gray-600">Thanh toán: <b>{PAYMENT_LABEL[order.paymentMethod]}</b></div>
            {order.note && <div className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-900">Khách ghi chú: {order.note}</div>}
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Xử lý đơn</h2>

            {['pending', 'awaiting_payment', 'confirmed', 'delivering'].includes(order.status) && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Lời nhắn cho khách (không bắt buộc)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="input" placeholder="VD: Cà chua cân thực tế 1,6kg nên tổng tiền thay đổi" />
              </div>
            )}

            {order.status === 'pending' && !isCod && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Tổng tiền khách cần trả (đ)</label>
                  <input value={total} onChange={e => setTotal(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="input text-lg font-bold" />
                  <p className="mt-1 text-xs text-gray-500">Hàng cân ký lệch so với lúc đặt thì sửa số này trước khi gửi.</p>
                </div>
                {!methodReady && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Chưa cài tài khoản nhận tiền. Vào <Link to="/admin/thanh-toan" className="font-semibold underline">Cài đặt thanh toán</Link> trước.</p>}
                <button disabled={busy || !methodReady || !Number(total)} onClick={() => act('request_payment', 'Đã gửi mã thanh toán cho khách')} className={btn}>
                  <Send size={18} /> Xác nhận & gửi mã thanh toán · {formatPrice(Number(total) || 0)}
                </button>
              </>
            )}
            {order.status === 'pending' && isCod && (
              <button disabled={busy} onClick={() => act('confirm', 'Đã xác nhận đơn')} className={btn}>Xác nhận đơn (khách trả tiền mặt)</button>
            )}
            {order.status === 'awaiting_payment' && (
              <>
                <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">Khách đang thấy mã QR {formatPrice(order.total)}. Kiểm tra app ngân hàng / MoMo có khoản tiền với nội dung <b>{order.code}</b>.</p>
                <button disabled={busy} onClick={() => act('mark_paid', 'Đã ghi nhận thanh toán')} className={btn}>Đã nhận tiền</button>
              </>
            )}
            {order.status === 'confirmed' && <button disabled={busy} onClick={() => act('deliver', 'Đơn chuyển sang đang giao')} className={btn}>Bắt đầu giao hàng</button>}
            {order.status === 'delivering' && <button disabled={busy} onClick={() => act('complete', 'Đơn đã hoàn tất')} className={btn}>Đã giao thành công</button>}
            {['completed', 'cancelled'].includes(order.status) && <p className="text-sm text-gray-500">Đơn đã kết thúc.</p>}

            {['pending', 'awaiting_payment', 'confirmed'].includes(order.status) && (
              <button disabled={busy} onClick={() => act('cancel', 'Đã hủy đơn')} className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">Hủy đơn</button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
