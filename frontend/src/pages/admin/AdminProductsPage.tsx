import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, PlusCircle, Search, Trash2 } from 'lucide-react'
import categories, { categoryById } from '../../data/categories'
import { isAvailable, useProducts } from '../../store/useProducts'
import { useToast } from '../../store/useToast'
import { errorMessage, productApi } from '../../services/api'
import { Product } from '../../types'
import { formatPrice, normalize } from '../../utils/format'

function StockSwitch({ product }: { product: Product }) {
  const upsert = useProducts(s => s.upsert)
  const show = useToast(s => s.show)
  const [busy, setBusy] = useState(false)
  const on = isAvailable(product)

  async function toggle() {
    setBusy(true)
    try {
      upsert(await productApi.setStock(product.id, !on))
      show(on ? `Đã báo hết hàng: ${product.name}` : `Đã mở bán lại: ${product.name}`, product.image)
    } catch (err) {
      show(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={toggle}
      className="flex items-center gap-2 text-sm disabled:opacity-50"
      title={on ? 'Bấm để báo hết hàng' : 'Bấm để mở bán lại'}
    >
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-primary' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      <span className={`whitespace-nowrap font-medium ${on ? 'text-primary' : 'text-red-600'}`}>{on ? 'Còn hàng' : 'Hết hàng'}</span>
    </button>
  )
}

export default function AdminProductsPage() {
  const products = useProducts(s => s.products)
  const removeLocal = useProducts(s => s.removeLocal)
  const show = useToast(s => s.show)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [stock, setStock] = useState<'' | 'in' | 'out'>('')
  const [confirm, setConfirm] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const list = useMemo(() => {
    const query = normalize(q)
    return products.filter(p =>
      (!query || normalize(p.name).includes(query)) &&
      (!cat || p.category === cat) &&
      (!stock || (stock === 'in') === isAvailable(p))
    )
  }, [products, q, cat, stock])

  const outCount = products.filter(p => !isAvailable(p)).length
  const stats = [
    { label: 'Tổng sản phẩm', value: products.length, tone: 'text-text' },
    { label: 'Đang bán', value: products.length - outCount, tone: 'text-primary' },
    { label: 'Hết hàng', value: outCount, tone: 'text-red-600' },
    { label: 'Đang giảm giá', value: products.filter(p => p.oldPrice).length, tone: 'text-accent' }
  ]

  async function doDelete() {
    if (!confirm) return
    setDeleting(true)
    try {
      await productApi.remove(confirm.id)
      removeLocal(confirm.id)
      show(`Đã xóa ${confirm.name}`)
      setConfirm(null)
    } catch (err) {
      show(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          <p className="text-sm text-gray-500">Gạt công tắc để báo hết hàng, khách sẽ thấy ngay trên web.</p>
        </div>
        <Link to="/admin/san-pham/moi" className="btn-primary"><PlusCircle size={18} /> Thêm sản phẩm</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`mt-1 text-2xl font-extrabold ${s.tone}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card mt-6">
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tên..." className="input pl-9" />
          </div>
          <select value={cat} onChange={e => setCat(e.target.value)} className="input w-auto">
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={stock} onChange={e => setStock(e.target.value as typeof stock)} className="input w-auto">
            <option value="">Mọi tình trạng</option>
            <option value="in">Còn hàng</option>
            <option value="out">Hết hàng</option>
          </select>
        </div>

        {/* Điện thoại: mỗi sản phẩm một thẻ, công tắc và nút luôn trong màn hình */}
        {list.length === 0 && <div className="p-10 text-center text-gray-500 md:hidden">Không có sản phẩm phù hợp.</div>}
        <ul className="divide-y divide-border md:hidden">
          {list.map(p => (
            <li key={p.id} className={`flex gap-3 p-3 ${isAvailable(p) ? '' : 'bg-red-50/40'}`}>
              <img src={p.image} alt="" className={`h-16 w-16 shrink-0 rounded-lg object-cover ${isAvailable(p) ? '' : 'opacity-50 grayscale'}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.name}</div>
                <div className="text-xs text-gray-500">#{p.id} · {categoryById[p.category]?.name ?? p.category}</div>
                <div className="text-sm font-semibold">{formatPrice(p.price)}<span className="font-normal text-gray-400">/{p.unit}</span></div>
                <div className="mt-2 flex items-center justify-between">
                  <StockSwitch product={p} />
                  <div className="flex gap-1">
                    <Link to={`/admin/san-pham/${p.id}`} className="grid h-10 w-10 place-items-center rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Sửa"><Pencil size={18} /></Link>
                    <button onClick={() => setConfirm(p)} className="grid h-10 w-10 place-items-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Xóa"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3 text-right">Giá bán</th>
                <th className="px-4 py-3">Tình trạng</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map(p => (
                <tr key={p.id} className={isAvailable(p) ? '' : 'bg-red-50/40'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className={`h-12 w-12 rounded-lg object-cover ${isAvailable(p) ? '' : 'opacity-50 grayscale'}`} />
                      <div>
                        <Link to={`/product/${p.id}`} target="_blank" className="font-semibold hover:text-primary">{p.name}</Link>
                        <div className="text-xs text-gray-500">#{p.id} · {p.origin || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{categoryById[p.category]?.name ?? p.category}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-semibold">{formatPrice(p.price)}<span className="font-normal text-gray-400">/{p.unit}</span></div>
                    {p.oldPrice && <div className="text-xs text-gray-400 line-through">{formatPrice(p.oldPrice)}</div>}
                  </td>
                  <td className="px-4 py-3"><StockSwitch product={p} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/san-pham/${p.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary" title="Sửa"><Pencil size={16} /></Link>
                      <button onClick={() => setConfirm(p)} className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600" title="Xóa"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="hidden p-10 text-center text-gray-500 md:block">Không có sản phẩm phù hợp.</div>}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !deleting && setConfirm(null)} />
          <div className="relative w-full max-w-sm animate-slide-in rounded-2xl bg-white p-6 shadow-lift">
            <img src={confirm.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <h2 className="mt-4 text-lg font-bold">Xóa "{confirm.name}"?</h2>
            <p className="mt-1 text-sm text-gray-500">Sản phẩm sẽ biến mất khỏi web và không khôi phục được. Nếu chỉ tạm hết, hãy dùng công tắc <b>Hết hàng</b> thay vì xóa.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setConfirm(null)} disabled={deleting} className="btn-outline">Hủy</button>
              <button onClick={doDelete} disabled={deleting} className="btn-primary bg-red-600 hover:bg-red-700">{deleting ? 'Đang xóa...' : 'Xóa'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
