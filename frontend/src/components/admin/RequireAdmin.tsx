import React from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { isAdmin, useAuth } from '../../store/useAuth'

/** Chặn trang quản trị ở phía giao diện. Quyền thật sự vẫn do server kiểm tra ở mỗi API. */
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuth(s => s.user)
  const location = useLocation()

  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />

  if (!isAdmin(user)) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-6">
        <div className="card max-w-md p-8 text-center">
          <ShieldAlert size={56} className="mx-auto text-red-500" />
          <h1 className="mt-4 text-2xl font-bold">Không có quyền truy cập</h1>
          <p className="mt-2 text-gray-500">Tài khoản <b>{user.name}</b> không phải quản trị viên. Hãy nhờ admin cấp quyền trong mục Người dùng.</p>
          <Link to="/" className="btn-primary mt-6">Về trang chủ</Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
