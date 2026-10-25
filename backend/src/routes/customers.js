import crypto from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { parse } from '../lib/validate.js'
import { tx } from '../lib/business.js'

const router = Router()
router.use(requireAdmin)

/** Danh sách khách + thống kê mua hàng (chỉ tính đơn không bị hủy) */
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, u.phone, u.email, u.role, u.marketing_opt_in, u.created_at,
      u.google_id IS NOT NULL AS google, u.facebook_id IS NOT NULL AS facebook,
      COUNT(o.id) AS orders, COALESCE(SUM(o.total), 0) AS spent, MAX(o.created_at) AS last_order
    FROM users u LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
    WHERE u.role = 'customer'
    GROUP BY u.id ORDER BY spent DESC, u.id DESC
  `).all()
  res.json(rows.map(r => ({
    id: r.id, name: r.name, phone: r.phone, email: r.email, createdAt: r.created_at,
    marketingOptIn: r.marketing_opt_in === 1, google: !!r.google, facebook: !!r.facebook,
    orders: r.orders, spent: r.spent, lastOrder: r.last_order
  })))
})

/**
 * Mật khẩu được lưu dạng băm một chiều nên KHÔNG ai xem được, kể cả admin.
 * Admin chỉ có thể đặt mật khẩu tạm (hiện 1 lần) để đọc cho khách qua điện thoại;
 * khách đăng nhập xong sẽ được nhắc đổi mật khẩu.
 */
router.post('/:id/reset-password', (req, res) => {
  const user = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'customer'").get(Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'Không tìm thấy khách hàng' })
  const temp = String(crypto.randomInt(10000000, 100000000))
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(bcrypt.hashSync(temp, 10), user.id)
  console.log(`[admin] ${req.user.name} đặt lại mật khẩu cho khách #${user.id}`)
  res.json({ tempPassword: temp })
})

const sendSchema = z.object({
  userIds: z.array(z.number().int()).min(1, 'Chọn ít nhất 1 khách hàng'),
  code: z.string().trim().toUpperCase().optional(),
  message: z.string().trim().min(5, 'Nội dung quá ngắn').max(300, 'Nội dung tối đa 300 ký tự')
})

/**
 * Gửi khuyến mãi: chỉ gửi cho khách ĐÃ ĐỒNG Ý nhận tin (Nghị định 91/2020 về chống tin nhắn rác).
 * - Có mã: tặng mã vào mục "Voucher của bạn" của khách.
 * - SMS: đang GIẢ LẬP (in ra terminal). Gửi thật cần dịch vụ SMS Brandname.
 */
router.post('/send-promo', (req, res) => {
  const d = parse(sendSchema, req.body, res)
  if (!d) return
  if (d.code && !db.prepare('SELECT 1 FROM coupons WHERE code = ? AND active = 1').get(d.code)) {
    return res.status(400).json({ error: 'Mã khuyến mãi không tồn tại hoặc đã tắt' })
  }
  const q = d.userIds.map(() => '?').join(',')
  const recipients = db.prepare(`SELECT id, name, phone FROM users WHERE id IN (${q}) AND role = 'customer' AND marketing_opt_in = 1`).all(...d.userIds)
  if (!recipients.length) return res.status(400).json({ error: 'Không có khách nào trong danh sách đồng ý nhận tin khuyến mãi' })

  tx(() => {
    if (d.code) {
      const give = db.prepare('INSERT OR IGNORE INTO user_coupons (user_id, code) VALUES (?, ?)')
      for (const r of recipients) give.run(r.id, d.code)
    }
    db.prepare('INSERT INTO promo_sends (code, message, recipients, created_by) VALUES (?, ?, ?, ?)').run(d.code ?? null, d.message, recipients.length, req.user.id)
  })
  for (const r of recipients) {
    console.log(`\x1b[33m[SMS giả lập] ${r.phone}: ${d.message.replace('{ten}', r.name)}${d.code ? ` Mã: ${d.code}` : ''}\x1b[0m`)
  }
  res.json({ sent: recipients.length, skipped: d.userIds.length - recipients.length })
})

router.get('/promo-history', (_req, res) => {
  res.json(db.prepare(`
    SELECT p.*, u.name AS by_name FROM promo_sends p LEFT JOIN users u ON u.id = p.created_by ORDER BY p.id DESC LIMIT 50
  `).all().map(p => ({ id: p.id, code: p.code, message: p.message, recipients: p.recipients, createdBy: p.by_name, createdAt: p.created_at })))
})

export default router
