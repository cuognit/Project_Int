import { useEffect, useState } from 'react';
import {
  getDashboardAnalytics,
  getDashboardCustomers,
  getDashboardOrders,
  getDashboardOverview,
  getDashboardProducts,
  getLeaderboard,
} from '../../api/dashboardApi.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function DashboardSkeleton() {
  return (
    <div className="space-y-8 select-none pb-16">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-72 max-w-full animate-pulse rounded-lg bg-slate-200" />
          <div className="h-3 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-xl bg-slate-200" />
      </div>

      <div>
        <div className="mb-4 h-3 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-5 h-6 w-28 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex h-20 animate-pulse items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-10 w-10 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-24 rounded bg-slate-200" />
                <div className="h-5 w-20 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="h-[390px] animate-pulse rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="h-4 w-48 rounded bg-slate-200" />
          <div className="mt-8 h-72 rounded-2xl bg-slate-100" />
        </div>
        <div className="h-[390px] animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mx-auto mt-10 h-48 w-48 rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="h-4 w-48 rounded bg-slate-200" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-9 rounded-xl bg-slate-100" />)}
          </div>
        </div>
        <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 rounded-2xl bg-slate-100" />)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, column) => (
          <div key={column} className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-10 rounded-xl bg-slate-100" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tổng hợp và hiển thị các chỉ số điều hành của cửa hàng.
