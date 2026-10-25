import React, { useEffect, useMemo, useState } from 'react'
import { Download, Plus, Trash2, X } from 'lucide-react'
import { CashCategories, cashbookApi, errorMessage } from '../../services/api'
import { useToast } from '../../store/useToast'
import { CashReport, PayMethod } from '../../types'
import { formatPrice } from '../../utils/format'
import { formatTime } from '../../utils/orderStatus'

// Màu đã kiểm tra bằng công cụ: tách biệt cả với người mù màu đỏ-lục (ΔE 28)
const INCOME = '#2F6FDB'
const EXPENSE = '#E8590C'

const METHOD: Record<PayMethod, string> = { cash: 'Tiền mặt', bank: 'Chuyển khoản', momo: 'MoMo' }

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD */
const vnToday = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)
const addDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10)
const shortDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n))

function presets() {
  const t = vnToday()
  const monthStart = t.slice(0, 8) + '01'
  const prevEnd = addDays(monthStart, -1)
  return [
    { id: 'today', label: 'Hôm nay', from: t, to: t },
    { id: '7d', label: '7 ngày', from: addDays(t, -6), to: t },
    { id: '30d', label: '30 ngày', from: addDays(t, -29), to: t },
    { id: 'month', label: 'Tháng này', from: monthStart, to: t },
    { id: 'prev', label: 'Tháng trước', from: prevEnd.slice(0, 8) + '01', to: prevEnd }
  ]
}

/** Biểu đồ cột đôi thu/chi theo ngày, rê chuột để xem số */
function DailyChart({ report }: { report: CashReport }) {
  const [hover, setHover] = useState<number | null>(null)
  // Đủ mọi ngày trong kỳ, ngày không phát sinh = 0
  const days = useMemo(() => {
    const map = new Map(report.daily.map(d => [d.day, d]))
    const out = []
    for (let d = report.from; d <= report.to; d = addDays(d, 1)) out.push(map.get(d) ?? { day: d, income: 0, expense: 0 })
    return out.slice(-62)
  }, [report])

  const W = 720, H = 220, L = 44, B = 24, T = 8
  const max = Math.max(1, ...days.flatMap(d => [d.income, d.expense]))
  const nice = Math.pow(10, Math.floor(Math.log10(max)))
  const top = Math.ceil(max / nice) * nice
  const plotW = W - L - 4, plotH = H - B - T
  const slot = plotW / days.length
  const barW = Math.max(2, Math.min(18, (slot - 6) / 2))
  const y = (v: number) => T + plotH - (v / top) * plotH
  const labelEvery = Math.ceil(days.length / 10)

  const bar = (x: number, v: number, color: string) => {
    if (v <= 0) return null
    const h = Math.max(2, (v / top) * plotH)
    const r = Math.min(4, barW / 2, h)
    const yTop = T + plotH - h
    // Bo 4px ở đầu cột, chân cột vuông bám trục
    return <path d={`M${x},${T + plotH} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${T + plotH} Z`} fill={color} />
  }

  const hd = hover !== null ? days[hover] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Biểu đồ thu chi theo ngày">
        {[0, 0.5, 1].map(f => (
          <g key={f}>
            <line x1={L} x2={W} y1={y(top * f)} y2={y(top * f)} stroke="#E5E7EB" strokeDasharray={f ? '3 3' : undefined} />
            <text x={L - 6} y={y(top * f) + 4} textAnchor="end" fontSize="11" fill="#6B7280">{compact(top * f)}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const x0 = L + i * slot + (slot - barW * 2 - 2) / 2
          return (
            <g key={d.day}>
              {hover === i && <rect x={L + i * slot} y={T} width={slot} height={plotH} fill="#F3F4F6" />}
              {bar(x0, d.income, INCOME)}
              {bar(x0 + barW + 2, d.expense, EXPENSE)}
              {i % labelEvery === 0 && <text x={L + i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#6B7280">{shortDay(d.day)}</text>}
              {/* Vùng rê chuột rộng cả cột ngày, dễ trúng hơn cột mỏng */}
              <rect x={L + i * slot} y={T} width={slot} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onTouchStart={() => setHover(i)} />
            </g>
          )
        })}
      </svg>
      {hd && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-44 rounded-lg border border-border bg-white p-3 text-xs shadow-lift"
          style={{ left: `clamp(0px, calc(${((L + hover! * slot + slot / 2) / W) * 100}% - 88px), calc(100% - 176px))` }}
        >
          <div className="mb-1 font-semibold text-text">Ngày {shortDay(hd.day)}</div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-600"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: INCOME }} />Thu</span><b>{formatPrice(hd.income)}</b></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-600"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: EXPENSE }} />Chi</span><b>{formatPrice(hd.expense)}</b></div>
          <div className="mt-1 flex justify-between border-t border-border pt-1 text-gray-600"><span>Chênh lệch</span><b className="text-text">{formatPrice(hd.income - hd.expense)}</b></div>
        </div>
      )}
    </div>
  )
}

