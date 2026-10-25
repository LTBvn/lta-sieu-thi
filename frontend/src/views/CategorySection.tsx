import React from 'react'
import { Link } from 'react-router-dom'
import categories from '../data/categories'
import { useProducts } from '../store/useProducts'

export default function CategorySection() {
  const products = useProducts(s => s.products)
  return (
    <section className="container mx-auto mt-12">
      <div className="flex items-end justify-between">
        <h2 className="section-title">Danh mục sản phẩm</h2>
        <Link to="/products" className="-my-2 py-2 text-sm font-semibold text-primary hover:underline">Xem tất cả →</Link>
      </div>

      <div className="no-scrollbar mt-5 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-7 md:overflow-visible">
        {categories.map(c => (
          <Link key={c.id} to={`/products?cat=${c.id}`} className="group flex w-24 shrink-0 flex-col items-center text-center md:w-auto">
            <div className="aspect-square w-full overflow-hidden rounded-2xl border-2 border-transparent bg-white shadow-card transition group-hover:border-primary">
              <img src={c.image} alt={c.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
            </div>
            <div className="mt-2 text-sm font-semibold group-hover:text-primary">{c.name}</div>
            <div className="text-xs text-gray-500">{products.filter(p => p.category === c.id).length} sản phẩm</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
