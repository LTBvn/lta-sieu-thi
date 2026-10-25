import React, { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Eye, EyeOff, Gift, Leaf, Link2, Loader2, Lock, Mail, ShieldCheck, Truck, User } from 'lucide-react'
import { useAuth } from '../store/useAuth'
import { useToast } from '../store/useToast'
import { authApi, AuthResponse, errorMessage, SocialProfile } from '../services/api'
import { useProviders } from '../hooks/useSocialLogin'
import SocialButtons, { FacebookIcon, GoogleIcon } from '../components/auth/SocialButtons'
import PhoneOtpStep from '../components/auth/PhoneOtpStep'
import { SocialProvider } from '../types'

type View = 'login' | 'register' | 'forgot' | 'link'

const PHONE = /^0\d{9}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[A-Za-z0-9_.]{3,30}$/

const perks = [
  { icon: Gift, text: 'Tặng voucher 50.000đ cho đơn đầu tiên' },
  { icon: Leaf, text: 'Tích điểm mỗi lần đi chợ, đổi quà hấp dẫn' },
  { icon: Truck, text: 'Lưu địa chỉ, đặt hàng chỉ trong 30 giây' }
]

function Field({ icon: Icon, error, children }: { icon: typeof User; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="relative">
        <Icon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <>
      <input {...props} type={show ? 'text' : 'password'} className="input py-3 pl-10 pr-11 text-base" />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </>
  )
}

const Divider = ({ text }: { text: string }) => (
  <div className="my-6 flex items-center gap-3 text-xs text-gray-400"><span className="h-px flex-1 bg-border" /> {text} <span className="h-px flex-1 bg-border" /></div>
)

// ---------- Đăng nhập bằng mật khẩu ----------

function SignIn({ onForgot }: { onForgot: () => void }) {
  const login = useAuth(s => s.login)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ identifier: string; password: string }>()

  async function onSubmit(d: { identifier: string; password: string }) {
    setError('')
    const err = await login(d.identifier, d.password)
    if (err) setError(err)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field icon={User} error={errors.identifier?.message}>
        <input
          {...register('identifier', {
            required: 'Vui lòng nhập số điện thoại, email hoặc tên đăng nhập',
            validate: v => PHONE.test(v.trim()) || EMAIL.test(v.trim()) || USERNAME.test(v.trim()) || 'Thông tin đăng nhập không hợp lệ'
          })}
          placeholder="Số điện thoại, email hoặc tên đăng nhập"
          autoComplete="username"
          autoFocus
          className="input py-3 pl-10 text-base"
        />
      </Field>
      <Field icon={Lock} error={errors.password?.message}>
        <PasswordInput {...register('password', { required: 'Vui lòng nhập mật khẩu' })} placeholder="Mật khẩu" autoComplete="current-password" />
      </Field>
      <div className="text-right">
        <button type="button" onClick={onForgot} className="text-sm font-semibold text-primary hover:underline">Quên mật khẩu?</button>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
        {isSubmitting && <Loader2 size={18} className="animate-spin" />} Đăng nhập
      </button>
    </form>
  )
}

// ---------- Đăng ký: điền thông tin → xác minh SĐT bằng OTP ----------

type RegisterForm = { name: string; phone: string; email: string; password: string; confirm: string; agree: boolean; marketingOptIn: boolean }

