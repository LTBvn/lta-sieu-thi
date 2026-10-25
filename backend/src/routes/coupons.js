import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { parse } from '../lib/validate.js'
import { BusinessError, evaluateCoupon } from '../lib/business.js'

const router = Router()

const toCoupon = c => ({
  code: c.code, type: c.type, value: c.value, maxDiscount: c.max_discount, minOrder: c.min_order,
  usageLimit: c.usage_limit, usedCount: c.used_count, perUser: c.per_user, private: c.private === 1,
  expiresAt: c.expires_at, active: c.active === 1, description: c.description, createdAt: c.created_at
})

/** Khách kiểm tra mã ở giỏ hàng (server mới là nơi tính tiền thật khi đặt) */
router.post('/check', requireAuth, (req, res) => {
  try {
    const { discount, coupon } = evaluateCoupon(req.body?.code, Number(req.body?.subtotal) || 0, req.user.id)
    res.json({ code: coupon.code, discount, description: coupon.description })
  } catch (err) {
    if (err instanceof BusinessError) return res.status(400).json({ error: err.message })
    throw err
  }
})

/** Voucher của khách: mã công khai đang chạy + mã được tặng riêng */
router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, uc.given_at FROM coupons c LEFT JOIN user_coupons uc ON uc.code = c.code AND uc.user_id = ?
    WHERE c.active = 1 AND (c.private = 0 OR uc.user_id IS NOT NULL)
      AND (c.expires_at IS NULL OR c.expires_at >= date('now', '+7 hours'))
      AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
      AND (c.per_user = 0 OR (SELECT COUNT(*) FROM orders o WHERE o.user_id = ? AND o.coupon = c.code AND o.status != 'cancelled') < c.per_user)
    ORDER BY uc.given_at DESC, c.created_at DESC
  `).all(req.user.id, req.user.id)
  res.json(rows.map(r => ({ ...toCoupon(r), gifted: !!r.given_at })))
})

// ---------- Admin ----------

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,20}$/, 'Mã gồm 3-20 ký tự chữ, số, - hoặc _'),
  type: z.enum(['fixed', 'percent']),
  value: z.number().int().positive('Giá trị giảm phải lớn hơn 0'),
  maxDiscount: z.number().int().positive().nullish(),
  minOrder: z.number().int().min(0).default(0),
  usageLimit: z.number().int().positive().nullish(),
  perUser: z.number().int().min(0).default(1),
  private: z.boolean().default(false),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  active: z.boolean().default(true),
  description: z.string().trim().max(200).default('')
}).refine(c => c.type !== 'percent' || c.value <= 100, { message: 'Giảm theo % tối đa 100' })

router.get('/', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM coupons ORDER BY active DESC, created_at DESC').all().map(toCoupon))
})

router.post('/', requireAdmin, (req, res) => {
  const c = parse(couponSchema, req.body, res)
  if (!c) return
  if (db.prepare('SELECT 1 FROM coupons WHERE code = ?').get(c.code)) return res.status(409).json({ error: 'Mã này đã tồn tại' })
  db.prepare(`
    INSERT INTO coupons (code, type, value, max_discount, min_order, usage_limit, per_user, private, expires_at, active, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(c.code, c.type, c.value, c.maxDiscount ?? null, c.minOrder, c.usageLimit ?? null, c.perUser, c.private ? 1 : 0, c.expiresAt ?? null, c.active ? 1 : 0, c.description)
  res.status(201).json(toCoupon(db.prepare('SELECT * FROM coupons WHERE code = ?').get(c.code)))
})

router.put('/:code', requireAdmin, (req, res) => {
  const c = parse(couponSchema, { ...req.body, code: req.params.code }, res)
  if (!c) return
  const { changes } = db.prepare(`
    UPDATE coupons SET type = ?, value = ?, max_discount = ?, min_order = ?, usage_limit = ?, per_user = ?, private = ?, expires_at = ?, active = ?, description = ?
    WHERE code = ?
  `).run(c.type, c.value, c.maxDiscount ?? null, c.minOrder, c.usageLimit ?? null, c.perUser, c.private ? 1 : 0, c.expiresAt ?? null, c.active ? 1 : 0, c.description, c.code)
  if (!changes) return res.status(404).json({ error: 'Không tìm thấy mã' })
  res.json(toCoupon(db.prepare('SELECT * FROM coupons WHERE code = ?').get(c.code)))
})

router.delete('/:code', requireAdmin, (req, res) => {
  const code = String(req.params.code).toUpperCase()
  const c = db.prepare('SELECT used_count FROM coupons WHERE code = ?').get(code)
  if (!c) return res.status(404).json({ error: 'Không tìm thấy mã' })
  // Mã đã có đơn dùng thì chỉ tắt, giữ lại để đối chiếu đơn cũ
  if (c.used_count > 0) db.prepare('UPDATE coupons SET active = 0 WHERE code = ?').run(code)
  else db.prepare('DELETE FROM coupons WHERE code = ?').run(code)
  res.status(204).end()
})

export default router
