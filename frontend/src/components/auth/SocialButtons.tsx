import React, { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Providers } from '../../services/api'
import { facebookLogin, renderGoogleButton } from '../../hooks/useSocialLogin'
import { SocialProvider } from '../../types'

type Props = {
  providers: Providers | null
  /** Nhận token từ Google/Facebook để gửi lên backend xác minh */
  onToken: (provider: SocialProvider, token: string) => void
  onError: (message: string) => void
  busy?: boolean
}

export const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)

export const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
  </svg>
)

/** Nút Google (nút chính thức do Google vẽ) + nút Facebook. Chưa cấu hình mã thì hiện nút mờ kèm ghi chú. */
export default function SocialButtons({ providers, onToken, onError, busy }: Props) {
  const googleRef = useRef<HTMLDivElement>(null)
  const [fbBusy, setFbBusy] = useState(false)
  const [googleFailed, setGoogleFailed] = useState(false)
  // Nút Google chỉ vẽ một lần; ref giúp nó luôn gọi hàm xử lý mới nhất của trang cha
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    if (!providers?.google || !googleRef.current) return
    renderGoogleButton(googleRef.current, providers.google, t => onTokenRef.current('google', t)).catch(() => setGoogleFailed(true))
  }, [providers?.google])

  async function fb() {
    if (!providers?.facebook) return
    setFbBusy(true)
    try {
      onToken('facebook', await facebookLogin(providers.facebook))
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setFbBusy(false)
    }
  }

  const missing = providers && (!providers.google || !providers.facebook)
  const fallback = 'flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white text-sm font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className={`space-y-3 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
      {providers?.google && !googleFailed ? (
        <div ref={googleRef} className="flex h-11 w-full justify-center overflow-hidden" />
      ) : (
        <button type="button" disabled className={fallback} title="Chưa cấu hình GOOGLE_CLIENT_ID"><GoogleIcon /> Tiếp tục với Google</button>
      )}
      <button type="button" onClick={fb} disabled={!providers?.facebook || fbBusy} className={fallback} title={providers?.facebook ? undefined : 'Chưa cấu hình FACEBOOK_APP_ID'}>
        {fbBusy ? <Loader2 size={18} className="animate-spin" /> : <FacebookIcon />} Tiếp tục với Facebook
      </button>
      {missing && (
        <p className="text-center text-xs text-gray-400">
          {googleFailed ? 'Không tải được Google. ' : ''}Điền <code>GOOGLE_CLIENT_ID</code> / <code>FACEBOOK_APP_ID</code> trong <code>backend/.env</code> để bật đăng nhập mạng xã hội.
        </p>
      )}
    </div>
  )
}
