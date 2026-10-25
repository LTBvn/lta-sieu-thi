import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { isAvailable, useProducts } from '../store/useProducts'
import { categoryById } from '../data/categories'
import ProductCard from '../components/product/ProductCard'
import SidebarFilter, { PRICE_RANGES } from '../components/filters/SidebarFilter'
import Pagination from '../components/ui/Pagination'
import { CategoryId } from '../types'
import { normalize } from '../utils/format'

const PAGE_SIZE = 12

const SORTS = [
  { id: 'popular', label: 'Bán chạy' },
  { id: 'price-asc', label: 'Giá thấp → cao' },
  { id: 'price-desc', label: 'Giá cao → thấp' },
  { id: 'rating', label: 'Đánh giá cao' }
]

export default function ProductListPage() {
  const products = useProducts(s => s.products)
  const [params, setParams] = useSearchParams()
  const [showFilter, setShowFilter] = useState(false)

  const q = params.get('q') ?? ''
  const cat = params.get('cat') as CategoryId | null
  const price = params.get('price')
  const tags = params.getAll('tag')
  const sort = params.get('sort') ?? 'popular'
  const page = Number(params.get('page') ?? 1)

  const filtered = useMemo(() => {
    const range = PRICE_RANGES.find(r => r.id === price)
    const query = normalize(q)
    const list = products.filter(p =>
      (!cat || p.category === cat) &&
      (!range || (p.price >= range.min && p.price < range.max)) &&
      tags.every(t => (t === 'deal' ? !!p.oldPrice : p.tags?.includes(t as never))) &&
      (!query || normalize(`${p.name} ${p.origin}`).includes(query))
    )
    const sorters: Record<string, (a: typeof list[number], b: typeof list[number]) => number> = {
      popular: (a, b) => b.sold - a.sold,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating
    }
    // Hàng còn bán luôn đứng trước hàng hết
    return list.sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)) || (sorters[sort] ?? sorters.popular)(a, b))
  }, [products, q, cat, price, tags.join(','), sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function update(key: 'cat' | 'price' | 'tag' | 'sort' | 'page' | 'q', value: string | null) {
    const next = new URLSearchParams(params)
    if (key === 'tag' && value) {
      const all = next.getAll('tag')
      next.delete('tag')
      ;(all.includes(value) ? all.filter(t => t !== value) : [...all, value]).forEach(t => next.append('tag', t))
    } else if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
    if (key === 'page') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const title = q ? `Kết quả cho "${q}"` : cat ? categoryById[cat]?.name : tags.includes('deal') ? 'Đang khuyến mãi' : 'Tất cả sản phẩm'

  const filter = (
    <SidebarFilter category={cat} price={price} tags={tags} onChange={update} onReset={() => setParams(q ? { q } : {})} />
  )

  return (
    <div className="container mx-auto py-6">
      <div className="text-sm text-gray-500"><Link to="/" className="hover:text-primary">Trang chủ</Link> / <span className="text-text">{title}</span></div>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">{filter}</aside>

        <section className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <div className="text-sm text-gray-500">{filtered.length} sản phẩm</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-outline px-3 py-2 text-sm lg:hidden" onClick={() => setShowFilter(true)}><SlidersHorizontal size={16} /> Lọc</button>
              <select value={sort} onChange={e => update('sort', e.target.value)} className="input w-auto py-2">
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {q && (
            <button onClick={() => update('q', null)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-sm text-primary">
              Từ khóa: {q} <X size={14} />
            </button>
          )}

          {pageItems.length ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {pageItems.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="card mt-5 flex flex-col items-center p-12 text-center">
              <div className="text-5xl">🥬</div>
              <h3 className="mt-3 text-lg font-semibold">Không tìm thấy sản phẩm phù hợp</h3>
              <p className="mt-1 text-sm text-gray-500">Thử từ khóa khác hoặc bỏ bớt bộ lọc nhé.</p>
              <button className="btn-primary mt-4" onClick={() => setParams({})}>Xem tất cả sản phẩm</button>
            </div>
          )}

          <div className="mt-8"><Pagination page={current} total={totalPages} onChange={n => update('page', String(n))} /></div>
        </section>
      </div>

      {showFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilter(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] animate-slide-in overflow-y-auto rounded-t-2xl bg-bg p-4">
            {filter}
            <button className="btn-primary mt-4 w-full" onClick={() => setShowFilter(false)}>Xem {filtered.length} sản phẩm</button>
          </div>
        </div>
      )}
    </div>
  )
}
