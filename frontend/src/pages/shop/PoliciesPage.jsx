import { useState } from 'react';

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState('shipping');

  const policies = {
    shipping: {
      title: 'Chính sách Vận chuyển & Giao hàng',
      icon: '🚚',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-800">
            ShopeeMart hợp tác cùng các đơn vị vận chuyển uy tín hàng đầu Việt Nam để cung cấp dịch vụ giao hàng nhanh chóng, an toàn tới tận tay người mua.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-1">
              <h4 className="font-bold text-[#ee4d2d]">1. Gói Vận chuyển Miễn phí Freeship Xtra 0Đ</h4>
              <p>Mọi đơn hàng từ 0Đ đặt qua sàn ShopeeMart đều được hỗ trợ mã giảm giá vận chuyển. Thời gian giao hàng nội thành từ 1-2 ngày, ngoại thành từ 2-4 ngày làm việc.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">2. Quy trình đóng gói & Kiểm hàng</h4>
              <p>Sản phẩm được đóng gói kỹ lưỡng với xốp chống sốc và dán niêm phong Shopee. Khách hàng có quyền quay video bóc mở hàng để làm bằng chứng khi có sự cố phát sinh.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">3. Theo dõi đơn hàng trực tuyến</h4>
              <p>Bạn có thể dễ dàng kiểm tra vị trí và lộ trình của đơn hàng trực tiếp trong mục <strong className="text-slate-800">"Đơn hàng của tôi"</strong>.</p>
            </div>
          </div>
        </div>
      ),
    },
    return: {
      title: 'Chính sách Đổi trả & Hoàn tiền 7 Ngày',
      icon: '🔄',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-800">
            ShopeeMart cam kết bảo vệ tối đa quyền lợi người tiêu dùng với chính sách đổi trả hàng linh hoạt trong vòng 7 ngày kể từ ngày nhận hàng thành công.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <h4 className="font-bold text-emerald-800">1. Điều kiện đổi trả miễn phí</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Sản phẩm giao không đúng chủng loại, mẫu mã hoặc số lượng như trong đơn hàng.</li>
                <li>Sản phẩm bị lỗi kỹ thuật từ nhà sản xuất hoặc bị hư hỏng trong quá trình vận chuyển.</li>
                <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
              <h4 className="font-bold text-amber-900">2. Cam kết Hoàn tiền 111%</h4>
              <p>Nếu người mua chứng minh được sản phẩm mua tại ShopeeMart là hàng giả, hàng nhái, chúng tôi cam kết hoàn lại 111% giá trị đơn hàng.</p>
            </div>
          </div>
        </div>
      ),
    },
    privacy: {
      title: 'Chính sách Bảo mật Thông tin',
      icon: '🔒',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-800">
            Sự riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. ShopeeMart tuân thủ nghiêm ngặt các quy định về bảo vệ dữ liệu cá nhân của người dùng.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
              <h4 className="font-bold text-indigo-900">1. Thu thập & Sử dụng thông tin</h4>
              <p>Thông tin Họ tên, Email, Số điện thoại và Địa chỉ chỉ được sử dụng cho mục đích xử lý đơn hàng, giao hàng và hỗ trợ khách hàng.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">2. Cam kết không chia sẻ dữ liệu</h4>
              <p>ShopeeMart tuyệt đối không bán, chia sẻ hay tiết lộ thông tin cá nhân của bạn cho bên thứ ba trừ khi có sự đồng ý của bạn hoặc theo yêu cầu pháp lý.</p>
            </div>
          </div>
        </div>
      ),
    },
    terms: {
      title: 'Điều khoản Sử dụng & Bảo hành',
      icon: '📜',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-800">
            Khi đăng ký và sử dụng dịch vụ tại ShopeeMart, khách hàng đồng ý tuân thủ các quy định và điều khoản chung của sàn.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">1. Cam kết chất lượng chính hãng</h4>
              <p>Tất cả các sản phẩm trên sàn đều được kiểm định chất lượng và đi kèm chính sách bảo hành chính hãng từ thương hiệu sản xuất.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">2. Hỗ trợ giải quyết khiếu nại 24/7</h4>
              <p>Mọi khiếu nại về chất lượng dịch vụ hoặc thái độ phục vụ đều được bộ phận CSKH tiếp nhận và xử lý trong vòng 24 giờ làm việc.</p>
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="w-full space-y-8 select-none">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] rounded-3xl p-8 text-white shadow-lg">
        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-2">
          📋 HƯỚNG DẪN & CHÍNH SÁCH
        </span>
        <h1 className="text-2xl sm:text-3xl font-black">Chính sách Cửa hàng</h1>
        <p className="mt-1 text-xs text-orange-100">
          Tìm hiểu thông tin minh bạch về vận chuyển, đổi trả, bảo mật và điều khoản dịch vụ tại ShopeeMart.
        </p>
      </div>

      {/* Main Grid: Tabs Sidebar + Content Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Tabs Sidebar */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-3xl p-3 shadow-xs space-y-1.5 h-fit">
          <button
            onClick={() => setActiveTab('shipping')}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'shipping'
                ? 'bg-orange-50 text-[#ee4d2d] border border-orange-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">🚚</span>
            <span>Vận chuyển & Giao hàng</span>
          </button>

          <button
            onClick={() => setActiveTab('return')}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'return'
                ? 'bg-orange-50 text-[#ee4d2d] border border-orange-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">🔄</span>
            <span>Đổi trả & Hoàn tiền</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-orange-50 text-[#ee4d2d] border border-orange-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">🔒</span>
            <span>Bảo mật thông tin</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-orange-50 text-[#ee4d2d] border border-orange-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">📜</span>
            <span>Điều khoản & Bảo hành</span>
          </button>
        </div>

        {/* Right Content Box */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="text-2xl">{policies[activeTab].icon}</span>
            <h2 className="text-base font-black text-slate-800">{policies[activeTab].title}</h2>
          </div>
          {policies[activeTab].content}
        </div>

      </div>

    </div>
  );
}
