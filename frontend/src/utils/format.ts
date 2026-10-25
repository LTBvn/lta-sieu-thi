export const formatPrice = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}đ`

/** 0.5 -> "0,5" ; 2 -> "2" */
export const formatQty = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

export const discountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0

/** Bỏ dấu tiếng Việt để tìm kiếm: "Cà Chua" -> "ca chua" */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim()

/** Bỏ phần lẻ do cộng số thực (0.1 + 0.2) */
export const roundQty = (n: number) => Math.round(n * 100) / 100
