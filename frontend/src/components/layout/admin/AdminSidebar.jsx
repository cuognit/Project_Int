import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-5 flex flex-col justify-between select-none">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 font-black text-lg">
            OH
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 text-base leading-tight">
              OrderHub
            </h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Quản trị Hệ thống
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Tổng quan (Dashboard)
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Khách hàng & Đơn hàng
          </NavLink>

          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Quản lý sản phẩm
          </NavLink>
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <NavLink
          to="/"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại Shop Cửa Hàng
        </NavLink>
      </div>
    </aside>
  );
}
