import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { BadgePercent, Carrot, ChevronDown, Home, LayoutGrid, LogOut, Menu, Phone, Search, ShieldCheck, ShoppingCart, Truck, User, X } from 'lucide-react'
import { useCart } from '../../store/useCart'
import { useAuth } from '../../store/useAuth'
import { useToast } from '../../store/useToast'
import categories from '../../data/categories'

const mainLinks = [
  { key: 'home', to: '/', label: 'Trang chủ', icon: Home },
  { key: 'market', to: '/di-cho', label: 'Đi chợ online', icon: Carrot, highlight: true },
  { key: 'all', to: '/products', label: 'Tất cả sản phẩm', icon: LayoutGrid },
  { key: 'deal', to: '/products?tag=deal', label: 'Khuyến mãi', icon: BadgePercent }
]

/** Mục menu nào đang được xem (dựa cả vào ?tag=deal, ?cat=...) */
function currentKey(pathname: string, params: URLSearchParams) {
  if (pathname === '/') return 'home'
  if (pathname === '/di-cho') return 'market'
  if (pathname === '/products') {
    if (params.getAll('tag').includes('deal')) return 'deal'
    return params.get('cat') ? null : 'all'
  }
  return null
}

export default function Header() {
  const cartCount = useCart(s => s.items.length)
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)
  const showToast = useToast(s => s.show)
  const [userMenu, setUserMenu] = useState(false)
  const current = currentKey(location.pathname, params)

  function signOut() {
    logout()
    setUserMenu(false)
    setOpen(false)
    showToast('Bạn đã đăng xuất')
  }

  useEffect(() => { setOpen(false) }, [location.pathname, location.search])
  useEffect(() => { setQ(params.get('q') ?? '') }, [params])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products')
  }

  const searchBox = (
    <form onSubmit={submit} className="relative w-full">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Tìm rau, thịt, trái cây..."
        className="w-full rounded-full border border-border bg-gray-50 py-2.5 pl-10 pr-24 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
      <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark">Tìm</button>
    </form>
  )

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="hidden bg-primary text-xs text-white md:block">
        <div className="container mx-auto flex h-8 items-center justify-between">
          <span className="flex items-center gap-2"><Truck size={14} /> Giao nhanh 2 giờ · Miễn phí giao hàng cho đơn từ 300.000đ</span>
          <span className="flex items-center gap-2"><Phone size={14} /> Hotline: 1900 6868 (7:00 - 22:00)</span>
        </div>
      </div>

      <div className="container mx-auto flex h-16 items-center gap-4 md:h-20 md:gap-8">
        <button className="-ml-2 p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Mở menu"><Menu /></button>
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg font-extrabold text-white">L</span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold text-primary">LTA Group</span>
            <span className="hidden text-[11px] text-gray-500 sm:block">Tươi ngon mỗi ngày</span>
          </span>
        </Link>

        <div className="hidden flex-1 md:block">{searchBox}</div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {user ? (
            <div className="relative hidden sm:block">
              <button onClick={() => setUserMenu(o => !o)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-light font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                <span className="hidden max-w-[8rem] truncate font-medium lg:inline">{user.name}</span>
                <ChevronDown size={16} className="hidden text-gray-400 lg:block" />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-56 animate-slide-in rounded-xl border border-border bg-white p-2 shadow-lift">
                    <div className="border-b border-border px-3 pb-2 pt-1">
                      <div className="truncate font-semibold">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.phone}</div>
                    </div>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenu(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-light"><ShieldCheck size={16} /> Trang quản trị</Link>
                    )}
                    <Link to="/tai-khoan" onClick={() => setUserMenu(false)} className="mt-1 block rounded-lg px-3 py-2 text-sm hover:bg-gray-50">Tài khoản của tôi</Link>
                    <Link to="/don-hang" onClick={() => setUserMenu(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50">Đơn hàng của tôi</Link>
                    <Link to="/tai-khoan?tab=thanh-vien" onClick={() => setUserMenu(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50">Thẻ thành viên & voucher</Link>
                    <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"><LogOut size={16} /> Đăng xuất</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 sm:flex">
              <User size={20} /> <span className="hidden lg:inline">Đăng nhập</span>
            </Link>
          )}
          <Link to="/cart" className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <span className="relative">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{cartCount}</span>
              )}
            </span>
            <span className="hidden font-medium lg:inline">Giỏ hàng</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto pb-3 md:hidden">{searchBox}</div>

      <nav className="hidden pb-3 lg:block" aria-label="Điều hướng chính">
        <div className="container mx-auto flex items-center justify-between gap-6">
          {/* Thanh tab bo tròn: mục đang xem nổi lên thành ô trắng */}
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 p-1 text-sm">
            {mainLinks.map(({ to, label, icon: Icon, highlight, key }) => {
              const active = current === key
              return (
                <Link
                  key={key}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={
                    highlight
                      ? `flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-accent px-4 py-2 font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 ${active ? 'ring-2 ring-orange-200' : ''}`
                      : `flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-medium transition ${active ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:bg-white/70 hover:text-text'}`
                  }
                >
                  <Icon size={16} strokeWidth={active || highlight ? 2.4 : 2} />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Danh mục dạng chip có ảnh tròn */}
          <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm">
            {categories.slice(0, 5).map((c, i) => {
              const active = params.get('cat') === c.id && location.pathname === '/products'
              return (
                <Link
                  key={c.id}
                  to={`/products?cat=${c.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 items-center gap-2 whitespace-nowrap rounded-full border py-1 pl-1 pr-3.5 font-medium transition ${i < 3 ? 'flex' : 'hidden xl:flex'} ${active ? 'border-primary bg-primary-light text-primary' : 'border-border bg-white text-gray-600 hover:border-primary/40 hover:text-primary'}`}
                >
                  <img src={c.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                  {c.short}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[82%] max-w-xs animate-slide-in overflow-y-auto bg-white p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-extrabold text-primary">LTA Group</span>
              <button onClick={() => setOpen(false)} aria-label="Đóng menu"><X /></button>
            </div>
            <div className="space-y-1">
              {mainLinks.map(({ key, to, label, icon: Icon, highlight }) => (
                <Link
                  key={key}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium ${highlight ? 'bg-gradient-to-r from-orange-500 to-accent text-white' : current === key ? 'bg-primary-light text-primary' : 'hover:bg-gray-50'}`}
                >
                  <Icon size={18} /> {label}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-light font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                    <span className="truncate font-medium">{user.name}</span>
                  </div>
                  <Link to="/tai-khoan" className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium hover:bg-gray-50"><User size={18} /> Tài khoản của tôi</Link>
                  <Link to="/don-hang" className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium hover:bg-gray-50"><ShoppingCart size={18} /> Đơn hàng của tôi</Link>
                  {user.role === 'admin' && <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-semibold text-primary hover:bg-primary-light"><ShieldCheck size={18} /> Trang quản trị</Link>}
                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left font-medium text-red-600 hover:bg-red-50"><LogOut size={18} /> Đăng xuất</button>
                </>
              ) : (
                <Link to="/login" className="block rounded-lg px-3 py-2.5 font-medium hover:bg-gray-50">Đăng nhập / Đăng ký</Link>
              )}
            </div>
            <div className="mt-6 text-xs font-semibold uppercase text-gray-400">Danh mục</div>
            <div className="mt-2 space-y-1">
              {categories.map(c => (
                <Link key={c.id} to={`/products?cat=${c.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                  <img src={c.image} alt="" className="h-8 w-8 rounded-full object-cover" /> {c.name}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}