function CategoryBars({ report, type, cats }: { report: CashReport; type: 'income' | 'expense'; cats: CashCategories }) {
  const rows = report.byCategory.filter(c => c.type === type)
  const max = Math.max(1, ...rows.map(r => r.total))
  if (!rows.length) return <p className="text-sm text-gray-400">Chưa có khoản {type === 'income' ? 'thu' : 'chi'} trong kỳ</p>
  return (
    <ul className="space-y-2.5">
      {rows.map(r => (
        <li key={r.category} className="text-sm">
          <div className="flex justify-between"><span className="text-gray-600">{cats[type][r.category] ?? r.category}</span><b>{formatPrice(r.total)}</b></div>
          <div className="mt-1 h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full" style={{ width: `${(r.total / max) * 100}%`, background: type === 'income' ? INCOME : EXPENSE }} /></div>
        </li>
      ))}
    </ul>
  )
}

function AddEntry({ cats, onClose, onSaved }: { cats: CashCategories; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('chi_khac')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [method, setMethod] = useState<PayMethod>('cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!(Number(amount) > 0)) return setError('Nhập số tiền')
    setBusy(true)
    try {
      await cashbookApi.add({ type, category, amount: Number(amount), note, method })
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={save} className="relative w-full max-w-md animate-slide-in space-y-4 rounded-2xl bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Thêm khoản thu / chi</h2><button type="button" onClick={onClose} aria-label="Đóng"><X size={20} /></button></div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          {(['income', 'expense'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setType(t); setCategory(t === 'income' ? 'thu_khac' : 'chi_khac') }} className={`rounded-lg py-2 text-sm font-semibold ${type === t ? 'bg-white shadow-card' : 'text-gray-500'}`} style={type === t ? { color: t === 'income' ? INCOME : EXPENSE } : undefined}>
              {t === 'income' ? 'Khoản thu' : 'Khoản chi'}
            </button>
          ))}
        </div>
        <input value={amount ? Number(amount).toLocaleString('vi-VN') : ''} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Số tiền (đ)" className="input text-lg font-bold" autoFocus />
        <select value={category} onChange={e => setCategory(e.target.value)} className="input">
          {Object.entries(cats[type]).filter(([k]) => !['ban_hang', 'nhap_hang', 'hoan_tien'].includes(k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={method} onChange={e => setMethod(e.target.value as PayMethod)} className="input">
          {Object.entries(METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (VD: tiền điện tháng 10)" className="input" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Đang lưu...' : 'Lưu'}</button>
        <p className="text-xs text-gray-500">Tiền bán hàng và tiền nhập hàng được ghi tự động, không cần nhập tay.</p>
      </form>
    </div>
  )
}

export default function AdminCashbookPage() {
  const show = useToast(s => s.show)
  const ranges = useMemo(presets, [])
  const [range, setRange] = useState({ from: ranges[2].from, to: ranges[2].to })
  const [report, setReport] = useState<CashReport | null>(null)
  const [cats, setCats] = useState<CashCategories | null>(null)
  const [filter, setFilter] = useState<'' | 'income' | 'expense'>('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const load = () => cashbookApi.report(range.from, range.to).then(setReport).catch(err => setError(errorMessage(err)))
  useEffect(() => { cashbookApi.categories().then(setCats) }, [])
  useEffect(() => { load() }, [range.from, range.to])

  async function remove(id: number) {
    if (!confirm('Xóa khoản này?')) return
    try {
      await cashbookApi.remove(id)
      show('Đã xóa')
      load()
    } catch (err) {
      show(errorMessage(err))
    }
  }

  function exportCsv() {
    if (!report || !cats) return
    const rows = [['Thời gian', 'Loại', 'Danh mục', 'Số tiền', 'Phương thức', 'Tham chiếu', 'Ghi chú', 'Người ghi']]
    for (const e of report.entries) rows.push([formatTime(e.occurredAt), e.type === 'income' ? 'Thu' : 'Chi', cats[e.type][e.category] ?? e.category, String(e.amount), METHOD[e.method], e.ref ?? '', e.note, e.createdBy ?? ''])
    const csv = '﻿' + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `so-thu-chi_${report.from}_${report.to}.csv`
    a.click()
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!report || !cats) return <p className="text-gray-500">Đang tải...</p>

  const entries = report.entries.filter(e => !filter || e.type === filter)
  const tiles = [
    { label: 'Tổng thu', value: report.income, color: INCOME },
    { label: 'Tổng chi', value: report.expense, color: EXPENSE },
    { label: report.net >= 0 ? 'Lãi (thu − chi)' : 'Lỗ (thu − chi)', value: report.net, color: undefined },
    { label: 'Số dư quỹ cuối kỳ', value: report.balance, color: undefined }
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sổ thu chi</h1>
          <p className="text-sm text-gray-500">Tiền đơn hàng đã thu và tiền nhập hàng được ghi tự động. Các khoản khác (điện, lương...) bạn ghi tay.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-outline px-3 py-2 text-sm"><Download size={16} /> Xuất Excel (CSV)</button>
          <button onClick={() => setAdding(true)} className="btn-primary px-4 py-2 text-sm"><Plus size={16} /> Thêm khoản</button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {ranges.map(r => (
          <button key={r.id} onClick={() => setRange({ from: r.from, to: r.to })} className={`rounded-full border px-3 py-2 text-sm font-medium ${range.from === r.from && range.to === r.to ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:border-primary'}`}>{r.label}</button>
        ))}
        <div className="flex items-center gap-1 text-sm">
          <input type="date" value={range.from} max={range.to} onChange={e => e.target.value && setRange(r => ({ ...r, from: e.target.value }))} className="input w-auto py-2" aria-label="Từ ngày" />
          <span className="text-gray-400">→</span>
          <input type="date" value={range.to} min={range.from} onChange={e => e.target.value && setRange(r => ({ ...r, to: e.target.value }))} className="input w-auto py-2" aria-label="Đến ngày" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="card p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">{t.color && <i className="h-2.5 w-2.5 rounded-sm" style={{ background: t.color }} />}{t.label}</div>
            <div className="mt-1 text-xl font-extrabold md:text-2xl">{formatPrice(t.value)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">Thu chi theo ngày</h2>
            <div className="flex gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: INCOME }} /> Thu</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: EXPENSE }} /> Chi</span>
            </div>
          </div>
          <div className="mt-3"><DailyChart report={report} /></div>
        </section>
        <section className="card space-y-6 p-5">
          <div><h2 className="mb-3 font-bold">Thu theo danh mục</h2><CategoryBars report={report} type="income" cats={cats} /></div>
          <div><h2 className="mb-3 font-bold">Chi theo danh mục</h2><CategoryBars report={report} type="expense" cats={cats} /></div>
        </section>
      </div>

      <section className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <h2 className="font-bold">Chi tiết ({entries.length} khoản)</h2>
          <div className="flex gap-2">
            {([['', 'Tất cả'], ['income', 'Thu'], ['expense', 'Chi']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} className={`rounded-full border px-3 py-1.5 text-sm ${filter === id ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary'}`}>{label}</button>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {entries.map(e => (
            <li key={e.id} className="flex items-center gap-3 p-3 md:px-4">
              <i className="h-9 w-1 shrink-0 rounded-full" style={{ background: e.type === 'income' ? INCOME : EXPENSE }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{cats[e.type][e.category] ?? e.category}{e.note ? <span className="font-normal text-gray-500"> · {e.note}</span> : null}</div>
                <div className="text-xs text-gray-500">{formatTime(e.occurredAt)} · {METHOD[e.method]}{e.auto ? ' · tự động' : e.createdBy ? ` · ${e.createdBy}` : ''}</div>
              </div>
              <div className="whitespace-nowrap font-bold">{e.type === 'income' ? '+' : '−'}{formatPrice(e.amount)}</div>
              {!e.auto ? (
                <button onClick={() => remove(e.id)} className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Xóa khoản"><Trash2 size={16} /></button>
              ) : <span className="w-9" />}
            </li>
          ))}
        </ul>
        {!entries.length && <p className="p-10 text-center text-gray-500">Chưa có khoản nào trong kỳ này.</p>}
      </section>

      {adding && <AddEntry cats={cats} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); show('Đã ghi sổ'); load() }} />}
    </div>
  )
}
