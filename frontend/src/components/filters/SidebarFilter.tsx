import React from 'react'
import categories from '../../data/categories'
import { useProducts } from '../../store/useProducts'

export const PRICE_RANGES = [
  { id: 'lt50', label: 'Dưới 50.000đ', min: 0, max: 50000 },
  { id: '50-100', label: '50.000đ - 100.000đ', min: 50000, max: 100000 },
  { id: '100-200', label: '100.000đ - 200.000đ', min: 100000, max: 200000 },
  { id: 'gt200', label: 'Trên 200.000đ', min: 200000, max: Infinity }
]

type Props = {
  category: string | null
  price: string | null
  tags: string[]
  onChange: (key: 'cat' | 'price' | 'tag', value: string | null) => void
  onReset: () => void
}

export default function SidebarFilter({ category, price, tags, onChange, onReset }: Props) {
  const products = useProducts(s => s.products)
  const radio = (checked: boolean) =>
    `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${checked ? 'bg-primary-light font-semibold text-primary' : 'hover:bg-gray-50'}`

  return (
    <div className="card space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Bộ lọc</h3>
        <button onClick={onReset} className="text-xs font-semibold text-primary hover:underline">Xóa bộ lọc</button>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase text-gray-400">Danh mục</div>
        <button className={radio(!category)} onClick={() => onChange('cat', null)}>
          Tất cả <span className="text-xs text-gray-400">{products.length}</span>
        </button>
        {categories.map(c => (
          <button key={c.id} className={radio(category === c.id)} onClick={() => onChange('cat', c.id)}>
            {c.name} <span className="text-xs text-gray-400">{products.filter(p => p.category === c.id).length}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase text-gray-400">Khoảng giá</div>
        {PRICE_RANGES.map(r => (
          <button key={r.id} className={radio(price === r.id)} onClick={() => onChange('price', price === r.id ? null : r.id)}>{r.label}</button>
        ))}
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase text-gray-400">Đặc điểm</div>
        {[
          { id: 'deal', label: 'Đang giảm giá' },
          { id: 'organic', label: 'Hữu cơ' },
          { id: 'new', label: 'Hàng mới về' },
          { id: 'hot', label: 'Bán chạy' }
        ].map(t => (
          <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={tags.includes(t.id)} onChange={() => onChange('tag', t.id)} />
            {t.label}
          </label>
        ))}
      </div>
    </div>
  )
}
