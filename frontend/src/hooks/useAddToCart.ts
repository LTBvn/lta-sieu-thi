import { useCart } from '../store/useCart'
import { useToast } from '../store/useToast'
import { Product } from '../types'
import { formatQty } from '../utils/format'

/** Thêm vào giỏ kèm thông báo nhỏ ở góc màn hình */
export function useAddToCart() {
  const add = useCart(s => s.add)
  const show = useToast(s => s.show)

  return (p: Product, qty = p.step ?? 1) => {
    add(p, qty)
    show(`Đã thêm ${formatQty(qty)} ${p.unit} ${p.name}`, p.image)
  }
}
