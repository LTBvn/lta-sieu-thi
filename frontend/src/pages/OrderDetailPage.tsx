import React, { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Check, Clock, Copy, PartyPopper, Printer } from 'lucide-react'
import { errorMessage, orderApi } from '../services/api'
import { useAuth } from '../store/useAuth'
import { useToast } from '../store/useToast'
import { Order } from '../types'
import { formatPrice, formatQty } from '../utils/format'
import { adjustmentOf, formatTime, PAYMENT_LABEL, STATUS, stepsFor } from '../utils/orderStatus'
import { momoQrUrl, usePaymentSettings, vietQrUrl } from '../utils/vietqr'
import { bankByBin } from '../data/banks'

function CopyValue({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard?.writeText(value).catch(() => {}); setDone(true); setTimeout(() => setDone(false), 1500) }}
      className="inline-flex items-center gap-1 font-semibold text-text hover:text-primary"
    >
      {value} {done ? <Check size={14} className="text-primary" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  )
}

/** Mã QR shop gửi cho khách sau khi xác nhận đơn */
function PayByQr({ order }: { order: Order }) {
  const settings = usePaymentSettings()
  if (!settings) return <p className="text-sm text-gray-500">Đang tải thông tin thanh toán...</p>

  const isMomo = order.paymentMethod === 'momo'
  const account = isMomo ? settings.momo : settings.bank
  const qr = isMomo ? momoQrUrl(settings.momo, order.total, order.code) : vietQrUrl({ ...settings.bank, amount: order.total, addInfo: order.code })

  return (
    <div className="rounded-xl border-2 border-sky-200 bg-sky-50 p-4 md:p-6">
      <h2 className="text-center text-lg font-bold">Shop đã xác nhận đơn: mời bạn thanh toán {formatPrice(order.total)}</h2>
      <p className="text-center text-sm text-gray-600">Mở {isMomo ? 'app MoMo' : 'app ngân hàng bất kỳ'} → Quét mã QR. Số tiền và nội dung đã điền sẵn.</p>
      <div className="mt-4 grid items-center gap-6 md:grid-cols-2">
        <img src={qr} alt={`Mã QR thanh toán đơn ${order.code}`} className="mx-auto w-64 rounded-lg bg-white p-2" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-3"><span className="text-gray-500">{isMomo ? 'Ví' : 'Ngân hàng'}</span><span className="font-semibold">{isMomo ? 'MoMo' : bankByBin.get(settings.bank.bin)?.shortName}</span></div>
          <div className="flex justify-between gap-3"><span className="text-gray-500">Số tài khoản</span><CopyValue value={account.accountNo} /></div>
          <div className="flex justify-between gap-3"><span className="text-gray-500">Chủ tài khoản</span><span className="font-semibold">{account.accountName}</span></div>
          <div className="flex justify-between gap-3"><span className="text-gray-500">Số tiền</span><CopyValue value={String(order.total)} /></div>
          <div className="flex justify-between gap-3"><span className="text-gray-500">Nội dung</span><CopyValue value={order.code} /></div>
          <p className="rounded-lg bg-white p-3 text-xs text-gray-600">Giữ đúng nội dung <b>{order.code}</b>. Trang này tự cập nhật khi shop xác nhận đã nhận tiền.</p>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  const { code = '' } = useParams()
  const user = useAuth(s => s.user)
  const show = useToast(s => s.show)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const lastStatus = useRef<string | null>(null)

  // Tự hỏi lại server mỗi 5 giây để thấy ngay khi shop gửi mã / đổi trạng thái
  useEffect(() => {
    if (!user) return
    let alive = true
    const load = () =>
      orderApi.get(code)
        .then(o => {
          if (!alive) return
          if (lastStatus.current && lastStatus.current !== o.status) show(`Đơn ${o.code}: ${STATUS[o.status].label}`)
          lastStatus.current = o.status
          setOrder(o)
        })
        .catch(err => alive && setError(errorMessage(err)))
    load()
    const t = setInterval(load, 5000)
    return () => { alive = false; clearInterval(t) }
  }, [code, user?.id])

  if (!user) return <Navigate to={`/login?redirect=/don-hang/${code}`} replace />
  if (error && !order) return <div className="container mx-auto py-24 text-center text-gray-500">{error} <Link to="/don-hang" className="text-primary">Xem đơn của tôi</Link></div>
  if (!order) return <div className="container mx-auto py-24 text-center text-gray-500">Đang tải đơn hàng...</div>

  const steps = stepsFor(order.paymentMethod)
  const current = steps.indexOf(order.status)

  async function cancel() {
    if (!confirm('Bạn chắc chắn muốn hủy đơn này?')) return
    setCancelling(true)
    try {
      const o = await orderApi.cancel(order!.code)
      lastStatus.current = o.status
      setOrder(o)
      show('Đã hủy đơn hàng')
    } catch (err) {
      show(errorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <div className="text-sm text-gray-500"><Link to="/don-hang" className="hover:text-primary">Đơn hàng của tôi</Link> / <span className="text-text">{order.code}</span></div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">Đơn {order.code}</h1> <Link to={`/hoa-don/${order.code}`} className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"><Printer size={15} /> Hóa đơn</Link></div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS[order.status].tone}`}>{STATUS[order.status].label}</span>
      </div>

      {order.status !== 'cancelled' && (
        <ol className="card mt-5 grid gap-2 p-4" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => (
            <li key={s} className="text-center">
              <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${i <= current ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                {i < current ? <Check size={16} /> : i + 1}
              </div>
              <div className={`mt-1 text-xs ${i <= current ? 'font-semibold text-text' : 'text-gray-400'}`}>{STATUS[s].label}</div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 space-y-5">
        {order.status === 'pending' && (
          <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <Clock className="shrink-0" />
            <div>
              <b>Shop đang kiểm hàng cho đơn của bạn.</b>{' '}
              {order.paymentMethod === 'cod'
                ? 'Bạn sẽ trả tiền mặt khi nhận hàng.'
                : 'Sau khi xác nhận, mã QR thanh toán (số tiền chính xác theo cân thực tế) sẽ hiện ngay tại đây. Trang tự cập nhật, bạn không cần tải lại.'}
            </div>
          </div>
        )}
        {order.status === 'awaiting_payment' && <PayByQr order={order} />}
        {order.status === 'completed' && (
          <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-900"><PartyPopper className="shrink-0" /> Cảm ơn bạn đã mua sắm tại LTA Group!</div>
        )}
        {order.adminNote && <div className="rounded-xl border border-border bg-white p-4 text-sm"><b>Lời nhắn từ shop:</b> {order.adminNote}</div>}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
          <section className="card p-4 md:col-span-3">
            <h2 className="font-bold">Sản phẩm</h2>
            <ul className="mt-3 divide-y divide-border">
              {order.items.map(i => (
                <li key={i.productId} className="flex items-center gap-3 py-2 text-sm">
                  <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{i.name}</div>
                    <div className="text-xs text-gray-500">{formatQty(i.quantity)} × {formatPrice(i.price)}/{i.unit}</div>
                  </div>
                  <div className="font-semibold">{formatPrice(i.price * i.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phí giao hàng</span><span>{order.shipping ? formatPrice(order.shipping) : 'Miễn phí'}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span>-{formatPrice(order.discount)}</span></div>}
              {adjustmentOf(order) !== 0 && <div className="flex justify-between"><span className="text-gray-500">Điều chỉnh theo cân thực tế</span><span className="font-medium">{adjustmentOf(order) > 0 ? '+' : '-'}{formatPrice(Math.abs(adjustmentOf(order)))}</span></div>}
              <div className="flex justify-between pt-1 text-base font-bold"><span>Tổng thanh toán</span><span className="text-primary">{formatPrice(order.total)}</span></div>
            </div>
          </section>

          <section className="space-y-5 md:col-span-2">
            <div className="card space-y-1 p-4 text-sm">
              <h2 className="mb-2 font-bold">Giao hàng</h2>
              <div>{order.customerName} · {order.phone}</div>
              <div className="text-gray-600">{order.address}</div>
              <div className="text-gray-600">{order.delivery}</div>
              <div className="text-gray-600">{PAYMENT_LABEL[order.paymentMethod]}</div>
              {order.note && <div className="text-gray-500">Ghi chú: {order.note}</div>}
            </div>
            <div className="card p-4 text-sm">
              <h2 className="mb-2 font-bold">Lịch sử</h2>
              <ul className="space-y-2">
                {[...order.history].reverse().map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-24 shrink-0 text-xs text-gray-400">{formatTime(h.at)}</span>
                    <span>{h.note}</span>
                  </li>
                ))}
              </ul>
            </div>
            {['pending', 'awaiting_payment'].includes(order.status) && (
              <button onClick={cancel} disabled={cancelling} className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
