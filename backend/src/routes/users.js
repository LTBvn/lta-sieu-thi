import { Router } from 'express'
import { db, findUser, toUser } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM users ORDER BY id').all().map(toUser))
})

router.patch('/:id/role', requireAdmin, (req, res) => {
  const role = req.body?.role
  if (role !== 'admin' && role !== 'customer') return res.status(400).json({ error: 'Quyền không hợp lệ' })
  const id = Number(req.params.id)
  if (id === req.user.id && role !== 'admin') return res.status(400).json({ error: 'Bạn không thể tự gỡ quyền admin của chính mình' })
  const { changes } = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
  if (!changes) return res.status(404).json({ error: 'Không tìm thấy người dùng' })
  res.json(toUser(findUser(id)))
})

export default router
