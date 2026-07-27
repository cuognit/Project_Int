import { useEffect, useMemo, useState } from "react";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../../api/productApi.js";
import DeleteProductModal from "../../components/products/DeleteProductModal.jsx";
import ProductFormModal from "../../components/products/ProductFormModal.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

const LOW_STOCK_LIMIT = 15;

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-lg text-slate-400">
      {product.imageUrl && !failed ? (
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover"
          onError={() => setFailed(true)} />
      ) : <span aria-hidden="true">▣</span>}
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({
    totalItems: 0,
    totalPages: 1,
    limit: 20,
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getProducts({
        page: currentPage,
        limit: 20,
        search: query,
        status: statusFilter,
        stock: stockFilter,
      });

      if (data && data.items) {
        setProducts(data.items);
        setPaginationInfo(data.pagination);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch {
      setLoadError("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentPage, query, statusFilter, stockFilter]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStockChange = (e) => {
    setStockFilter(e.target.value);
    setCurrentPage(1);
  };

  const saveProduct = async (payload) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
      setNotice("Đã cập nhật sản phẩm.");
    } else {
      await createProduct(payload);
      setNotice("Đã thêm sản phẩm mới.");
    }
    setFormOpen(false);
    setEditingProduct(null);
    loadProducts();
  };

  const confirmDelete = async () => {
    setDeleteSubmitting(true);
    setDeleteError("");
    try {
      const result = await deleteProduct(deletingProduct.id);
      if (result.action === "deleted") {
        setNotice("Đã xóa sản phẩm.");
      } else {
        setNotice("Sản phẩm đã có đơn hàng và được chuyển sang ngừng kinh doanh.");
      }
      setDeletingProduct(null);
      loadProducts();
    } catch (error) {
      setDeleteError(error.response?.data?.message || "Không thể xóa sản phẩm.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {notice && <div className="fixed right-6 top-6 z-[60] rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">{notice}</div>}
      
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Quản lý sản phẩm</h2>
          <p className="mt-1 text-sm text-slate-400">Theo dõi danh mục, giá bán và tồn kho theo từng trang (20 SP/trang)</p>
        </div>
        <button type="button" onClick={() => { setEditingProduct(null); setFormOpen(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-100">
          <span className="text-lg leading-none">+</span> Thêm sản phẩm
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 lg:flex-row">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400">⌕</span>
            <input value={query} onChange={handleSearchChange}
              placeholder="Tìm theo tên hoặc SKU..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" />
          </div>
          <select value={statusFilter} onChange={handleStatusChange}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang kinh doanh</option>
            <option value="inactive">Ngừng kinh doanh</option>
          </select>
          <select value={stockFilter} onChange={handleStockChange}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none">
            <option value="all">Tất cả tồn kho</option>
            <option value="low">Sắp hết hàng (1–15)</option>
            <option value="out">Hết hàng</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            Đang tải danh sách sản phẩm trang {currentPage}...
          </div>
        ) : loadError ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button type="button" onClick={loadProducts}
              className="mt-3 text-sm font-bold text-indigo-600 hover:underline">Thử lại</button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">Không tìm thấy sản phẩm phù hợp.</div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-4">Sản phẩm</th><th className="p-4">SKU</th>
                    <th className="p-4">Giá bán</th><th className="p-4">Tồn kho</th>
                    <th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product, index) => (
                    <tr
                      key={product.id}
                      style={{ animationDelay: `${(index % 10) * 0.04}s` }}
                      className="animate-slide-up hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="p-4"><div className="flex items-center gap-3">
                        <ProductImage product={product} />
                        <div className="min-w-0">
                          <p className="max-w-xs truncate text-sm font-bold text-slate-800">{product.name}</p>
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{product.description || "Chưa có mô tả"}</p>
                        </div>
                      </div></td>
                      <td className="p-4 text-xs font-bold text-slate-600">{product.sku}</td>
                      <td className="p-4 text-sm font-bold text-slate-800">{formatCurrency(Number(product.price))}</td>
                      <td className="p-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        product.stock === 0 ? "bg-red-50 text-red-600" :
                          product.stock <= LOW_STOCK_LIMIT ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                      }`}>{product.stock === 0 ? "Hết hàng" : product.stock}</span></td>
                      <td className="p-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>{product.isActive ? "Đang kinh doanh" : "Ngừng kinh doanh"}</span></td>
                      <td className="p-4"><div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setEditingProduct(product); setFormOpen(true); }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 cursor-pointer">Sửa</button>
                        <button type="button" onClick={() => { setDeletingProduct(product); setDeleteError(""); }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer">Xóa</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-slate-100 px-4">
              <Pagination
                currentPage={currentPage}
                totalPages={paginationInfo.totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </div>
        )}
      </div>

      <ProductFormModal product={editingProduct} open={formOpen}
        onClose={() => { setFormOpen(false); setEditingProduct(null); }} onSubmit={saveProduct} />
      <DeleteProductModal product={deletingProduct} submitting={deleteSubmitting}
        error={deleteError} onClose={() => { if (!deleteSubmitting) setDeletingProduct(null); }}
        onConfirm={confirmDelete} />
    </div>
  );
}
