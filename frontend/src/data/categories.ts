import { Category } from '../types'

const categories: Category[] = [
  { id: 'rau-cu', name: 'Rau Củ Tươi', short: 'Rau củ', image: '/images/products/bong-cai.jpg', description: 'Đạt chuẩn VietGAP, thu hoạch mỗi sáng' },
  { id: 'trai-cay', name: 'Trái Cây', short: 'Trái cây', image: '/images/products/xoai.jpg', description: 'Nội địa & nhập khẩu loại 1' },
  { id: 'thit-trung', name: 'Thịt & Trứng', short: 'Thịt, trứng', image: '/images/products/ba-chi.jpg', description: 'Nguồn gốc rõ ràng, giết mổ trong ngày' },
  { id: 'hai-san', name: 'Hải Sản', short: 'Hải sản', image: '/images/products/ca-hoi.jpg', description: 'Đánh bắt tươi, giữ lạnh chuẩn' },
  { id: 'sua', name: 'Sữa & Bơ Sữa', short: 'Sữa', image: '/images/products/pho-mai.jpg', description: 'Sữa tươi, sữa chua, phô mai' },
  { id: 'do-kho', name: 'Đồ Khô & Gia Vị', short: 'Đồ khô', image: '/images/products/mi-goi.jpg', description: 'Gạo, bún, mì, nước mắm, dầu ăn' },
  { id: 'do-uong', name: 'Đồ Uống', short: 'Đồ uống', image: '/images/products/ca-phe.jpg', description: 'Cà phê, trà, nước dừa' }
]

export const categoryById = Object.fromEntries(categories.map(c => [c.id, c])) as Record<Category['id'], Category>

export default categories
