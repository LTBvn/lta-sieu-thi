import React, { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { couponApi, CouponInput, errorMessage } from '../../services/api'
import { useToast } from '../../store/useToast'
import { Coupon } from '../../types'
import { formatPrice } from '../../utils/format'

const EMPTY: CouponInput = {
  code: '', type: 'fixed', value: 20000, maxDiscount: null, minOrder: 0, usageLimit: null,
  perUser: 1, private: false, expiresAt: null, active: true, description: ''
}

const describe = (c: Coupon | CouponInput) =>
  (c.type === 'fixed' ? `Giảm ${formatPrice(c.value)}` : `Giảm ${c.value}%${c.maxDiscount ? ` (tối đa ${formatPrice(c.maxDiscount)})` : ''}`) +
  (c.minOrder ? ` · đơn từ ${formatPrice(c.minOrder)}` : '')

function CouponForm({ initial, isNew, onClose, onSaved }: { initial: CouponInput; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (patch: Partial<CouponInput>) => setC(prev => ({ ...prev, ...patch }))
  const num = (v: string) => (v === '' ? null : Number(v.replace(/\D/g, '')))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await (isNew ? couponApi.create(c) : couponApi.update(c))
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const label = 'mb-1.5 block text-sm font-semibold'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={save} className="relative max-h-[92vh] w-full max-w-lg animate-slide-in space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{isNew ? 'Tạo mã khuyến mãi' : `Sửa mã ${c.code}`}</h2><button type="button" onClick={onClose} aria-label="Đóng"><X size={20} /></button></div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Mã</label>
            <input value={c.code} disabled={!isNew} onChange={e => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} className="input font-mono font-bold uppercase" placeholder="VD: TETSALE" autoFocus={isNew} />
          </div>
          <div>
            <label className={label}>Loại giảm</label>
            <select value={c.type} onChange={e => set({ type: e.target.value as CouponInput['type'], value: e.target.value === 'percent' ? 10 : 20000 })} className="input">
              <option value="fixed">Số tiền cố định</option>
              <option value="percent">Phần trăm (%)</option>
            </select>
          </div>
          <div>
            <label className={label}>{c.type === 'fixed' ? 'Số tiền giảm (đ)' : 'Phần trăm giảm'}</label>
            <input value={c.value || ''} onChange={e => set({ value: num(e.target.value) ?? 0 })} inputMode="numeric" className="input" />
          </div>
          {c.type === 'percent' && (
            <div>
              <label className={label}>Giảm tối đa (đ)</label>
              <input value={c.maxDiscount ?? ''} onChange={e => set({ maxDiscount: num(e.target.value) })} inputMode="numeric" className="input" placeholder="Không giới hạn" />
            </div>
          )}
          <div>
            <label className={label}>Đơn tối thiểu (đ)</label>
            <input value={c.minOrder || ''} onChange={e => set({ minOrder: num(e.target.value) ?? 0 })} inputMode="numeric" className="input" placeholder="0" />
          </div>
          <div>
            <label className={label}>Tổng lượt dùng</label>
            <input value={c.usageLimit ?? ''} onChange={e => set({ usageLimit: num(e.target.value) })} inputMode="numeric" className="input" placeholder="Không giới hạn" />
          </div>
          <div>
            <label className={label}>Lượt / mỗi khách</label>
            <input value={c.perUser} onChange={e => set({ perUser: num(e.target.value) ?? 0 })} inputMode="numeric" className="input" />
            <p className="mt-1 text-xs text-gray-500">0 = không giới hạn</p>
          </div>
          <div>
            <label className={label}>Hết hạn</label>
            <input type="date" value={c.expiresAt ?? ''} onChange={e => set({ expiresAt: e.target.value || null })} className="input" />
          </div>
        </div>
        <div>
          <label className={label}>Mô tả cho khách</label>
          <input value={c.description} onChange={e => set({ description: e.target.value })} className="input" placeholder="VD: Ưu đãi khách quen tháng 11" />
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={c.private} onChange={e => set({ private: e.target.checked })} className="mt-0.5 h-4 w-4 accent-primary" /> <span><b>Mã riêng</b>: chỉ khách được tặng (qua trang Khách hàng) mới dùng được</span></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.active} onChange={e => set({ active: e.target.checked })} className="h-4 w-4 accent-primary" /> Đang hoạt động</label>
        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Khách sẽ thấy: <b>{describe(c)}</b></p>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Đang lưu...' : 'Lưu mã'}</button>
      </form>
    </div>
  )
}

export default function AdminCouponsPage() {
  const show = useToast(s => s.show)
  const [list, setList] = useState<Coupon[] | null>(null)
  const [editing, setEditing] = useState<{ c: CouponInput; isNew: boolean } | null>(null)
  const [error, setError] = useState('')

  const load = () => couponApi.list().then(setList).catch(err => setError(errorMessage(err)))
  useEffect(() => { load() }, [])

  async function remove(c: Coupon) {
    if (!confirm(c.usedCount ? `Mã ${c.code} đã được dùng ${c.usedCount} lần nên sẽ được TẮT (giữ lịch sử). Tiếp tục?` : `Xóa mã ${c.code}?`)) return
    try {
      await couponApi.remove(c.code)
      show(c.usedCount ? 'Đã tắt mã' : 'Đã xóa mã')
      load()
    } catch (err) {
      show(errorMessage(err))
    }
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!list) return <p className="text-gray-500">Đang tải...</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mã khuyến mãi</h1>
          <p className="text-sm text-gray-500">Mã công khai: ai nhập cũng dùng được. Mã riêng: chỉ khách được tặng ở trang Khách hàng.</p>
        </div>
        <button onClick={() => setEditing({ c: EMPTY, isNew: true })} className="btn-primary"><Plus size={18} /> Tạo mã</button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map(c => {
          const expired = !!c.expiresAt && c.expiresAt < new Date().toISOString().slice(0, 10)
          const exhausted = c.usageLimit !== null && c.usedCount >= c.usageLimit
          const live = c.active && !expired && !exhausted
          return (
            <div key={c.code} className={`card flex overflow-hidden ${live ? '' : 'opacity-60'}`}>
              <div className={`grid w-3 shrink-0 ${live ? 'bg-accent' : 'bg-gray-300'}`} />
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-lg font-bold">{c.code}</div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing({ c, isNew: false })} className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Sửa"><Pencil size={15} /></button>
                    <button onClick={() => remove(c)} className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600" aria-label="Xóa"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="text-sm font-semibold">{describe(c)}</div>
                {c.description && <div className="text-xs text-gray-500">{c.description}</div>}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className={`rounded-full px-2 py-0.5 ${live ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{!c.active ? 'Đã tắt' : expired ? 'Hết hạn' : exhausted ? 'Hết lượt' : 'Đang chạy'}</span>
                  {c.private && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">Mã riêng</span>}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Đã dùng {c.usedCount}{c.usageLimit !== null ? `/${c.usageLimit}` : ''}</span>
                  {c.expiresAt && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">HSD {c.expiresAt.split('-').reverse().join('/')}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {!list.length && <p className="card mt-6 p-10 text-center text-gray-500">Chưa có mã nào.</p>}

      {editing && <CouponForm initial={editing.c} isNew={editing.isNew} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); show('Đã lưu mã'); load() }} />}
    </div>
  )
}
