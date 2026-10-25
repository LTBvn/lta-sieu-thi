import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import jwt from 'jsonwebtoken'
import { DATA_DIR } from '../config.js'
import { findUser, toUser } from '../db.js'

/** Khóa ký token: lấy từ biến môi trường, nếu không có thì tạo một lần và lưu lại */
function loadSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  const file = path.join(DATA_DIR, '.jwt-secret')
  if (!fs.existsSync(file)) fs.writeFileSync(file, crypto.randomBytes(48).toString('hex'))
  return fs.readFileSync(file, 'utf8')
}

const SECRET = loadSecret()

/** Token đăng nhập (7 ngày) */
export const signToken = user => jwt.sign({ sub: user.id }, SECRET, { expiresIn: '7d' })

/** Token ngắn hạn cho bước trung gian (vd: đã qua Google nhưng chưa liên kết SĐT) */
export const signTemp = (kind, payload, expiresIn = '15m') => jwt.sign({ ...payload, kind }, SECRET, { expiresIn })

export function verifyTemp(kind, token) {
  try {
    const data = jwt.verify(String(token), SECRET)
    return data.kind === kind ? data : null
  } catch {
    return null
  }
}

/** Đọc token "Bearer ..." và gắn req.user (đọc lại từ DB để quyền luôn mới nhất) */
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '')
  if (!token) return res.status(401).json({ error: 'Bạn cần đăng nhập' })
  try {
    const { sub, kind } = jwt.verify(token, SECRET)
    if (kind) throw new Error('not a login token')
    const row = findUser(sub)
    if (!row) return res.status(401).json({ error: 'Tài khoản không còn tồn tại' })
    req.user = toUser(row)
    next()
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' })
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ quản trị viên mới được thực hiện thao tác này' })
    next()
  })
}
