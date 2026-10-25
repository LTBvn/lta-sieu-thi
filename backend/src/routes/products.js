import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { z } from 'zod'
import { db, toProduct } from '../db.js'
import { UPLOAD_DIR } from '../config.js'
import { requireAdmin } from '../middleware/auth.js'
import { parse } from '../lib/validate.js'

const router = Router()

const CATEGORIES = ['rau-cu', 'trai-cay', 'thit-trung', 'hai-san', 'sua', 'do-kho', 'do-uong']
const TAGS = ['organic', 'hot', 'new', 'deal']

const productSchema = z.object({
  name: z.string().trim().min(2, 'Tên sản phẩm quá ngắn'),
  price: z.number({ invalid_type_error: 'Giá phải là số' }).int().positive('Giá phải lớn hơn 0'),
  oldPrice: z.number().int().positive().nullish(),
  unit: z.string().trim().min(1, 'Vui lòng nhập đơn vị tính'),
  step: z.number().positive().nullish(),
  image: z.string().trim().min(1, 'Vui lòng chọn ảnh sản phẩm'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Danh mục không hợp lệ' }) }),
  origin: z.string().trim().default(''),
  description: z.string().trim().default(''),
  tags: z.array(z.enum(TAGS)).default([]),
  inStock: z.boolean().default(true)
}).refine(p => !p.oldPrice || p.oldPrice > p.price, { message: 'Giá gốc phải cao hơn giá bán' })

const findProduct = id => db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id))

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY id').all().map(toProduct))
})

router.get('/:id', (req, res) => {
  const row = findProduct(req.params.id)
  if (!row) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
  res.json(toProduct(row))
})

router.post('/', requireAdmin, (req, res) => {
  const p = parse(productSchema, req.body, res)
  if (!p) return
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO products (name, price, old_price, unit, step, image, category, origin, description, tags, in_stock, rating, sold)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5, 0)
  `).run(p.name, p.price, p.oldPrice ?? null, p.unit, p.step ?? null, p.image, p.category, p.origin, p.description, JSON.stringify(p.tags), p.inStock ? 1 : 0)
  res.status(201).json(toProduct(findProduct(lastInsertRowid)))
})

router.put('/:id', requireAdmin, (req, res) => {
  const p = parse(productSchema, req.body, res)
  if (!p) return
  const { changes } = db.prepare(`
    UPDATE products SET name = ?, price = ?, old_price = ?, unit = ?, step = ?, image = ?, category = ?, origin = ?,
      description = ?, tags = ?, in_stock = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(p.name, p.price, p.oldPrice ?? null, p.unit, p.step ?? null, p.image, p.category, p.origin, p.description, JSON.stringify(p.tags), p.inStock ? 1 : 0, Number(req.params.id))
  if (!changes) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
  res.json(toProduct(findProduct(req.params.id)))
})

/** Bật/tắt nhanh trạng thái còn hàng / hết hàng */
router.patch('/:id/stock', requireAdmin, (req, res) => {
  if (typeof req.body?.inStock !== 'boolean') return res.status(400).json({ error: 'inStock phải là true hoặc false' })
  const { changes } = db.prepare("UPDATE products SET in_stock = ?, updated_at = datetime('now') WHERE id = ?").run(req.body.inStock ? 1 : 0, Number(req.params.id))
  if (!changes) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
  res.json(toProduct(findProduct(req.params.id)))
})

router.delete('/:id', requireAdmin, (req, res) => {
  const row = findProduct(req.params.id)
  if (!row) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
  db.prepare('DELETE FROM products WHERE id = ?').run(row.id)
  // Xóa luôn ảnh đã tải lên (ảnh có sẵn trong frontend/public thì giữ nguyên)
  if (row.image.startsWith('/uploads/')) fs.rm(path.join(UPLOAD_DIR, path.basename(row.image)), { force: true }, () => {})
  res.status(204).end()
})

export default router
