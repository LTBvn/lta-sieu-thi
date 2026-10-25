import { db } from '../db.js'

/** Chạy nhiều câu lệnh như một giao dịch: lỗi giữa chừng thì hoàn tác toàn bộ */
export function tx(fn) {
  db.exec('BEGIN')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

/** Lỗi nghiệp vụ có câu báo tiếng Việt, route trả về 400 */
export class BusinessError extends Error {}

const round2 = n => Math.round(n * 100) / 100

// ---------- Kho ----------

export const RECEIPT_REASONS = {
  import: { nhap_hang: 'Nhập hàng từ nhà cung cấp', khach_tra: 'Khách trả hàng', kiem_ke: 'Điều chỉnh kiểm kê (thừa)', khac: 'Khác' },
  export: { ban_hang: 'Xuất bán theo đơn', hang_hong: 'Hàng hỏng / hết hạn', tra_ncc: 'Trả nhà cung cấp', kiem_ke: 'Điều chỉnh kiểm kê (thiếu)', khac: 'Khác' }
}

function nextReceiptCode(type) {
  const prefix = type === 'import' ? 'PN' : 'PX'
  const last = db.prepare('SELECT code FROM stock_receipts WHERE type = ? ORDER BY id DESC LIMIT 1').get(type)
  const n = last ? Number(last.code.slice(2)) + 1 : 1
  return prefix + String(n).padStart(5, '0')
}

/**
 * Tạo phiếu nhập/xuất và cập nhật tồn kho. Gọi bên trong tx().
 * items: [{ productId, quantity, unitCost? }]
 * - Nhập: sản phẩm bắt đầu được theo dõi tồn kho; cập nhật giá vốn; còn hàng → mở bán lại.
 * - Xuất: không cho xuất quá tồn (trừ khi allowNegative); về 0 → tự báo hết hàng.
 */
export function createReceipt({ type, reason, partner = '', note = '', orderCode = null, items, userId = null, allowNegative = false }) {
  const lines = []
  for (const { productId, quantity, unitCost } of items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
    if (!p) throw new BusinessError(`Không tìm thấy sản phẩm #${productId}`)
    if (!(quantity > 0)) throw new BusinessError(`Số lượng ${p.name} phải lớn hơn 0`)

    const before = p.stock ?? 0
    const after = round2(type === 'import' ? before + quantity : before - quantity)
    // Sản phẩm chưa theo dõi tồn kho thì xuất bán không trừ âm (giữ cách bán cũ)
    if (type === 'export' && p.stock !== null && after < 0 && !allowNegative) {
      throw new BusinessError(`${p.name} chỉ còn ${before} ${p.unit} trong kho`)
    }
    const cost = Math.round(unitCost ?? p.cost_price ?? 0)
    const tracked = type === 'import' || p.stock !== null
    const newStock = tracked ? Math.max(0, after) : null

    db.prepare(`
      UPDATE products SET stock = ?, cost_price = ?, in_stock = ?, updated_at = datetime('now') WHERE id = ?
    `).run(newStock, type === 'import' && unitCost ? cost : p.cost_price, tracked ? (newStock > 0 ? 1 : 0) : p.in_stock, p.id)

    lines.push({ productId: p.id, name: p.name, unit: p.unit, quantity, unitCost: cost, stockAfter: newStock })
  }

  const total = Math.round(lines.reduce((s, l) => s + l.quantity * l.unitCost, 0))
  const code = nextReceiptCode(type)
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO stock_receipts (code, type, reason, partner, order_code, note, total, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, type, reason, partner, orderCode, note, total, userId)
  const insertItem = db.prepare('INSERT INTO stock_receipt_items (receipt_id, product_id, name, unit, quantity, unit_cost, stock_after) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const l of lines) insertItem.run(lastInsertRowid, l.productId, l.name, l.unit, l.quantity, l.unitCost, l.stockAfter)
  return { id: Number(lastInsertRowid), code, total }
}

// ---------- Thu chi ----------

export const CASH_CATEGORIES = {
  income: { ban_hang: 'Bán hàng', thu_khac: 'Thu khác' },
  expense: { nhap_hang: 'Nhập hàng', hoan_tien: 'Hoàn tiền khách', mat_bang: 'Mặt bằng', luong: 'Lương nhân viên', dien_nuoc: 'Điện nước', van_chuyen: 'Vận chuyển', marketing: 'Quảng cáo / khuyến mãi', chi_khac: 'Chi khác' }
}

export function addCashEntry({ type, amount, category, note = '', ref = null, method = 'cash', auto = false, userId = null }) {
  if (!(amount > 0)) return
  db.prepare('INSERT INTO cashbook (type, amount, category, note, ref, method, auto, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(type, Math.round(amount), category, note, ref, method, auto ? 1 : 0, userId)
}

// ---------- Mã khuyến mãi ----------

/**
 * Tính số tiền giảm của mã cho một đơn. Trả { discount, coupon } hoặc ném BusinessError.
 * Kiểm tra: còn hiệu lực, hạn dùng, đơn tối thiểu, tổng lượt, lượt mỗi khách, mã riêng.
 */
export function evaluateCoupon(codeRaw, subtotal, userId) {
  const code = String(codeRaw || '').trim().toUpperCase()
  const c = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code)
  if (!c || !c.active) throw new BusinessError('Mã giảm giá không tồn tại hoặc đã ngừng')
  if (c.expires_at && new Date(c.expires_at + 'T23:59:59+07:00') < new Date()) throw new BusinessError('Mã giảm giá đã hết hạn')
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) throw new BusinessError('Mã giảm giá đã hết lượt sử dụng')
  if (subtotal < c.min_order) throw new BusinessError(`Mã chỉ áp dụng cho đơn từ ${c.min_order.toLocaleString('vi-VN')}đ`)
  if (c.private && !db.prepare('SELECT 1 FROM user_coupons WHERE user_id = ? AND code = ?').get(userId, code)) {
    throw new BusinessError('Mã này chỉ dành cho khách được tặng')
  }
  if (c.per_user) {
    const used = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND coupon = ? AND status != 'cancelled'").get(userId, code).n
    if (used >= c.per_user) throw new BusinessError('Bạn đã dùng hết lượt của mã này')
  }
  let discount = c.type === 'fixed' ? c.value : Math.floor((subtotal * c.value) / 100)
  if (c.type === 'percent' && c.max_discount) discount = Math.min(discount, c.max_discount)
  return { discount: Math.min(discount, subtotal), coupon: c }
}
