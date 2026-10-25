import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Leaf, RotateCcw, ShieldCheck, Truck } from 'lucide-react'

const perks = [
  { icon: Truck, title: 'Giao nhanh 2 giờ', text: 'Nội thành TP.HCM & Hà Nội' },
  { icon: Leaf, title: 'Tươi mỗi sáng', text: 'Nhập hàng từ nông trại lúc 4h' },
  { icon: RotateCcw, title: 'Đổi trả 24 giờ', text: 'Không tươi, hoàn tiền ngay' },
  { icon: ShieldCheck, title: 'Rõ nguồn gốc', text: 'VietGAP, hữu cơ, nhập khẩu' }
]

export default function Hero() {
  return (
    <section className="container mx-auto pt-4 md:pt-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl lg:col-span-2">
          <img src="/images/banners/cho-sai-gon.jpg" alt="Sạp rau ở chợ Sài Gòn" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <div className="relative flex min-h-[300px] flex-col justify-center p-5 text-white sm:p-6 md:min-h-[420px] md:p-12">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur"><Clock size={14} /> Đặt trước 10h, nhận trước bữa trưa</span>
            <h1 className="mt-3 max-w-lg text-[28px] font-extrabold leading-tight sm:text-3xl md:mt-4 md:text-5xl">Đi chợ online,<br />tươi như chợ sáng</h1>
            <p className="mt-3 max-w-md text-sm text-white/90 sm:text-base md:mt-4 md:text-lg">Rau củ, thịt cá, trái cây chọn lọc mỗi ngày.<span className="hidden sm:inline"> Chọn món, chọn giờ giao, mọi thứ có mặt ở bếp nhà bạn.</span></p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-6">
              <Link to="/di-cho" className="btn-primary bg-accent hover:bg-orange-700">🧺 Đi chợ ngay <ArrowRight size={18} /></Link>
              <Link to="/products?tag=deal" className="btn-outline border-white bg-white/10 text-white backdrop-blur hover:bg-white hover:text-primary">Xem khuyến mãi</Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
          <Link to="/products?cat=trai-cay" className="group relative overflow-hidden rounded-2xl">
            <img src="/images/products/xoai.jpg" alt="" className="h-full min-h-[132px] w-full object-cover sm:min-h-[160px] transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 p-3 text-white sm:p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs text-amber-300">Mùa xoài</div>
              <div className="text-[15px] font-bold leading-tight sm:text-lg md:text-xl">Xoài Cát Hòa Lộc</div>
              <div className="text-xs sm:text-sm">chỉ 75.000đ/kg</div>
            </div>
          </Link>
          <Link to="/products?cat=hai-san" className="group relative overflow-hidden rounded-2xl">
            <img src="/images/banners/hai-san.jpg" alt="" className="h-full min-h-[132px] w-full object-cover sm:min-h-[160px] transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 p-3 text-white sm:p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs text-sky-300">Về bến sáng nay</div>
              <div className="text-[15px] font-bold leading-tight sm:text-lg md:text-xl">Hải sản tươi sống</div>
              <div className="text-xs sm:text-sm">Giảm đến 15%</div>
            </div>
          </Link>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:mt-4 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex w-[210px] shrink-0 items-center gap-3 px-3 py-2.5 md:w-auto">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-light text-primary"><Icon size={18} /></span>
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs text-gray-500">{text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
