import crypto from 'node:crypto'
import { z } from 'zod'
import { Router } from 'express'
import { db, toProduct } from '../db.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { parse } from '../lib/validate.js'
import { getPaymentSettings } from './settings.js'
import { addCashEntry, BusinessError, createReceipt, evaluateCoupon, tx } from '../lib/business.js'

export const ordersRouter = Router()
export const adminOrdersRouter = Router()

export const FREE_SHIP_THRESHOLD = 300000
export const SHIPPING_FEE = 15000

/**
 * Trạng thái đơn:
 *   pending          Chờ shop xác nhận (mới đặt)
 *   awaiting_payment Shop đã gửi mã thanh toán, chờ khách chuyển tiền (chỉ bank/momo)
 *   confirmed        Đã xác nhận (COD) / đã nhận tiền (bank/momo), đang chuẩn bị hàng
 *   delivering       Đang giao
 *   completed        Hoàn tất
 *   cancelled        Đã hủy
 */
const ACTIONS = {
  // action: [trạng thái được phép, trạng thái mới, ghi chú lịch sử]
  request_payment: [['pending'], 'awaiting_payment', 'Shop đã xác nhận và gửi mã thanh toán'],
  confirm:         [['pending'], 'confirmed', 'Shop đã xác nhận đơn'],
  mark_paid:       [['awaiting_payment'], 'confirmed', 'Shop đã nhận được tiền'],
  deliver:         [['confirmed'], 'delivering', 'Đơn hàng đang được giao'],
  complete:        [['delivering'], 'completed', 'Giao hàng thành công'],
  cancel:          [['pending', 'awaiting_payment', 'confirmed'], 'cancelled', 'Shop đã hủy đơn']
}

const now = () => new Date().toISOString()