export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Controls
  const [trendRange, setTrendRange] = useState('7'); // '7' | '30'
  const [trendMetric, setTrendMetric] = useState('count'); // 'count' | 'revenue'
  const [customerTab, setCustomerTab] = useState('orders'); // 'orders' | 'spend'
  const [orderTab, setOrderTab] = useState('latest'); // 'latest' | 'pending' | 'cancelled'
  
  // Leaderboard filters
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all'); // 'all' | 'today' | 'month' | 'year' | 'custom'
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tải đồng thời các nhóm dữ liệu chính của dashboard.
  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      getDashboardOverview(),
      getDashboardAnalytics(),
      getDashboardCustomers({ period: 'all' }),
      getDashboardOrders(),
      getDashboardProducts(),
    ])
      .then(([overview, analytics, customerStats, orderLists, productLists]) => {
        setStats({
          overview,
          ...analytics,
          customerStats,
          operationalLists: {
            ...orderLists,
            ...productLists,
          },
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  };

  // Tải lại riêng bảng xếp hạng khi bộ lọc thời gian thay đổi.
  const fetchLeaderboardOnly = (period, start = startDate, end = endDate) => {
    setLeaderboardLoading(true);
    getLeaderboard({
      period,
      startDate: start,
      endDate: end,
    })
      .then((data) => {
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            customerStats: {
              ...prev.customerStats,
              topCustomersByOrders: data.topCustomersByOrders,
              topCustomersBySpend: data.topCustomersBySpend,
            },
          };
        });
        setLeaderboardLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLeaderboardLoading(false);
      });
  };

  const handlePeriodChange = (period) => {
    setLeaderboardPeriod(period);
    if (period !== 'custom') {
      fetchLeaderboardOnly(period);
    }
  };

  const handleDateChange = (type, val) => {
    let start = startDate;
    let end = endDate;
    if (type === 'start') {
      setStartDate(val);
      start = val;
    } else {
      setEndDate(val);
      end = val;
    }
    if (start && end) {
      fetchLeaderboardOnly('custom', start, end);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 select-none">
        <div className="bg-red-50 p-4 rounded-full text-red-500">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Không thể tải dữ liệu báo cáo</h3>
        <p className="text-xs text-slate-400 max-w-sm text-center leading-relaxed">
          Đã có lỗi kết nối tới máy chủ cơ sở dữ liệu. Vui lòng khôi phục dự án trên Supabase Dashboard và thử lại.
        </p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
        >
          Tải lại dữ liệu
        </button>
      </div>
    );
  }

  const { overview, statusStats, customerStats, trends, insights, operationalLists } = stats;

  // Decide trend dataset based on selected range
  const trendData = trendRange === '7' ? trends.last7Days : trends.last30Days;

  // Colors for Donut chart
  const COLORS = {
    PENDING: '#f59e0b',  // Amber
    CONFIRMED: '#3b82f6', // Blue
    SHIPPING: '#791bec',  // Indigo
    COMPLETED: '#10b981', // Emerald
    CANCELLED: '#f43f5e', // Rose
  };

  const donutData = Object.keys(statusStats.statuses).map((key) => ({
    name: key === 'PENDING' ? 'Chờ xử lý' :
          key === 'CONFIRMED' ? 'Xác nhận' :
          key === 'SHIPPING' ? 'Đang giao' :
          key === 'COMPLETED' ? 'Đã giao' : 'Đã hủy',
    value: statusStats.statuses[key],
    color: COLORS[key],
  })).filter(item => item.value > 0); // Only display if count > 0

  return (
    <div className="space-y-8 select-none animate-fade-in pb-16">
      
      {/* ----------------- HEADER ----------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Báo cáo Tổng hợp Kinh doanh</h2>
          <p className="text-xs text-slate-400 mt-1">Quản lý doanh thu, vận hành và phân khúc khách hàng</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 shadow-2xs cursor-pointer transition-all duration-150"
        >
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 9H18.01" />
          </svg>
          Làm mới dữ liệu
        </button>
      </div>

      {/* ----------------- SECTION 1: OVERVIEW METRICS ----------------- */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Các chỉ số cốt lõi</h3>
        
        {/* Row 1: Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-6">
          <div className="bg-emerald-50/40 p-5 border border-emerald-100/70 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all">
            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tổng Doanh Thu</span>
            <span className="block text-xl font-extrabold text-emerald-800 mt-2">{formatCurrency(overview.totalRevenue)}</span>
          </div>

          <div className="bg-emerald-50/20 p-5 border border-emerald-100/40 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all">
            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Doanh thu Tháng này</span>
            <span className="block text-xl font-extrabold text-emerald-800 mt-2">{formatCurrency(overview.revenueThisMonth)}</span>
            <span className={`block text-[10px] mt-1 font-bold ${overview.revenuePercentageChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {overview.revenuePercentageChange >= 0 ? `+${overview.revenuePercentageChange}%` : `${overview.revenuePercentageChange}%`} so với tháng trước
            </span>
          </div>

          <div className="bg-white p-5 border border-slate-200 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu Hôm nay</span>
            <span className="block text-lg font-bold text-slate-700 mt-2">{formatCurrency(overview.revenueToday)}</span>
          </div>

          <div className="bg-indigo-50/30 p-5 border border-indigo-100/50 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all">
            <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Đơn Trung Bình (AOV)</span>
            <span className="block text-lg font-bold text-indigo-800 mt-2">{formatCurrency(overview.averageOrderValue)}</span>
          </div>

          <div className="bg-white p-5 border border-slate-200 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn giá trị cao nhất</span>
            <span className="block text-sm font-bold text-slate-700 mt-2 truncate">
              {overview.highestValueOrder ? formatCurrency(Number(overview.highestValueOrder.totalAmount)) : 'N/A'}
            </span>
            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
              {overview.highestValueOrder ? `Mã đơn: #${overview.highestValueOrder.orderCode}` : 'Chưa có'}
            </span>
          </div>
        </div>

        {/* Row 2: Operational counts */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4 hover:shadow-xs transition-all">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Đơn Hàng</span>
              <span className="block text-xl font-extrabold text-slate-800">{overview.totalOrders} đơn</span>
            </div>
          </div>

          <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4 hover:shadow-xs transition-all">
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số Đơn Hôm nay</span>
              <span className="block text-xl font-extrabold text-slate-800">{overview.ordersToday} đơn</span>
            </div>
          </div>

          <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4 hover:shadow-xs transition-all">
            <div className="h-10 w-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Khách Hàng</span>
              <span className="block text-xl font-extrabold text-slate-800">{overview.totalCustomers} khách</span>
            </div>
          </div>

          <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4 hover:shadow-xs transition-all">
            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.783-.57-.372-1.81.587-1.81H9.51a1 1 0 00.95-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khách đặt nhiều nhất</span>
              <span className="block text-sm font-bold text-slate-800 truncate">
                {overview.topCustomer ? overview.topCustomer.fullName : 'N/A'}
              </span>
              {overview.topCustomer && (
                <span className="block text-[10px] text-slate-400 font-semibold">
                  {overview.topCustomer.orderCount} đơn hàng đặt mua
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- SECTION 2: CHARTS & STATUS ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Area Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Thống kê Xu hướng Thời gian</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Biểu đồ biểu diễn lượng đơn hàng và doanh số</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Toggle Metric */}
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setTrendMetric('count')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    trendMetric === 'count' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Số đơn
                </button>
                <button
                  onClick={() => setTrendMetric('revenue')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    trendMetric === 'revenue' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Doanh thu
                </button>
              </div>

              {/* Toggle Date Range */}
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setTrendRange('7')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    trendRange === '7' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  7 Ngày
                </button>
                <button
                  onClick={() => setTrendRange('30')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    trendRange === '30' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  30 Ngày
                </button>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pr-4 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={trendMetric === 'count' ? '#6366f1' : '#10b981'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={trendMetric === 'count' ? '#6366f1' : '#10b981'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  style={{ fontSize: '10px', fontWeight: '500' }}
                />
                <YAxis
                  allowDecimals={trendMetric === 'count' ? false : true}
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  style={{ fontSize: '10px', fontWeight: '500' }}
                  tickFormatter={(v) => trendMetric === 'count' ? v : `${v / 1000000}M`}
                />
                <Tooltip
                  isAnimationActive={false}
                  cursor={{
                    stroke: trendMetric === 'count' ? '#a5b4fc' : '#6ee7b7',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 4',
                  }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                  wrapperStyle={{ pointerEvents: 'none', outline: 'none' }}
                  formatter={(value) => trendMetric === 'count' ? [`${value} đơn`, 'Số lượng'] : [formatCurrency(value), 'Doanh thu']}
                />
                <Area
                  type="monotone"
                  dataKey={trendMetric}
                  stroke={trendMetric === 'count' ? '#4f46e5' : '#10b981'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 3,
                    stroke: '#fff',
                    fill: trendMetric === 'count' ? '#4f46e5' : '#10b981',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut Chart (1/3 width) */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Thống kê theo Trạng thái</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Tỷ lệ phân chia các trạng thái đơn hàng hiện tại</p>
          </div>

          {donutData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
              Chưa có số liệu trạng thái
            </div>
          ) : (
            <div className="relative h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '10px',
                    }}
                  />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="block text-2xl font-black text-slate-800">{overview.totalOrders}</span>
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Tổng đơn</span>
              </div>
            </div>
          )}

          {/* Donut Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-500 px-4">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>

          {/* Rates Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60 text-center">
              <span className="block text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Tỷ lệ hoàn thành</span>
              <span className="block text-base font-extrabold text-emerald-700 mt-0.5">{statusStats.completionRate}%</span>
            </div>
            <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/60 text-center">
              <span className="block text-[8px] font-bold text-rose-600 uppercase tracking-wider">Tỷ lệ hủy đơn</span>
              <span className="block text-base font-extrabold text-rose-700 mt-0.5">{statusStats.cancellationRate}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* ----------------- SECTION 3: CUSTOMERS ANALYTICS ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Customers Leaderboards (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bảng xếp hạng Khách hàng</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Top 5 khách đặt nhiều đơn nhất và chi tiêu cao nhất</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Toggle Period */}
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => handlePeriodChange('today')}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                      leaderboardPeriod === 'today' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={() => handlePeriodChange('month')}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                      leaderboardPeriod === 'month' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tháng này
                  </button>
                  <button
                    onClick={() => handlePeriodChange('year')}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                      leaderboardPeriod === 'year' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Năm nay
                  </button>
                  <button
                    onClick={() => handlePeriodChange('all')}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                      leaderboardPeriod === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => handlePeriodChange('custom')}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                      leaderboardPeriod === 'custom' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tùy chọn
                  </button>
                </div>

                {/* Toggle Table */}
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setCustomerTab('orders')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      customerTab === 'orders' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Theo số đơn
                  </button>
                  <button
                    onClick={() => setCustomerTab('spend')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      customerTab === 'spend' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Theo chi tiêu
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Date Inputs (only show if leaderboardPeriod === 'custom') */}
            {leaderboardPeriod === 'custom' && (
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 animate-fade-in text-[11px] font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span>Từ ngày:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span>Đến ngày:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Table display */}
          <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white min-h-[220px]">
            {/* Leaderboard Loader overlay */}
            {leaderboardLoading && (
              <div className="absolute inset-0 z-10 space-y-3 bg-white p-4 select-none">
                <div className="grid grid-cols-4 gap-4 border-b border-slate-100 pb-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="h-3 animate-pulse rounded bg-slate-200" />
                  ))}
                </div>
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="grid grid-cols-4 gap-4 py-1">
                    {Array.from({ length: 4 }, (_, column) => (
                      <div key={column} className="h-3 animate-pulse rounded bg-slate-100" />
                    ))}
                  </div>
                ))}
              </div>
            )}
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3 pl-4">Họ tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Điện thoại</th>
                  <th className="p-3 text-right pr-4">
                    {customerTab === 'orders' ? 'Số đơn hàng' : 'Tổng chi tiêu'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {customerTab === 'orders' ? (
                  customerStats.topCustomersByOrders.map((c) => (
                    <tr key={c.userId} className="hover:bg-slate-50/50">
                      <td className="p-3 pl-4 font-bold text-slate-800">{c.user?.fullName}</td>
                      <td className="p-3 text-slate-500">{c.user?.email}</td>
                      <td className="p-3 text-slate-400">{c.user?.phone || 'Chưa cập nhật'}</td>
                      <td className="p-3 text-right pr-4 font-extrabold text-indigo-600">{c.orderCount} đơn</td>
                    </tr>
                  ))
                ) : (
                  customerStats.topCustomersBySpend.map((c) => (
                    <tr key={c.userId} className="hover:bg-slate-50/50">
                      <td className="p-3 pl-4 font-bold text-slate-800">{c.user?.fullName}</td>
                      <td className="p-3 text-slate-500">{c.user?.email}</td>
                      <td className="p-3 text-slate-400">{c.user?.phone || 'Chưa cập nhật'}</td>
                      <td className="p-3 text-right pr-4 font-extrabold text-emerald-600">{formatCurrency(Number(c.totalSpend))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Segments (1/3 width) */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Phân khúc Khách hàng</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Số liệu phân loại tệp người dùng hệ thống</p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            
            {/* Segment 1: New Customers */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  +
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700">Khách mới tháng này</span>
                  <span className="block text-[9px] text-slate-400">Đăng ký tài khoản mới</span>
                </div>
              </div>
              <span className="text-base font-extrabold text-slate-800">{customerStats.newCustomersThisMonth} khách</span>
            </div>

            {/* Segment 2: Customers with orders */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                  ✔
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700">Đã từng mua hàng</span>
                  <span className="block text-[9px] text-slate-400">Có ít nhất 1 đơn hàng</span>
                </div>
              </div>
              <span className="text-base font-extrabold text-emerald-700">{customerStats.customersWithOrdersCount} khách</span>
            </div>

            {/* Segment 3: Customers without orders */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  0
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700">Chưa từng mua hàng</span>
                  <span className="block text-[9px] text-slate-400">Tài khoản trắng, 0 đơn</span>
                </div>
              </div>
              <span className="text-base font-extrabold text-rose-700">{customerStats.customersWithoutOrdersCount} khách</span>
            </div>

          </div>
        </div>

      </div>

      {/* ----------------- SECTION 4: OPERATIONAL LISTS ----------------- */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Hoạt động Vận hành & Cảnh báo</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Order Queues */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">Vận hành Đơn hàng</h4>
              
              {/* Tabs */}
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setOrderTab('latest')}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                    orderTab === 'latest' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Mới nhất
                </button>
                <button
                  onClick={() => setOrderTab('pending')}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                    orderTab === 'pending' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Đang chờ
                </button>
                <button
                  onClick={() => setOrderTab('cancelled')}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                    orderTab === 'cancelled' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Hủy gần đây
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 min-h-[260px] flex flex-col justify-start">
              {orderTab === 'latest' && (
                operationalLists.latestOrders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-slate-50">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-800">#{o.orderCode}</span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{o.user?.fullName} | {formatDate(o.createdAt).split(' ')[1]}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{formatCurrency(Number(o.totalAmount))}</span>
                  </div>
                ))
              )}

              {orderTab === 'pending' && (
                operationalLists.pendingOrders.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
                    Không có đơn nào chờ xử lý.
                  </div>
                ) : (
                  operationalLists.pendingOrders.map((o) => (
                    <div key={o.id} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-slate-50">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-800">#{o.orderCode}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{o.user?.fullName} | {formatDate(o.createdAt).split(' ')[1]}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{formatCurrency(Number(o.totalAmount))}</span>
                    </div>
                  ))
                )
              )}

              {orderTab === 'cancelled' && (
                operationalLists.recentlyCancelledOrders.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
                    Không có đơn hủy gần đây.
                  </div>
                ) : (
                  operationalLists.recentlyCancelledOrders.map((o) => (
                    <div key={o.id} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-slate-50">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-800">#{o.orderCode}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{o.user?.fullName} | {formatDate(o.createdAt).split(' ')[1]}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{formatCurrency(Number(o.totalAmount))}</span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Column 2: Best Sellers */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800">Top 5 Sản phẩm bán chạy</h4>
            
            <div className="space-y-3 min-h-[260px] flex flex-col justify-start">
              {operationalLists.topSellingProducts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
                  Chưa có sản phẩm bán chạy.
                </div>
              ) : (
                operationalLists.topSellingProducts.map((p, index) => (
                  <div key={p.productId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-[11px] font-bold text-slate-400 w-4">{index + 1}</div>
                      <img
                        src={p.imageUrl || 'https://picsum.photos/50/50'}
                        alt={p.productName}
                        className="h-8 w-8 rounded-md bg-slate-100 object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="block text-[11px] font-bold text-slate-800 truncate">{p.productName}</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">SKU: {p.productSku}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 shrink-0">
                      Đã bán: {p.totalSold}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Low Stock Warning */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 text-rose-600 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              Cảnh báo tồn kho thấp (Tồn ≤ 15)
            </h4>
            
            <div className="space-y-4 min-h-[260px] flex flex-col justify-start">
              {operationalLists.lowStockProducts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-emerald-600 font-bold italic">
                  ✔ Không có sản phẩm nào sắp hết hàng.
                </div>
              ) : (
                operationalLists.lowStockProducts.map((p) => {
                  const percentage = Math.min(100, (p.stock / 15) * 100);
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-800 truncate pr-4">{p.name}</span>
                        <span className="font-bold text-rose-600 shrink-0">Chỉ còn {p.stock}</span>
                      </div>
                      
                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
