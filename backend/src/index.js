import express from 'express'
import multer from 'multer'
import { PORT, UPLOAD_DIR } from './config.js'
import { seed } from './db.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import uploadRoutes from './routes/uploads.js'
import userRoutes from './routes/users.js'
import settingsRoutes from './routes/settings.js'
import { adminOrdersRouter, ordersRouter } from './routes/orders.js'
import inventoryRoutes from './routes/inventory.js'
import cashbookRoutes from './routes/cashbook.js'
import couponRoutes from './routes/coupons.js'
import customerRoutes from './routes/customers.js'

seed()

const app = express()
app.use(express.json())
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/users', userRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/orders', ordersRouter)
app.use('/api/admin/orders', adminOrdersRouter)
app.use('/api/admin/inventory', inventoryRoutes)
app.use('/api/admin/cashbook', cashbookRoutes)
app.use('/api/admin/customers', customerRoutes)
app.use('/api/coupons', couponRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', (_req, res) => res.status(404).json({ error: 'Không tìm thấy API' }))

// Mở nhầm cổng API trên trình duyệt: chỉ đường sang web
app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html><meta charset="utf-8"><title>LTA API</title>
    <body style="font-family:system-ui;max-width:560px;margin:80px auto;padding:0 16px;line-height:1.6">
    <h1 style="color:#007A3D">✅ Backend LTA đang chạy</h1>
    <p>Đây là cổng dữ liệu (${PORT}), không phải trang web.</p>
    <p>Mở web tại <a href="http://localhost:5173">http://localhost:5173</a>.</p></body>`)
})

// Lỗi multer (ảnh quá lớn...) và lỗi bất ngờ
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Ảnh tối đa 5MB' : err.message })
  console.error(err)
  res.status(500).json({ error: 'Lỗi máy chủ' })
})

app.listen(PORT, () => console.log(`Backend đang chạy tại http://localhost:${PORT}`))
