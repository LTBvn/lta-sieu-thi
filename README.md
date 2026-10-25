# LTA Group – Siêu thị & Đi chợ online

```
web siêu thị/
├── frontend/          Web React + Vite + Tailwind (cổng 5173)
│   └── src/           pages/, components/, store/, services/api.ts ...
├── backend/           API Express + SQLite (cổng 4000)
│   ├── src/
│   │   ├── index.js         khởi động server, gắn các route
│   │   ├── config.js        đọc cấu hình từ backend/.env
│   │   ├── db.js            tạo bảng, dữ liệu mẫu
│   │   ├── middleware/      kiểm tra đăng nhập / quyền admin
│   │   ├── lib/             OTP, xác minh Google/Facebook, kiểm tra dữ liệu
│   │   └── routes/          auth, products, orders, users, settings, uploads
│   ├── data/          database lta.db + ảnh tải lên (không đưa lên git)
│   └── .env           mã Google/Facebook, mật khẩu admin (không đưa lên git)
└── scripts/dev.mjs    chạy cả hai cùng lúc
```

## Chạy
Cần **Node.js 24** trở lên.

```bash
npm run install:all   # lần đầu: cài thư viện cho backend/ và frontend/
npm run dev           # bật backend (4000) rồi frontend (5173); Ctrl+C tắt cả hai
```

Mở `http://localhost:5173`. Chạy riêng: `npm run dev:backend` / `npm run dev:frontend`.

| Vai trò | Đăng nhập | Mật khẩu |
|---|---|---|
| Quản trị viên | `LTAadmin` (hoặc `0900000000`) | `adminLTA` |
| Khách demo | `0901234567` | `123456` |

## Đăng nhập (`/login`, trang riêng)
- Mật khẩu: số điện thoại, email hoặc tên đăng nhập.
- Đăng ký: điền thông tin → **xác minh số điện thoại bằng OTP**.
- Quên mật khẩu: OTP → đặt mật khẩu mới.
- Google / Facebook: lần đầu bắt buộc **liên kết số điện thoại bằng OTP**.
  Số đã có tài khoản → gắn vào tài khoản đó; số mới → tạo tài khoản mới.
- Trang Tài khoản: liên kết / gỡ Google, Facebook; tài khoản mạng xã hội có thể tạo mật khẩu.

**OTP đang giả lập**: chưa gửi SMS, mã in ra terminal dòng `[OTP giả lập]`.
Gửi SMS thật: sửa hàm `sendOtp` trong `backend/src/lib/otp.js` để gọi API nhà mạng (eSMS, SpeedSMS...).

### Bật Google / Facebook
Điền vào `backend/.env` (mẫu ở `backend/.env.example`) rồi khởi động lại `npm run dev`:

```
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
FACEBOOK_APP_ID=1234567890
```

- Google Cloud Console → OAuth client ID (Web) → *Authorized JavaScript origins* thêm `http://localhost:5173`.
- Meta for Developers → app có *Facebook Login* → *App Domains* / *Allowed Domains for the JavaScript SDK* thêm `localhost`.

Backend tự xác minh token với Google/Facebook, không tin dữ liệu trình duyệt gửi lên.

## Trang quản trị (`/admin`)
Đơn hàng (thông báo đơn mới, gửi mã QR thanh toán), sản phẩm (thêm/sửa/xóa, báo hết hàng),
người dùng & phân quyền, cài đặt tài khoản nhận tiền (VietQR / MoMo).

## Kiểm tra
```bash
npm run typecheck
npm run build
```

Ảnh sản phẩm: Wikimedia Commons (CC BY-SA), nguồn trong `frontend/public/images/CREDITS.txt`.