function toOrder(row) {
  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    note: row.note,
    delivery: row.delivery,
    paymentMethod: row.payment_method,
    items: JSON.parse(row.items),
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount,
    total: row.total,
    status: row.status,
    adminNote: row.admin_note,
    history: JSON.parse(row.history),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Hủy đơn thì trả lại lượt dùng mã giảm giá */
const releaseCoupon = row => {
  if (row.coupon) db.prepare('UPDATE coupons SET used_count = MAX(0, used_count - 1) WHERE code = ?').run(row.coupon)
}

const findByCode = code => db.prepare('SELECT * FROM orders WHERE code = ?').get(String(code).toUpperCase())

function newCode() {
  for (;;) {
    const code = 'LTA' + crypto.randomInt(100000, 1000000)
    if (!findByCode(code)) return code
  }
}

const orderSchema = z.object({
  items: z.array(z.object({ productId: z.number().int(), quantity: z.number().positive() })).min(1, 'Giỏ hàng đang trống'),
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên'),
  phone: z.string().trim().regex(/^0\d{9}$/, 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0'),
  address: z.string().trim().min(5, 'Vui lòng nhập địa chỉ đầy đủ'),
  note: z.string().trim().max(500).default(''),
  delivery: z.string().trim().min(1),
  payment: z.enum(['cod', 'bank', 'momo']),
  coupon: z.string().trim().toUpperCase().optional()
})

/** Khách đặt hàng: server tự tính lại giá từ database, không tin số tiền gửi lên */
ordersRouter.post('/', requireAuth, (req, res) => {
  const data = parse(orderSchema, req.body, res)
  if (!data) return

  if (data.payment !== 'cod' && !getPaymentSettings()[data.payment]?.enabled) {
    return res.status(400).json({ error: 'Shop chưa mở phương thức thanh toán này' })
  }

  const items = []
  for (const { productId, quantity } of data.items) {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
    if (!row) return res.status(400).json({ error: 'Có sản phẩm không còn bán, vui lòng tải lại giỏ hàng' })
    const p = toProduct(row)
    if (!p.inStock) return res.status(400).json({ error: `${p.name} vừa hết hàng, vui lòng xóa khỏi giỏ` })
    if (p.stock !== null && quantity > p.stock) return res.status(400).json({ error: `${p.name} chỉ còn ${p.stock} ${p.unit}, vui lòng giảm số lượng` })
    items.push({ productId: p.id, name: p.name, image: p.image, unit: p.unit, price: p.price, quantity })
  }

  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0))
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE
  let discount = 0
  let couponCode = null
  if (data.coupon) {
    try {
      discount = evaluateCoupon(data.coupon, subtotal, req.user.id).discount
      couponCode = data.coupon
    } catch (err) {
      if (err instanceof BusinessError) return res.status(400).json({ error: err.message })
      throw err
    }
  }
  const total = Math.max(0, subtotal + shipping - discount)
  const code = newCode()
  const history = [{ status: 'pending', at: now(), note: 'Khách đặt hàng' }]

  tx(() => {
    db.prepare(`
      INSERT INTO orders (code, user_id, customer_name, phone, address, note, delivery, payment_method, items, subtotal, shipping, discount, total, history, coupon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, req.user.id, data.name, data.phone, data.address, data.note, data.delivery, data.payment, JSON.stringify(items), subtotal, shipping, discount, total, JSON.stringify(history), couponCode)
    if (couponCode) db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(couponCode)
  })

  console.log(`[đơn mới] ${code} · ${data.name} · ${total.toLocaleString('vi-VN')}đ · ${data.payment}`)
  res.status(201).json(toOrder(findByCode(code)))
})

ordersRouter.get('/mine', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.id).map(toOrder))
})

ordersRouter.get('/:code', requireAuth, (req, res) => {
  const row = findByCode(req.params.code)
  if (!row || (row.user_id !== req.user.id && req.user.role !== 'admin')) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
  res.json(toOrder(row))
})

/** Khách tự hủy khi shop chưa xử lý */
ordersRouter.post('/:code/cancel', requireAuth, (req, res) => {
  const row = findByCode(req.params.code)
  if (!row || row.user_id !== req.user.id) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
  if (!['pending', 'awaiting_payment'].includes(row.status)) return res.status(400).json({ error: 'Đơn đã được xử lý, vui lòng gọi 1900 6868 để hủy' })
  const history = [...JSON.parse(row.history), { status: 'cancelled', at: now(), note: 'Khách hủy đơn' }]
  tx(() => {
    db.prepare("UPDATE orders SET status = 'cancelled', history = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(history), row.id)
    releaseCoupon(row)
  })
  res.json(toOrder(findByCode(row.code)))
})

// ---------- Admin ----------

adminOrdersRouter.get('/', requireAdmin, (req, res) => {
  const status = req.query.status
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').all(String(status))
    : db.prepare('SELECT * FROM orders ORDER BY id DESC').all()
  res.json(rows.map(toOrder))
})

/** Số đơn theo trạng thái, trang admin hỏi định kỳ để báo đơn mới */
adminOrdersRouter.get('/summary', requireAdmin, (_req, res) => {
  const counts = Object.fromEntries(db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all().map(r => [r.status, r.n]))
  const latest = db.prepare('SELECT id FROM orders ORDER BY id DESC LIMIT 1').get()
  res.json({ counts, latestId: latest?.id ?? 0 })
})

const actionSchema = z.object({
  action: z.enum(Object.keys(ACTIONS)),
  // Hàng cân ký thực tế có thể lệch: admin chỉnh tổng tiền trước khi gửi mã thanh toán
  total: z.number().int().positive('Số tiền phải lớn hơn 0').optional(),
  adminNote: z.string().trim().max(500).optional()
})

adminOrdersRouter.patch('/:code', requireAdmin, (req, res) => {
  const data = parse(actionSchema, req.body, res)
  if (!data) return
  const row = findByCode(req.params.code)
  if (!row) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })

  const [from, to, note] = ACTIONS[data.action]
  if (!from.includes(row.status)) return res.status(400).json({ error: 'Đơn không ở trạng thái phù hợp cho thao tác này' })
  if (data.action === 'request_payment' && row.payment_method === 'cod') return res.status(400).json({ error: 'Đơn COD không cần gửi mã thanh toán' })
  if (data.action === 'confirm' && row.payment_method !== 'cod') return res.status(400).json({ error: 'Đơn chuyển khoản cần gửi mã thanh toán trước' })

  const total = data.action === 'request_payment' && data.total ? data.total : row.total
  const adjusted = total !== row.total ? ` (điều chỉnh tổng tiền ${row.total.toLocaleString('vi-VN')}đ → ${total.toLocaleString('vi-VN')}đ)` : ''
  const history = [...JSON.parse(row.history), { status: to, at: now(), note: note + adjusted }]

  try {
    tx(() => {
      db.prepare("UPDATE orders SET status = ?, total = ?, admin_note = ?, history = ?, updated_at = datetime('now') WHERE id = ?")
        .run(to, total, data.adminNote ?? row.admin_note, JSON.stringify(history), row.id)
      applySideEffects(data.action, { ...row, total }, req.user.id)
    })
  } catch (err) {
    if (err instanceof BusinessError) return res.status(400).json({ error: err.message })
    throw err
  }
  res.json(toOrder(findByCode(row.code)))
})

/**
 * Sổ thu chi + kho tự cập nhật theo đơn:
 * - Chuyển khoản/MoMo: ghi THU khi shop xác nhận đã nhận tiền.
 * - COD: ghi THU khi giao thành công (shipper đã thu tiền mặt).
 * - Bắt đầu giao: tạo PHIẾU XUẤT kho bán hàng.
 * - Hủy đơn đã nhận tiền chuyển khoản: ghi CHI hoàn tiền; trả lại lượt mã giảm giá.
 */
function applySideEffects(action, order, userId) {
  const items = JSON.parse(order.items)
  if (action === 'mark_paid') {
    addCashEntry({ type: 'income', amount: order.total, category: 'ban_hang', note: `Thanh toán đơn ${order.code}`, ref: order.code, method: order.payment_method, auto: true, userId })
  }
  if (action === 'complete' && order.payment_method === 'cod') {
    addCashEntry({ type: 'income', amount: order.total, category: 'ban_hang', note: `Thu tiền mặt đơn ${order.code}`, ref: order.code, method: 'cash', auto: true, userId })
  }
  if (action === 'deliver') {
    createReceipt({
      type: 'export', reason: 'ban_hang', partner: order.customer_name, orderCode: order.code, note: `Xuất bán đơn ${order.code}`,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })), userId, allowNegative: true
    })
  }
  if (action === 'cancel') {
    releaseCoupon(order)
    const paid = order.status === 'confirmed' && order.payment_method !== 'cod'
    if (paid) addCashEntry({ type: 'expense', amount: order.total, category: 'hoan_tien', note: `Hoàn tiền đơn hủy ${order.code}`, ref: order.code, method: order.payment_method, auto: true, userId })
  }
}
