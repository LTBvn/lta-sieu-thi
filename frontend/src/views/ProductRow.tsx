import React from 'react'
import { Link } from 'react-router-dom'
import { isAvailable, useProducts } from '../store/useProducts'
import { categoryById } from '../data/categories'
import ProductCard from '../components/product/ProductCard'
import { CategoryId } from '../types'

type Props = { category: CategoryId; title?: string; limit?: number }

export default function ProductRow({ category, title, limit = 5 }: Props) {
  const products = useProducts(s => s.products)
  const items = products.filter(p => p.category === category).sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)) || b.sold - a.sold).slice(0, limit)
  const cat = categoryById[category]

  return (
    <section className="container mx-auto mt-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="section-title">{title ?? cat.name}</h2>
          <p className="text-sm text-gray-500">{cat.description}</p>
        </div>
        <Link to={`/products?cat=${category}`} className="-my-2 shrink-0 py-2 text-sm font-semibold text-primary hover:underline">Xem thêm →</Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
        {items.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}
