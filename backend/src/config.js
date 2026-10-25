import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Mọi cấu hình đọc từ biến môi trường (file backend/.env), có giá trị mặc định để chạy thử */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const PORT = Number(process.env.PORT || 4000)
export const IS_PROD = process.env.NODE_ENV === 'production'

export const DATA_DIR = path.join(root, 'data')
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() || null
export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID?.trim() || null

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'LTAadmin'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminLTA'
export const ADMIN_PHONE = process.env.ADMIN_PHONE || '0900000000'
