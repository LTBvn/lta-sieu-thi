import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, KeyRound, Megaphone, Search, ShieldCheck, X } from 'lucide-react'
import { couponApi, customerApi, errorMessage } from '../../services/api'
import { useToast } from '../../store/useToast'
import { Coupon, Customer } from '../../types'
import { formatPrice, normalize } from '../../utils/format'
import { formatTime } from '../../utils/orderStatus'

function SendPromo({ customers, onClose, onSent }: { customers: Customer[]; onClose: () => void; onSent: (msg: string) => void }) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('LTA Group: Chào {ten}, tặng bạn mã giảm giá cho lần đi chợ tới!')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const optIn = customers.filter(c => c.marketingOptIn)

  useEffect(() => { couponApi.list().then(cs => setCoupons(cs.filter(c => c.active))) }, [])

  async function send() {
    setBusy(true)
    setError('')
    try {
      const r = await customerApi.sendPromo({ userIds: customers.map(c => c.id), code: code || undefined, message })
      onSent(`Đã gửi cho ${r.sent} khách${r.skipped ? `, bỏ qua ${r.skipped} khách chưa đồng ý nhận tin` : ''}`)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-in space-y-4 rounded-2xl bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><Megaphone size={20} className="text-accent" /> Gửi khuyến mãi</h2><button onClick={onClose} aria-label="Đóng"><X size={20} /></button></div>
        <p className="text-sm text-gray-600">
          Đã chọn <b>{customers.length}</b> khách, trong đó <b className="text-primary">{optIn.length}</b> khách đồng ý nhận tin.
          {customers.length > optIn.length && <> {customers.length - optIn.length} khách còn lại sẽ <b>không</b> nhận (theo Nghị định 91/2020 chống tin nhắn rác).</>}
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Tặng mã (vào mục "Voucher của bạn")</label>
          <select value={code} onChange={e => setCode(e.target.value)} className="input">
            <option value="">Không tặng mã, chỉ gửi tin</option>
            {coupons.map(c => <option key={c.code} value={c.code}>{c.code} · {c.type === 'fixed' ? formatPrice(c.value) : `${c.value}%`}{c.private ? ' · mã riêng' : ''}</option>)}
          </select>
          {!coupons.length && <p className="mt-1 text-xs text-gray-500">Chưa có mã. <Link to="/admin/khuyen-mai" className="font-semibold text-primary">Tạo mã khuyến mãi</Link></p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Nội dung tin nhắn <span className="font-normal text-gray-400">({message.length}/300)</span></label>
          <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 300))} rows={3} className="input" />
          <p className="mt-1 text-xs text-gray-500"><code>{'{ten}'}</code> sẽ được thay bằng tên khách. Mã giảm giá tự thêm vào cuối tin.</p>
        </div>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">SMS đang <b>giả lập</b>: tin được in ra terminal backend. Mã tặng vẫn vào tài khoản khách thật. Gửi SMS thật cần đăng ký SMS Brandname (VNPT, Viettel, eSMS...).</p>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button onClick={send} disabled={busy || !optIn.length} className="btn-primary w-full">{busy ? 'Đang gửi...' : `Gửi cho ${optIn.length} khách`}</button>
      </div>
    </div>
  )
}

