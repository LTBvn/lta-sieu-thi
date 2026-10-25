import crypto from 'node:crypto'
import { db } from '../db.js'

const TTL_MS = 5 * 60 * 1000 // mã có hiệu lực 5 phút
const RESEND_MS = 60 * 1000 // gửi lại sau 60 giây
const MAX_ATTEMPTS = 5

const hash = code => crypto.createHash('sha256').update(code).digest('hex')

/**
 * Tạo và "gửi" mã OTP 6 số.
 * Hiện đang GIẢ LẬP: mã được in ra terminal của backend. Muốn gửi SMS thật,
 * thay phần console.log bằng lời gọi API của nhà cung cấp SMS (eSMS, SpeedSMS...).
 * Trả về { ok } hoặc { error, retryAfter }.
 */
export function sendOtp(phone, purpose) {
  const now = Date.now()
  const prev = db.prepare('SELECT sent_at FROM otps WHERE phone = ? AND purpose = ?').get(phone, purpose)
  if (prev && now - prev.sent_at < RESEND_MS) {
    const retryAfter = Math.ceil((RESEND_MS - (now - prev.sent_at)) / 1000)
    return { error: `Vui lòng đợi ${retryAfter} giây trước khi gửi lại mã`, retryAfter }
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
  db.prepare(`
    INSERT INTO otps (phone, purpose, code_hash, expires_at, sent_at, attempts) VALUES (?, ?, ?, ?, ?, 0)
    ON CONFLICT(phone, purpose) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, sent_at = excluded.sent_at, attempts = 0
  `).run(phone, purpose, hash(code), now + TTL_MS, now)

  console.log(`\x1b[33m[OTP giả lập] ${phone} (${purpose}): ${code}  (hết hạn sau 5 phút)\x1b[0m`)
  return { ok: true, retryAfter: RESEND_MS / 1000 }
}

/** Kiểm tra mã. Đúng thì xóa mã (dùng 1 lần) và trả null; sai trả câu báo lỗi. */
export function verifyOtp(phone, purpose, code) {
  const row = db.prepare('SELECT * FROM otps WHERE phone = ? AND purpose = ?').get(phone, purpose)
  if (!row) return 'Bạn chưa yêu cầu mã OTP cho số này'
  if (Date.now() > row.expires_at) return 'Mã OTP đã hết hạn, vui lòng gửi lại'
  if (row.attempts >= MAX_ATTEMPTS) return 'Nhập sai quá nhiều lần, vui lòng gửi lại mã mới'

  if (!crypto.timingSafeEqual(Buffer.from(hash(String(code))), Buffer.from(row.code_hash))) {
    db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE phone = ? AND purpose = ?').run(phone, purpose)
    return `Mã OTP không đúng (còn ${MAX_ATTEMPTS - row.attempts - 1} lần thử)`
  }
  db.prepare('DELETE FROM otps WHERE phone = ? AND purpose = ?').run(phone, purpose)
  return null
}
