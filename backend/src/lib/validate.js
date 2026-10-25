import { z } from 'zod'

/** Kiểm tra body theo schema zod; sai thì trả 400 kèm lỗi đầu tiên và trả về null */
export function parse(schema, body, res) {
  const result = schema.safeParse(body)
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message })
    return null
  }
  return result.data
}

export const PHONE = /^0\d{9}$/

export const phoneField = z.string().trim().regex(PHONE, 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0')
export const passwordField = z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự')
export const otpField = z.string().trim().regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số')
export const optionalEmail = z.string().trim().email('Email không hợp lệ').optional().or(z.literal('').transform(() => undefined))
