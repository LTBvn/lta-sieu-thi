import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, ImagePlus, Loader2 } from 'lucide-react'
import categories from '../../data/categories'
import { useProducts } from '../../store/useProducts'
import { useToast } from '../../store/useToast'
import { errorMessage, productApi, ProductInput } from '../../services/api'
import ProductCard from '../../components/product/ProductCard'
import { CategoryId, Product } from '../../types'

type FormValues = {
  name: string
  category: CategoryId
  price: string
  oldPrice: string
  unit: string
  byWeight: boolean
  origin: string
  description: string
  image: string
  tags: NonNullable<Product['tags']>
  inStock: boolean
}

const TAGS = [
  { id: 'organic', label: 'Hữu cơ' },
  { id: 'hot', label: 'Bán chạy' },
  { id: 'new', label: 'Hàng mới về' }
] as const

const empty: FormValues = {
  name: '', category: 'rau-cu', price: '', oldPrice: '', unit: 'kg', byWeight: true,
  origin: '', description: '', image: '', tags: [], inStock: true
}

const toForm = (p: Product): FormValues => ({
  name: p.name, category: p.category, price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '',
  unit: p.unit, byWeight: !!p.step, origin: p.origin, description: p.description ?? '', image: p.image,
  tags: (p.tags ?? []).filter(t => t !== 'deal'), inStock: p.inStock !== false
})

