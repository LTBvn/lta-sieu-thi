import React from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react'
import categories from '../../data/categories'

export default function Footer() {
  return (
    <footer className="mt-16 bg-gray-900 text-sm text-gray-400">
      <div className="container mx-auto grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg font-extrabold text-white">L</span>
            <span className="text-lg font-extrabold text-white">LTA Group</span>
          </div>
          <p className="mt-4 leading-relaxed">Hệ thống siêu thị thực phẩm tươi sống. Đi chợ online, giao tận nhà trong 2 giờ, tươi như vừa mua ở chợ.</p>
          <div className="mt-4 flex gap-3">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-primary"><Icon size={16} /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-white">Danh mục</h4>
          <ul className="mt-3 space-y-1">
            {categories.map(c => <li key={c.id}><Link to={`/products?cat=${c.id}`} className="inline-block py-1 hover:text-white">{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white">Hỗ trợ khách hàng</h4>
          <ul className="mt-3 space-y-1">
            <li><Link to="/di-cho" className="inline-block py-1 hover:text-white">Hướng dẫn đi chợ online</Link></li>
            <li>Chính sách giao hàng</li>
            <li>Đổi trả trong 24 giờ</li>
            <li>Phương thức thanh toán</li>
            <li><Link to="/tai-khoan?tab=thanh-vien" className="inline-block py-1 hover:text-white">Thẻ thành viên</Link></li>
          </ul>
        </div>
        <div className="col-span-2 md:col-span-1">
          <h4 className="font-semibold text-white">Liên hệ</h4>
          <ul className="mt-4 space-y-3">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</li>
            <li className="flex gap-2"><Phone size={16} className="shrink-0" /> 1900 6868</li>
            <li className="flex gap-2"><Mail size={16} className="shrink-0" /> cskh@ltagroup.vn</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col justify-between gap-2 py-5 text-xs md:flex-row">
          <span>© 2026 LTA Group Supermarket. All rights reserved.</span>
          <span>Ảnh sản phẩm: Wikimedia Commons (CC BY-SA) · xem public/images/CREDITS.txt</span>
        </div>
      </div>
    </footer>
  )
}
