import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Banknote, CreditCard, Trash2, Truck, Wallet } from 'lucide-react'
import { cartSubtotal, FREE_SHIP_THRESHOLD, isSlotAvailable, shippingFee, useCart } from '../store/useCart'
import { useAuth } from '../store/useAuth'
import { isAvailable, useProducts } from '../store/useProducts'
import QuantitySelector from '../components/ui/QuantitySelector'
import DeliveryPicker from '../components/cart/DeliveryPicker'
import { formatPrice } from '../utils/format'
import { usePaymentSettings } from '../utils/vietqr'
import { couponApi, errorMessage, orderApi } from '../services/api'
import { PaymentMethod } from '../types'

type ShippingForm = { name: string; phone: string; address: string; note: string }

const PAYMENTS = [
  { id: 'cod', label: 'Tiền mặt (COD)', icon: Banknote, hint: 'Trả tiền khi nhận hàng' },
  { id: 'bank', label: 'Chuyển khoản', icon: CreditCard, hint: 'Quét mã QR bằng app ngân hàng' },
  { id: 'momo', label: 'Ví MoMo', icon: Wallet, hint: 'Quét mã QR bằng app MoMo' }
] as const

export default function CartPage() {
  const { items: saved, updateQty, remove, clear, deliveryDate, deliverySlot } = useCart()
  const byId = useProducts(s => s.byId)
  const productsReady = useProducts(s => s.status) !== 'loading'
  // Giỏ lưu bản sao lúc thêm vào; luôn lấy giá & tình trạng mới nhất từ server
  const items = saved.map(i => {
    const live = byId.get(i.id)
    return live ? { ...live, quantity: i.quantity } : i
  })
  const isGone = (id: number) => productsReady && (!byId.has(id) || !isAvailable(byId.get(id)!))
  const goneCount = items.filter(i => isGone(i.id)).length
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponMsg, setCouponMsg] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('cod')
  const paymentSettings = usePaymentSettings()
  // Chỉ mở chuyển khoản / MoMo khi admin đã cài tài khoản nhận tiền
  const enabled = (id: PaymentMethod) => id === 'cod' || !!paymentSettings?.[id].enabled
  const [slotError, setSlotError] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [orderError, setOrderError] = useState('')
  const navigate = useNavigate()
  const user = useAuth(s => s.user)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ShippingForm>({ defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' } })

  const subtotal = cartSubtotal(items.filter(i => !isGone(i.id)))
  const ship = shippingFee(subtotal)
  const total = Math.max(0, subtotal + ship - discount)

  // Server kiểm tra mã (hạn dùng, đơn tối thiểu, lượt dùng); khi đặt hàng server tính lại lần nữa
  async function applyCoupon() {
    const code = coupon.trim().toUpperCase()
    if (!code) return
    if (!user) return setCouponMsg('Đăng nhập để dùng mã giảm giá')
    try {
      const r = await couponApi.check(code, subtotal)
      setDiscount(r.discount)
      setAppliedCoupon(r.code)
      setCouponMsg(`Đã áp dụng giảm ${formatPrice(r.discount)}`)
    } catch (err) {
      setDiscount(0)
      setAppliedCoupon('')
      setCouponMsg(errorMessage(err))
    }
  }

  async function placeOrder(form: ShippingForm) {
    if (!user) return navigate('/login?redirect=/cart')
    if (goneCount > 0) return
    if (!isSlotAvailable(deliveryDate, deliverySlot)) {
      setSlotError(true)
      return
    }
    setOrderError('')
    try {
      // Server tự tính lại tiền theo giá hiện tại; chỉ gửi mã sản phẩm + số lượng
      const order = await orderApi.create({
        items: saved.map(i => ({ productId: i.id, quantity: i.quantity })),
        name: form.name,
        phone: form.phone,
        address: form.address,
        note: form.note,
        delivery: `${deliveryDate === 'today' ? 'Hôm nay' : 'Ngày mai'}, ${deliverySlot}`,
        payment: enabled(payment) ? payment : 'cod',
        coupon: discount ? appliedCoupon : undefined
      })
      clear()
      navigate(`/don-hang/${order.code}`)
    } catch (err) {
      setOrderError(errorMessage(err))
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center py-24 text-center">
        <div className="text-7xl">🧺</div>
        <h1 className="mt-4 text-2xl font-bold">Giỏ hàng đang trống</h1>
        <p className="mt-2 text-gray-500">Đi một vòng chợ và chọn vài món tươi ngon nhé!</p>
        <div className="mt-6 flex gap-3">
          <Link to="/di-cho" className="btn-primary">Đi chợ online</Link>
          <Link to="/products" className="btn-outline">Xem sản phẩm</Link>
        </div>
      </div>
    )
  }

  const err = (msg?: string) => (msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null)

  return (
    <form onSubmit={handleSubmit(placeOrder)} className="container mx-auto pb-24 pt-6 lg:py-6">
      <h1 className="text-2xl font-bold">Giỏ hàng <span className="text-base font-normal text-gray-500">({items.length} sản phẩm)</span></h1>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="card divide-y divide-border">
            {items.map(i => (
              <div key={i.id} className={`flex gap-3 p-4 md:gap-4 ${isGone(i.id) ? 'bg-red-50/50' : ''}`}>
                <Link to={`/product/${i.id}`} className="shrink-0"><img src={i.image} alt={i.name} className={`h-20 w-20 rounded-lg object-cover md:h-24 md:w-24 ${isGone(i.id) ? 'opacity-50 grayscale' : ''}`} /></Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <Link to={`/product/${i.id}`} className="font-semibold hover:text-primary">{i.name}</Link>
                    <button type="button" onClick={() => remove(i.id)} className="-m-2 p-2 text-gray-400 hover:text-red-600" aria-label="Xóa"><Trash2 size={18} /></button>
                  </div>
                  <div className="text-sm text-gray-500">{formatPrice(i.price)} / {i.unit}</div>
                  {isGone(i.id) ? (
                    <div className="mt-auto flex items-center justify-between pt-2 text-sm">
                      <span className="font-semibold text-red-600">Sản phẩm vừa hết hàng</span>
                      <button type="button" onClick={() => remove(i.id)} className="font-semibold text-primary hover:underline">Xóa khỏi giỏ</button>
                    </div>
                  ) : (
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QuantitySelector size="sm" value={i.quantity} step={i.step ?? 1} onChange={q => updateQty(i.id, q)} />
                      <div className="font-bold text-primary">{formatPrice(i.price * i.quantity)}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="card p-4 md:p-6">
            <h2 className="font-bold">Thông tin giao hàng</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <input {...register('name', { required: 'Vui lòng nhập họ tên' })} placeholder="Họ và tên *" className="input" />
                {err(errors.name?.message)}
              </div>
              <div>
                <input {...register('phone', { required: 'Vui lòng nhập số điện thoại', pattern: { value: /^0\d{9}$/, message: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' } })} placeholder="Số điện thoại *" className="input" inputMode="tel" />
                {err(errors.phone?.message)}
              </div>
              <div className="md:col-span-2">
                <textarea {...register('address', { required: 'Vui lòng nhập địa chỉ' })} placeholder="Địa chỉ nhận hàng (số nhà, đường, phường, quận) *" rows={2} className="input" />
                {err(errors.address?.message)}
              </div>
              <div className="md:col-span-2">
                <input {...register('note')} placeholder="Ghi chú cho shipper / người chọn hàng (vd: chọn cà chua hơi xanh)" className="input" />
              </div>
            </div>

            <h3 className="mt-6 flex items-center gap-2 font-semibold"><Truck size={18} className="text-primary" /> Thời gian giao</h3>
            <div className="mt-3"><DeliveryPicker /></div>

            <h3 className="mt-6 font-semibold">Phương thức thanh toán</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {PAYMENTS.map(({ id, label, icon: Icon, hint }) => (
                <button
                  type="button"
                  key={id}
                  disabled={!enabled(id)}
                  onClick={() => setPayment(id)}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${payment === id ? 'border-primary bg-primary-light text-primary' : 'border-border hover:border-primary disabled:hover:border-border'}`}
                >
                  <Icon size={18} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-xs text-gray-500">{enabled(id) ? hint : 'Shop chưa mở phương thức này'}</span>
                  </span>
                </button>
              ))}
            </div>
            {payment !== 'cod' && <p className="mt-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-900">Shop sẽ kiểm hàng, cân thực tế rồi <b>gửi mã QR với số tiền chính xác</b> vào trang đơn hàng của bạn. Bạn chưa cần chuyển tiền lúc này.</p>}
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="card sticky top-44 p-4 md:p-6">
            <h2 className="font-bold">Tóm tắt đơn hàng</h2>

            {ship > 0 && (
              <div className="mt-4 rounded-lg bg-primary-light p-3 text-sm">
                Mua thêm <b>{formatPrice(FREE_SHIP_THRESHOLD - subtotal)}</b> để được miễn phí giao hàng
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(subtotal / FREE_SHIP_THRESHOLD) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phí giao hàng</span><span>{ship ? formatPrice(ship) : <span className="font-semibold text-primary">Miễn phí</span>}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span className="text-primary">-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between border-t border-border pt-3 text-lg font-bold"><span>Tổng cộng</span><span className="text-primary">{formatPrice(total)}</span></div>
            </div>

            <div className="mt-4 flex gap-2">
              <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Mã giảm giá (thử LTA50)" className="input" />
              <button type="button" onClick={applyCoupon} className="shrink-0 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700">Áp dụng</button>
            </div>
            {couponMsg && <p className={`mt-1 text-xs ${discount ? 'text-primary' : 'text-red-600'}`}>{couponMsg}</p>}

            {goneCount > 0 && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Có {goneCount} sản phẩm vừa hết hàng. Vui lòng xóa khỏi giỏ để đặt hàng.</p>}
            {orderError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{orderError}</p>}
            {user ? (
              <button type="submit" disabled={goneCount > 0 || isSubmitting} className="btn-primary mt-5 w-full py-3 text-base">{isSubmitting ? 'Đang gửi đơn...' : `Đặt hàng · ${formatPrice(total)}`}</button>
            ) : (
              <Link to="/login?redirect=/cart" className="btn-primary mt-5 w-full py-3 text-base">Đăng nhập để đặt hàng</Link>
            )}
            {slotError && !isSlotAvailable(deliveryDate, deliverySlot) && <p className="mt-2 text-center text-xs text-red-600">Vui lòng chọn lại khung giờ giao hàng.</p>}
            <p className="mt-2 text-center text-xs text-gray-500">Giao {deliveryDate === 'today' ? 'hôm nay' : 'ngày mai'}, {deliverySlot}</p>
          </div>
        </aside>
      </div>

      {/* Điện thoại: tổng tiền + nút đặt hàng luôn nằm trên thanh điều hướng */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-white px-4 py-2.5 shadow-lift lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-500">Tổng cộng</div>
            <div className="text-lg font-extrabold text-primary">{formatPrice(total)}</div>
          </div>
          {user ? (
            <button type="submit" disabled={goneCount > 0 || isSubmitting} className="btn-primary px-6">{isSubmitting ? 'Đang gửi...' : 'Đặt hàng'}</button>
          ) : (
            <Link to="/login?redirect=/cart" className="btn-primary px-5">Đăng nhập để đặt</Link>
          )}
        </div>
      </div>
    </form>
  )
}
