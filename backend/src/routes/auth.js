import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db, findUser, toUser } from '../db.js'
import { FACEBOOK_APP_ID, GOOGLE_CLIENT_ID, IS_PROD } from '../config.js'
import { requireAuth, signTemp, signToken, verifyTemp } from '../middleware/auth.js'
import { optionalEmail, otpField, parse, passwordField, phoneField } from '../lib/validate.js'
import { sendOtp, verifyOtp } from '../lib/otp.js'
import { providerColumn, verifySocial } from '../lib/social.js'

const router = Router()

const byPhone = phone => db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)
const emailTaken = (email, exceptId = 0) => !!email && !!db.prepare('SELECT 1 FROM users WHERE lower(email) = lower(?) AND id != ?').get(email, exceptId)
const loggedIn = (res, row, status = 200) => {
  const user = toUser(row)
  res.status(status).json({ token: signToken(user), user })
}

/** Web hỏi: đăng nhập Google/Facebook đã bật chưa (mã ứng dụng là thông tin công khai) */
router.get('/providers', (_req, res) => {
  res.json({ google: GOOGLE_CLIENT_ID, facebook: FACEBOOK_APP_ID, otpSimulated: !IS_PROD })
})

// ---------- Mật khẩu ----------

router.post('/login', (req, res) => {
  const id = String(req.body?.identifier ?? '').trim().toLowerCase()
  const row = db.prepare('SELECT * FROM users WHERE phone = ? OR lower(email) = ? OR lower(username) = ?').get(id, id, id)
  if (!row) return res.status(401).json({ error: 'Tài khoản chưa được đăng ký' })
  if (!row.password_hash) {
    return res.status(401).json({ error: 'Tài khoản này đăng nhập bằng Google/Facebook. Dùng nút bên dưới, hoặc "Quên mật khẩu" để tạo mật khẩu.' })
  }
  if (!bcrypt.compareSync(String(req.body?.password ?? ''), row.password_hash)) return res.status(401).json({ error: 'Mật khẩu không đúng' })
  loggedIn(res, row)
})

// ---------- OTP ----------

const otpSendSchema = z.object({ phone: phoneField, purpose: z.enum(['register', 'link', 'reset']) })

router.post('/otp/send', (req, res) => {
  const data = parse(otpSendSchema, req.body, res)
  if (!data) return
  const exists = !!byPhone(data.phone)
  if (data.purpose === 'register' && exists) return res.status(409).json({ error: 'Số điện thoại này đã có tài khoản, vui lòng đăng nhập' })
  if (data.purpose === 'reset' && !exists) return res.status(404).json({ error: 'Số điện thoại này chưa đăng ký tài khoản' })
  const result = sendOtp(data.phone, data.purpose)
  if (result.error) return res.status(429).json(result)
  // Cho web biết số này đã có tài khoản chưa (để hiện đúng lời nhắn khi liên kết)
  res.json({ ok: true, retryAfter: result.retryAfter, existing: exists })
})

// ---------- Đăng ký bằng số điện thoại ----------

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên quá ngắn'),
  phone: phoneField,
  email: optionalEmail,
  password: passwordField,
  otp: otpField,
  marketingOptIn: z.boolean().default(false)
})

router.post('/register', (req, res) => {
  const data = parse(registerSchema, req.body, res)
  if (!data) return
  if (byPhone(data.phone)) return res.status(409).json({ error: 'Số điện thoại này đã được đăng ký' })
  if (emailTaken(data.email)) return res.status(409).json({ error: 'Email này đã được đăng ký' })
  const otpError = verifyOtp(data.phone, 'register', data.otp)
  if (otpError) return res.status(400).json({ error: otpError })

  // Tài khoản tự đăng ký luôn là khách; chỉ admin mới cấp quyền admin
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, phone, email, password_hash, marketing_opt_in) VALUES (?, ?, ?, ?, ?)')
    .run(data.name, data.phone, data.email ?? null, bcrypt.hashSync(data.password, 10), data.marketingOptIn ? 1 : 0)
  loggedIn(res, findUser(lastInsertRowid), 201)
})

// ---------- Quên mật khẩu (xác minh bằng OTP) ----------

const resetSchema = z.object({ phone: phoneField, otp: otpField, newPassword: passwordField })

router.post('/password/reset', (req, res) => {
  const data = parse(resetSchema, req.body, res)
  if (!data) return
  const row = byPhone(data.phone)
  if (!row) return res.status(404).json({ error: 'Số điện thoại này chưa đăng ký tài khoản' })
  const otpError = verifyOtp(data.phone, 'reset', data.otp)
  if (otpError) return res.status(400).json({ error: otpError })
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(bcrypt.hashSync(data.newPassword, 10), row.id)
  loggedIn(res, findUser(row.id))
})

// ---------- Google / Facebook ----------

/**
 * Bước 1: web gửi token Google/Facebook.
 * - Tài khoản đã liên kết SĐT → đăng nhập luôn.
 * - Chưa liên kết → trả linkToken (15 phút) để bước 2 bắt buộc xác minh SĐT bằng OTP.
 */
