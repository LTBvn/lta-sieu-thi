import { FACEBOOK_APP_ID, GOOGLE_CLIENT_ID } from '../config.js'

/**
 * Xác minh token Google/Facebook ở phía server (không tin dữ liệu trình duyệt gửi lên).
 * Trả về hồ sơ { provider, id, name, email, avatar } hoặc ném lỗi có câu tiếng Việt.
 */

async function verifyGoogle(idToken) {
  if (!GOOGLE_CLIENT_ID) throw new Error('Đăng nhập Google chưa được cấu hình (GOOGLE_CLIENT_ID)')
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  if (!res.ok) throw new Error('Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn')
  const info = await res.json()
  // Token phải được cấp cho chính ứng dụng của shop, không phải ứng dụng khác
  if (info.aud !== GOOGLE_CLIENT_ID) throw new Error('Token Google không dành cho ứng dụng này')
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(info.iss)) throw new Error('Token Google không hợp lệ')
  return {
    provider: 'google',
    id: info.sub,
    name: info.name || info.email?.split('@')[0] || 'Khách hàng',
    email: info.email_verified === 'true' || info.email_verified === true ? info.email : undefined,
    avatar: info.picture
  }
}

async function verifyFacebook(accessToken) {
  if (!FACEBOOK_APP_ID) throw new Error('Đăng nhập Facebook chưa được cấu hình (FACEBOOK_APP_ID)')
  const token = encodeURIComponent(accessToken)
  // Kiểm tra token thuộc đúng app Facebook của shop
  const app = await fetch(`https://graph.facebook.com/app?access_token=${token}`).then(r => r.json())
  if (app.error || app.id !== FACEBOOK_APP_ID) throw new Error('Phiên đăng nhập Facebook không hợp lệ')
  const me = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${token}`).then(r => r.json())
  if (me.error || !me.id) throw new Error('Không lấy được thông tin tài khoản Facebook')
  return { provider: 'facebook', id: me.id, name: me.name || 'Khách hàng', email: me.email, avatar: me.picture?.data?.url }
}

export async function verifySocial(provider, token) {
  if (typeof token !== 'string' || !token) throw new Error('Thiếu token đăng nhập')
  if (provider === 'google') return verifyGoogle(token)
  if (provider === 'facebook') return verifyFacebook(token)
  throw new Error('Phương thức đăng nhập không hợp lệ')
}

/** Tên cột lưu id tài khoản mạng xã hội trong bảng users */
export const providerColumn = provider => (provider === 'google' ? 'google_id' : 'facebook_id')
