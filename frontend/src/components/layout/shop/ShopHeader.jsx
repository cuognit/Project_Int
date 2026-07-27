import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useState } from 'react';
import NotificationBell from '../../notifications/NotificationBell.jsx';

export default function ShopHeader() {
  const { user, isAuthenticated, isAdmin, logout, cartCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] text-white shadow-md select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand - Shopee Orange Theme */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-10 w-10 bg-white text-[#ee4d2d] rounded-2xl flex items-center justify-center font-black text-2xl shadow-md group-hover:scale-105 transition-all duration-200">
              S
            </div>
            <div>
              <span className="block text-xl font-black tracking-tight leading-none text-white drop-shadow-xs">
                ShopeeMart
              </span>
              <span className="block text-[10px] font-bold text-orange-100 uppercase tracking-widest mt-0.5">
                Cửa hàng Giá Tốt
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive('/')
                  ? 'bg-white/20 text-white shadow-2xs'
                  : 'text-orange-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              Trang chủ
            </Link>

            <Link
              to="/products"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive('/products')
                  ? 'bg-white/20 text-white shadow-2xs'
                  : 'text-orange-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              Sản phẩm
            </Link>

            <Link
              to="/policies"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive('/policies')
                  ? 'bg-white/20 text-white shadow-2xs'
                  : 'text-orange-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              Chính sách
            </Link>

            <Link
              to="/about"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive('/about')
                  ? 'bg-white/20 text-white shadow-2xs'
                  : 'text-orange-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              Về chúng tôi
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-orders"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/my-orders')
                    ? 'bg-white/20 text-white shadow-2xs'
                    : 'text-orange-50 hover:bg-white/10 hover:text-white'
                }`}
              >
                Đơn hàng của tôi
              </Link>
            )}

           
          </nav>

          {/* Right Actions: Notifications, Cart & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {isAuthenticated && <NotificationBell variant="shop" />}

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 text-white hover:bg-white/15 rounded-2xl transition-all"
              title="Giỏ hàng"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-yellow-400 text-orange-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Button or User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center gap-2.5 p-1.5 pr-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="h-8 w-8 rounded-xl bg-white text-[#ee4d2d] font-black text-sm flex items-center justify-center shadow-xs">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                      {user.fullName}
                    </span>
                    <span className="block text-[9px] font-semibold text-orange-200 uppercase tracking-wider">
                      {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                    </span>
                  </div>
                  <svg className="h-4 w-4 text-orange-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-150 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 bg-orange-50/50">
                      <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#ee4d2d] transition-colors"
                    >
                      <svg className="h-4 w-4 text-[#ee4d2d]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Hồ sơ cá nhân
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#ee4d2d] transition-colors"
                    >
                      <svg className="h-4 w-4 text-[#ee4d2d]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Đơn hàng của tôi
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Trang Quản trị Admin
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all shadow-2xs border border-white/20"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-white text-[#ee4d2d] hover:bg-orange-50 rounded-xl text-xs font-extrabold transition-all shadow-md"
                >
                  Đăng ký
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