function ResetPassword({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [temp, setTemp] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function reset() {
    setBusy(true)
    try {
      setTemp(await customerApi.resetPassword(customer.id))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md animate-slide-in space-y-4 rounded-2xl bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound size={20} /> Đặt lại mật khẩu</h2><button onClick={onClose} aria-label="Đóng"><X size={20} /></button></div>
        <p className="text-sm text-gray-600">Khách: <b>{customer.name}</b> · {customer.phone}</p>
        <div className="flex gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-900">
          <ShieldCheck size={16} className="shrink-0" />
          <span>Mật khẩu của khách được mã hóa một chiều nên <b>không ai xem được</b>, kể cả admin. Bạn chỉ có thể cấp <b>mật khẩu tạm</b> để đọc cho khách; khách đăng nhập xong sẽ được nhắc đổi mật khẩu.</span>
        </div>
        {temp ? (
          <div className="rounded-xl border-2 border-dashed border-primary bg-primary-light p-4 text-center">
            <div className="text-xs text-gray-600">Mật khẩu tạm (chỉ hiện 1 lần)</div>
            <div className="mt-1 font-mono text-3xl font-bold tracking-widest text-primary">{temp}</div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">Chỉ làm khi khách gọi điện nhờ hỗ trợ và bạn đã xác minh đúng chủ tài khoản. Khách cũng có thể tự đặt lại bằng OTP ở trang đăng nhập.</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={reset} disabled={busy} className="btn-primary w-full">{busy ? 'Đang tạo...' : 'Tạo mật khẩu tạm'}</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminCustomersPage() {
  const show = useToast(s => s.show)
  const [list, setList] = useState<Customer[] | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [onlyOptIn, setOnlyOptIn] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [sending, setSending] = useState(false)
  const [resetFor, setResetFor] = useState<Customer | null>(null)
  const [history, setHistory] = useState<Awaited<ReturnType<typeof customerApi.history>>>([])

  const load = () => {
    customerApi.list().then(setList).catch(err => setError(errorMessage(err)))
    customerApi.history().then(setHistory).catch(() => {})
  }
  useEffect(load, [])

  const rows = useMemo(() => {
    const query = normalize(q)
    return (list ?? []).filter(c => (!onlyOptIn || c.marketingOptIn) && (!query || normalize(`${c.name} ${c.phone} ${c.email ?? ''}`).includes(query)))
  }, [list, q, onlyOptIn])

  const allChecked = rows.length > 0 && rows.every(c => selected.has(c.id))
  const toggle = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map(c => c.id)))

  function exportCsv() {
    const data = rows.filter(c => c.marketingOptIn)
    const csv = '﻿' + [['Tên', 'Số điện thoại', 'Email', 'Số đơn', 'Tổng chi tiêu'], ...data.map(c => [c.name, c.phone, c.email ?? '', String(c.orders), String(c.spent)])]
      .map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'khach-dong-y-nhan-tin.csv'
    a.click()
    show(`Đã xuất ${data.length} khách đồng ý nhận tin`)
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!list) return <p className="text-gray-500">Đang tải...</p>

  const chosen = list.filter(c => selected.has(c.id))
  const optInCount = list.filter(c => c.marketingOptIn).length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Khách hàng</h1>
          <p className="text-sm text-gray-500">{list.length} khách · {optInCount} khách đồng ý nhận tin khuyến mãi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-outline px-3 py-2 text-sm"><Download size={16} /> Xuất SĐT (đã đồng ý)</button>
          <button onClick={() => setSending(true)} disabled={!selected.size} className="btn-primary px-4 py-2 text-sm"><Megaphone size={16} /> Gửi khuyến mãi ({selected.size})</button>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm tên, số điện thoại, email..." className="input pl-9" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyOptIn} onChange={e => setOnlyOptIn(e.target.checked)} className="h-4 w-4 accent-primary" /> Chỉ khách đồng ý nhận tin</label>
        </div>

        <label className="flex items-center gap-3 border-b border-border bg-gray-50 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-primary" /> Chọn tất cả ({rows.length})
        </label>
        <ul className="divide-y divide-border">
          {rows.map(c => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap">
              <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-primary" aria-label={`Chọn ${c.name}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.name}</span>
                  {c.marketingOptIn
                    ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">Nhận tin KM</span>
                    : <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Không nhận tin</span>}
                  {c.google && <span className="text-[11px] text-gray-400">Google</span>}
                  {c.facebook && <span className="text-[11px] text-gray-400">Facebook</span>}
                </div>
                <div className="text-sm text-gray-600"><a href={`tel:${c.phone}`} className="hover:text-primary">{c.phone}</a>{c.email ? ` · ${c.email}` : ''}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-bold">{formatPrice(c.spent)}</div>
                <div className="text-xs text-gray-500">{c.orders} đơn{c.lastOrder ? ` · gần nhất ${formatTime(c.lastOrder)}` : ''}</div>
              </div>
              <button onClick={() => setResetFor(c)} className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100" title="Đặt lại mật khẩu" aria-label="Đặt lại mật khẩu"><KeyRound size={16} /></button>
            </li>
          ))}
        </ul>
        {!rows.length && <p className="p-10 text-center text-gray-500">Không có khách phù hợp.</p>}
      </div>

      {history.length > 0 && (
        <section className="card mt-6 p-5">
          <h2 className="font-bold">Lịch sử gửi khuyến mãi</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {history.map(h => (
              <li key={h.id} className="py-2">
                <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{h.recipients} khách{h.code ? ` · mã ${h.code}` : ''}</span><span className="text-xs text-gray-500">{formatTime(h.createdAt)} · {h.createdBy}</span></div>
                <div className="text-gray-600">{h.message}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sending && <SendPromo customers={chosen} onClose={() => setSending(false)} onSent={msg => { setSending(false); setSelected(new Set()); show(msg); load() }} />}
      {resetFor && <ResetPassword customer={resetFor} onClose={() => setResetFor(null)} />}
    </div>
  )
}
