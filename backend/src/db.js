import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_USERNAME, DATA_DIR } from './config.js'

export const db = new DatabaseSync(path.join(DATA_DIR, 'lta.db'))

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    phone         TEXT NOT NULL UNIQUE,
    email         TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    price       INTEGER NOT NULL,
    old_price   INTEGER,
    unit        TEXT NOT NULL,
    step        REAL,
    image       TEXT NOT NULL,
    category    TEXT NOT NULL,
    origin      TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    rating      REAL NOT NULL DEFAULT 5,
    sold        INTEGER NOT NULL DEFAULT 0,
    tags        TEXT NOT NULL DEFAULT '[]',
    in_stock    INTEGER NOT NULL DEFAULT 1,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    code           TEXT NOT NULL UNIQUE,
    user_id        INTEGER NOT NULL REFERENCES users(id),
    customer_name  TEXT NOT NULL,
    phone          TEXT NOT NULL,
    address        TEXT NOT NULL,
    note           TEXT NOT NULL DEFAULT '',
    delivery       TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'bank', 'momo')),
    items          TEXT NOT NULL,
    subtotal       INTEGER NOT NULL,
    shipping       INTEGER NOT NULL,
    discount       INTEGER NOT NULL DEFAULT 0,
    total          INTEGER NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending',
    admin_note     TEXT NOT NULL DEFAULT '',
    history        TEXT NOT NULL DEFAULT '[]',
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS orders_status ON orders(status);

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Mã OTP xác minh số điện thoại (lưu dạng băm, mỗi số + mục đích chỉ giữ 1 mã)
  CREATE TABLE IF NOT EXISTS otps (
    phone      TEXT NOT NULL,
    purpose    TEXT NOT NULL,
    code_hash  TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    sent_at    INTEGER NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (phone, purpose)
  );
`)

// Bổ sung cột cho database tạo từ bản cũ (SQLite không thêm cột UNIQUE trực tiếp được → dùng index)
const userColumns = db.prepare('PRAGMA table_info(users)').all().map(c => c.name)
for (const [col, type] of [['username', 'TEXT'], ['google_id', 'TEXT'], ['facebook_id', 'TEXT'], ['avatar', 'TEXT']]) {
  if (!userColumns.includes(col)) db.exec(`ALTER TABLE users ADD COLUMN ${col} ${type}`)
}
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS users_username ON users(lower(username));
  CREATE UNIQUE INDEX IF NOT EXISTS users_google ON users(google_id);
  CREATE UNIQUE INDEX IF NOT EXISTS users_facebook ON users(facebook_id);
`)

// ---------- Kho, thu chi, khuyến mãi ----------

// stock = NULL nghĩa là sản phẩm chưa theo dõi tồn kho (bán không giới hạn, như trước đây)
const productColumns = db.prepare('PRAGMA table_info(products)').all().map(c => c.name)
if (!productColumns.includes('stock')) db.exec('ALTER TABLE products ADD COLUMN stock REAL')
if (!productColumns.includes('cost_price')) db.exec('ALTER TABLE products ADD COLUMN cost_price INTEGER')
if (!userColumns.includes('marketing_opt_in')) db.exec('ALTER TABLE users ADD COLUMN marketing_opt_in INTEGER NOT NULL DEFAULT 0')
if (!userColumns.includes('must_change_password')) db.exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0')

