import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/productApi.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import ScrollReveal from '../../components/common/ScrollReveal.jsx';

export default function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [addedToast, setAddedToast] = useState(null);
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({
    totalItems: 0,
    totalPages: 1,
    limit: 16,
  });

  const { addToCart, isAuthenticated, cartError, cartLoading } = useAuth();

  const fetchProductsList = (page = 1, search = '') => {
    setLoading(true);
    getProducts({ page, limit: 16, search })
      .then((data) => {
        if (data && data.items) {
          setProducts(data.items);
          setPaginationInfo(data.pagination);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProductsList(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Client-side sorting on current page products or fetched items
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => Number(b.price) - Number(a.price));
    }
    if (sortBy === 'name-asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Default 'latest' (by ID descending or original order)
    return list.sort((a, b) => b.id - a.id);
  }, [products, sortBy]);

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

  return (
    <div className="space-y-8 select-none">
      
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700">
          <div className="h-7 w-7 bg-[#ee4d2d] text-white rounded-full flex items-center justify-center text-xs font-black">
            ✓
          </div>
          <span className="text-xs font-bold">Đã thêm "{addedToast}" vào giỏ hàng!</span>
        </div>
      )}
      {(actionError || cartError) && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-rose-600 px-5 py-3.5 text-xs font-bold text-white shadow-2xl">
          {actionError || cartError}
        </div>
      )}

      {/* Header Banner - Products Page */}
      <div className="bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-white mb-2">
            <span>🛍️ SHOPEE MART CATALOG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Tất cả sản phẩm</h1>
          <p className="mt-1 text-xs text-orange-100">
            Khám phá hàng ngàn sản phẩm chất lượng cao với giá ưu đãi tốt nhất hôm nay.
          </p>
        </div>
        <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-extrabold shrink-0">
          <span>{paginationInfo.totalItems || products.length} sản phẩm có sẵn</span>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tìm theo tên sản phẩm, SKU..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#ee4d2d] focus:bg-white transition-all text-slate-800"
          />
          <svg className="h-4 w-4 text-[#ee4d2d] absolute left-3.5 top-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#ee4d2d] cursor-pointer"
          >
            <option value="latest">Mới nhất</option>
            <option value="price-asc">Giá: Thấp đến Cao</option>
            <option value="price-desc">Giá: Cao đến Thấp</option>
            <option value="name-asc">Tên: A - Z</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-3xl p-4 h-72 animate-pulse space-y-3">
              <div className="bg-slate-200 h-40 rounded-2xl w-full"></div>
              <div className="bg-slate-200 h-4 rounded-full w-3/4"></div>
              <div className="bg-slate-200 h-4 rounded-full w-1/2"></div>
            </div>
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="h-14 w-14 bg-orange-50 text-[#ee4d2d] rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy sản phẩm phù hợp</h3>
          <p className="text-xs text-slate-400">Hãy thử nhập từ khóa tìm kiếm khác nhé.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={(index % 4) * 0.06}>
                <Link
                  to={`/products/${product.id}`}
                  className="group bg-white border border-gray-200 rounded-3xl p-3.5 shadow-2xs hover:shadow-xl hover:border-orange-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full"
                >
                  <div className="space-y-3">
                    {/* Image Wrap */}
                    <div className="relative h-44 w-full bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100">
                      <img
                        src={product.imageUrl || 'https://picsum.photos/300/300'}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Shopee Mall Badge */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#d0011b] text-white text-[9px] font-black rounded-md shadow-xs">
                        Shopee Mall
                      </span>

                      {product.stock <= 5 && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-400 text-orange-950 text-[9px] font-extrabold rounded-md shadow-xs">
                          Sắp hết ({product.stock})
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        SKU: {product.sku || 'N/A'}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5 group-hover:text-[#ee4d2d] transition-colors leading-tight">
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  {/* Price & Action */}
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
                      className="px-3 py-1.5 bg-[#ee4d2d] hover:bg-[#d73211] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>+ Thêm</span>
                    </button>
                  </div>

                </Link>
              </ScrollReveal>
            ))}
          </div>

          {/* Pagination Bar */}
          <div className="border-t border-slate-200 pt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={paginationInfo.totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
