import React from 'react'
import { Smartphone } from 'lucide-react'

export default function AppBanner() {
  return (
    <section className="container mx-auto mt-12">
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white">
        <img src="/images/banners/cho-ben-thanh.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative flex flex-col items-start justify-between gap-6 p-6 md:flex-row md:items-center md:p-10">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300"><Smartphone size={16} /> ỨNG DỤNG LTA</div>
            <h3 className="mt-2 text-2xl font-extrabold md:text-3xl">Tải app, nhận ngay voucher 50.000đ</h3>
            <p className="mt-2 text-white/80">Nhập mã <b className="text-white">LTA50</b> cho đơn đầu tiên. Tích điểm mỗi lần đi chợ.</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-lg bg-white px-5 py-3 font-semibold text-gray-900 hover:bg-gray-100">App Store</button>
            <button className="rounded-lg bg-white px-5 py-3 font-semibold text-gray-900 hover:bg-gray-100">▶ Google Play</button>
          </div>
        </div>
      </div>
    </section>
  )
}
