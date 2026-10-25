export type CategoryId = 'rau-cu' | 'trai-cay' | 'thit-trung' | 'hai-san' | 'sua' | 'do-kho' | 'do-uong'

export type Category = {
  id: CategoryId
  name: string
  short: string
  image: string
  description: string
}

export type Product = {
  id: number
  name: string
  price: number
  oldPrice?: number
  unit: string
  /** Bước tăng số lượng, ví dụ 0.5 cho hàng bán theo kg */
  step?: number
  image: string
  category: CategoryId
  origin: string
  description?: string
  rating: number
  sold: number
  tags?: ('organic' | 'hot' | 'new' | 'deal')[]
  /** false = hết hàng, vẫn hiển thị nhưng không cho mua */
  inStock?: boolean
  /** null = không theo dõi tồn kho */
  stock?: number | null
  costPrice?: number | null
}

export type PayMethod = 'cash' | 'bank' | 'momo'

export type ReceiptItem = { productId: number; name: string; unit: string; quantity: number; unitCost: number; stockAfter: number | null }
export type StockReceipt = {
  id: number
  code: string
  type: 'import' | 'export'
  reason: string
  partner: string
  orderCode: string | null
  note: string
  total: number
  createdAt: string
  createdBy: string | null
  itemCount?: number
  items?: ReceiptItem[]
}

export type CashEntry = {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  note: string
  ref: string | null
  method: PayMethod
  auto: boolean
  createdBy: string | null
  occurredAt: string
}

export type CashReport = {
  from: string
  to: string
  income: number
  expense: number
  net: number
  balance: number
  daily: { day: string; income: number; expense: number }[]
  byCategory: { type: 'income' | 'expense'; category: string; total: number }[]
  entries: CashEntry[]
}

export type Coupon = {
  code: string
  type: 'fixed' | 'percent'
  value: number
  maxDiscount: number | null
  minOrder: number
  usageLimit: number | null
  usedCount: number
  perUser: number
  private: boolean
  expiresAt: string | null
  active: boolean
  description: string
  createdAt: string
  gifted?: boolean
}

export type Customer = {
  id: number
  name: string
  phone: string
  email: string | null
  createdAt: string
  marketingOptIn: boolean
  google: boolean
  facebook: boolean
  orders: number
  spent: number
  lastOrder: string | null
}

export type Role = 'admin' | 'customer'

export type PaymentMethod = 'cod' | 'bank' | 'momo'
export type OrderStatus = 'pending' | 'awaiting_payment' | 'confirmed' | 'delivering' | 'completed' | 'cancelled'

export type OrderItem = { productId: number; name: string; image: string; unit: string; price: number; quantity: number }

export type Order = {
  id: number
  code: string
  userId: number
  customerName: string
  phone: string
  address: string
  note: string
  delivery: string
  paymentMethod: PaymentMethod
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  adminNote: string
  history: { status: OrderStatus; at: string; note: string }[]
  createdAt: string
  updatedAt: string
}

export type SocialProvider = 'google' | 'facebook'

export type User = {
  id: number
  name: string
  phone: string
  email?: string | null
  username?: string | null
  avatar?: string | null
  role: Role
  hasPassword?: boolean
  linked?: Record<SocialProvider, boolean>
  marketingOptIn?: boolean
  mustChangePassword?: boolean
}

export type CartItem = Product & { quantity: number }

export type RecipeIngredient = { productId: number; quantity: number; note?: string }

export type Recipe = {
  id: string
  name: string
  image: string
  time: string
  servings: number
  description: string
  ingredients: RecipeIngredient[]
}
