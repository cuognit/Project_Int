import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="app-soft-background min-h-screen flex items-center justify-center p-4 text-center select-none">
      <div className="max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-4">
        <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Không Có Quyền Truy Cập (403)</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tài khoản của bạn không có quyền truy cập vào khu vực này. Trang này dành riêng cho quản trị viên.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
          >
            Quay Về Trang Chủ Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
