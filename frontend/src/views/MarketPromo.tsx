import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChefHat, ListChecks } from 'lucide-react'
import recipes from '../data/recipes'

const steps = [
  { icon: ChefHat, title: 'Chọn món hôm nay', text: 'Một chạm thêm đủ nguyên liệu cho cả mâm cơm' },
  { icon: ListChecks, title: 'Hoặc ghi danh sách', text: 'Gõ "cà chua, thịt ba chỉ..." như ghi giấy đi chợ' },
  { icon: CalendarDays, title: 'Chọn giờ giao', text: 'Khung giờ 2 tiếng, hàng tươi đóng gói ngay' }
]

export default function MarketPromo() {
  return (
    <section className="container mx-auto mt-12">
      <div className="overflow-hidden rounded-2xl bg-primary text-white">
        <div className="grid lg:grid-cols-5">
          <div className="p-6 md:p-10 lg:col-span-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">MỚI · ĐI CHỢ ONLINE</span>
            <h2 className="mt-4 text-2xl font-extrabold md:text-3xl">Hôm nay ăn gì?<br />Để LTA đi chợ giúp bạn</h2>
            <div className="mt-6 space-y-4">
              {steps.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15"><Icon size={20} /></span>
                  <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-sm text-white/80">{text}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/di-cho" className="btn-primary mt-8 bg-white text-primary hover:bg-primary-light">Bắt đầu đi chợ →</Link>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 md:p-6 lg:col-span-3">
            {recipes.map(r => (
              <Link key={r.id} to={`/di-cho#${r.id}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl md:aspect-square">
                <img src={r.image} alt={r.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-3">
                  <div className="font-semibold leading-tight">{r.name}</div>
                  <div className="text-xs text-white/80">{r.time} · {r.servings} người</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
