import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Leaf, MapPin, RotateCcw, ShoppingCart, Star, Truck } from 'lucide-react'
import { isAvailable, useProducts } from '../store/useProducts'
import { categoryById } from '../data/categories'
import QuantitySelector from '../components/ui/QuantitySelector'
import ProductCard from '../components/product/ProductCard'
import { useAddToCart } from '../hooks/useAddToCart'
import { discountPercent, formatPrice } from '../utils/format'
import NotFoundPage from './NotFoundPage'

export default function ProductDetailPage() {
  const { id } = useParams()
  const products = useProducts(s => s.products)
  const status = useProducts(s => s.status)
  const product = useProducts(s => s.byId.get(Number(id)))
  const step = product?.step ?? 1
  const [qty, setQty] = useState(step)
  const addToCart = useAddToCart()
  const navigate = useNavigate()

  useEffect(() => { setQty(step) }, [id, step])

  if (!product && status === 'loading') return <div className="container mx-auto py-24 text-center text-gray-500">Đang tải sản phẩm...</div>
  if (!product) return <NotFoundPage />
  const available = isAvailable(product)

  const cat = categoryById[product.category]
  const off = discountPercent(product.price, product.oldPrice)
  const related = products.filter(p => p.category === product.category && p.id !== product.id && isAvailable(p)).slice(0, 5)

  return (
    <div className="container mx-auto py-6">
      <div className="text-sm text-gray-500">
        <Link to="/" className="hover:text-primary">Trang chủ</Link> / <Link to={`/products?cat=${cat.id}`} className="hover:text-primary">{cat.name}</Link> / <span className="text-text">{product.name}</span>
      </div>

      <div className="card mt-4 grid gap-8 p-4 md:grid-cols-2 md:p-8">
        <div className="relative overflow-hidden rounded-xl bg-gray-100">
          <img src={product.image} alt={product.name} className={`aspect-square w-full object-cover ${available ? '' : 'opacity-50 grayscale'}`} />
          {off > 0 && <span className="absolute left-4 top-4 rounded-lg bg-accent px-3 py-1 font-bold text-white">-{off}%</span>}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {product.tags?.includes('organic') && <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary"><Leaf size={12} /> Hữu cơ</span>}
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"><MapPin size={12} /> {product.origin}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1 font-semibold text-amber-500"><Star size={16} className="fill-amber-400 text-amber-400" /> {product.rating}</span>
            · Đã bán {product.sold.toLocaleString('vi-VN')}
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-primary">{formatPrice(product.price)}</span>
              <span className="text-gray-500">/ {product.unit}</span>
            </div>
            {product.oldPrice && <div className="mt-1 text-sm text-gray-400"><span className="line-through">{formatPrice(product.oldPrice)}</span> · Tiết kiệm {formatPrice(product.oldPrice - product.price)}</div>}
          </div>

          {available ? (
            <>
              <div className="mt-6">
                <div className="mb-2 text-sm font-semibold">Số lượng {product.step ? `(${product.unit})` : ''}</div>
                <div className="flex flex-wrap items-center gap-3">
                  <QuantitySelector value={qty} step={step} onChange={setQty} />
                  <span className="text-sm text-gray-500">Tạm tính: <b className="text-text">{formatPrice(product.price * qty)}</b></span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={() => addToCart(product, qty)} className="btn-outline py-3"><ShoppingCart size={18} /> Thêm vào giỏ</button>
                <button onClick={() => { addToCart(product, qty); navigate('/cart') }} className="btn-primary py-3">Mua ngay</button>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="font-bold text-red-700">Tạm hết hàng</div>
              <p className="mt-1 text-sm text-red-700/80">Sản phẩm đang tạm hết. LTA sẽ nhập thêm sớm, bạn xem các sản phẩm cùng loại bên dưới nhé.</p>
            </div>
          )}

          <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm text-gray-600">
            <div className="flex items-center gap-3"><Truck size={18} className="text-primary" /> Giao nhanh 2 giờ, miễn phí cho đơn từ 300.000đ</div>
            <div className="flex items-center gap-3"><RotateCcw size={18} className="text-primary" /> Đổi trả trong 24 giờ nếu sản phẩm không tươi</div>
          </div>

          <div className="mt-6">
            <h2 className="font-bold">Mô tả sản phẩm</h2>
            <p className="mt-2 leading-relaxed text-gray-600">{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title">Sản phẩm cùng loại</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
