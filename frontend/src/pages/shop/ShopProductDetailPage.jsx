import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getProduct } from '../../api/productApi.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ShopProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { addToCart, isAuthenticated, cartError, cartLoading } = useAuth();

  useEffect(() => {
    getProduct(id)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (product) {
      setActionError('');
      try {
        await addToCart(product, quantity);
        setAddedToast(true);
        setTimeout(() => setAddedToast(false), 2500);
      } catch (error) {
        setActionError(error?.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-[#ee4d2d]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
        <h3 className="text-lg font-bold text-slate-800">Sản phẩm không tồn tại trên Shopee</h3>
        <Link to="/" className="inline-block px-5 py-2.5 bg-[#ee4d2d] text-white text-xs font-bold rounded-xl">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700">
          <div className="h-7 w-7 bg-[#ee4d2d] text-white rounded-full flex items-center justify-center text-xs font-black">
            ✓
          </div>
          <span className="text-xs font-bold">Đã thêm {quantity} sản phẩm vào giỏ hàng Shopee!</span>
        </div>
      )}
      {(actionError || cartError) && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-rose-600 px-5 py-3.5 text-xs font-bold text-white shadow-2xl">
          {actionError || cartError}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link to="/" className="hover:text-[#ee4d2d] transition-colors">Trang chủ Shopee</Link>
        <span>/</span>
        <span className="text-slate-800 truncate">{product.name}</span>
      </nav>

      <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Product Image */}
        <div className="relative h-80 w-full bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100">
          <img
            src={product.imageUrl || 'https://picsum.photos/400/400'}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#d0011b] text-white text-xs font-black rounded-md shadow-xs">
            Shopee Mall
          </span>
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="block text-xs font-bold text-[#ee4d2d] uppercase tracking-widest">
              Mã sản phẩm: {product.sku || 'N/A'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
            </p>

            {/* Shopee Orange Price banner */}
            <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl">
              <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-wider">Giá Ưu Đãi Shopee</span>
              <span className="text-3xl font-black text-[#ee4d2d]">
                {formatCurrency(Number(product.price))}
              </span>
            </div>

            <div className="pt-2">
              <span className="block text-xs text-slate-500">
                Tồn kho sẵn có: <strong className="text-slate-800 font-extrabold">{product.stock}</strong> sản phẩm
              </span>
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Số lượng:</span>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className="flex-1 py-3.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-200 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                🛒 Thêm Vào Giỏ Hàng
              </button>
              <Link
                to="/cart"
                className="px-5 py-3.5 border border-orange-200 bg-orange-50/50 hover:bg-orange-100 text-[#ee4d2d] font-bold text-xs rounded-xl transition-all"
              >
                Xem Giỏ Hàng
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
