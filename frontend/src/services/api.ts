import axios from 'axios'
import { CashReport, Coupon, Customer, Order, OrderStatus, PayMethod, PaymentMethod, Product, Role, SocialProvider, StockReceipt, User } from '../types'

const api = axios.create({ baseURL: '/api' })

let token: string | null = null
export const setToken = (t: string | null) => { token = t }

api.interceptors.request.use(config => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Lấy câu thông báo lỗi tiếng Việt mà server trả về */
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.error) return err.response.data.error
    if (!err.response || err.response.status >= 500) return 'Không kết nối được máy chủ. Hãy chạy "npm run dev" ở thư mục gốc.'
  }
  return 'Đã có lỗi xảy ra'
}

export type AuthResponse = { token: string; user: User }
export type ProductInput = Omit<Product, 'id' | 'rating' | 'sold'>
export type OtpPurpose = 'register' | 'link' | 'reset'
export type Providers = { google: string | null; facebook: string | null; otpSimulated: boolean }
export type SocialProfile = { provider: SocialProvider; name: string; email?: string; avatar?: string }
export type SocialResult = AuthResponse | { needPhone: true; linkToken: string; profile: SocialProfile }

export const authApi = {
  providers: () => api.get<Providers>('/auth/providers').then(r => r.data),
  login: (identifier: string, password: string) => api.post<AuthResponse>('/auth/login', { identifier, password }).then(r => r.data),
  sendOtp: (phone: string, purpose: OtpPurpose) =>
    api.post<{ ok: true; retryAfter: number; existing: boolean }>('/auth/otp/send', { phone, purpose }).then(r => r.data),
  register: (data: { name: string; phone: string; email?: string; password: string; otp: string; marketingOptIn?: boolean }) =>
    api.post<AuthResponse>('/auth/register', data).then(r => r.data),
  resetPassword: (phone: string, otp: string, newPassword: string) =>
    api.post<AuthResponse>('/auth/password/reset', { phone, otp, newPassword }).then(r => r.data),
  social: (provider: SocialProvider, token: string) => api.post<SocialResult>('/auth/social', { provider, token }).then(r => r.data),
  socialLink: (linkToken: string, phone: string, otp: string) =>
    api.post<AuthResponse>('/auth/social/link', { linkToken, phone, otp }).then(r => r.data),
  socialConnect: (provider: SocialProvider, token: string) =>
    api.post<{ user: User }>('/auth/social/connect', { provider, token }).then(r => r.data.user),
  socialUnlink: (provider: SocialProvider) => api.delete<{ user: User }>(`/auth/social/${provider}`).then(r => r.data.user),
  me: () => api.get<{ user: User }>('/auth/me').then(r => r.data.user),
  updateProfile: (data: { name: string; email?: string; marketingOptIn?: boolean }) => api.put<{ user: User }>('/auth/me', data).then(r => r.data.user),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ user: User }>('/auth/password', { currentPassword, newPassword }).then(r => r.data.user)
}

export type NewOrder = {
  items: { productId: number; quantity: number }[]
  name: string
  phone: string
  address: string
  note: string
  delivery: string
  payment: PaymentMethod
  coupon?: string
}

export type OrderAction = 'request_payment' | 'confirm' | 'mark_paid' | 'deliver' | 'complete' | 'cancel'

export const orderApi = {
  create: (data: NewOrder) => api.post<Order>('/orders', data).then(r => r.data),
  mine: () => api.get<Order[]>('/orders/mine').then(r => r.data),
  get: (code: string) => api.get<Order>(`/orders/${code}`).then(r => r.data),
  cancel: (code: string) => api.post<Order>(`/orders/${code}/cancel`).then(r => r.data),
  // Admin
  list: (status?: OrderStatus) => api.get<Order[]>('/admin/orders', { params: status ? { status } : {} }).then(r => r.data),
  summary: () => api.get<{ counts: Partial<Record<OrderStatus, number>>; latestId: number }>('/admin/orders/summary').then(r => r.data),
  act: (code: string, action: OrderAction, extra?: { total?: number; adminNote?: string }) =>
    api.patch<Order>(`/admin/orders/${code}`, { action, ...extra }).then(r => r.data)
}

export type PaymentAccount ={ enabled: boolean; accountNo: string; accountName: string }
export type PaymentSettings = { bank: PaymentAccount & { bin: string }; momo: PaymentAccount }

