import React from 'react';

export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const delta = 1;
    const left = currentPage - delta;
    const right = currentPage + delta + 1;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 select-none">
      
      <div className="text-xs font-semibold text-slate-500">
        Trang <span className="font-extrabold text-[#ee4d2d]">{currentPage}</span> / {totalPages}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentPage === 1
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-[#ee4d2d] hover:bg-orange-50 shadow-2xs'
          }`}
          title="Trang trước"
        >
          ‹
        </button>

        {/* Page Buttons */}
        {pages.map((p, index) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${index}`} className="h-9 w-7 flex items-center justify-center text-slate-400 text-xs font-bold">
                ...
              </span>
            );
          }

          const isActive = p === currentPage;

          return (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              className={`h-9 min-w-[36px] px-2.5 flex items-center justify-center rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#ee4d2d] text-white shadow-md shadow-orange-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-[#ee4d2d] hover:bg-orange-50 shadow-2xs'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentPage === totalPages
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-[#ee4d2d] hover:bg-orange-50 shadow-2xs'
          }`}
          title="Trang tiếp"
        >
          ›
        </button>
      </div>

    </div>
  );
}
