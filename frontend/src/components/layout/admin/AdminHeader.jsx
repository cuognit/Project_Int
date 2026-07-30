import { useAuth } from '../../../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import NotificationBell from '../../notifications/NotificationBell.jsx';

export default function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between shadow-2xs select-none">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Quản trị Hệ thống</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Bảng điều khiển quản lý đơn hàng, khách hàng và tồn kho sản phẩm
        </p>
      </div>

      <div className="flex items-center gap-4">
        
        <NotificationBell variant="admin" />

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-2xs"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Xem Giao diện Shop
        </Link>

        {/* User profile info */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <span className="block text-xs font-bold text-slate-800">
              {user?.fullName || 'Quản trị viên'}
            </span>
            <span className="block text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
              {user?.role || 'Admin'}
            </span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>

      </div>
    </header>
  );
}
