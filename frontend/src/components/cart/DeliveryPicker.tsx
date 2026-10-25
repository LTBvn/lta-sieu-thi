import React, { useEffect } from 'react'
import { DELIVERY_SLOTS, isSlotAvailable, useCart } from '../../store/useCart'

/** Chọn ngày + khung giờ giao hàng, lưu chung trong giỏ */
export default function DeliveryPicker() {
  const date = useCart(s => s.deliveryDate)
  const slot = useCart(s => s.deliverySlot)
  const setDelivery = useCart(s => s.setDelivery)
  const available = (s: string) => isSlotAvailable(date, s)
  const todayOpen = DELIVERY_SLOTS.some(s => isSlotAvailable('today', s))

  // Khung giờ đã lưu bị quá hạn: chọn khung sớm nhất còn nhận đơn
  useEffect(() => {
    if (isSlotAvailable(date, slot)) return
    const firstToday = DELIVERY_SLOTS.find(s => isSlotAvailable('today', s))
    if (firstToday) setDelivery('today', firstToday)
    else setDelivery('tomorrow', slot)
  }, [date, slot])
  const chip = (active: boolean, disabled = false) =>
    `rounded-lg border px-3 py-2 text-sm font-medium transition ${active ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:border-primary'} ${disabled ? 'cursor-not-allowed opacity-40 hover:border-border' : ''}`

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {(['today', 'tomorrow'] as const).map(d => (
          <button key={d} type="button" disabled={d === 'today' && !todayOpen} className={chip(date === d, d === 'today' && !todayOpen)} onClick={() => setDelivery(d, slot)}>
            {d === 'today' ? (todayOpen ? 'Hôm nay' : 'Hôm nay (hết giờ)') : 'Ngày mai'}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DELIVERY_SLOTS.map(s => (
          <button key={s} type="button" disabled={!available(s)} className={chip(slot === s && available(s), !available(s))} onClick={() => setDelivery(date, s)}>
            {s}
          </button>
        ))}
      </div>
      {!available(slot) && <p className="mt-2 text-xs text-accent">Khung giờ đã chọn không còn nhận đơn hôm nay, vui lòng chọn khung khác.</p>}
    </div>
  )
}
