import { Router } from 'express'
import { z } from 'zod'
import { db, toAdminProduct } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { parse } from '../lib/validate.js'
import { addCashEntry, BusinessError, createReceipt, RECEIPT_REASONS, tx } from '../lib/business.js'

const router = Router()
router.use(requireAdmin)

const LOW_STOCK = 5

/** Tồn kho hiện tại + giá trị tồn theo giá vốn */
router.get('/stock', (_req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY category, name').all().map(toAdminProduct)
  const tracked = products.filter(p => p.stock !== null)
  res.json({
    products,
    lowStock: LOW_STOCK,
    summary: {
      tracked: tracked.length,
      untracked: products.length - tracked.length,
      outOfStock: tracked.filter(p => p.stock <= 0).length,
      low: tracked.filter(p => p.stock > 0 && p.stock <= LOW_STOCK).length,
      value: Math.round(tracked.reduce((s, p) => s + p.stock * (p.costPrice ?? 0), 0))
    }
  })
})

router.get('/reasons', (_req, res) => res.json(RECEIPT_REASONS))

const toReceipt = (r, items) => ({
  id: r.id, code: r.code, type: r.type, reason: r.reason, partner: r.partner, orderCode: r.order_code,
  note: r.note, total: r.total, createdAt: r.created_at, createdBy: r.created_by_name ?? null,
  items: items?.map(i => ({ productId: i.product_id, name: i.name, unit: i.unit, quantity: i.quantity, unitCost: i.unit_cost, stockAfter: i.stock_after }))
})

router.get('/receipts', (req, res) => {
  const type = ['import', 'export'].includes(req.query.type) ? req.query.type : null
  const rows = db.prepare(`
    SELECT r.*, u.name AS created_by_name, (SELECT COUNT(*) FROM stock_receipt_items WHERE receipt_id = r.id) AS item_count
    FROM stock_receipts r LEFT JOIN users u ON u.id = r.created_by
    ${type ? 'WHERE r.type = ?' : ''} ORDER BY r.id DESC LIMIT 200
  `).all(...(type ? [type] : []))
  res.json(rows.map(r => ({ ...toReceipt(r), itemCount: r.item_count })))
})

router.get('/receipts/:code', (req, res) => {
  const r = db.prepare('SELECT r.*, u.name AS created_by_name FROM stock_receipts r LEFT JOIN users u ON u.id = r.created_by WHERE r.code = ?').get(String(req.params.code).toUpperCase())
  if (!r) return res.status(404).json({ error: 'Không tìm thấy phiếu' })
  res.json(toReceipt(r, db.prepare('SELECT * FROM stock_receipt_items WHERE receipt_id = ?').all(r.id)))
})

/** Lịch sử nhập/xuất của một sản phẩm (thẻ kho) */
router.get('/products/:id/history', (req, res) => {
  const rows = db.prepare(`
    SELECT r.code, r.type, r.reason, r.partner, r.created_at, i.quantity, i.unit_cost, i.stock_after
    FROM stock_receipt_items i JOIN stock_receipts r ON r.id = i.receipt_id
    WHERE i.product_id = ? ORDER BY r.id DESC LIMIT 100
  `).all(Number(req.params.id))
  res.json(rows.map(r => ({ code: r.code, type: r.type, reason: r.reason, partner: r.partner, createdAt: r.created_at, quantity: r.quantity, unitCost: r.unit_cost, stockAfter: r.stock_after })))
})

const receiptSchema = z.object({
  type: z.enum(['import', 'export']),
  reason: z.string(),
  partner: z.string().trim().max(200).default(''),
  note: z.string().trim().max(500).default(''),
  items: z.array(z.object({
    productId: z.number().int(),
    quantity: z.number().positive('Số lượng phải lớn hơn 0'),
    unitCost: z.number().int().min(0).optional()
  })).min(1, 'Phiếu cần ít nhất 1 sản phẩm'),
  // Phiếu nhập hàng: ghi luôn khoản chi vào sổ thu chi
  paid: z.boolean().default(true),
  method: z.enum(['cash', 'bank', 'momo']).default('cash')
}).refine(d => d.reason in RECEIPT_REASONS[d.type], { message: 'Lý do nhập/xuất không hợp lệ' })
  .refine(d => d.reason !== 'ban_hang', { message: 'Phiếu xuất bán được tạo tự động khi giao đơn' })

router.post('/receipts', (req, res) => {
  const d = parse(receiptSchema, req.body, res)
  if (!d) return
  try {
    const receipt = tx(() => {
      const r = createReceipt({ ...d, userId: req.user.id })
      if (d.type === 'import' && d.reason === 'nhap_hang' && d.paid && r.total > 0) {
        addCashEntry({ type: 'expense', amount: r.total, category: 'nhap_hang', note: `Phiếu nhập ${r.code}${d.partner ? ' · ' + d.partner : ''}`, ref: r.code, method: d.method, auto: true, userId: req.user.id })
      }
      return r
    })
    res.status(201).json(receipt)
  } catch (err) {
    if (err instanceof BusinessError) return res.status(400).json({ error: err.message })
    throw err
  }
})

/** Ngừng theo dõi tồn kho cho một sản phẩm (quay về bán không giới hạn) */
router.delete('/products/:id/tracking', (req, res) => {
  db.prepare('UPDATE products SET stock = NULL WHERE id = ?').run(Number(req.params.id))
  res.json(toAdminProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id))))
})

export default router
