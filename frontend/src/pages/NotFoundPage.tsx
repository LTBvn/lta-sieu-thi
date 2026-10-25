import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container mx-auto flex flex-col items-center py-24 text-center">
      <div className="text-7xl">🥕</div>
      <h1 className="mt-4 text-3xl font-extrabold">Không tìm thấy trang</h1>
      <p className="mt-2 text-gray-500">Trang bạn tìm có thể đã bị xóa hoặc đường dẫn không đúng.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">Về trang chủ</Link>
        <Link to="/di-cho" className="btn-outline">Đi chợ online</Link>
      </div>
    </div>
  )
}