function SignUp({ otpSimulated, onDone }: { otpSimulated?: boolean; onDone: (r: AuthResponse) => void }) {
  const [info, setInfo] = useState<RegisterForm | null>(null)
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<RegisterForm>()

  if (info) {
    return (
      <div>
        <button type="button" onClick={() => setInfo(null)} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"><ArrowLeft size={16} /> Sửa thông tin</button>
        <PhoneOtpStep
          purpose="register"
          phone={info.phone}
          otpSimulated={otpSimulated}
          submitLabel="Xác minh & tạo tài khoản"
          onSubmit={async (phone, otp) => {
            try {
              onDone(await authApi.register({ name: info.name.trim(), phone, email: info.email.trim() || undefined, password: info.password, otp, marketingOptIn: info.marketingOptIn }))
              return null
            } catch (err) {
              return errorMessage(err)
            }
          }}
        >
          <p className="rounded-lg bg-primary-light p-3 text-sm text-primary-dark">Bấm gửi mã để xác minh số <b>{info.phone}</b> là của bạn.</p>
        </PhoneOtpStep>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(setInfo)} className="space-y-4" noValidate>
      <Field icon={User} error={errors.name?.message}>
        <input {...register('name', { required: 'Vui lòng nhập họ tên', minLength: { value: 2, message: 'Họ tên quá ngắn' } })} placeholder="Họ và tên" autoComplete="name" autoFocus className="input py-3 pl-10 text-base" />
      </Field>
      <Field icon={User} error={errors.phone?.message}>
        <input {...register('phone', { required: 'Vui lòng nhập số điện thoại', pattern: { value: PHONE, message: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' } })} placeholder="Số điện thoại" inputMode="tel" autoComplete="tel" className="input py-3 pl-10 text-base" />
      </Field>
      <Field icon={Mail} error={errors.email?.message}>
        <input {...register('email', { validate: v => !v || EMAIL.test(v.trim()) || 'Email không hợp lệ' })} placeholder="Email (không bắt buộc)" autoComplete="email" className="input py-3 pl-10 text-base" />
      </Field>
      <Field icon={Lock} error={errors.password?.message}>
        <PasswordInput {...register('password', { required: 'Vui lòng tạo mật khẩu', minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' } })} placeholder="Mật khẩu (tối thiểu 6 ký tự)" autoComplete="new-password" />
      </Field>
      <Field icon={Lock} error={errors.confirm?.message}>
        <PasswordInput {...register('confirm', { validate: v => v === getValues('password') || 'Mật khẩu nhập lại không khớp' })} placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
      </Field>
      <div>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
          <input type="checkbox" {...register('agree', { required: 'Bạn cần đồng ý với điều khoản' })} className="mt-0.5 h-4 w-4 accent-primary" />
          <span>Tôi đồng ý với <a href="#" className="font-semibold text-primary">Điều khoản sử dụng</a> và <a href="#" className="font-semibold text-primary">Chính sách bảo mật</a></span>
        </label>
        {errors.agree && <p className="mt-1 text-xs text-red-600">{errors.agree.message}</p>}
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" {...register('marketingOptIn')} className="mt-0.5 h-4 w-4 accent-primary" />
        <span>Nhận mã giảm giá và tin khuyến mãi qua SMS (không bắt buộc)</span>
      </label>
      <button className="btn-primary w-full py-3 text-base">Tiếp tục: xác minh số điện thoại</button>
    </form>
  )
}

// ---------- Quên mật khẩu: OTP + mật khẩu mới ----------

function Forgot({ otpSimulated, onDone }: { otpSimulated?: boolean; onDone: (r: AuthResponse) => void }) {
  const [password, setPassword] = useState('')

  return (
    <div className="space-y-4">
      <Field icon={Lock}>
        <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" autoComplete="new-password" />
      </Field>
      <PhoneOtpStep
        purpose="reset"
        otpSimulated={otpSimulated}
        submitLabel="Đặt lại mật khẩu"
        onSubmit={async (phone, otp) => {
          if (password.length < 6) return 'Mật khẩu mới tối thiểu 6 ký tự'
          try {
            onDone(await authApi.resetPassword(phone, otp, password))
            return null
          } catch (err) {
            return errorMessage(err)
          }
        }}
      />
    </div>
  )
}

// ---------- Liên kết SĐT sau khi đăng nhập Google/Facebook ----------

function LinkPhone({ profile, linkToken, otpSimulated, onDone }: { profile: SocialProfile; linkToken: string; otpSimulated?: boolean; onDone: (r: AuthResponse) => void }) {
  const [existing, setExisting] = useState<boolean | null>(null)
  const label = profile.provider === 'google' ? 'Google' : 'Facebook'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-gray-50 p-3">
        {profile.avatar
          ? <img src={profile.avatar} alt="" className="h-12 w-12 rounded-full object-cover" referrerPolicy="no-referrer" />
          : <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-light text-lg font-bold text-primary">{profile.name.charAt(0)}</span>}
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{profile.name}</div>
          <div className="truncate text-xs text-gray-500">{profile.email || `Tài khoản ${label}`}</div>
        </div>
        {profile.provider === 'google' ? <GoogleIcon /> : <FacebookIcon />}
      </div>

      <p className="text-sm text-gray-600">
        Để giao hàng và bảo vệ tài khoản, LTA cần <b>liên kết số điện thoại</b> với tài khoản {label} của bạn. Chỉ cần làm một lần.
      </p>

      {existing !== null && (
        <p className={`rounded-lg p-3 text-sm ${existing ? 'bg-sky-50 text-sky-900' : 'bg-primary-light text-primary-dark'}`}>
          {existing
            ? `Số này đã có tài khoản LTA. Sau khi xác minh, ${label} sẽ được gắn vào tài khoản đó (giữ nguyên đơn hàng, điểm thưởng).`
            : 'Số này chưa có tài khoản. Sau khi xác minh, LTA sẽ tạo tài khoản mới cho bạn.'}
        </p>
      )}

      <PhoneOtpStep
        purpose="link"
        otpSimulated={otpSimulated}
        submitLabel="Xác minh & liên kết"
        onSent={({ existing }) => setExisting(existing)}
        onSubmit={async (phone, otp) => {
          try {
            onDone(await authApi.socialLink(linkToken, phone, otp))
            return null
          } catch (err) {
            return errorMessage(err)
          }
        }}
      />
    </div>
  )
}

// ---------- Trang ----------

const TITLES: Record<View, [string, string]> = {
  login: ['Chào mừng trở lại 👋', 'Đăng nhập để đi chợ, theo dõi đơn hàng và tích điểm.'],
  register: ['Tạo tài khoản mới', 'Chỉ mất 1 phút, nhận ngay voucher 50.000đ.'],
  forgot: ['Quên mật khẩu', 'Xác minh số điện thoại để đặt mật khẩu mới.'],
  link: ['Liên kết số điện thoại', 'Bước cuối cùng để hoàn tất đăng nhập.']
}

export default function LoginPage() {
  const user = useAuth(s => s.user)
  const signIn = useAuth(s => s.signIn)
  const show = useToast(s => s.show)
  const providers = useProviders()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const redirect = params.get('redirect') || '/'
  const [view, setView] = useState<View>(params.get('mode') === 'register' ? 'register' : 'login')
  const [social, setSocial] = useState<{ profile: SocialProfile; linkToken: string } | null>(null)
  const [socialBusy, setSocialBusy] = useState(false)
  const [socialError, setSocialError] = useState('')

  if (user) return <Navigate to={redirect} replace />

  function go(v: View) {
    setView(v)
    setSocialError('')
    const next = new URLSearchParams(params)
    if (v === 'register') next.set('mode', 'register')
    else next.delete('mode')
    setParams(next, { replace: true })
  }

  function done(r: AuthResponse, message?: string) {
    signIn(r)
    show(message ?? `Xin chào, ${r.user.name}!`)
    navigate(redirect, { replace: true })
  }

  async function onSocialToken(provider: SocialProvider, token: string) {
    setSocialBusy(true)
    setSocialError('')
    try {
      const r = await authApi.social(provider, token)
      if ('needPhone' in r) {
        setSocial({ profile: r.profile, linkToken: r.linkToken })
        setView('link')
      } else done(r)
    } catch (err) {
      setSocialError(errorMessage(err))
    } finally {
      setSocialBusy(false)
    }
  }

  const [title, subtitle] = TITLES[view]
  const tab = (active: boolean) => `flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${active ? 'bg-white text-primary shadow-card' : 'text-gray-500 hover:text-gray-700'}`

  return (
    <div className="flex min-h-screen bg-white">
      {/* Cột ảnh thương hiệu (máy tính) */}
      <aside className="relative hidden w-[46%] shrink-0 lg:block">
        <img src="/images/banners/cho-sai-gon.jpg" alt="Sạp rau tươi ở chợ" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/75 to-primary/20" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <Link to="/" className="flex w-fit items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl font-extrabold text-primary">L</span>
            <span className="text-xl font-extrabold">LTA Group</span>
          </Link>
          <div>
            <h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">Đi chợ tươi mỗi ngày,<br />không cần ra chợ.</h1>
            <p className="mt-4 max-w-md text-white/85">Từ nông trại đến bàn ăn, LTA chọn hàng tươi và giao tận nhà trong 2 giờ.</p>
            <ul className="mt-8 space-y-3">
              {perks.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"><Icon size={18} /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="flex items-center gap-2 text-sm text-white/70"><ShieldCheck size={16} /> Thông tin của bạn được mã hóa và bảo mật</p>
        </div>
      </aside>

      {/* Cột form */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-4 sm:px-10">
          <Link to="/" className="flex items-center gap-2 lg:invisible">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg font-extrabold text-white">L</span>
            <span className="text-lg font-extrabold text-primary">LTA Group</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary"><ArrowLeft size={16} /> Về cửa hàng</Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-10">
          <div className="w-full max-w-md">
            {(view === 'forgot' || view === 'link') && (
              <button type="button" onClick={() => go('login')} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"><ArrowLeft size={16} /> Quay lại đăng nhập</button>
            )}
            <h2 className="flex items-center gap-2 text-3xl font-extrabold">{view === 'link' && <Link2 className="text-primary" />}{title}</h2>
            <p className="mt-2 text-gray-500">{subtitle}</p>

            {(view === 'login' || view === 'register') && (
              <div className="mt-8 flex rounded-xl bg-gray-100 p-1">
                <button type="button" className={tab(view === 'login')} onClick={() => go('login')}>Đăng nhập</button>
                <button type="button" className={tab(view === 'register')} onClick={() => go('register')}>Đăng ký</button>
              </div>
            )}

            <div className="mt-6">
              {view === 'login' && <SignIn onForgot={() => go('forgot')} />}
              {view === 'register' && <SignUp otpSimulated={providers?.otpSimulated} onDone={r => done(r, `Chào mừng ${r.user.name} đến với LTA Group!`)} />}
              {view === 'forgot' && <Forgot otpSimulated={providers?.otpSimulated} onDone={r => done(r, 'Đã đặt mật khẩu mới')} />}
              {view === 'link' && social && <LinkPhone {...social} otpSimulated={providers?.otpSimulated} onDone={r => done(r, `Đã liên kết, xin chào ${r.user.name}!`)} />}
            </div>

            {(view === 'login' || view === 'register') && (
              <>
                <Divider text="hoặc tiếp tục với" />
                <SocialButtons providers={providers} onToken={onSocialToken} onError={setSocialError} busy={socialBusy} />
                {socialBusy && <p className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" /> Đang xác minh...</p>}
                {socialError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{socialError}</p>}
                <p className="mt-4 text-center text-xs text-gray-400">Đăng nhập lần đầu bằng Google/Facebook sẽ cần liên kết số điện thoại.</p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
