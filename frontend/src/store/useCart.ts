import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '../types'
import { roundQty } from '../utils/format'

export const FREE_SHIP_THRESHOLD = 300000
export const SHIPPING_FEE = 15000

export const DELIVERY_SLOTS = ['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00'] as const

type CartState = {
  items: CartItem[]
  deliveryDate: 'today' | 'tomorrow'
  deliverySlot: string
  add: (p: Product, qty?: number) => void
  remove: (id: number) => void
  updateQty: (id: number, qty: number) => void
  clear: () => void
  setDelivery: (date: CartState['deliveryDate'], slot: string) => void
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryDate: 'today',
      deliverySlot: DELIVERY_SLOTS[2],
      add(p, qty = p.step ?? 1) {
        const items = get().items
        const existing = items.find(i => i.id === p.id)
        set({
          items: existing
            ? items.map(i => (i.id === p.id ? { ...i, quantity: roundQty(i.quantity + qty) } : i))
            : [...items, { ...p, quantity: roundQty(qty) }]
        })
      },
      remove(id) {
        set({ items: get().items.filter(i => i.id !== id) })
      },
      updateQty(id, qty) {
        if (qty <= 0) return get().remove(id)
        set({ items: get().items.map(i => (i.id === id ? { ...i, quantity: roundQty(qty) } : i)) })
      },
      clear() {
        set({ items: [] })
      },
      setDelivery(deliveryDate, deliverySlot) {
        set({ deliveryDate, deliverySlot })
      }
    }),
    { name: 'lta-cart' }
  )
)

/** Hôm nay chỉ nhận các khung bắt đầu sau ít nhất 2 giờ nữa */
export const isSlotAvailable = (date: CartState['deliveryDate'], slot: string) =>
  date === 'tomorrow' || Number(slot.slice(0, 2)) >= new Date().getHours() + 2

export const cartSubtotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.quantity, 0)

export const shippingFee = (subtotal: number) => (subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE)
