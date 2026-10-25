import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/ui/Header'
import Footer from '../components/ui/Footer'
import Toaster from '../components/ui/Toaster'
import MobileTabBar from '../components/ui/MobileTabBar'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    // pb-16: chừa chỗ cho thanh điều hướng dưới đáy trên điện thoại
    <div className="flex min-h-screen flex-col bg-bg pb-16 lg:pb-0">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <Toaster />
    </div>
  )
}
