import React from 'react'
import Hero from '../views/Hero'
import CategorySection from '../views/CategorySection'
import FlashSale from '../views/FlashSale'
import MarketPromo from '../views/MarketPromo'
import ProductRow from '../views/ProductRow'
import AppBanner from '../views/AppBanner'

export default function HomePage() {
  return (
    <div className="pb-4">
      <Hero />
      <CategorySection />
      <FlashSale />
      <MarketPromo />
      <ProductRow category="rau-cu" title="Rau củ tươi hôm nay" />
      <ProductRow category="trai-cay" title="Trái cây theo mùa" />
      <ProductRow category="thit-trung" title="Thịt tươi & trứng" />
      <AppBanner />
    </div>
  )
}
