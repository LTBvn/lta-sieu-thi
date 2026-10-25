import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, AuthResponse, errorMessage, setToken } from '../services/api'
import { User } from '../types'

type AuthState = {
  user: User | null
  token: string | null
  /** Trả về thông báo lỗi, hoặc null nếu thành công */
  login: (identifier: string, password: string) => Promise<string | null>
  /** Lưu phiên sau khi đăng ký / OTP / Google / Facebook thành công */
  signIn: (res: AuthResponse) => void
  setUser: (user: User) => void
  logout: () => void
  /** Hỏi lại server thông tin & quyền mới nhất (vd: vừa được cấp quyền admin) */
  refresh: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      async login(identifier, password) {
        try {
          const { token, user } = await authApi.login(identifier, password)
          setToken(token)
          set({ token, user })
          return null
        } catch (err) {
          return errorMessage(err)
        }
      },
      signIn({ token, user }) {
        setToken(token)
        set({ token, user })
      },
      setUser(user) {
        set({ user })
      },
      logout() {
        setToken(null)
        set({ user: null, token: null })
      },
      async refresh() {
        if (!get().token) return
        try {
          set({ user: await authApi.me() })
        } catch (err) {
          // Token hết hạn hoặc tài khoản bị xóa thì đăng xuất; mất mạng thì giữ nguyên
          if ((err as { response?: { status?: number } }).response?.status === 401) get().logout()
        }
      }
    }),
    {
      name: 'lta-auth',
      // v0 là bản lưu tài khoản trong trình duyệt, không có token: bỏ đi
      version: 1,
      migrate: () => ({ user: null, token: null }) as unknown as AuthState,
      partialize: s => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => state => setToken(state?.token ?? null)
    }
  )
)

export const isAdmin = (user: User | null) => user?.role === 'admin'