export default function AdminProductFormPage() {
  const { id } = useParams()
  const isNew = !id
  const product = useProducts(s => (id ? s.byId.get(Number(id)) : undefined))
  const upsert = useProducts(s => s.upsert)
  const show = useToast(s => s.show)
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: product ? toForm(product) : empty
  })

  // Sửa sản phẩm: điền form khi dữ liệu từ server về (vd: mở thẳng link /admin/san-pham/12)
  useEffect(() => { if (product) reset(toForm(product)) }, [product?.id])

  const v = watch()

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setServerError('')
    try {
      setValue('image', await productApi.uploadImage(file), { shouldValidate: true })
    } catch (err) {
      setServerError(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(f: FormValues) {
    setServerError('')
    const oldPrice = f.oldPrice ? Number(f.oldPrice) : null
    const data: ProductInput = {
      name: f.name.trim(),
      category: f.category,
      price: Number(f.price),
      oldPrice,
      unit: f.unit.trim(),
      step: f.byWeight ? 0.5 : null,
      origin: f.origin.trim(),
      description: f.description.trim(),
      image: f.image,
      // Có giá gốc thì tự gắn nhãn "deal" để lên Flash Sale
      tags: oldPrice ? [...f.tags, 'deal'] : f.tags,
      inStock: f.inStock
    } as ProductInput
    try {
      const saved = isNew ? await productApi.create(data) : await productApi.update(Number(id), data)
      upsert(saved)
      show(isNew ? `Đã thêm ${saved.name}` : `Đã lưu ${saved.name}`, saved.image)
      navigate('/admin')
    } catch (err) {
      setServerError(errorMessage(err))
    }
  }

  if (!isNew && !product) {
    return <div className="py-20 text-center text-gray-500">Không tìm thấy sản phẩm #{id}. <Link to="/admin" className="text-primary">Quay lại</Link></div>
  }

  const preview: Product = {
    id: product?.id ?? 0,
    name: v.name || 'Tên sản phẩm',
    price: Number(v.price) || 0,
    oldPrice: Number(v.oldPrice) || undefined,
    unit: v.unit || 'đơn vị',
    step: v.byWeight ? 0.5 : undefined,
    image: v.image || '/images/banners/sap-rau.jpg',
    category: v.category,
    origin: v.origin || 'Xuất xứ',
    rating: product?.rating ?? 5,
    sold: product?.sold ?? 0,
    tags: v.tags,
    inStock: v.inStock
  }

  const err = (msg?: string) => (msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null)
  const label = 'mb-1.5 block text-sm font-semibold'

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"><ArrowLeft size={16} /> Danh sách sản phẩm</Link>
      <h1 className="mt-2 text-2xl font-bold">{isNew ? 'Thêm sản phẩm mới' : `Sửa: ${product!.name}`}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3" noValidate>
        <div className="space-y-6 xl:col-span-2">
          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Thông tin cơ bản</h2>
            <div>
              <label className={label}>Tên sản phẩm *</label>
              <input {...register('name', { required: 'Vui lòng nhập tên', minLength: { value: 2, message: 'Tên quá ngắn' } })} className="input" placeholder="VD: Cà Chua Đà Lạt" />
              {err(errors.name?.message)}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Danh mục *</label>
                <select {...register('category')} className="input">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Xuất xứ</label>
                <input {...register('origin')} className="input" placeholder="VD: Đà Lạt" />
              </div>
            </div>
            <div>
              <label className={label}>Mô tả</label>
              <textarea {...register('description')} rows={3} className="input" placeholder="Đặc điểm, cách dùng, bảo quản..." />
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Giá & đơn vị</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={label}>Giá bán (đ) *</label>
                <input {...register('price', { required: 'Vui lòng nhập giá', validate: x => Number(x) > 0 || 'Giá phải lớn hơn 0' })} inputMode="numeric" className="input" placeholder="25000" />
                {err(errors.price?.message)}
              </div>
              <div>
                <label className={label}>Giá gốc (đ)</label>
                <input
                  {...register('oldPrice', { validate: x => !x || Number(x) > Number(v.price) || 'Giá gốc phải cao hơn giá bán' })}
                  inputMode="numeric" className="input" placeholder="Để trống nếu không giảm"
                />
                {err(errors.oldPrice?.message)}
              </div>
              <div>
                <label className={label}>Đơn vị tính *</label>
                <input {...register('unit', { required: 'Vui lòng nhập đơn vị' })} className="input" placeholder="kg, bó 500g, hộp..." />
                {err(errors.unit?.message)}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" {...register('byWeight')} className="h-4 w-4 accent-primary" />
              Bán theo cân (khách chọn 0,5kg / 1kg / 1,5kg...)
            </label>
            <p className="text-xs text-gray-500">Có giá gốc thì sản phẩm tự lên khung Flash Sale.</p>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Nhãn & tình trạng</h2>
            <div className="flex flex-wrap gap-4">
              {TAGS.map(t => (
                <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" value={t.id} {...register('tags')} className="h-4 w-4 accent-primary" /> {t.label}
                </label>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3">
              <input type="checkbox" {...register('inStock')} className="h-5 w-5 accent-primary" />
              <span>
                <span className="block text-sm font-semibold">Còn hàng</span>
                <span className="block text-xs text-gray-500">Bỏ chọn để báo hết hàng: sản phẩm vẫn hiện nhưng khách không mua được.</span>
              </span>
            </label>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-bold">Ảnh sản phẩm *</h2>
            <input type="hidden" {...register('image', { required: 'Vui lòng chọn ảnh' })} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-3 grid aspect-square w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-gray-50 text-gray-400 transition hover:border-primary hover:text-primary"
            >
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : v.image ? (
                <img src={v.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm"><ImagePlus size={32} /> Bấm để tải ảnh lên<br />JPG, PNG, WEBP · tối đa 5MB</span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPickFile} className="hidden" />
            {v.image && <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 text-sm font-semibold text-primary hover:underline">Đổi ảnh khác</button>}
            {err(errors.image?.message)}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-500">Xem trước trên web</h2>
            <div className="pointer-events-none mx-auto max-w-[240px]"><ProductCard product={preview} /></div>
          </section>

          {serverError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
          <div className="flex gap-3">
            <Link to="/admin" className="btn-outline flex-1">Hủy</Link>
            <button disabled={isSubmitting || uploading} className="btn-primary flex-1">{isSubmitting ? 'Đang lưu...' : isNew ? 'Thêm sản phẩm' : 'Lưu thay đổi'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}