router.post('/social', async (req, res) => {
  let profile
  try {
    profile = await verifySocial(req.body?.provider, req.body?.token)
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }
  const row = db.prepare(`SELECT * FROM users WHERE ${providerColumn(profile.provider)} = ?`).get(profile.id)
  if (row) return loggedIn(res, row)

  const { provider, id, name, email, avatar } = profile
  res.json({ needPhone: true, linkToken: signTemp('social-link', { provider, providerId: id, name, email, avatar }), profile: { provider, name, email, avatar } })
})

const linkSchema = z.object({ linkToken: z.string().min(1), phone: phoneField, otp: otpField })

/**
 * Bước 2: khách nhập SĐT + OTP. SĐT chứng minh chính chủ nên:
 * - SĐT đã có tài khoản → gắn Google/Facebook vào tài khoản đó.
 * - SĐT mới → tạo tài khoản mới (chưa có mật khẩu, đăng nhập bằng Google/Facebook hoặc tạo mật khẩu sau).
 */
router.post('/social/link', (req, res) => {
  const data = parse(linkSchema, req.body, res)
  if (!data) return
  const link = verifyTemp('social-link', data.linkToken)
  if (!link) return res.status(401).json({ error: 'Phiên liên kết đã hết hạn, vui lòng đăng nhập Google/Facebook lại' })
  const otpError = verifyOtp(data.phone, 'link', data.otp)
  if (otpError) return res.status(400).json({ error: otpError })

  const col = providerColumn(link.provider)
  const label = link.provider === 'google' ? 'Google' : 'Facebook'
  if (db.prepare(`SELECT 1 FROM users WHERE ${col} = ?`).get(link.providerId)) {
    return res.status(409).json({ error: `Tài khoản ${label} này đã liên kết với số điện thoại khác` })
  }

  const existing = byPhone(data.phone)
  if (existing) {
    if (existing[col]) return res.status(409).json({ error: `Số điện thoại này đã liên kết với một tài khoản ${label} khác` })
    db.prepare(`UPDATE users SET ${col} = ?, avatar = COALESCE(avatar, ?), email = COALESCE(email, ?) WHERE id = ?`)
      .run(link.providerId, link.avatar ?? null, emailTaken(link.email, existing.id) ? null : link.email ?? null, existing.id)
    return loggedIn(res, findUser(existing.id))
  }

  const { lastInsertRowid } = db
    .prepare(`INSERT INTO users (name, phone, email, avatar, password_hash, ${col}) VALUES (?, ?, ?, ?, '', ?)`)
    .run(link.name, data.phone, emailTaken(link.email) ? null : link.email ?? null, link.avatar ?? null, link.providerId)
  loggedIn(res, findUser(lastInsertRowid), 201)
})

/** Khách đã đăng nhập tự liên kết thêm Google/Facebook trong trang Tài khoản */
router.post('/social/connect', requireAuth, async (req, res) => {
  let profile
  try {
    profile = await verifySocial(req.body?.provider, req.body?.token)
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }
  const col = providerColumn(profile.provider)
  const owner = db.prepare(`SELECT id FROM users WHERE ${col} = ?`).get(profile.id)
  if (owner && owner.id !== req.user.id) return res.status(409).json({ error: 'Tài khoản này đã liên kết với số điện thoại khác' })
  db.prepare(`UPDATE users SET ${col} = ?, avatar = COALESCE(avatar, ?) WHERE id = ?`).run(profile.id, profile.avatar ?? null, req.user.id)
  res.json({ user: toUser(findUser(req.user.id)) })
})

router.delete('/social/:provider', requireAuth, (req, res) => {
  const { provider } = req.params
  if (!['google', 'facebook'].includes(provider)) return res.status(400).json({ error: 'Phương thức không hợp lệ' })
  const other = provider === 'google' ? 'facebook' : 'google'
  // Không để khách tự khóa mình ở ngoài: phải còn mật khẩu hoặc cách đăng nhập khác
  if (!req.user.hasPassword && !req.user.linked[other]) {
    return res.status(400).json({ error: 'Hãy tạo mật khẩu trước khi gỡ liên kết, nếu không bạn sẽ không đăng nhập lại được' })
  }
  db.prepare(`UPDATE users SET ${providerColumn(provider)} = NULL WHERE id = ?`).run(req.user.id)
  res.json({ user: toUser(findUser(req.user.id)) })
})

// ---------- Hồ sơ ----------

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

const profileSchema = z.object({ name: z.string().trim().min(2, 'Họ tên quá ngắn'), email: optionalEmail, marketingOptIn: z.boolean().optional() })

router.put('/me', requireAuth, (req, res) => {
  const data = parse(profileSchema, req.body, res)
  if (!data) return
  if (emailTaken(data.email, req.user.id)) return res.status(409).json({ error: 'Email này đã được tài khoản khác sử dụng' })
  db.prepare('UPDATE users SET name = ?, email = ?, marketing_opt_in = COALESCE(?, marketing_opt_in) WHERE id = ?')
    .run(data.name, data.email ?? null, data.marketingOptIn === undefined ? null : data.marketingOptIn ? 1 : 0, req.user.id)
  res.json({ user: toUser(findUser(req.user.id)) })
})

router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {}
  const row = findUser(req.user.id)
  // Tài khoản Google/Facebook chưa có mật khẩu thì được tạo mới mà không cần mật khẩu cũ
  if (row.password_hash && !bcrypt.compareSync(String(currentPassword ?? ''), row.password_hash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 6 ký tự' })
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id)
  res.json({ user: toUser(findUser(req.user.id)) })
})

export default router
