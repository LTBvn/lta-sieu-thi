import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, ChefHat, Clock, ListChecks, Plus, ShoppingCart, Users } from 'lucide-react'
import recipes from '../data/recipes'
import { isAvailable, useProducts } from '../store/useProducts'
import categories from '../data/categories'
import { cartSubtotal, useCart } from '../store/useCart'
import { useToast } from '../store/useToast'
import { useAddToCart } from '../hooks/useAddToCart'
import DeliveryPicker from '../components/cart/DeliveryPicker'
import QuantitySelector from '../components/ui/QuantitySelector'
import { CategoryId, Product, Recipe } from '../types'
import { formatPrice, formatQty, normalize, roundQty } from '../utils/format'

const LIST_KEY = 'lta-shopping-list'

function readList() {
  try {
    return localStorage.getItem(LIST_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Tìm sản phẩm khớp với một dòng trong danh sách đi chợ */
function matchLine(line: string, products: Product[]): Product | undefined {
  const words = normalize(line).split(/[^a-z0-9]+/).filter(Boolean)
  if (!words.length) return undefined
  let best: Product | undefined
  let bestScore = 0
  for (const p of products) {
    const nameWords = normalize(p.name).split(/[^a-z0-9]+/)
    const score = words.filter(w => nameWords.includes(w)).length
    if (score > bestScore || (score === bestScore && best && p.sold > best.sold)) {
      best = p
      bestScore = score
    }
  }
  return bestScore >= Math.max(1, Math.ceil(words.length / 2)) ? best : undefined
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [servings, setServings] = useState(recipe.servings)
  const add = useCart(s => s.add)
  const show = useToast(s => s.show)
  const byId = useProducts(s => s.byId)
  const ratio = servings / recipe.servings
  const ingredients = recipe.ingredients.map(i => ({ ...i, product: byId.get(i.productId) }))
  const lines = ingredients
    .filter((i): i is typeof i & { product: Product } => !!i.product && isAvailable(i.product))
    .map(({ product: p, quantity: base, note }) => {
      const step = p.step ?? 1
      // Làm tròn theo bước bán của sản phẩm (0,5kg hoặc 1 đơn vị)
      const quantity = Math.max(step, roundQty(Math.ceil((base * ratio) / step) * step))
      return { product: p, quantity, note }
    })
  // Nguyên liệu đã hết hàng hoặc bị admin xóa: báo cho khách tự chuẩn bị
  const missing = ingredients.filter(i => !i.product || !isAvailable(i.product)).map(i => i.product?.name ?? 'một nguyên liệu')
  const total = lines.reduce((s, l) => s + l.product.price * l.quantity, 0)

  function addAll() {
    lines.forEach(l => add(l.product, l.quantity))
    show(`Đã thêm nguyên liệu ${recipe.name} cho ${servings} người`, recipe.image)
  }

  return (
    <article id={recipe.id} className="card flex scroll-mt-40 flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={recipe.image} alt={recipe.name} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold"><Clock size={12} /> {recipe.time}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold">{recipe.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{recipe.description}</p>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="flex items-center gap-1 text-gray-600"><Users size={16} /> Khẩu phần</span>
          <QuantitySelector size="sm" value={servings} min={1} onChange={setServings} />
        </div>

        <ul className="mt-3 space-y-2 text-sm">
          {lines.map(l => (
            <li key={l.product.id} className="flex items-center gap-2">
              <img src={l.product.image} alt="" className="h-8 w-8 rounded-md object-cover" />
              <span className="flex-1">{l.product.name} <span className="text-gray-400">× {formatQty(l.quantity)} {l.product.unit}</span></span>
              <span className="font-medium">{formatPrice(l.product.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        {missing.length > 0 && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Tạm hết: {missing.join(', ')}</p>}

        <div className="mt-auto pt-4">
          <button onClick={addAll} disabled={!lines.length} className="btn-primary w-full">
            <ShoppingCart size={18} /> Mua đủ nguyên liệu · {formatPrice(total)}
          </button>
        </div>
      </div>
    </article>
  )
}

function ShoppingList() {
  const [text, setText] = useState(readList)
  const addToCart = useAddToCart()
  const add = useCart(s => s.add)
  const show = useToast(s => s.show)

  useEffect(() => {
    try {
      localStorage.setItem(LIST_KEY, text)
    } catch {
      /* trình duyệt chặn lưu trữ: bỏ qua */
    }
  }, [text])

  const products = useProducts(s => s.products)
  const lines = text.split(/\n|,/).map(l => l.trim()).filter(Boolean)
  const results = lines.map(line => ({ line, product: matchLine(line, products) }))
  const found = results.filter(r => r.product && isAvailable(r.product))

  function addFound() {
    found.forEach(r => add(r.product!, r.product!.step ?? 1))
    show(`Đã thêm ${found.length} món từ danh sách đi chợ`)
  }

  return (
    <div className="card p-4 md:p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold"><ListChecks className="text-primary" /> Danh sách đi chợ</h2>
      <p className="mt-1 text-sm text-gray-500">Gõ như ghi giấy đi chợ, mỗi dòng một món (hoặc cách nhau bằng dấu phẩy). Gõ không dấu cũng được.</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={5}
        placeholder={'ca chua\nthịt ba chỉ\ntrứng gà\nrau cải, tỏi'}
        className="input mt-3 font-mono"
      />

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map(({ line, product }, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg border border-border p-2 text-sm">
              {product ? (
                <>
                  <img src={product.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-gray-500">"{line}" · {formatPrice(product.price)}/{product.unit}</div>
                  </div>
                  {isAvailable(product) ? (
                    <button onClick={() => addToCart(product)} className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white hover:bg-primary-dark" aria-label={`Thêm ${product.name}`}><Plus size={16} /></button>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">Hết hàng</span>
                  )}
                </>
              ) : (
                <div className="flex-1 px-1 text-gray-500">"{line}": chưa có sản phẩm phù hợp</div>
              )}
            </div>
          ))}
          {found.length > 1 && <button onClick={addFound} className="btn-primary w-full">Thêm cả {found.length} món vào giỏ</button>}
        </div>
      )}
    </div>
  )
}

function StallRow({ product }: { product: Product }) {
  const inCart = useCart(s => s.items.find(i => i.id === product.id))
  const updateQty = useCart(s => s.updateQty)
  const addToCart = useAddToCart()
  const quick = product.step ? [0.5, 1, 2] : [1, 2, 5]

  return (
    <div className="flex items-center gap-3 p-3">
      <Link to={`/product/${product.id}`} className="shrink-0"><img src={product.image} alt={product.name} loading="lazy" className={`h-16 w-16 rounded-lg object-cover ${isAvailable(product) ? '' : 'opacity-50 grayscale'}`} /></Link>
      <div className="min-w-0 flex-1">
        <Link to={`/product/${product.id}`} className="block truncate font-semibold hover:text-primary">{product.name}</Link>
        <div className="text-sm"><b className="text-primary">{formatPrice(product.price)}</b> <span className="text-gray-500">/{product.unit}</span></div>
        {!isAvailable(product) && <span className="mt-1 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">Tạm hết hàng</span>}
        {!inCart && isAvailable(product) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {quick.map(q => (
              <button key={q} onClick={() => addToCart(product, q)} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">
                + {formatQty(q)} {product.step ? 'kg' : ''}
              </button>
            ))}
          </div>
        )}
      </div>
      {inCart && <QuantitySelector size="sm" value={inCart.quantity} step={product.step ?? 1} allowZero onChange={q => updateQty(product.id, q)} />}
    </div>
  )
}

export default function MarketPage() {
  const [stall, setStall] = useState<CategoryId>('rau-cu')
  const items = useCart(s => s.items)
  const deliveryDate = useCart(s => s.deliveryDate)
  const deliverySlot = useCart(s => s.deliverySlot)
  const subtotal = cartSubtotal(items)
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  const products = useProducts(s => s.products)
  const stallProducts = useMemo(() => products.filter(p => p.category === stall), [products, stall])

  return (
    <div className="pb-20 lg:pb-8">
      <section className="relative overflow-hidden">
        <img src="/images/banners/sap-rau.jpg" alt="Sạp rau củ ở chợ" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/95 via-primary/80 to-primary/30" />
        <div className="container relative mx-auto py-12 text-white md:py-16">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">🧺 ĐI CHỢ ONLINE</span>
          <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight md:text-5xl">Tươi như chợ sáng,<br />tiện như siêu thị</h1>
          <p className="mt-3 max-w-lg text-white/90">Chọn món theo mâm cơm, ghi danh sách như đi chợ thật, hoặc dạo từng quầy. Nhân viên LTA chọn hàng tươi và giao đúng khung giờ bạn hẹn.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <a href="#mon-ngon" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-primary"><ChefHat size={16} /> Hôm nay ăn gì?</a>
            <a href="#danh-sach" className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-semibold backdrop-blur hover:bg-white/25"><ListChecks size={16} /> Danh sách đi chợ</a>
            <a href="#quay-hang" className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-semibold backdrop-blur hover:bg-white/25">Dạo các quầy</a>
          </div>
        </div>
      </section>

      <div className="container mx-auto mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          <section id="mon-ngon" className="scroll-mt-40">
            <h2 className="section-title flex items-center gap-2"><ChefHat className="text-accent" /> Hôm nay ăn gì?</h2>
            <p className="mt-1 text-sm text-gray-500">Chọn món, chỉnh số người ăn, một chạm thêm đủ nguyên liệu vào giỏ.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          </section>

          <section id="danh-sach" className="scroll-mt-40">
            <ShoppingList />
          </section>

          <section id="quay-hang" className="scroll-mt-40">
            <h2 className="section-title">Dạo quanh các quầy</h2>
            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map(c => (
                <button key={c.id} onClick={() => setStall(c.id)} className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-sm font-medium transition ${stall === c.id ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:border-primary'}`}>
                  <img src={c.image} alt="" className="h-7 w-7 rounded-full object-cover" /> {c.short}
                </button>
              ))}
            </div>
            <div className="card mt-4 grid divide-y divide-border md:grid-cols-2 md:divide-y-0">
              {stallProducts.map(p => <div key={p.id} className="md:border-b md:border-border md:odd:border-r"><StallRow product={p} /></div>)}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-44 space-y-4">
            <div className="card p-4">
              <h3 className="flex items-center gap-2 font-bold"><CalendarDays size={18} className="text-primary" /> Hẹn giờ giao</h3>
              <div className="mt-3"><DeliveryPicker /></div>
            </div>

            <div className="card p-4">
              <h3 className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-2"><ShoppingCart size={18} className="text-primary" /> Giỏ đi chợ</span>
                <span className="text-sm font-normal text-gray-500">{items.length} món</span>
              </h3>
              {items.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">Chưa có món nào. Chọn một mâm cơm hoặc thêm từ các quầy nhé.</p>
              ) : (
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
                  {items.map(i => (
                    <li key={i.id} className="flex items-center gap-2">
                      <img src={i.image} alt="" className="h-8 w-8 rounded-md object-cover" />
                      <span className="flex-1 truncate">{i.name}</span>
                      <span className="text-gray-500">{formatQty(i.quantity)} {i.step ? 'kg' : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-between border-t border-border pt-3 font-bold">
                <span>Tạm tính</span><span className="text-primary">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Giao {deliveryDate === 'today' ? 'hôm nay' : 'ngày mai'}, {deliverySlot}</p>
              <Link to="/cart" className={`btn-primary mt-3 w-full ${items.length ? '' : 'pointer-events-none opacity-50'}`}>Thanh toán</Link>
            </div>
          </div>
        </aside>
      </div>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-white px-3 py-2.5 shadow-lift lg:hidden">
          <div className="container mx-auto flex items-center gap-3">
            <div className="flex-1 text-sm">
              <div className="font-bold text-primary">{formatPrice(subtotal)}</div>
              <div className="text-xs text-gray-500">{items.length} món · Giao {deliveryDate === 'today' ? 'hôm nay' : 'ngày mai'}, {deliverySlot}</div>
            </div>
            <Link to="/cart" className="btn-primary">Thanh toán</Link>
          </div>
        </div>
      )}
    </div>
  )
}
