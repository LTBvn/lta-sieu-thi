import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Boxes, ClipboardList, ExternalLink, LogOut, Package, QrCode, Ticket, UserCog, Users, Wallet, WifiOff } from 'lucide-react'
import { useOrderAlerts } from '../../hooks/useOrderAlerts'
import { useAuth } from '../../store/useAuth'
import { useProducts } from '../../store/useProducts'
import Toaster from '../../components/ui/Toaster'

const links = [
  { to: '/admin/don-hang', label: 'Đơn hàng', icon: ClipboardList, badge: true },
  { to: '/admin/thu-chi', label: 'Sổ thu chi', icon: Wallet },
  { to: '/admin', label: 'Sản phẩm', icon: Package, end: true },
  { to: '/admin/kho', label: 'Kho hàng', icon: Boxes },
  { to: '/admin/khach-hang', label: 'Khách hàng', icon: Users },
  { to: '/admin/khuyen-mai', label: 'Mã khuyến mãi', icon: Ticket },
  { to: '/admin/nguoi-dung', label: 'Phân quyền', icon: UserCog },
  { to: '/admin/thanh-toan', label: 'Cài đặt thanh toán', icon: QrCode }
]

export default function AdminLayout() {
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)
  const offline = useProducts(s => s.status) === 'offline'
  const navigate = useNavigate()
  const waiting = useOrderAlerts()

  return (
    <div className="min-h-screen bg-bg lg:flex">
      <aside className="border-b border-border bg-gray-900 text-gray-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0">
        <div className="flex items-center justify-between p-4 lg:block lg:p-6">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg font-extrabold text-white">L</span>
            <span>
              <span className="block font-extrabold text-white">LTA Admin</span>
              <span className="block text-xs text-gray-400">Quản trị cửa hàng</span>
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm hover:text-white lg:hidden">Xem web <ExternalLink size={14} /></Link>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {links.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-primary text-white' : 'hover:bg-white/10 hover:text-white'}`}
            >
              <Icon size={18} /> {label}
              {badge && waiting > 0 && <span className="ml-auto grid h-5 min-w-[1.25rem] animate-pulse place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">{waiting}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="text-sm font-semibold text-white">{user?.name}</div>
          <div className="text-xs text-gray-400">{user?.phone} · Quản trị viên</div>
          <div className="mt-3 flex gap-2">
            <Link to="/" className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/10 py-2 text-xs hover:bg-white/20">Xem web <ExternalLink size={12} /></Link>
            <button onClick={() => { logout(); navigate('/') }} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/10 py-2 text-xs hover:bg-red-600 hover:text-white"><LogOut size={12} /> Đăng xuất</button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        {offline && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <WifiOff size={20} className="shrink-0" />
            <div>
              <b>Không kết nối được máy chủ API.</b> Mở thêm một terminal và chạy <code className="rounded bg-red-100 px-1">npm run dev:server</code>, rồi tải lại trang.
              Lúc này mọi thay đổi sẽ không lưu được.
            </div>
          </div>
        )}
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
