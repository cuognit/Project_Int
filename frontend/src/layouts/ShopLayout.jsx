import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import ShopHeader from '../components/layout/shop/ShopHeader.jsx';
import ShopFooter from '../components/layout/shop/ShopFooter.jsx';
import SidePromotionBanners from '../components/shop/SidePromotionBanners.jsx';

export default function ShopLayout() {
  useEffect(() => {
    document.title = 'Shopee Mart | Phụ kiện điện tử';
  }, []);

  return (
    <div className="app-soft-background min-h-screen flex flex-col font-sans">
      <ShopHeader />
      <SidePromotionBanners />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <ShopFooter />
    </div>
  );
}
