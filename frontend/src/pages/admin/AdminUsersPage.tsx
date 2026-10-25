import React, { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { errorMessage, userApi } from '../../services/api'
import { useAuth } from '../../store/useAuth'
import { useToast } from '../../store/useToast'
import { Role, User } from '../../types'

export default function AdminUsersPage() {
  const me = useAuth(s => s.user)
  const show = useToast(s => s.show)
  const [users, setUsers] = useState<User[] | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    userApi.list().then(setUsers).catch(err => setError(errorMessage(err)))
  }, [])

  async function changeRole(u: User, role: Role) {
    setBusyId(u.id)
    try {
      const updated = await userApi.setRole(u.id, role)
      setUsers(list => list!.map(x => (x.id === u.id ? updated : x)))
      show(role === 'admin' ? `Đã cấp quyền quản trị cho ${u.name}` : `Đã chuyển ${u.name} về khách hàng`)
    } catch (err) {
      show(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Người dùng & phân quyền</h1>
      <p className="text-sm text-gray-500">Khách tự đăng ký luôn là <b>Khách hàng</b>. Chỉ quản trị viên mới cấp được quyền quản trị cho người khác.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="card p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-primary"><ShieldCheck size={18} /> Quản trị viên</div>
          <p className="mt-1 text-gray-500">Thêm, sửa, xóa sản phẩm, báo hết hàng, quản lý người dùng.</p>
        </div>
        <div className="card p-4 text-sm">
          <div className="font-semibold">Khách hàng</div>
          <p className="mt-1 text-gray-500">Mua sắm, đặt hàng. Không vào được trang quản trị.</p>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto">
        {error && <p className="p-6 text-red-600">{error}</p>}
        {!users && !error && <p className="p-6 text-gray-500">Đang tải...</p>}
        {users && (
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 place-items-center rounded-full font-bold ${u.role === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{u.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <div className="font-semibold">{u.name} {u.id === me?.id && <span className="text-xs font-normal text-gray-400">(bạn)</span>}</div>
                        <div className="text-xs text-gray-500">#{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{u.phone}</div>
                    <div className="text-xs text-gray-400">{u.email || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id || u.id === me?.id}
                      onChange={e => changeRole(u, e.target.value as Role)}
                      className={`input w-auto py-2 font-semibold ${u.role === 'admin' ? 'text-primary' : ''}`}
                      title={u.id === me?.id ? 'Không thể tự đổi quyền của chính mình' : undefined}
                    >
                      <option value="customer">Khách hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
