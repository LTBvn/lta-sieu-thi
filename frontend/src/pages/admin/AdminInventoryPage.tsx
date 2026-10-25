import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, PackageX, Plus, Printer, Search, Trash2, Wallet, X } from 'lucide-react'
import { errorMessage, inventoryApi, Reasons, StockOverview } from '../../services/api'
import { useProducts } from '../../store/useProducts'
import { useToast } from '../../store/useToast'
import { PayMethod, Product, StockReceipt } from '../../types'
import { formatPrice, formatQty, normalize } from '../../utils/format'
import { formatTime } from '../../utils/orderStatus'

type Tab = 'ton-kho' | 'phieu' | 'tao'

const stockTone = (p: Product, low: number) =>
  p.stock === null || p.stock === undefined ? 'bg-gray-100 text-gray-500'
    : p.stock <= 0 ? 'bg-red-100 text-red-700'
      : p.stock <= low ? 'bg-amber-100 text-amber-800'
        : 'bg-green-100 text-green-800'

// ---------- Tồn kho ----------

function StockTab({ data, onImport }: { data: StockOverview; onImport: (p: Product) => void }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'untracked'>('all')
  const low = data.lowStock

  const list = useMemo(() => {
    const query = normalize(q)
    return data.products.filter(p => {
      if (query && !normalize(p.name).includes(query)) return false
      if (filter === 'untracked') return p.stock === null
      if (filter === 'out') return p.stock !== null && p.stock! <= 0
      if (filter === 'low') return p.stock !== null && p.stock! > 0 && p.stock! <= low
      return true
    }).sort((a, b) => {
      // Đang theo dõi lên đầu, ít tồn nhất đứng trước để dễ thấy cần nhập thêm
      const sa = a.stock ?? Infinity, sb = b.stock ?? Infinity
      return sa - sb || a.name.localeCompare(b.name, 'vi')
    })
  }, [data, q, filter])

  const chips: [typeof filter, string][] = [['all', 'Tất cả'], ['low', `Sắp hết (≤${low})`], ['out', 'Hết hàng'], ['untracked', 'Chưa theo dõi']]

  return (
    <div className="card">
      <div className="flex flex-wrap gap-3 border-b border-border p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm sản phẩm..." className="input pl-9" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {chips.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium ${filter === id ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:border-primary'}`}>{label}</button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-border">
        {list.map(p => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 md:flex-nowrap md:px-4">
            <img src={p.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{p.name}</div>
              <div className="text-xs text-gray-500">
                Giá bán {formatPrice(p.price)}/{p.unit}{p.costPrice ? ` · Giá vốn ${formatPrice(p.costPrice)}` : ''}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${stockTone(p, low)}`}>
                {p.stock === null || p.stock === undefined ? 'Không theo dõi' : `${formatQty(p.stock)} ${p.unit}`}
              </span>
              {p.stock !== null && p.costPrice ? <div className="mt-0.5 text-xs text-gray-500">Giá trị {formatPrice(p.stock! * p.costPrice)}</div> : null}
            </div>
            <button onClick={() => onImport(p)} className="btn-outline px-3 py-2 text-sm"><ArrowDownToLine size={16} /> Nhập</button>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="p-10 text-center text-gray-500">Không có sản phẩm phù hợp.</p>}
    </div>
  )
}

// ---------- Danh sách phiếu ----------

function ReceiptDetail({ code, reasons, onClose }: { code: string; reasons: Reasons; onClose: () => void }) {
  const [r, setR] = useState<StockReceipt | null>(null)
  useEffect(() => { inventoryApi.receipt(code).then(setR) }, [code])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40 print:hidden" onClick={onClose} />
      <div className="printable relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-lift">
        {!r ? <p className="text-gray-500">Đang tải...</p> : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">LTA Group</div>
                <h2 className="text-xl font-bold">{r.type === 'import' ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO'} {r.code}</h2>
                <p className="text-sm text-gray-500">{formatTime(r.createdAt)} · {reasons[r.type][r.reason] ?? r.reason}{r.createdBy ? ` · Lập bởi ${r.createdBy}` : ''}</p>
              </div>
              <div className="flex gap-1 print:hidden">
                <button onClick={() => window.print()} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-gray-100" aria-label="In phiếu"><Printer size={18} /></button>
                <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-gray-100" aria-label="Đóng"><X size={18} /></button>
              </div>
            </div>
            {(r.partner || r.orderCode) && <p className="mt-3 text-sm">{r.type === 'import' ? 'Nhà cung cấp' : 'Đối tượng'}: <b>{r.partner || '—'}</b>{r.orderCode && <> · Đơn <Link to={`/admin/don-hang/${r.orderCode}`} className="font-semibold text-primary">{r.orderCode}</Link></>}</p>}
            <table className="mt-4 w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-gray-500">
                <tr><th className="py-2">Sản phẩm</th><th className="py-2 text-right">SL</th><th className="py-2 text-right">Đơn giá</th><th className="py-2 text-right">Thành tiền</th><th className="py-2 text-right">Tồn sau</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {r.items!.map((i, k) => (
                  <tr key={k}>
                    <td className="py-2">{i.name}</td>
                    <td className="py-2 text-right">{formatQty(i.quantity)} {i.unit}</td>
                    <td className="py-2 text-right">{formatPrice(i.unitCost)}</td>
                    <td className="py-2 text-right font-medium">{formatPrice(i.unitCost * i.quantity)}</td>
                    <td className="py-2 text-right text-gray-500">{i.stockAfter === null ? '—' : formatQty(i.stockAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold"><span>Tổng giá trị</span><span>{formatPrice(r.total)}</span></div>
            {r.note && <p className="mt-2 text-sm text-gray-600">Ghi chú: {r.note}</p>}
          </>
        )}
      </div>
    </div>
  )
}

function ReceiptsTab({ reasons }: { reasons: Reasons }) {
  const [type, setType] = useState<'' | 'import' | 'export'>('')
  const [rows, setRows] = useState<StockReceipt[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => { setRows(null); inventoryApi.receipts(type || undefined).then(setRows) }, [type])

  return (
    <div className="card">
      <div className="flex gap-2 border-b border-border p-4">
        {([['', 'Tất cả'], ['import', 'Phiếu nhập'], ['export', 'Phiếu xuất']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setType(id)} className={`rounded-full border px-3 py-2 text-sm font-medium ${type === id ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:border-primary'}`}>{label}</button>
        ))}
      </div>
      {!rows && <p className="p-6 text-gray-500">Đang tải...</p>}
      {rows?.length === 0 && <p className="p-10 text-center text-gray-500">Chưa có phiếu nào.</p>}
      <ul className="divide-y divide-border">
        {rows?.map(r => (
          <li key={r.code}>
            <button onClick={() => setOpen(r.code)} className="flex w-full flex-wrap items-center gap-3 p-3 text-left hover:bg-gray-50 md:px-4">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${r.type === 'import' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {r.type === 'import' ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{r.code} <span className="font-normal text-gray-500">· {reasons[r.type][r.reason] ?? r.reason}</span></div>
                <div className="truncate text-xs text-gray-500">{formatTime(r.createdAt)} · {r.itemCount} sản phẩm{r.partner ? ` · ${r.partner}` : ''}{r.orderCode ? ` · Đơn ${r.orderCode}` : ''}</div>
              </div>
              <div className="font-bold">{formatPrice(r.total)}</div>
            </button>
          </li>
        ))}
      </ul>
      {open && <ReceiptDetail code={open} reasons={reasons} onClose={() => setOpen(null)} />}
    </div>
  )
}

// ---------- Tạo phiếu ----------

type Line = { productId: number; quantity: string; unitCost: string }

function CreateTab({ reasons, preset, onDone }: { reasons: Reasons; preset: Product | null; onDone: () => void }) {
  const products = useProducts(s => s.products)
  const byId = useProducts(s => s.byId)
  const show = useToast(s => s.show)
  const [type, setType] = useState<'import' | 'export'>('import')
  const [reason, setReason] = useState('nhap_hang')
  const [partner, setPartner] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<Line[]>(preset ? [{ productId: preset.id, quantity: '', unitCost: String(preset.costPrice ?? '') }] : [])
  const [pick, setPick] = useState('')
  const [paid, setPaid] = useState(true)
  const [method, setMethod] = useState<PayMethod>('cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const options = useMemo(() => {
    const q = normalize(pick)
    return q ? products.filter(p => normalize(p.name).includes(q) && !lines.some(l => l.productId === p.id)).slice(0, 6) : []
  }, [pick, products, lines])

  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || byId.get(l.productId)?.costPrice || 0), 0)
  const setLine = (i: number, patch: Partial<Line>) => setLines(ls => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)))

  function switchType(t: 'import' | 'export') {
    setType(t)
    setReason(t === 'import' ? 'nhap_hang' : 'hang_hong')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!lines.length) return setError('Thêm ít nhất 1 sản phẩm')
    if (lines.some(l => !(Number(l.quantity) > 0))) return setError('Nhập số lượng cho tất cả sản phẩm')
    setBusy(true)
    try {
      const r = await inventoryApi.create({
        type, reason, partner, note, paid, method,
        items: lines.map(l => ({ productId: l.productId, quantity: Number(l.quantity), unitCost: type === 'import' && l.unitCost ? Number(l.unitCost) : undefined }))
      })
      show(`Đã tạo ${r.code} · ${formatPrice(r.total)}`)
      // Cập nhật lại tình trạng còn/hết hàng trên web
      useProducts.getState().load()
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const label = 'mb-1.5 block text-sm font-semibold'

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="card space-y-4 p-5 xl:col-span-2">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          {(['import', 'export'] as const).map(t => (
            <button key={t} type="button" onClick={() => switchType(t)} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${type === t ? 'bg-white text-primary shadow-card' : 'text-gray-500'}`}>
              {t === 'import' ? <><ArrowDownToLine size={16} /> Phiếu nhập</> : <><ArrowUpFromLine size={16} /> Phiếu xuất</>}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Lý do</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="input">
              {Object.entries(reasons[type]).filter(([k]) => k !== 'ban_hang').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>{type === 'import' ? 'Nhà cung cấp' : 'Đối tượng / nơi nhận'}</label>
            <input value={partner} onChange={e => setPartner(e.target.value)} className="input" placeholder={type === 'import' ? 'VD: HTX rau Đà Lạt' : 'Không bắt buộc'} />
          </div>
        </div>

        <div>
          <label className={label}>Sản phẩm</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={pick} onChange={e => setPick(e.target.value)} placeholder="Gõ tên sản phẩm để thêm..." className="input pl-9" />
            {options.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lift">
                {options.map(p => (
                  <li key={p.id}>
                    <button type="button" onClick={() => { setLines(ls => [...ls, { productId: p.id, quantity: '', unitCost: String(p.costPrice ?? '') }]); setPick('') }} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                      <span className="flex-1">{p.name}</span>
                      <span className="text-xs text-gray-500">{p.stock === null ? 'chưa theo dõi' : `tồn ${formatQty(p.stock!)} ${p.unit}`}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <ul className="space-y-2">
          {lines.map((l, i) => {
            const p = byId.get(l.productId)!
            return (
              <li key={l.productId} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-2">
                <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-[120px] flex-1">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-500">Tồn hiện tại: {p.stock === null ? 'chưa theo dõi' : `${formatQty(p.stock!)} ${p.unit}`}</div>
                </div>
                <label className="flex items-center gap-1 text-xs text-gray-500">SL
                  <input value={l.quantity} onChange={e => setLine(i, { quantity: e.target.value.replace(/[^\d.]/g, '') })} inputMode="decimal" className="input w-20 py-2" placeholder={p.unit} />
                </label>
                {type === 'import' && (
                  <label className="flex items-center gap-1 text-xs text-gray-500">Giá nhập
                    <input value={l.unitCost} onChange={e => setLine(i, { unitCost: e.target.value.replace(/\D/g, '') })} inputMode="numeric" className="input w-28 py-2" placeholder="đ/đơn vị" />
                  </label>
                )}
                <button type="button" onClick={() => setLines(ls => ls.filter((_, k) => k !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Bỏ"><Trash2 size={16} /></button>
              </li>
            )
          })}
          {!lines.length && <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-gray-500">Chưa có sản phẩm nào trong phiếu</li>}
        </ul>

        <div>
          <label className={label}>Ghi chú</label>
          <input value={note} onChange={e => setNote(e.target.value)} className="input" placeholder={type === 'export' ? 'VD: rau dập, hết hạn' : 'Không bắt buộc'} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3 p-5">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Số sản phẩm</span><span>{lines.length}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Tổng giá trị</span><span className="text-primary">{formatPrice(total)}</span></div>
          {type === 'import' && reason === 'nhap_hang' && (
            <div className="space-y-2 border-t border-border pt-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} className="h-4 w-4 accent-primary" />
                <Wallet size={16} className="text-gray-500" /> Đã trả tiền nhà cung cấp (ghi vào sổ chi)
              </label>
              {paid && (
                <select value={method} onChange={e => setMethod(e.target.value as PayMethod)} className="input">
                  <option value="cash">Tiền mặt</option><option value="bank">Chuyển khoản</option><option value="momo">MoMo</option>
                </select>
              )}
            </div>
          )}
          {type === 'export' && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Phiếu xuất bán hàng được tạo tự động khi bạn bấm "Bắt đầu giao hàng" trong đơn. Phiếu này dùng cho hàng hỏng, trả nhà cung cấp, kiểm kê...</p>}
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Đang lưu...' : `Tạo ${type === 'import' ? 'phiếu nhập' : 'phiếu xuất'}`}</button>
        </div>
      </div>
    </form>
  )
}

// ---------- Trang ----------

export default function AdminInventoryPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'ton-kho'
  const [data, setData] = useState<StockOverview | null>(null)
  const [reasons, setReasons] = useState<Reasons | null>(null)
  const [preset, setPreset] = useState<Product | null>(null)
  const [error, setError] = useState('')

  const load = () => inventoryApi.stock().then(setData).catch(err => setError(errorMessage(err)))
  useEffect(() => { load(); inventoryApi.reasons().then(setReasons) }, [])

  const go = (t: Tab) => setParams({ tab: t })
  if (error) return <p className="text-red-600">{error}</p>
  if (!data || !reasons) return <p className="text-gray-500">Đang tải...</p>

  const s = data.summary
  const cards = [
    { label: 'Đang theo dõi tồn', value: `${s.tracked} SP`, icon: Boxes, tone: 'text-text' },
    { label: `Sắp hết (≤${data.lowStock})`, value: s.low, icon: AlertTriangle, tone: 'text-amber-600' },
    { label: 'Hết hàng', value: s.outOfStock, icon: PackageX, tone: 'text-red-600' },
    { label: 'Giá trị tồn (giá vốn)', value: formatPrice(s.value), icon: Wallet, tone: 'text-primary' }
  ]
  const tabs: [Tab, string][] = [['ton-kho', 'Tồn kho'], ['phieu', 'Phiếu nhập / xuất'], ['tao', 'Tạo phiếu']]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kho hàng</h1>
          <p className="text-sm text-gray-500">Nhập hàng, xuất hủy, theo dõi tồn. Giao đơn sẽ tự trừ kho; hết tồn web tự báo hết hàng.</p>
        </div>
        <button onClick={() => { setPreset(null); go('tao') }} className="btn-primary"><Plus size={18} /> Tạo phiếu</button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500"><Icon size={14} /> {label}</div>
            <div className={`mt-1 text-xl font-extrabold md:text-2xl ${tone}`}>{value}</div>
          </div>
        ))}
      </div>
      {s.untracked > 0 && <p className="mt-3 text-xs text-gray-500">{s.untracked} sản phẩm chưa theo dõi tồn kho (bán không giới hạn). Tạo phiếu nhập đầu tiên để bắt đầu theo dõi.</p>}

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => go(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 shadow-card hover:text-text'}`}>{label}</button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'ton-kho' && <StockTab data={data} onImport={p => { setPreset(p); go('tao') }} />}
        {tab === 'phieu' && <ReceiptsTab reasons={reasons} />}
        {tab === 'tao' && <CreateTab key={preset?.id ?? 'new'} reasons={reasons} preset={preset} onDone={() => { load(); setPreset(null); go('phieu') }} />}
      </div>
    </div>
  )
}
