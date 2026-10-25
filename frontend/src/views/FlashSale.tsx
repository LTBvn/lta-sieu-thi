import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { isAvailable, useProducts } from '../store/useProducts'
import ProductCard from '../components/product/ProductCard'

/** Đếm ngược đến 23:59:59 hôm nay */
function useCountdown() {
  const calc = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
  }
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const t = setInterval(() => setLeft(calc()), 1000)
    return () => clearInterval(t)
  }, [])
  return [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60]
}


export default function FlashSale() {
  const parts = useCountdown()
  const products = useProducts(s => s.products)
  // Hết hàng thì không đưa lên băng chuyền flash sale
  const deals = products.filter(p => p.oldPrice && isAvailable(p))

  return (
    <section className="container mx-auto mt-12">
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-accent p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-xl font-extrabold md:text-2xl"><Flame className="fill-yellow-300 text-yellow-300" /> FLASH SALE</h2>
            <div className="flex items-center gap-1 text-sm">
              Kết thúc sau
              {parts.map((n, i) => (
                <React.Fragment key={i}>
                  <span className="rounded-md bg-gray-900 px-2 py-1 font-mono font-bold">{String(n).padStart(2, '0')}</span>
                  {i < 2 && <span className="font-bold">:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Link to="/products?tag=deal" className="-my-2 py-2 text-sm font-semibold hover:underline">Xem tất cả deal →</Link>
        </div>

        {/* Băng chuyền chạy vòng: lặp danh sách 2 lần, trượt -50% rồi quay về đầu nên không bị giật */}
        <div className="group/marquee -mx-4 mt-4 overflow-hidden md:-mx-6 [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
          <div
            className="flex w-max animate-marquee group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none"
            style={{ animationDuration: `${deals.length * 5}s` }}
          >
            {[0, 1].map(copy => (
              <div key={copy} className="flex" aria-hidden={copy === 1}>
                {deals.map(p => (
                  <div key={p.id} className="w-44 shrink-0 pl-3 md:w-56 md:pl-4">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 hidden text-center text-xs text-white/80 md:block">Rê chuột vào sản phẩm để dừng băng chuyền</p>
      </div>
    </section>
  )
}
