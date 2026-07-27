import { Link } from 'react-router-dom';

export default function ShopFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[#ee4d2d] text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md">
                S
              </div>
              <span className="text-base font-extrabold text-white">ShopeeMart</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Sàn thương mại điện tử & Quản lý đơn hàng mua sắm trực tuyến hàng đầu. Giá tốt mỗi ngày - Giao hàng cực nhanh.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-orange-400 transition-colors">Trang chủ Shop</Link>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-orange-400 transition-colors">Đơn hàng của tôi</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-orange-400 transition-colors">Giỏ hàng Shopee</Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Shopee Tiết Kiệm & Trả Hàng 7 Ngày</li>
              <li>Hướng dẫn thanh toán COD/AirPay</li>
              <li>Chính sách bảo mật thông tin</li>
              <li>Trung tâm hỗ trợ khách hàng 24/7</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Tổng đài hỗ trợ</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Hotline: 1900 1221 (Cước phí 1.000đ/phút)<br />
              Email: cskh@shopeemart.vn<br />
              Địa chỉ: Tòa nhà Shopee, Hà Nội, Việt Nam
            </p>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px]">
          <p>© {new Date().getFullYear()} ShopeeMart. Tất cả các quyền được bảo lưu.</p>
          <p className="text-slate-500">Bản quyền thuộc về ShopeeMart Vietnam</p>
        </div>
      </div>
    </footer>
  );
}
