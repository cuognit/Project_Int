import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/productApi.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ScrollReveal from '../../components/common/ScrollReveal.jsx';

export default function ShopHomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedToast, setAddedToast] = useState(null);
  const [actionError, setActionError] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribedToast, setSubscribedToast] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Live Flash Sale Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  const { addToCart, isAuthenticated, cartError, cartLoading } = useAuth();

  // Handle Back to Top button visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Flash Sale Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts({ page: 1, limit: 8 })
      .then((data) => {
        if (data && data.items) {
          setFeaturedProducts(data.items);
        } else if (Array.isArray(data)) {
          setFeaturedProducts(data.slice(0, 8));
        } else {
          setFeaturedProducts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setActionError('');
    try {
      await addToCart(product, 1);
      setAddedToast(product.name);
      setTimeout(() => setAddedToast(null), 2500);
    } catch (error) {
      setActionError(error?.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!subscriberEmail.trim()) return;
    setSubscribedToast(true);
    setSubscriberEmail('');
    setTimeout(() => setSubscribedToast(false), 3000);
  };

  const marqueeText = "⚡ FLASH SALE SỐC HÔM NAY: GIẢM GIÁ 50% TOÀN BỘ MẶT HÀNG • FREESHIP XTRA 0Đ TOÀN QUỐC • HOÀN TIỀN 111% XU SHOPEE • ĐỔI TRẢ 7 NGÀY MIỄN PHÍ • BẢO HÀNH CHÍNH HÃNG 100% • ";

  return (
    <div className="space-y-12 select-none relative">
      
      {/* Toast Notifications */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700">
          <div className="h-7 w-7 bg-[#ee4d2d] text-white rounded-full flex items-center justify-center text-xs font-black">
            ✓
          </div>
          <span className="text-xs font-bold">Đã thêm "{addedToast}" vào giỏ hàng!</span>
        </div>
      )}
      {subscribedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="h-7 w-7 bg-white text-emerald-700 rounded-full flex items-center justify-center text-xs font-black">
            ✓
          </div>
          <span className="text-xs font-bold">Cảm ơn bạn! Mã giảm giá 50K đã được gửi vào email.</span>
        </div>
      )}
      {(actionError || cartError) && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-rose-600 px-5 py-3.5 text-xs font-bold text-white shadow-2xl">
          {actionError || cartError}
        </div>
      )}

      {/* Floating Back-to-Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 p-3.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer border border-orange-300 animate-fade-in"
          title="Lên đầu trang"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* ANIMATION 1: Continuous Marquee Announcement Bar */}
      <div className="overflow-hidden bg-gradient-to-r from-orange-950 via-[#ee4d2d] to-orange-950 text-white py-2 rounded-2xl shadow-md border border-orange-400/30">
        <div className="animate-marquee whitespace-nowrap text-xs font-black tracking-wider uppercase flex">
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </div>
      </div>

      {/* BLOCK 1: Dynamic Outstanding Shopee Hero Banner */}
      <div className="relative bg-gradient-to-br from-[#ee4d2d] via-[#f53d2d] to-[#ff6026] rounded-3xl p-8 sm:p-12 text-white overflow-hidden shadow-2xl border border-orange-400/30">
        
        {/* Animated Light Glare Sweep */}
        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine pointer-events-none z-1"></div>

        {/* Orbiting Ambient Background Orbs */}
        <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] bg-yellow-400/20 rounded-full blur-3xl animate-spin-slow pointer-events-none"></div>
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-yellow-400 text-orange-950 rounded-full text-xs font-black uppercase tracking-wider shadow-md animate-pulse">
                <span>🔥 FLASH SALE GIỜ VÀNG</span>
              </div>
              
              {/* Live Countdown Timer */}
              <div className="flex items-center gap-1.5 text-xs font-extrabold bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-inner">
                <span className="text-yellow-300">Kết thúc sau:</span>
                <span className="bg-white text-orange-950 px-2 py-0.5 rounded-md font-black text-xs shadow-xs">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-white text-orange-950 px-2 py-0.5 rounded-md font-black text-xs shadow-xs">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-[#ee4d2d] text-white px-2 py-0.5 rounded-md font-black text-xs animate-pulse shadow-xs">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
              ShopeeMart <br className="hidden sm:inline" />
              <span className="text-yellow-300 drop-shadow-sm">Siêu Siêu Rẻ</span> Mới Mỗi Ngày
            </h1>

            <p className="text-xs sm:text-sm text-orange-100 leading-relaxed font-medium max-w-lg">
              Hàng triệu sản phẩm chính hãng 100%, voucher Freeship 0Đ toàn quốc, bảo hành 1 đổi 1 & hoàn tiền 111% nếu phát hiện hàng giả.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
              <Link
                to="/products"
                className="px-6 py-3.5 bg-white text-[#ee4d2d] hover:bg-orange-50 font-black rounded-2xl shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 group"
              >
                <span>⚡ KHÁM PHÁ SẢN PHẨM</span>
                <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
              </Link>

              <span className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-yellow-200">
                🚚 Vận chuyển 0Đ Xtra
              </span>
            </div>

          </div>

          {/* Right Floating 3D Graphic Cards Column */}
          <div className="lg:col-span-5 relative min-h-[220px] hidden sm:flex items-center justify-center">
            
            {/* Card 1: Floating Discount Badge */}
            <div className="animate-float absolute -top-10 right-4 bg-white/20 backdrop-blur-xl border border-white/30 p-4 rounded-3xl shadow-2xl space-y-1 text-white max-w-[200px] hover:scale-105 transition-all cursor-pointer">
              <span className="block text-[10px] font-black text-yellow-300 uppercase tracking-widest">
                ƯU ĐÃI KHỦNG
              </span>
              <span className="block text-2xl font-black text-white">GIẢM 50%</span>
              <span className="block text-[10px] text-orange-100">Áp dụng cho mọi sản phẩm hôm nay</span>
            </div>

            {/* Card 2: Floating Cashback Badge */}
            <div className="animate-float-delayed absolute bottom-2 left-6 bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 p-4 rounded-3xl shadow-2xl space-y-1 text-white max-w-[220px] hover:scale-105 transition-all cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 bg-emerald-500 rounded-lg flex items-center justify-center text-xs font-black">
                  ✓
                </span>
                <span className="text-xs font-black text-emerald-400">SHOPEE MALL</span>
              </div>
              <span className="block text-xs font-bold text-slate-200 mt-1">Hoàn Tiền 111% Xu</span>
              <span className="block text-[9px] text-slate-400">Cam kết chính hãng 100%</span>
            </div>

            {/* Center Big Floating Shopping Graphic */}
            <div className="h-44 w-44 bg-gradient-to-tr from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-2xl text-6xl shadow-orange-600/50 animate-bounce">
              🛍️
            </div>

          </div>

        </div>

      </div>

      {/* ANIMATION 2: Interactive Category Quick Pills */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Danh Mục Nổi Bật</h3>
          <Link to="/products" className="text-xs font-bold text-[#ee4d2d] hover:underline">Xem thêm →</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: 'Đồ Công Nghệ', icon: '📱', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { name: 'Thời Trang', icon: '👕', color: 'bg-pink-50 text-pink-700 border-pink-100' },
            { name: 'Đồ Gia Dụng', icon: '🏠', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            { name: 'Mỹ Phẩm & Spa', icon: '💄', color: 'bg-purple-50 text-purple-700 border-purple-100' },
            { name: 'Mẹ & Bé', icon: '🍼', color: 'bg-amber-50 text-amber-700 border-amber-100' },
            { name: 'Sách & VPP', icon: '📚', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
          ].map((cat, idx) => (
            <Link
              key={idx}
              to="/products"
              className={`p-3.5 rounded-2xl border ${cat.color} flex flex-col items-center justify-center gap-1.5 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer text-center group`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-bold leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* BLOCK 2: Hot Deals / Bán chạy nhất */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">Sản phẩm Bán chạy</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">Các sản phẩm hot nhất được đông đảo khách hàng tin dùng.</p>
          </div>
          <Link
            to="/products"
            className="group flex items-center gap-1.5 text-xs font-black text-[#ee4d2d] hover:text-orange-700 transition-colors"
          >
            <span>Xem tất cả sản phẩm</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-3xl p-4 h-72 animate-pulse space-y-3">
                <div className="bg-slate-200 h-40 rounded-2xl w-full"></div>
                <div className="bg-slate-200 h-4 rounded-full w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={(index % 4) * 0.08}>
                <Link
                  to={`/products/${product.id}`}
                  className="group bg-white border border-gray-200 rounded-3xl p-3.5 shadow-2xs hover:shadow-xl hover:border-orange-300 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
                >
                  {/* Subtle Top Glare Hover Sweep */}
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shine pointer-events-none z-10"></div>

                  <div className="space-y-3">
                    <div className="relative h-44 w-full bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100">
                      <img
                        src={product.imageUrl || 'https://picsum.photos/300/300'}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#d0011b] text-white text-[9px] font-black rounded-md shadow-xs">
                        Shopee Mall
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        SKU: {product.sku || 'N/A'}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5 group-hover:text-[#ee4d2d] transition-colors leading-tight">
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] text-slate-400 font-semibold uppercase">Giá Siêu Rẻ</span>
                      <span className="text-base font-black text-[#ee4d2d]">
                        {formatCurrency(Number(product.price))}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={cartLoading}
                      className="px-3 py-1.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-60 group-hover:scale-105"
                    >
                      <span>+ Thêm</span>
                    </button>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-50 border border-orange-200 px-8 py-3.5 text-xs font-black text-[#ee4d2d] hover:bg-[#ee4d2d] hover:text-white hover:scale-105 transition-all shadow-xs"
          >
            <span>Khám phá toàn bộ {featuredProducts.length * 5}+ sản phẩm tại Cửa Hàng</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* ANIMATION 3: Customer Reviews & Ratings ⭐⭐⭐⭐⭐ */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center max-w-md mx-auto space-y-1">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] font-black uppercase tracking-wider">
            <span>⭐⭐⭐⭐⭐ 4.9/5 ĐÁNH GIÁ THỰC TẾ</span>
          </div>
          <h2 className="text-xl font-black text-slate-800">Khách Hàng Nói Về ShopeeMart</h2>
          <p className="text-xs text-slate-400">Hàng ngàn phản hồi tích cực từ những người mua sắm thực tế.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              name: 'Nguyễn Thanh Hà',
              role: 'Khách hàng thân thiết',
              comment: 'Giao hàng siêu nhanh! Đặt buổi sáng buổi chiều đã nhận được. Đóng gói sản phẩm cẩn thận xốp bọc nilon 3 lớp.',
              stars: '⭐⭐⭐⭐⭐',
              avatar: 'H',
              color: 'bg-emerald-500',
            },
            {
              name: 'Trần Văn Minh',
              role: 'Người mua đã xác minh',
              comment: 'Giá tốt hơn nhiều so với mua ở ngoài cửa hàng. Sản phẩm chính hãng 100%, kiểm tra tem mác chuẩn.',
              stars: '⭐⭐⭐⭐⭐',
              avatar: 'M',
              color: 'bg-indigo-600',
            },
            {
              name: 'Lê Thu Thảo',
              role: 'VIP Member',
              comment: 'Dịch vụ CSKH quá đỉnh! Mình lỡ đặt nhầm size được hỗ trợ đổi trả trong 1 nốt nhạc không tốn phí.',
              stars: '⭐⭐⭐⭐⭐',
              avatar: 'T',
              color: 'bg-[#ee4d2d]',
            },
          ].map((item, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 hover:scale-105 hover:bg-orange-50/30 hover:border-orange-200 transition-all duration-300 shadow-2xs h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{item.stars}</span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ Đã mua hàng
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic leading-relaxed">"{item.comment}"</p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                  <div className={`h-8 w-8 rounded-xl ${item.color} text-white font-black text-xs flex items-center justify-center shadow-xs`}>
                    {item.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                    <p className="text-[10px] text-slate-400">{item.role}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* BLOCK 3: Why Choose Us (4 Core Commitments) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center max-w-lg mx-auto mb-8">
          <h2 className="text-xl font-black text-slate-800">Tại sao chọn ShopeeMart?</h2>
          <p className="mt-1 text-xs text-slate-400">Trải nghiệm mua sắm trực tuyến tuyệt vời với các đặc quyền vượt trội.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 text-center space-y-2 hover:scale-105 hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-[#ee4d2d] text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
              🚚
            </div>
            <h4 className="text-xs font-black text-slate-800">Miễn phí Vận chuyển 0Đ</h4>
            <p className="text-[11px] text-slate-500 leading-snug">Áp dụng cho mọi đơn hàng từ 0Đ trên toàn quốc.</p>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center space-y-2 hover:scale-105 hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
              🛡️
            </div>
            <h4 className="text-xs font-black text-slate-800">Chính hãng 100%</h4>
            <p className="text-[11px] text-slate-500 leading-snug">Hoàn tiền 111% nếu phát hiện hàng giả, nhái.</p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center space-y-2 hover:scale-105 hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
              🔄
            </div>
            <h4 className="text-xs font-black text-slate-800">Đổi trả 7 ngày</h4>
            <p className="text-[11px] text-slate-500 leading-snug">Miễn phí đổi trả trong 7 ngày nếu không hài lòng.</p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 text-center space-y-2 hover:scale-105 hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-md">
              🎧
            </div>
            <h4 className="text-xs font-black text-slate-800">Hỗ trợ 24/7</h4>
            <p className="text-[11px] text-slate-500 leading-snug">Đội ngũ CSKH hỗ trợ tư vấn tức thì mọi lúc.</p>
          </div>
        </div>
      </section>

      {/* BLOCK 4: Voucher Subscription Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 sm:p-10 text-white border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">🎁 ƯU ĐÃI THÀNH VIÊN MỚI</span>
            <h3 className="text-xl sm:text-2xl font-black mt-1">Đăng ký nhận Voucher giảm ngay 50.000Đ</h3>
            <p className="text-xs text-slate-400 mt-1">Nhận mã giảm giá độc quyền và thông báo Flash Sale sớm nhất.</p>
          </div>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <input
              type="email"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              placeholder="Nhập địa chỉ email của bạn..."
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-[#ee4d2d] min-w-[260px]"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer shadow-md hover:scale-105"
            >
              Nhận voucher 50K
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
