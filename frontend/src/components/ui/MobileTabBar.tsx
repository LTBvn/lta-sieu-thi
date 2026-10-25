import React from 'react'
import { NavLink } from 'react-router-dom'
import { Carrot, Home, LayoutGrid, ShoppingCart, User } from 'lucide-react'
import { useCart } from '../../store/useCart'
import { useAuth } from '../../store/useAuth'

/** Thanh điều hướng dưới đáy màn hình, chỉ hiện trên điện thoại / máy tính bảng */
export default function MobileTabBar() {
  const cartCount = useCart(s => s.items.length)
  const user = useAuth(s => s.user)

  const tabs = [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/di-cho', label: 'Đi chợ', icon: Carrot },
    { to: '/products', label: 'Danh mục', icon: LayoutGrid },
    { to: '/cart', label: 'Giỏ hàng', icon: ShoppingCart, badge: cartCount },
    { to: user ? '/tai-khoan' : '/login', label: user ? 'Tài khoản' : 'Đăng nhập', icon: User }
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Điều hướng chính"
    >
      <div className="grid h-16 grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${isActive ? 'text-primary' : 'text-gray-500'}`}
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                  {!!badge && (
                    <span className="absolute -right-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{badge}</span>
                  )}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
