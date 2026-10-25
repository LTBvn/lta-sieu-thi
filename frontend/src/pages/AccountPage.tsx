import React, { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Check, ClipboardList, Copy, Crown, KeyRound, LogOut, ShieldCheck, Ticket, User } from 'lucide-react'
import { useAuth } from '../store/useAuth'
import { useToast } from '../store/useToast'
import { authApi, couponApi, errorMessage } from '../services/api'
import { formatPrice } from '../utils/format'
import { facebookLogin, renderGoogleButton, useProviders } from '../hooks/useSocialLogin'
import { FacebookIcon, GoogleIcon } from '../components/auth/SocialButtons'
import { Coupon, SocialProvider } from '../types'

const TABS = [
  { id: 'ho-so', label: 'Thông tin cá nhân', icon: User },
  { id: 'thanh-vien', label: 'Thẻ thành viên & ưu đãi', icon: Crown },
  { id: 'mat-khau', label: 'Mật khẩu', icon: KeyRound }
] as const

type TabId = (typeof TABS)[number]['id']

function ProfileTab() {
  const user = useAuth(s => s.user)!
  const show = useToast(s => s.show)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm({
    defaultValues: { name: user.name, email: user.email ?? '', marketingOptIn: !!user.marketingOptIn }
  })

  async function onSubmit(data: { name: string; email: string; marketingOptIn: boolean }) {
    setError('')
    try {
      const updated = await authApi.updateProfile({ name: data.name.trim(), email: data.email.trim() || undefined, marketingOptIn: data.marketingOptIn })
      useAuth.setState({ user: updated })
      reset({ name: updated.name, email: updated.email ?? '', marketingOptIn: !!updated.marketingOptIn })
      show('Đã cập nhật thông tin')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4" noValidate>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Họ và tên</label>
        <input {...register('name', { required: 'Vui lòng nhập họ tên', minLength: { value: 2, message: 'Họ tên quá ngắn' } })} className="input" />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Số điện thoại</label>
        <input value={user.phone} disabled className="input bg-gray-50 text-gray-500" />
        <p className="mt-1 text-xs text-gray-500">Số điện thoại dùng để đăng nhập nên không đổi được. Cần đổi, vui lòng gọi 1900 6868.</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Email</label>
        <input {...register('email', { validate: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Email không hợp lệ' })} className="input" placeholder="Không bắt buộc" />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
        <input type="checkbox" {...register('marketingOptIn')} className="mt-0.5 h-4 w-4 accent-primary" />
        <span>
          <span className="block text-sm font-semibold">Nhận tin khuyến mãi qua SMS</span>
          <span className="block text-xs text-gray-500">Mã giảm giá, deal trong ngày. Bỏ chọn bất cứ lúc nào.</span>
        </span>
      </label>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={isSubmitting || !isDirty} className="btn-primary">{isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
    </form>
  )
}

/** Liên kết / gỡ liên kết Google, Facebook với tài khoản đang đăng nhập */
function LinkedAccounts() {
  const user = useAuth(s => s.user)!
  const setUser = useAuth(s => s.setUser)
  const show = useToast(s => s.show)
  const providers = useProviders()
  const [busy, setBusy] = useState<SocialProvider | null>(null)
  const [error, setError] = useState('')
  const googleRef = useRef<HTMLDivElement>(null)

  async function connect(provider: SocialProvider, token: string) {
    setBusy(provider)
    setError('')
    try {
      setUser(await authApi.socialConnect(provider, token))
      show(`Đã liên kết ${provider === 'google' ? 'Google' : 'Facebook'}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function unlink(provider: SocialProvider) {
    setBusy(provider)
    setError('')
    try {
      setUser(await authApi.socialUnlink(provider))
      show(`Đã gỡ liên kết ${provider === 'google' ? 'Google' : 'Facebook'}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  // Nút Google chính thức chỉ vẽ khi chưa liên kết
  const connectRef = useRef(connect)
  connectRef.current = connect
  useEffect(() => {
    if (providers?.google && !user.linked?.google && googleRef.current) {
      renderGoogleButton(googleRef.current, providers.google, t => connectRef.current('google', t), 'signin_with').catch(() => {})
    }
  }, [providers?.google, user.linked?.google])

  const rows: { id: SocialProvider; label: string; icon: React.ReactNode; configured: boolean }[] = [
    { id: 'google', label: 'Google', icon: <GoogleIcon />, configured: !!providers?.google },
    { id: 'facebook', label: 'Facebook', icon: <FacebookIcon />, configured: !!providers?.facebook }
  ]

  return (
    <div className="max-w-lg">
      <h3 className="font-bold">Liên kết đăng nhập</h3>
      <p className="mt-1 text-sm text-gray-500">Đăng nhập nhanh bằng Google/Facebook, vẫn dùng chung số điện thoại {user.phone}.</p>
      <div className="mt-3 divide-y divide-border rounded-xl border border-border">
        {rows.map(r => {
          const linked = !!user.linked?.[r.id]
          return (
            <div key={r.id} className="flex items-center gap-3 p-3">
              {r.icon}
              <div className="flex-1">
                <div className="text-sm font-semibold">{r.label}</div>
                <div className={`text-xs ${linked ? 'text-primary' : 'text-gray-500'}`}>{linked ? 'Đã liên kết' : r.configured ? 'Chưa liên kết' : 'Shop chưa bật'}</div>
              </div>
              {linked ? (
                <button onClick={() => unlink(r.id)} disabled={busy === r.id} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-red-300 hover:text-red-600">Gỡ</button>
              ) : r.id === 'google' && r.configured ? (
                <div ref={googleRef} className="h-10 w-48 overflow-hidden" />
              ) : (
                <button
                  disabled={!r.configured || busy === r.id}
                  onClick={async () => {
                    try { await connect('facebook', await facebookLogin(providers!.facebook!)) } catch (err) { setError((err as Error).message) }
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  Liên kết
                </button>
              )}
            </div>
          )
        })}
      </div>
      {error && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function PasswordTab() {
  const user = useAuth(s => s.user)!
  const setUser = useAuth(s => s.setUser)
  const show = useToast(s => s.show)
  const [error, setError] = useState('')
  // Tài khoản tạo bằng Google/Facebook chưa có mật khẩu: tạo mới, không cần mật khẩu cũ
  const hasPassword = user.hasPassword !== false
  const { register, handleSubmit, getValues, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { current: '', next: '', confirm: '' }
  })

  async function onSubmit(data: { current: string; next: string }) {
    setError('')
    try {
      setUser(await authApi.changePassword(data.current, data.next))
      reset()
      show(hasPassword ? 'Đã đổi mật khẩu' : 'Đã tạo mật khẩu. Giờ bạn đăng nhập được bằng số điện thoại.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const field = (name: 'current' | 'next' | 'confirm', label: string, rules: object, auto: string) => (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input type="password" autoComplete={auto} {...register(name, rules)} className="input" />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]?.message}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4" noValidate>
      {!hasPassword && <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">Tài khoản của bạn đang đăng nhập bằng Google/Facebook. Tạo mật khẩu để đăng nhập được cả bằng số điện thoại {user.phone}.</p>}
      {hasPassword && field('current', 'Mật khẩu hiện tại', { required: 'Vui lòng nhập mật khẩu hiện tại' }, 'current-password')}
      {field('next', 'Mật khẩu mới', { required: 'Vui lòng nhập mật khẩu mới', minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } }, 'new-password')}
      {field('confirm', 'Nhập lại mật khẩu mới', { validate: (v: string) => v === getValues('next') || 'Mật khẩu nhập lại không khớp' }, 'new-password')}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Đang lưu...' : hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'}</button>
    </form>
  )
}

function MembershipTab() {
  const user = useAuth(s => s.user)!
  const [copied, setCopied] = useState('')
  const [vouchers, setVouchers] = useState<Coupon[] | null>(null)
  const memberCode = `LTA${String(user.id).padStart(6, '0')}`

  useEffect(() => { couponApi.mine().then(setVouchers).catch(() => setVouchers([])) }, [])

  function copy(code: string) {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-lift">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="font-extrabold">LTA Group</span>
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"><Crown size={14} /> Thành viên Xanh</span>
          </div>
          <div className="mt-8 text-xl font-bold">{user.name}</div>
          <div className="mt-1 font-mono tracking-widest text-white/80">{memberCode}</div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <div className="text-xs text-white/70">Điểm tích lũy</div>
              <div className="text-2xl font-extrabold">0 điểm</div>
            </div>
            <div className="text-right text-xs text-white/70">Đọc mã thành viên<br />khi mua tại cửa hàng</div>
          </div>
        </div>
      </div>

      <div className="max-w-md rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        Tích <b>1 điểm cho mỗi 10.000đ</b>. Đủ 500 điểm lên hạng <b>Bạc</b> (giảm thêm 3%), 2.000 điểm lên hạng <b>Vàng</b> (giảm 5%, miễn phí giao hàng).
        <div className="mt-1 text-xs text-gray-400">Điểm sẽ được cộng khi tính năng lưu đơn hàng hoàn thiện.</div>
      </div>

      <div>
        <h3 className="flex items-center gap-2 font-bold"><Ticket size={18} className="text-accent" /> Voucher của bạn</h3>
        {vouchers === null && <p className="mt-3 text-sm text-gray-500">Đang tải...</p>}
        {vouchers?.length === 0 && <p className="mt-3 text-sm text-gray-500">Hiện chưa có voucher nào.</p>}
        <div className="mt-3 grid max-w-2xl gap-3 sm:grid-cols-2">
          {vouchers?.map(v => (
            <div key={v.code} className="flex overflow-hidden rounded-xl border border-border bg-white">
              <div className={`grid w-20 shrink-0 place-items-center text-center text-xs font-bold text-white ${v.gifted ? 'bg-violet-600' : 'bg-accent'}`}>{v.gifted ? 'QUÀ TẶNG' : 'VOUCHER'}</div>
              <div className="min-w-0 flex-1 p-3">
                <div className="font-bold">{v.type === 'fixed' ? `Giảm ${formatPrice(v.value)}` : `Giảm ${v.value}%${v.maxDiscount ? ` (tối đa ${formatPrice(v.maxDiscount)})` : ''}`}</div>
                <div className="text-xs text-gray-500">
                  {v.description || (v.minOrder ? `Đơn từ ${formatPrice(v.minOrder)}` : 'Áp dụng cho mọi đơn hàng')}
                  {v.expiresAt ? ` · HSD ${v.expiresAt.split('-').reverse().join('/')}` : ''}
                </div>
                <button onClick={() => copy(v.code)} className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-accent px-2 py-1 font-mono text-sm font-bold text-accent">
                  {v.code} {copied === v.code ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">Bấm vào mã để sao chép, rồi dán vào ô "Mã giảm giá" ở giỏ hàng.</p>
      </div>
    </div>
  )
}

export default function AccountPage() {
  const user = useAuth(s => s.user)
  const logout = useAuth(s => s.logout)
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find(t => t.id === params.get('tab'))?.id ?? 'ho-so') as TabId

  if (!user) return <Navigate to="/login?redirect=/tai-khoan" replace />

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold">Tài khoản của tôi</h1>
      {user.mustChangePassword && tab !== 'mat-khau' && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <KeyRound size={18} className="shrink-0" />
          <span className="flex-1">Bạn đang dùng <b>mật khẩu tạm</b> do cửa hàng cấp. Vui lòng đổi sang mật khẩu của riêng bạn.</span>
          <button onClick={() => setParams({ tab: 'mat-khau' })} className="btn-primary px-4 py-2 text-sm">Đổi ngay</button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="card p-4">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-light text-lg font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <div className="truncate font-semibold">{user.name}</div>
                <div className="text-xs text-gray-500">{user.phone}</div>
              </div>
            </div>
            <nav className="no-scrollbar mt-3 flex gap-1 overflow-x-auto lg:flex-col">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setParams({ tab: id })} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${tab === id ? 'bg-primary-light text-primary' : 'hover:bg-gray-50'}`}>
                  <Icon size={18} /> {label}
                </button>
              ))}
              <Link to="/don-hang" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50"><ClipboardList size={18} /> Đơn hàng của tôi</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary-light"><ShieldCheck size={18} /> Trang quản trị</Link>
              )}
              <button onClick={logout} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={18} /> Đăng xuất</button>
            </nav>
          </div>
        </aside>

        <section className="card p-5 md:p-8 lg:col-span-9">
          <h2 className="mb-6 text-lg font-bold">{TABS.find(t => t.id === tab)!.label}</h2>
          {tab === 'ho-so' && <div className="space-y-10"><ProfileTab /><LinkedAccounts /></div>}
          {tab === 'thanh-vien' && <MembershipTab />}
          {tab === 'mat-khau' && <PasswordTab />}
        </section>
      </div>
    </div>
  )
}
