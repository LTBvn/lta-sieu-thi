import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { errorMessage, orderApi } from '../services/api'
import { useAuth } from '../store/useAuth'
import { Order } from '../types'
import { formatPrice } from '../utils/format'
import { formatTime, STATUS } from '../utils/orderStatus'

export default function OrdersPage() {
  const user = useAuth(s => s.user)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) orderApi.mine().then(setOrders).catch(err => setError(errorMessage(err)))
  }, [user?.id])

  if (!user) return <Navigate to="/login?redirect=/don-hang" replace />

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!orders && !error && <p className="mt-4 text-gray-500">Đang tải...</p>}
      {orders?.length === 0 && (
        <div className="card mt-5 flex flex-col items-center p-12 text-center">
          <div className="text-5xl">🧾</div>
          <p className="mt-3 text-gray-500">Bạn chưa có đơn hàng nào.</p>
          <Link to="/di-cho" className="btn-primary mt-4">Đi chợ ngay</Link>
        </div>
      )}
      <div className="mt-5 space-y-3">
        {orders?.map(o => (
          <Link key={o.code} to={`/don-hang/${o.code}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map(i => <img key={i.productId} src={i.image} alt="" className="h-12 w-12 rounded-full border-2 border-white object-cover" />)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{o.code}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span>
              </div>
              <div className="truncate text-sm text-gray-500">{o.items.length} sản phẩm · {formatTime(o.createdAt)}</div>
            </div>
            <div className="text-right font-bold text-primary">{formatPrice(o.total)}</div>
            <ChevronRight className="text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  )
}
