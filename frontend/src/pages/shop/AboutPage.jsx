import { Link } from 'react-router-dom';
import ScrollReveal from '../../components/common/ScrollReveal.jsx';

export default function AboutPage() {
  return (
    <div className="w-full space-y-10 select-none">
      
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] rounded-3xl p-8 sm:p-12 text-white overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
            🧡 SHOPEEMART VIỆT NAM
          </span>
          <h1 className="text-3xl sm:text-4xl font-black">Về Chúng Tôi</h1>
          <p className="text-xs sm:text-sm text-orange-100 leading-relaxed font-medium">
            ShopeeMart là hệ thống mua sắm trực tuyến hàng đầu, mang đến giải pháp trải nghiệm mua sắm tiện lợi, nhanh chóng, minh bạch và an toàn tuyệt đối cho người dùng Việt Nam.
          </p>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xs">
          <span className="block text-2xl sm:text-3xl font-black text-[#ee4d2d]">1.000.000+</span>
          <span className="block text-xs font-bold text-slate-500 mt-1">Đơn hàng hoàn tất</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xs">
          <span className="block text-2xl sm:text-3xl font-black text-indigo-600">99.8%</span>
          <span className="block text-xs font-bold text-slate-500 mt-1">Khách hàng hài lòng</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xs">
          <span className="block text-2xl sm:text-3xl font-black text-emerald-600">100%</span>
          <span className="block text-xs font-bold text-slate-500 mt-1">Hàng chính hãng</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xs">
          <span className="block text-2xl sm:text-3xl font-black text-amber-500">24/7</span>
          <span className="block text-xs font-bold text-slate-500 mt-1">Hỗ trợ khách hàng</span>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScrollReveal>
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-3 shadow-xs h-full">
            <div className="h-12 w-12 bg-orange-50 text-[#ee4d2d] rounded-2xl flex items-center justify-center text-2xl font-bold">
              🎯
            </div>
            <h3 className="text-lg font-black text-slate-800">Sứ mệnh của chúng tôi</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mang niềm vui mua sắm chất lượng với giá tốt nhất tới từng gia đình Việt Nam. Chúng tôi liên tục tối ưu hóa quy trình từ khâu nhập kho đến khi giao tới tận tay khách hàng để đảm bảo trải nghiệm vượt trội.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-3 shadow-xs h-full">
            <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              🚀
            </div>
            <h3 className="text-lg font-black text-slate-800">Tầm nhìn phát triển</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trở thành thương hiệu thương mại điện tử đáng tin cậy nhất tại Việt Nam. Xây dựng môi trường mua sắm thông minh, an toàn, ứng dụng công nghệ hiện đại phục vụ nhu cầu của cộng đồng.
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Core Values */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        <div className="text-center max-w-md mx-auto space-y-1">
          <h2 className="text-xl font-black text-slate-800">Giá trị cốt lõi</h2>
          <p className="text-xs text-slate-400">Những nguyên tắc vàng kim chỉ nam cho mọi hoạt động tại ShopeeMart.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <div className="text-3xl">💎</div>
            <h4 className="text-xs font-black text-slate-800">Uy tín hàng đầu</h4>
            <p className="text-[11px] text-slate-500">Nói không với hàng giả, cam kết chất lượng sản phẩm chính hãng.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <div className="text-3xl">⚡</div>
            <h4 className="text-xs font-black text-slate-800">Giao hàng thần tốc</h4>
            <p className="text-[11px] text-slate-500">Tối ưu vận chuyển siêu tốc với gói Freeship Xtra 0Đ.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <div className="text-3xl">🤝</div>
            <h4 className="text-xs font-black text-slate-800">Khách hàng là trọng tâm</h4>
            <p className="text-[11px] text-slate-500">Lắng nghe, thấu hiểu và xử lý mọi yêu cầu tận tâm 24/7.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 text-center space-y-4 shadow-xl">
        <h3 className="text-xl font-black">Sẵn sàng trải nghiệm mua sắm tuyệt vời?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Hàng triệu sản phẩm đang có giá ưu đãi cực sốc chờ bạn khám phá hôm nay.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-2xl text-xs font-black transition-all shadow-md"
        >
          <span>Khám phá sản phẩm ngay</span>
          <span>→</span>
        </Link>
      </div>

    </div>
  );
}
