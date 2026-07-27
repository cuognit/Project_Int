import { Outlet } from 'react-router-dom';
import ShopHeader from '../components/layout/shop/ShopHeader.jsx';
import ShopFooter from '../components/layout/shop/ShopFooter.jsx';

export default function ShopLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <ShopHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <ShopFooter />
    </div>
  );
}
