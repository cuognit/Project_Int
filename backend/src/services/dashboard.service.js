import { Op, fn, col } from "sequelize";
import { User, Order, OrderItem, Product } from "../models/index.js";

const getDayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getMonthBounds = () => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);
  return { now, thisMonthStart, lastMonthStart, lastMonthEnd };
};

const percentageChange = (current, previous) => {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  return current > 0 ? 100 : 0;
};

const buildTrend = (orders, days) => {
  const trendMap = new Map();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    trendMap.set(key, {
      date: date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }),
      count: 0,
      revenue: 0,
    });
  }

  orders.forEach((order) => {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    const item = trendMap.get(key);
    if (!item) return;
    item.count += 1;
    if (order.status === "COMPLETED") item.revenue += Number(order.totalAmount || 0);
  });

  return [...trendMap.values()];
};

// Tổng hợp các chỉ số kinh doanh nổi bật cho dashboard.
export const getOverviewStats = async () => {
  const { start: todayStart, end: todayEnd } = getDayBounds();
  const { thisMonthStart, lastMonthStart, lastMonthEnd } = getMonthBounds();
  const completedWhere = { status: "COMPLETED" };

  const [
    totalOrders,
    totalCustomers,
    ordersToday,
    completedOrdersCount,
    totalRevenueResult,
    revenueTodayResult,
    revenueThisMonthResult,
    revenueLastMonthResult,
    highestValueOrder,
    topCustomerGroup,
  ] = await Promise.all([
    Order.count(),
    User.count(),
    Order.count({ where: { createdAt: { [Op.between]: [todayStart, todayEnd] } } }),
    Order.count({ where: completedWhere }),
    Order.sum("totalAmount", { where: completedWhere }),
    Order.sum("totalAmount", {
      where: { ...completedWhere, createdAt: { [Op.between]: [todayStart, todayEnd] } },
    }),
    Order.sum("totalAmount", {
      where: { ...completedWhere, createdAt: { [Op.gte]: thisMonthStart } },
    }),
    Order.sum("totalAmount", {
      where: { ...completedWhere, createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } },
    }),
    Order.findOne({ where: completedWhere, order: [["totalAmount", "DESC"]], raw: true }),
    Order.findAll({
      attributes: ["userId", [fn("COUNT", col("Order.id")), "orderCount"]],
      include: [{ model: User, as: "user", attributes: ["id", "fullName", "email"] }],
      group: ["userId", "user.id", "user.full_name", "user.email"],
      order: [[fn("COUNT", col("Order.id")), "DESC"]],
      limit: 1,
    }),
  ]);

  const totalRevenue = Number(totalRevenueResult || 0);
  const revenueThisMonth = Number(revenueThisMonthResult || 0);
  const revenueLastMonth = Number(revenueLastMonthResult || 0);
  const topCustomerRow = topCustomerGroup[0];

  return {
    totalOrders,
    ordersToday,
    totalCustomers,
    topCustomer: topCustomerRow
      ? {
          id: topCustomerRow.user?.id,
          fullName: topCustomerRow.user?.fullName,
          email: topCustomerRow.user?.email,
          orderCount: Number(topCustomerRow.dataValues.orderCount || 0),
        }
      : null,
    totalRevenue,
    averageOrderValue: completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0,
    revenueToday: Number(revenueTodayResult || 0),
    revenueThisMonth,
    revenuePercentageChange: percentageChange(revenueThisMonth, revenueLastMonth),
    highestValueOrder,
  };
};

// Tổng hợp xu hướng doanh thu và đơn hàng theo thời gian.
export const getAnalyticsStats = async () => {
  const { now, thisMonthStart, lastMonthStart, lastMonthEnd } = getMonthBounds();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [statusCounts, ordersLast30Days, ordersThisYear, thisMonthCount, lastMonthCount] =
    await Promise.all([
      Order.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
        raw: true,
      }),
      Order.findAll({
        where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
        attributes: ["createdAt", "status", "totalAmount"],
        raw: true,
      }),
      Order.findAll({
        where: { createdAt: { [Op.gte]: startOfYear } },
        attributes: ["createdAt", "status", "totalAmount"],
        raw: true,
      }),
      Order.count({ where: { createdAt: { [Op.gte]: thisMonthStart } } }),
      Order.count({ where: { createdAt: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),
    ]);

  const statuses = {
    PENDING: 0,
    CONFIRMED: 0,
    SHIPPING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  statusCounts.forEach((item) => {
    statuses[item.status] = Number(item.count || 0);
  });

  const totalOrders = Object.values(statuses).reduce((sum, count) => sum + count, 0);
  const last7Days = buildTrend(ordersLast30Days, 7);
  const last30Days = buildTrend(ordersLast30Days, 30);
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: `Th. ${index + 1}`,
    count: 0,
    revenue: 0,
  }));

  ordersThisYear.forEach((order) => {
    const item = monthly[new Date(order.createdAt).getMonth()];
    item.count += 1;
    if (order.status === "COMPLETED") item.revenue += Number(order.totalAmount || 0);
  });

  const peakDay = last30Days.reduce(
    (peak, item) => (item.count > peak.count ? { date: item.date, count: item.count } : peak),
    { date: "N/A", count: 0 },
  );
  const peakMonth = monthly.reduce(
    (peak, item) => (item.count > peak.count ? { month: item.month, count: item.count } : peak),
    { month: "N/A", count: 0 },
  );

  return {
    statusStats: {
      statuses,
      completionRate: totalOrders > 0 ? Math.round((statuses.COMPLETED / totalOrders) * 100) : 0,
      cancellationRate: totalOrders > 0 ? Math.round((statuses.CANCELLED / totalOrders) * 100) : 0,
    },
    trends: { last7Days, last30Days, monthly },
    insights: {
      peakDay,
      peakMonth,
      orderCountPercentageChange: percentageChange(thisMonthCount, lastMonthCount),
    },
  };
};

