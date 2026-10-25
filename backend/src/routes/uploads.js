import crypto from 'node:crypto'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { UPLOAD_DIR } from '../config.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))
})

router.post('/', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF' })
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})

export default router
