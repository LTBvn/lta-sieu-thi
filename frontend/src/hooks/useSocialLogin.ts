import { useEffect, useState } from 'react'
import { authApi, Providers } from '../services/api'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any
    FB?: any
    fbAsyncInit?: () => void
  }
}

const loaded = new Map<string, Promise<void>>()

function loadScript(src: string) {
  if (!loaded.has(src)) {
    loaded.set(src, new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => { loaded.delete(src); reject(new Error('Không tải được ' + src)) }
      document.head.appendChild(s)
    }))
  }
  return loaded.get(src)!
}

let providersCache: Promise<Providers> | null = null

/** Mã Google/Facebook do backend cấu hình (backend/.env) */
export function useProviders() {
  const [providers, setProviders] = useState<Providers | null>(null)
  useEffect(() => {
    providersCache ??= authApi.providers().catch(err => { providersCache = null; throw err })
    providersCache.then(setProviders).catch(() => setProviders({ google: null, facebook: null, otpSimulated: false }))
  }, [])
  return providers
}

/**
 * Vẽ nút "Đăng nhập với Google" chính thức vào phần tử `el`.
 * Google trả về ID token (credential) qua `onToken`; backend tự xác minh token này.
 */
export async function renderGoogleButton(el: HTMLElement, clientId: string, onToken: (idToken: string) => void, text: 'signin_with' | 'continue_with' = 'continue_with') {
  await loadScript('https://accounts.google.com/gsi/client')
  window.google.accounts.id.initialize({ client_id: clientId, callback: (r: { credential: string }) => onToken(r.credential), ux_mode: 'popup' })
  window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'rectangular', text, locale: 'vi', width: el.clientWidth || 320 })
}

/** Mở cửa sổ đăng nhập Facebook, trả về access token (backend tự xác minh) */
export async function facebookLogin(appId: string): Promise<string> {
  if (!window.FB) {
    await new Promise<void>((resolve, reject) => {
      window.fbAsyncInit = () => {
        window.FB.init({ appId, cookie: false, xfbml: false, version: 'v19.0' })
        resolve()
      }
      loadScript('https://connect.facebook.net/vi_VN/sdk.js').catch(reject)
    })
  }
  return new Promise((resolve, reject) => {
    window.FB.login((res: any) => {
      if (res.authResponse?.accessToken) resolve(res.authResponse.accessToken)
      else reject(new Error('Bạn đã hủy đăng nhập Facebook'))
    }, { scope: 'public_profile,email' })
  })
}