export const settingsApi = {
  getPayment: () => api.get<PaymentSettings>('/settings/payment').then(r => r.data),
  updatePayment: (data: PaymentSettings) => api.put<PaymentSettings>('/settings/payment', data).then(r => r.data)
}

export const productApi = {
  list: () => api.get<Product[]>('/products').then(r => r.data),
  create: (data: ProductInput) => api.post<Product>('/products', data).then(r => r.data),
  update: (id: number, data: ProductInput) => api.put<Product>(`/products/${id}`, data).then(r => r.data),
  setStock: (id: number, inStock: boolean) => api.patch<Product>(`/products/${id}/stock`, { inStock }).then(r => r.data),
  remove: (id: number) => api.delete(`/products/${id}`),
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return api.post<{ url: string }>('/uploads', form).then(r => r.data.url)
  }
}

export const userApi = {
  list: () => api.get<User[]>('/users').then(r => r.data),
  setRole: (id: number, role: Role) => api.patch<User>(`/users/${id}/role`, { role }).then(r => r.data)
}

export type Reasons = Record<'import' | 'export', Record<string, string>>
export type CashCategories = Record<'income' | 'expense', Record<string, string>>
export type StockOverview = {
  products: Product[]
  lowStock: number
  summary: { tracked: number; untracked: number; outOfStock: number; low: number; value: number }
}
export type NewReceipt = {
  type: 'import' | 'export'
  reason: string
  partner: string
  note: string
  items: { productId: number; quantity: number; unitCost?: number }[]
  paid?: boolean
  method?: PayMethod
}

export const inventoryApi = {
  stock: () => api.get<StockOverview>('/admin/inventory/stock').then(r => r.data),
  reasons: () => api.get<Reasons>('/admin/inventory/reasons').then(r => r.data),
  receipts: (type?: 'import' | 'export') => api.get<StockReceipt[]>('/admin/inventory/receipts', { params: type ? { type } : {} }).then(r => r.data),
  receipt: (code: string) => api.get<StockReceipt>(`/admin/inventory/receipts/${code}`).then(r => r.data),
  create: (data: NewReceipt) => api.post<{ code: string; total: number }>('/admin/inventory/receipts', data).then(r => r.data),
  untrack: (productId: number) => api.delete<Product>(`/admin/inventory/products/${productId}/tracking`).then(r => r.data)
}

export const cashbookApi = {
  categories: () => api.get<CashCategories>('/admin/cashbook/categories').then(r => r.data),
  report: (from: string, to: string) => api.get<CashReport>('/admin/cashbook', { params: { from, to } }).then(r => r.data),
  add: (data: { type: 'income' | 'expense'; amount: number; category: string; note: string; method: PayMethod }) => api.post('/admin/cashbook', data),
  remove: (id: number) => api.delete(`/admin/cashbook/${id}`)
}

export type CouponInput = Omit<Coupon, 'usedCount' | 'createdAt' | 'gifted'>

export const couponApi = {
  check: (code: string, subtotal: number) => api.post<{ code: string; discount: number; description: string }>('/coupons/check', { code, subtotal }).then(r => r.data),
  mine: () => api.get<Coupon[]>('/coupons/mine').then(r => r.data),
  list: () => api.get<Coupon[]>('/coupons').then(r => r.data),
  create: (c: CouponInput) => api.post<Coupon>('/coupons', c).then(r => r.data),
  update: (c: CouponInput) => api.put<Coupon>(`/coupons/${c.code}`, c).then(r => r.data),
  remove: (code: string) => api.delete(`/coupons/${code}`)
}

export const customerApi = {
  list: () => api.get<Customer[]>('/admin/customers').then(r => r.data),
  resetPassword: (id: number) => api.post<{ tempPassword: string }>(`/admin/customers/${id}/reset-password`).then(r => r.data.tempPassword),
  sendPromo: (data: { userIds: number[]; code?: string; message: string }) =>
    api.post<{ sent: number; skipped: number }>('/admin/customers/send-promo', data).then(r => r.data),
  history: () => api.get<{ id: number; code: string | null; message: string; recipients: number; createdBy: string; createdAt: string }[]>('/admin/customers/promo-history').then(r => r.data)
}

export default api
