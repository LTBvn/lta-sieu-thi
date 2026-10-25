import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { parse } from '../lib/validate.js'
import { addCashEntry, CASH_CATEGORIES } from '../lib/business.js'

const router = Router()
router.use(requireAdmin)

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Khoảng thời gian theo giờ Việt Nam: from/to dạng YYYY-MM-DD (bao gồm cả 2 ngày) */
function range(q) {
  const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)
  const to = DATE.test(q.to) ? q.to : today
  const from = DATE.test(q.from) ? q.from : new Date(Date.parse(to) - 29 * 86400e3).toISOString().slice(0, 10)
  return { from, to }
}

// occurred_at lưu giờ UTC → đổi sang ngày giờ Việt Nam khi lọc và gộp theo ngày
const VN_DAY = "date(occurred_at, '+7 hours')"

router.get('/categories', (_req, res) => res.json(CASH_CATEGORIES))

router.get('/', (req, res) => {
  const { from, to } = range(req.query)
  const where = `${VN_DAY} BETWEEN ? AND ?`
  const entries = db.prepare(`
    SELECT c.*, u.name AS created_by_name FROM cashbook c LEFT JOIN users u ON u.id = c.created_by
    WHERE ${where} ORDER BY c.occurred_at DESC, c.id DESC
  `).all(from, to)

  const totals = db.prepare(`SELECT type, SUM(amount) AS total FROM cashbook WHERE ${where} GROUP BY type`).all(from, to)
  const income = totals.find(t => t.type === 'income')?.total ?? 0
  const expense = totals.find(t => t.type === 'expense')?.total ?? 0

  const daily = db.prepare(`
    SELECT ${VN_DAY} AS day, SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
    FROM cashbook WHERE ${where} GROUP BY day ORDER BY day
  `).all(from, to)

  const byCategory = db.prepare(`SELECT type, category, SUM(amount) AS total FROM cashbook WHERE ${where} GROUP BY type, category ORDER BY total DESC`).all(from, to)

  // Số dư quỹ từ trước tới cuối kỳ
  const balance = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS b FROM cashbook WHERE ${VN_DAY} <= ?`).get(to).b

  res.json({
    from, to, income, expense, net: income - expense, balance,
    daily: daily.map(d => ({ day: d.day, income: d.income, expense: d.expense })),
    byCategory,
    entries: entries.map(e => ({
      id: e.id, type: e.type, amount: e.amount, category: e.category, note: e.note, ref: e.ref, method: e.method,
      auto: e.auto === 1, createdBy: e.created_by_name, occurredAt: e.occurred_at
    }))
  })
})

const entrySchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().int().positive('Số tiền phải lớn hơn 0'),
  category: z.string(),
  note: z.string().trim().max(300).default(''),
  method: z.enum(['cash', 'bank', 'momo']).default('cash')
}).refine(d => d.category in CASH_CATEGORIES[d.type], { message: 'Danh mục không hợp lệ' })

router.post('/', (req, res) => {
  const d = parse(entrySchema, req.body, res)
  if (!d) return
  addCashEntry({ ...d, userId: req.user.id })
  res.status(201).json({ ok: true })
})

/** Chỉ xóa được khoản ghi tay; khoản tự động gắn với đơn/phiếu nhập */
router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT auto FROM cashbook WHERE id = ?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'Không tìm thấy khoản thu chi' })
  if (row.auto) return res.status(400).json({ error: 'Khoản tự động từ đơn hàng/phiếu nhập không xóa được' })
  db.prepare('DELETE FROM cashbook WHERE id = ?').run(Number(req.params.id))
  res.status(204).end()
})

export default router