// Phân tích khách hàng và hiệu suất mua hàng theo khoảng thời gian.
export const getCustomerStats = async ({ leaderboardPeriod = "all", startDate, endDate } = {}) => {
  const { thisMonthStart } = getMonthBounds();
  const [totalCustomers, newCustomersThisMonth, customersWithOrdersCount, leaderboard] =
    await Promise.all([
      User.count(),
      User.count({ where: { createdAt: { [Op.gte]: thisMonthStart } } }),
      User.count({
        distinct: true,
        col: "id",
        include: [{ model: Order, as: "orders", required: true }],
      }),
      getLeaderboardStats({ leaderboardPeriod, startDate, endDate }),
    ]);

  return {
    ...leaderboard,
    newCustomersThisMonth,
    customersWithOrdersCount,
    customersWithoutOrdersCount: Math.max(0, totalCustomers - customersWithOrdersCount),
  };
};

// Lấy các nhóm đơn hàng gần đây phục vụ dashboard.
export const getOrderLists = async () => {
  const [latestOrders, pendingOrders, recentlyCancelledOrders] = await Promise.all([
    Order.findAll({
      order: [["createdAt", "DESC"]],
      limit: 10,
      include: [{ model: User, as: "user", attributes: ["id", "fullName", "email"] }],
    }),
    Order.findAll({
      where: { status: "PENDING" },
      order: [["createdAt", "DESC"]],
      limit: 5,
      include: [{ model: User, as: "user", attributes: ["id", "fullName"] }],
    }),
    Order.findAll({
      where: { status: "CANCELLED" },
      order: [["createdAt", "DESC"]],
      limit: 5,
      include: [{ model: User, as: "user", attributes: ["id", "fullName"] }],
    }),
  ]);
  return { latestOrders, pendingOrders, recentlyCancelledOrders };
};

// Tổng hợp tồn kho và hiệu suất bán của sản phẩm.
export const getProductStats = async () => {
  const [lowStockProducts, topProductsRaw] = await Promise.all([
    Product.findAll({
      where: { stock: { [Op.lte]: 15 } },
      order: [["stock", "ASC"]],
      limit: 5,
    }),
    OrderItem.findAll({
      attributes: [
        "productId",
        "productName",
        "productSku",
        [fn("SUM", col("quantity")), "totalSold"],
      ],
      include: [{ model: Product, as: "product", attributes: ["imageUrl"] }],
      group: [
        "productId",
        "OrderItem.product_name",
        "OrderItem.product_sku",
        "product.id",
        "product.image_url",
      ],
      order: [[fn("SUM", col("quantity")), "DESC"]],
      limit: 5,
    }),
  ]);

  return {
    lowStockProducts,
    topSellingProducts: topProductsRaw.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      productSku: product.productSku,
      totalSold: Number(product.dataValues.totalSold),
      imageUrl: product.product?.imageUrl || null,
    })),
  };
};

// Xây dựng bảng xếp hạng từ tiêu chí và khoảng thời gian được chọn.
export const getLeaderboardStats = async ({
  leaderboardPeriod = "all",
  startDate,
  endDate,
} = {}) => {
  const orderWhere = { status: "COMPLETED" };
  const now = new Date();

  if (leaderboardPeriod === "today") {
    const { start, end } = getDayBounds();
    orderWhere.createdAt = { [Op.between]: [start, end] };
  } else if (leaderboardPeriod === "month") {
    orderWhere.createdAt = { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1) };
  } else if (leaderboardPeriod === "year") {
    orderWhere.createdAt = { [Op.gte]: new Date(now.getFullYear(), 0, 1) };
  } else if (leaderboardPeriod === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    orderWhere.createdAt = { [Op.between]: [start, end] };
  }

  const userInclude = {
    model: User,
    as: "user",
    attributes: ["id", "fullName", "email", "phone"],
  };
  const group = ["userId", "user.id", "user.full_name", "user.email", "user.phone"];

  const [topCustomersByOrders, topCustomersBySpend] = await Promise.all([
    Order.findAll({
      attributes: ["userId", [fn("COUNT", col("Order.id")), "orderCount"]],
      where: orderWhere,
      include: [userInclude],
      group,
      order: [[fn("COUNT", col("Order.id")), "DESC"]],
      limit: 5,
    }),
    Order.findAll({
      attributes: ["userId", [fn("SUM", col("total_amount")), "totalSpend"]],
      where: orderWhere,
      include: [userInclude],
      group,
      order: [[fn("SUM", col("total_amount")), "DESC"]],
      limit: 5,
    }),
  ]);

  return { topCustomersByOrders, topCustomersBySpend };
};
