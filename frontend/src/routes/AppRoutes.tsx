import React from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from '../layouts/Layout'
import HomePage from '../pages/HomePage'
import ProductListPage from '../pages/ProductListPage'
import ProductDetailPage from '../pages/ProductDetailPage'
import CartPage from '../pages/CartPage'
import LoginPage from '../pages/LoginPage'
import AccountPage from '../pages/AccountPage'
import MarketPage from '../pages/MarketPage'
import OrdersPage from '../pages/OrdersPage'
import OrderDetailPage from '../pages/OrderDetailPage'
import AdminOrdersPage from '../pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage'
import NotFoundPage from '../pages/NotFoundPage'
import RequireAdmin from '../components/admin/RequireAdmin'
import AdminLayout from '../pages/admin/AdminLayout'
import AdminProductsPage from '../pages/admin/AdminProductsPage'
import AdminProductFormPage from '../pages/admin/AdminProductFormPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminPaymentPage from '../pages/admin/AdminPaymentPage'
import AdminInventoryPage from '../pages/admin/AdminInventoryPage'
import AdminCashbookPage from '../pages/admin/AdminCashbookPage'
import AdminCustomersPage from '../pages/admin/AdminCustomersPage'
import AdminCouponsPage from '../pages/admin/AdminCouponsPage'
import InvoicePage from '../pages/InvoicePage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Trang đăng nhập riêng, không có header/footer của cửa hàng */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dang-nhap" element={<Navigate to="/login" replace />} />
      {/* Hóa đơn: trang trắng để in, không header/footer */}
      <Route path="/hoa-don/:code" element={<InvoicePage />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="di-cho" element={<MarketPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="don-hang" element={<OrdersPage />} />
        <Route path="don-hang/:code" element={<OrderDetailPage />} />
        <Route path="tai-khoan" element={<AccountPage />} />
        <Route path="membership" element={<Navigate to="/tai-khoan?tab=thanh-vien" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminProductsPage />} />
        <Route path="don-hang" element={<AdminOrdersPage />} />
        <Route path="don-hang/:code" element={<AdminOrderDetailPage />} />
        <Route path="san-pham/moi" element={<AdminProductFormPage />} />
        <Route path="san-pham/:id" element={<AdminProductFormPage />} />
        <Route path="nguoi-dung" element={<AdminUsersPage />} />
        <Route path="thanh-toan" element={<AdminPaymentPage />} />
        <Route path="kho" element={<AdminInventoryPage />} />
        <Route path="thu-chi" element={<AdminCashbookPage />} />
        <Route path="khach-hang" element={<AdminCustomersPage />} />
        <Route path="khuyen-mai" element={<AdminCouponsPage />} />
      </Route>
    </Routes>
  )
}
