import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'
import { useCart } from '../../store/useCart'
import { isAvailable } from '../../store/useProducts'
import { useAddToCart } from '../../hooks/useAddToCart'
import { Product } from '../../types'
import { discountPercent, formatPrice, formatQty } from '../../utils/format'
import QuantitySelector from '../ui/QuantitySelector'

type Props = { product: Product }

export default function ProductCard({ product }: Props) {
  const inCart = useCart(s => s.items.find(i => i.id === product.id))
  const updateQty = useCart(s => s.updateQty)
  const addToCart = useAddToCart()
  const off = discountPercent(product.price, product.oldPrice)
  const available = isAvailable(product)

  return (
    <div className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link to={`/product/${product.id}`} className="relative block aspect-square overflow-hidden bg-gray-100">
        <img src={product.image} alt={product.name} loading="lazy" className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${available ? '' : 'opacity-50 grayscale'}`} />
        {!available && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-gray-900/80 px-4 py-1.5 text-sm font-bold text-white">Hết hàng</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {off > 0 && <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>}
          {product.tags?.includes('organic') && <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-white">Hữu cơ</span>}
          {product.tags?.includes('new') && <span className="rounded-md bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">Mới</span>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <div className="text-xs text-gray-500">{product.origin}</div>
        <Link to={`/product/${product.id}`} className="mt-0.5 line-clamp-2 min-h-[2.5rem] font-semibold leading-snug hover:text-primary">{product.name}</Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <Star size={12} className="fill-amber-400 text-amber-400" /> {product.rating} · Đã bán {product.sold.toLocaleString('vi-VN')}
        </div>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            <span className="text-xs text-gray-500">/{product.unit}</span>
          </div>
          <div className="flex h-4 items-center justify-between text-xs">
            <span className="text-gray-400 line-through">{product.oldPrice ? formatPrice(product.oldPrice) : ''}</span>
            {available && product.stock != null && product.stock <= 5 && <span className="font-semibold text-accent">Chỉ còn {formatQty(product.stock)}</span>}
          </div>

          <div className="mt-2">
            {!available ? (
              <button disabled className="w-full cursor-not-allowed rounded-lg border border-border bg-gray-50 py-2 text-sm font-semibold text-gray-400">Tạm hết hàng</button>
            ) : inCart ? (
              <div className="flex justify-center">
                <QuantitySelector size="sm" value={inCart.quantity} step={product.step ?? 1} allowZero onChange={q => updateQty(product.id, q)} />
              </div>
            ) : (
              <button onClick={() => addToCart(product)} className="flex w-full items-center justify-center gap-1 rounded-lg border border-primary py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white">
                <Plus size={16} /> Thêm vào giỏ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
