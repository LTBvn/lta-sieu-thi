import { Router } from 'express'
import { z } from 'zod'
import { getSetting, setSetting } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { parse } from '../lib/validate.js'

const router = Router()

const EMPTY_PAYMENT = {
  bank: { enabled: false, bin: '', accountNo: '', accountName: '' },
  momo: { enabled: false, accountNo: '', accountName: '' }
}

export const getPaymentSettings = () => getSetting('payment', EMPTY_PAYMENT)

/** VietQR yêu cầu tên chủ tài khoản viết hoa, không dấu */
const toQrName = s =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

const accountFields = {
  enabled: z.boolean(),
  accountNo: z.string().trim(),
  accountName: z.string().transform(toQrName)
}

/** Chỉ bắt buộc điền đủ khi phương thức đó đang bật */
const checkAccount = (label, needBin) => (a, ctx) => {
  if (!a.enabled) return
  if (needBin && !/^\d{6}$/.test(a.bin)) ctx.addIssue({ code: 'custom', message: `${label}: vui lòng chọn ngân hàng` })
  if (!/^\d{6,19}$/.test(a.accountNo)) ctx.addIssue({ code: 'custom', message: `${label}: số tài khoản gồm 6-19 chữ số` })
  if (a.accountName.length < 2) ctx.addIssue({ code: 'custom', message: `${label}: vui lòng nhập tên chủ tài khoản` })
}

const paymentSchema = z.object({
  bank: z.object({ ...accountFields, bin: z.string().trim() }).superRefine(checkAccount('Ngân hàng', true)),
  momo: z.object(accountFields).superRefine(checkAccount('MoMo', false))
})

// Công khai: trang đơn hàng cần biết shop nhận tiền vào đâu để tạo mã QR
router.get('/payment', (_req, res) => res.json(getPaymentSettings()))

router.put('/payment', requireAdmin, (req, res) => {
  const data = parse(paymentSchema, req.body, res)
  if (!data) return
  setSetting('payment', data)
  res.json(data)
})

export default router
