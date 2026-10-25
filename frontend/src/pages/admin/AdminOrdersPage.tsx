import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, RefreshCw } from 'lucide-react'
import { errorMessage, orderApi } from '../../services/api'
import { Order, OrderStatus } from '../../types'
import { formatPrice } from '../../utils/format'
import { formatTime, PAYMENT_LABEL, STATUS } from '../../utils/orderStatus'

const TABS: (OrderStatus | 'all')[] = ['pending', 'awaiting_payment', 'confirmed', 'delivering', 'completed', 'cancelled', 'all']

export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('status') as OrderStatus | 'all') || 'pending'
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [counts, setCounts] = useState<Partial<Record<OrderStatus, number>>>({})
  const [error, setError] = useState('')

  const load = () => {
    orderApi.list(tab === 'all' ? undefined : tab).then(setOrders).catch(err => setError(errorMessage(err)))
    orderApi.summary().then(s => setCounts(s.counts)).catch(() => {})
  }

  // Tự làm mới mỗi 10 giây để thấy đơn mới
  useEffect(() => {
    setOrders(null)
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [tab])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng</h1>
          <p className="text-sm text-gray-500">Đơn mới vào tab <b>Chờ xác nhận</b>. Kiểm hàng xong, gửi mã thanh toán (chuyển khoản / MoMo) hoặc xác nhận (COD).</p>
        </div>
        <button onClick={load} className="btn-outline px-3 py-2 text-sm"><RefreshCw size={16} /> Làm mới</button>
      </div>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => {
          const n = t === 'all' ? undefined : counts[t]
          return (
            <button key={t} onClick={() => setParams({ status: t })} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${tab === t ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:border-primary'}`}>
              {t === 'all' ? 'Tất cả' : STATUS[t].label}
              {!!n && <span className={`rounded-full px-1.5 text-xs font-bold ${tab === t ? 'bg-white/25' : t === 'pending' ? 'bg-accent text-white' : 'bg-gray-100'}`}>{n}</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-4 space-y-3">
        {error && <p className="text-red-600">{error}</p>}
        {!orders && !error && <p className="text-gray-500">Đang tải...</p>}
        {orders?.length === 0 && <div className="card p-10 text-center text-gray-500">Không có đơn nào ở mục này.</div>}
        {orders?.map(o => (
          <Link key={o.code} to={`/admin/don-hang/${o.code}`} className={`card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-lift ${o.status === 'pending' ? 'border-l-4 border-l-accent' : ''}`}>
            <div className="min-w-[140px]">
              <div className="font-bold">{o.code}</div>
              <div className="text-xs text-gray-500">{formatTime(o.createdAt)}</div>
            </div>
            <div className="min-w-[160px] flex-1">
              <div className="font-medium">{o.customerName} · {o.phone}</div>
              <div className="truncate text-xs text-gray-500">{o.items.length} sản phẩm · {o.delivery}</div>
            </div>
            <div className="text-sm text-gray-600">{PAYMENT_LABEL[o.paymentMethod]}</div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span>
            <div className="w-28 text-right font-bold text-primary">{formatPrice(o.total)}</div>
            <ChevronRight className="text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  )
}
