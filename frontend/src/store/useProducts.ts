import { create } from 'zustand'
import fallback from '../data/products'
import { productApi } from '../services/api'
import { Product } from '../types'

type ProductsState = {
  products: Product[]
  byId: Map<number, Product>
  status: 'loading' | 'ready' | 'offline'
  load: () => Promise<void>
  upsert: (p: Product) => void
  removeLocal: (id: number) => void
}

const indexed = (products: Product[]) => ({ products, byId: new Map(products.map(p => [p.id, p])) })

/**
 * Danh sách sản phẩm lấy từ API. Nếu server chưa chạy thì tạm dùng dữ liệu
 * có sẵn trong src/data/products.ts để web vẫn xem được (status = 'offline').
 */
export const useProducts = create<ProductsState>((set, get) => ({
  ...indexed(fallback),
  status: 'loading',
  async load() {
    // Server có thể đang khởi động: thử lại vài lần trước khi báo offline
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        set({ ...indexed(await productApi.list()), status: 'ready' })
        return
      } catch {
        if (attempt === 0) set({ status: 'offline' })
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  },
  upsert(p) {
    const list = get().products
    set(indexed(list.some(x => x.id === p.id) ? list.map(x => (x.id === p.id ? p : x)) : [...list, p]))
  },
  removeLocal(id) {
    set(indexed(get().products.filter(p => p.id !== id)))
  }
}))

export const isAvailable = (p: Product) => p.inStock !== false
