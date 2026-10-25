import React, { useEffect, useMemo, useState } from 'react'
import { Building2, Info, Smartphone } from 'lucide-react'
import banks, { bankByBin } from '../../data/banks'
import { errorMessage, PaymentSettings, settingsApi } from '../../services/api'
import { useToast } from '../../store/useToast'
import { momoQrUrl, setPaymentCache, vietQrUrl } from '../../utils/vietqr'

const EMPTY: PaymentSettings = {
  bank: { enabled: false, bin: '', accountNo: '', accountName: '' },
  momo: { enabled: false, accountNo: '', accountName: '' }
}

/** Xem trước giống như VietQR sẽ in: viết hoa, bỏ dấu */
const qrName = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase()

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-primary' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

export default function AdminPaymentPage() {
  const show = useToast(s => s.show)
  const [form, setForm] = useState<PaymentSettings | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [bankQuery, setBankQuery] = useState('')

  useEffect(() => {
    settingsApi.getPayment().then(setForm).catch(err => { setLoadError(errorMessage(err)); setForm(EMPTY) })
  }, [])

  const bankOptions = useMemo(() => {
    const q = bankQuery.trim().toLowerCase()
    return q ? banks.filter(b => `${b.shortName} ${b.code} ${b.name}`.toLowerCase().includes(q)) : banks
  }, [bankQuery])

  if (!form) return <p className="text-gray-500">Đang tải...</p>

  const setBank = (patch: Partial<PaymentSettings['bank']>) => setForm({ ...form, bank: { ...form.bank, ...patch } })
  const setMomo = (patch: Partial<PaymentSettings['momo']>) => setForm({ ...form, momo: { ...form.momo, ...patch } })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const saved = await settingsApi.updatePayment(form!)
      setForm(saved)
      setPaymentCache(saved)
      show('Đã lưu cài đặt thanh toán')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const bankReady = form.bank.bin && /^\d{6,19}$/.test(form.bank.accountNo) && form.bank.accountName.trim()
  const momoReady = /^\d{6,19}$/.test(form.momo.accountNo) && form.momo.accountName.trim()
  const label = 'mb-1.5 block text-sm font-semibold'

  return (
    <form onSubmit={save}>
      <h1 className="text-2xl font-bold">Cài đặt thanh toán</h1>
      <p className="text-sm text-gray-500">Tài khoản nhận tiền của shop. Khách chọn chuyển khoản / MoMo sẽ nhận mã QR có sẵn số tiền và mã đơn hàng.</p>

      {loadError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold"><Building2 size={20} className="text-primary" /> Chuyển khoản ngân hàng</h2>
            <Toggle on={form.bank.enabled} onChange={enabled => setBank({ enabled })} />
          </div>

          <div className={`mt-4 space-y-4 ${form.bank.enabled ? '' : 'pointer-events-none opacity-50'}`}>
            <div>
              <label className={label}>Ngân hàng</label>
              <input value={bankQuery} onChange={e => setBankQuery(e.target.value)} placeholder="Gõ để tìm: vietcombank, mb, tcb..." className="input mb-2" />
              <select value={form.bank.bin} onChange={e => setBank({ bin: e.target.value })} className="input" size={5}>
                {bankOptions.map(b => <option key={b.bin} value={b.bin}>{b.shortName} · {b.name}</option>)}
              </select>
              {form.bank.bin && <p className="mt-1 text-xs text-primary">Đã chọn: {bankByBin.get(form.bank.bin)?.shortName}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Số tài khoản</label>
                <input value={form.bank.accountNo} onChange={e => setBank({ accountNo: e.target.value.replace(/\D/g, '') })} inputMode="numeric" className="input" placeholder="0123456789" />
              </div>
              <div>
                <label className={label}>Tên chủ tài khoản</label>
                <input value={form.bank.accountName} onChange={e => setBank({ accountName: e.target.value })} className="input" placeholder="NGUYEN VAN A" />
                {form.bank.accountName && <p className="mt-1 text-xs text-gray-500">Hiển thị: {qrName(form.bank.accountName)}</p>}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase text-gray-400">Mã QR mẫu · đơn 125.000đ</div>
            {form.bank.enabled && bankReady ? (
              <img src={vietQrUrl({ ...form.bank, accountName: qrName(form.bank.accountName), amount: 125000, addInfo: 'LTA123456' })} alt="QR mẫu" className="mx-auto mt-3 w-56" />
            ) : (
              <p className="py-10 text-sm text-gray-400">Bật và điền đủ thông tin để xem mã QR</p>
            )}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold"><Smartphone size={20} className="text-[#A50064]" /> Ví MoMo</h2>
            <Toggle on={form.momo.enabled} onChange={enabled => setMomo({ enabled })} />
          </div>

          <div className={`mt-4 space-y-4 ${form.momo.enabled ? '' : 'pointer-events-none opacity-50'}`}>
            <div className="flex gap-2 rounded-lg bg-pink-50 p-3 text-xs text-pink-900">
              <Info size={16} className="shrink-0" />
              <span>Trong app MoMo, vào phần <b>Nhận tiền</b> và tìm số tài khoản dùng để nhận chuyển khoản từ ngân hàng (VietQR). Sau khi lưu, hãy quét mã mẫu bên dưới và <b>chuyển thử 1.000đ</b> để chắc chắn tiền về đúng ví.</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Số tài khoản MoMo</label>
                <input value={form.momo.accountNo} onChange={e => setMomo({ accountNo: e.target.value.replace(/\D/g, '') })} inputMode="numeric" className="input" placeholder="99MM..." />
              </div>
              <div>
                <label className={label}>Tên chủ ví</label>
                <input value={form.momo.accountName} onChange={e => setMomo({ accountName: e.target.value })} className="input" placeholder="NGUYEN VAN A" />
                {form.momo.accountName && <p className="mt-1 text-xs text-gray-500">Hiển thị: {qrName(form.momo.accountName)}</p>}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-xs font-semibold uppercase text-gray-400">Mã QR mẫu · đơn 125.000đ</div>
            {form.momo.enabled && momoReady ? (
              <img src={momoQrUrl({ ...form.momo, accountName: qrName(form.momo.accountName) }, 125000, 'LTA123456')} alt="QR MoMo mẫu" className="mx-auto mt-3 w-56" />
            ) : (
              <p className="py-10 text-sm text-gray-400">Bật và điền đủ thông tin để xem mã QR</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button disabled={saving} className="btn-primary px-8">{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <p className="mt-4 max-w-2xl text-xs text-gray-500">
        Lưu ý: web chưa tự xác nhận được tiền đã về. Khách chuyển khoản với nội dung là mã đơn (VD: LTA123456), bạn đối chiếu trong app ngân hàng / MoMo.
        Muốn tự động xác nhận cần đăng ký cổng thanh toán (PayOS, Casso, MoMo Business...).
      </p>
    </form>
  )
}