db.exec(`
  -- Phiếu nhập / xuất kho
  CREATE TABLE IF NOT EXISTS stock_receipts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    type        TEXT NOT NULL CHECK (type IN ('import', 'export')),
    reason      TEXT NOT NULL,          -- nhap_hang | ban_hang | hang_hong | tra_ncc | kiem_ke | khac
    partner     TEXT NOT NULL DEFAULT '',-- nhà cung cấp / khách hàng
    order_code  TEXT,                   -- phiếu xuất tự động khi giao đơn
    note        TEXT NOT NULL DEFAULT '',
    total       INTEGER NOT NULL DEFAULT 0,
    created_by  INTEGER REFERENCES users(id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stock_receipt_items (
    receipt_id  INTEGER NOT NULL REFERENCES stock_receipts(id) ON DELETE CASCADE,
    product_id  INTEGER NOT NULL,
    name        TEXT NOT NULL,
    unit        TEXT NOT NULL,
    quantity    REAL NOT NULL,
    unit_cost   INTEGER NOT NULL DEFAULT 0,
    stock_after REAL
  );
  CREATE INDEX IF NOT EXISTS receipt_items_product ON stock_receipt_items(product_id);

  -- Sổ thu chi
  CREATE TABLE IF NOT EXISTS cashbook (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount      INTEGER NOT NULL CHECK (amount > 0),
    category    TEXT NOT NULL,
    note        TEXT NOT NULL DEFAULT '',
    ref         TEXT,                   -- mã đơn / mã phiếu nhập (khoản tự động)
    method      TEXT NOT NULL DEFAULT 'cash',
    auto        INTEGER NOT NULL DEFAULT 0,
    created_by  INTEGER REFERENCES users(id),
    occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS cashbook_time ON cashbook(occurred_at);

  -- Mã khuyến mãi
  CREATE TABLE IF NOT EXISTS coupons (
    code        TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK (type IN ('fixed', 'percent')),
    value       INTEGER NOT NULL,
    max_discount INTEGER,               -- trần giảm cho mã phần trăm
    min_order   INTEGER NOT NULL DEFAULT 0,
    usage_limit INTEGER,                -- NULL = không giới hạn
    used_count  INTEGER NOT NULL DEFAULT 0,
    per_user    INTEGER NOT NULL DEFAULT 1,
    private     INTEGER NOT NULL DEFAULT 0, -- 1 = chỉ khách được tặng mới dùng được
    expires_at  TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Mã đã tặng cho khách (hiện trong "Voucher của bạn")
  CREATE TABLE IF NOT EXISTS user_coupons (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code        TEXT NOT NULL REFERENCES coupons(code) ON DELETE CASCADE,
    given_at    TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, code)
  );

  -- Lịch sử gửi tin khuyến mãi
  CREATE TABLE IF NOT EXISTS promo_sends (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT,
    message     TEXT NOT NULL,
    recipients  INTEGER NOT NULL,
    created_by  INTEGER REFERENCES users(id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Đơn hàng: lưu mã giảm giá đã dùng để hoàn lượt khi hủy
if (!db.prepare('PRAGMA table_info(orders)').all().some(c => c.name === 'coupon')) db.exec('ALTER TABLE orders ADD COLUMN coupon TEXT')

// Chuyển mã LTA50 đang viết cứng trong code sang database
db.prepare(`INSERT OR IGNORE INTO coupons (code, type, value, min_order, description) VALUES ('LTA50', 'fixed', 50000, 0, 'Giảm 50.000đ cho mọi đơn hàng')`).run()

export function getSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? JSON.parse(row.value) : fallback
}

export function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value))
}

/** Chuyển một dòng trong bảng products sang đúng dạng Product mà web dùng */
export function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    unit: row.unit,
    step: row.step ?? undefined,
    image: row.image,
    category: row.category,
    origin: row.origin,
    description: row.description,
    rating: row.rating,
    sold: row.sold,
    tags: JSON.parse(row.tags),
    inStock: row.in_stock === 1,
    stock: row.stock ?? null
  }
}

/** Thông tin kho chỉ admin thấy (giá vốn) */
export function toAdminProduct(row) {
  return { ...toProduct(row), costPrice: row.cost_price ?? null }
}

export function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    username: row.username ?? null,
    avatar: row.avatar ?? null,
    role: row.role,
    // Tài khoản tạo bằng Google/Facebook chưa có mật khẩu (password_hash rỗng)
    hasPassword: !!row.password_hash,
    linked: { google: !!row.google_id, facebook: !!row.facebook_id },
    marketingOptIn: row.marketing_opt_in === 1,
    mustChangePassword: row.must_change_password === 1
  }
}

export const findUser = id => db.prepare('SELECT * FROM users WHERE id = ?').get(id)

/** Lần chạy đầu: nạp 47 sản phẩm có sẵn và tạo tài khoản admin + khách demo */
export function seed() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get()
  if (count === 0) {
    const products = JSON.parse(fs.readFileSync(new URL('./seed/products.json', import.meta.url), 'utf8'))
    const insert = db.prepare(`
      INSERT INTO products (id, name, price, old_price, unit, step, image, category, origin, description, rating, sold, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const p of products) {
      insert.run(p.id, p.name, p.price, p.oldPrice ?? null, p.unit, p.step ?? null, p.image, p.category, p.origin, p.description ?? '', p.rating, p.sold, JSON.stringify(p.tags ?? []))
    }
    console.log(`[seed] Đã nạp ${products.length} sản phẩm`)
  }

  const users = db.prepare('SELECT COUNT(*) AS count FROM users').get().count
  if (users === 0) {
    const add = db.prepare('INSERT INTO users (name, phone, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)')
    add.run('Quản trị viên', ADMIN_PHONE, 'admin@lta.vn', ADMIN_USERNAME, bcrypt.hashSync(ADMIN_PASSWORD, 10), 'admin')
    add.run('Khách Demo', '0901234567', 'demo@lta.vn', null, bcrypt.hashSync('123456', 10), 'customer')
    console.log(`[seed] Admin: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`)
    console.log('[seed] Khách demo: 0901234567 / 123456')
  }
}
