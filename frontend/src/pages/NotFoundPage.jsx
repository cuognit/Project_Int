import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center select-none">
      <div className="max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-4">
        <div className="h-16 w-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          404
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Trang Không Tồn Tại</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển.
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
