import { Op, fn, col } from "sequelize";
import { User, Order, OrderItem, Product } from "../models/index.js";

export const getDashboardStats = async ({ leaderboardPeriod = "all" } = {}) => {
  // ==========================================
  // 1. OVERVIEW & COUNTS
  // ==========================================
  const totalOrders = await Order.count();
  const totalCustomers = await User.count();

  // Orders created today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  
  const ordersToday = await Order.count({
    where: {
      createdAt: {
        [Op.between]: [todayStart, todayEnd],
      },
    },
  });

  // Customer with most orders
  const topCustomerGroup = await Order.findAll({
    attributes: [
      "userId",
      [fn("COUNT", col("id")), "orderCount"],
    ],
    group: ["userId"],
    order: [[fn("COUNT", col("id")), "DESC"]],
    limit: 1,
    raw: true,
  });

  let topCustomer = null;
  if (topCustomerGroup.length > 0) {
    const userId = topCustomerGroup[0].userId;
    const user = await User.findByPk(userId);
    if (user) {
      topCustomer = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        orderCount: Number(topCustomerGroup[0].orderCount),
      };
    }
  }

  // ==========================================
  // 2. STATUS STATISTICS
  // ==========================================
  const statusCounts = await Order.findAll({
    attributes: [
      "status",
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const statuses = {
    PENDING: 0,
    CONFIRMED: 0,
    SHIPPING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  statusCounts.forEach((s) => {
    statuses[s.status] = Number(s.count || 0);
  });

  const completionRate = totalOrders > 0 ? Math.round((statuses.COMPLETED / totalOrders) * 100) : 0;
  const cancellationRate = totalOrders > 0 ? Math.round((statuses.CANCELLED / totalOrders) * 100) : 0;

  // ==========================================
  // 3. REVENUE STATISTICS (COMPLETED ONLY)
  // ==========================================
  const totalRevenueResult = await Order.sum("totalAmount", {
    where: { status: "COMPLETED" },
  });
  const totalRevenue = Number(totalRevenueResult || 0);

  const completedOrdersCount = statuses.COMPLETED;
  const averageOrderValue = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;

  // Revenue today
  const revenueTodayResult = await Order.sum("totalAmount", {
    where: {
      status: "COMPLETED",
      createdAt: {
        [Op.between]: [todayStart, todayEnd],
      },
    },
  });
  const revenueToday = Number(revenueTodayResult || 0);

  // Revenue this month
  const startOfThisMonth = new Date();
  startOfThisMonth.setDate(1);
  startOfThisMonth.setHours(0, 0, 0, 0);

  const revenueThisMonthResult = await Order.sum("totalAmount", {
    where: {
      status: "COMPLETED",
      createdAt: {
        [Op.gte]: startOfThisMonth,
      },
    },
  });
  const revenueThisMonth = Number(revenueThisMonthResult || 0);

  // Revenue comparison (growth)
  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);
  const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

  const revenueLastMonthResult = await Order.sum("totalAmount", {
    where: {
      status: "COMPLETED",
      createdAt: {
        [Op.between]: [startOfLastMonth, endOfLastMonth],
      },
    },
  });
  const revenueLastMonth = Number(revenueLastMonthResult || 0);

  let revenuePercentageChange = 0;
  if (revenueLastMonth > 0) {
    revenuePercentageChange = Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100);
  } else if (revenueThisMonth > 0) {
    revenuePercentageChange = 100;
  }

  // Highest value completed order
  const highestValueOrder = await Order.findOne({
    where: { status: "COMPLETED" },
    order: [["totalAmount", "DESC"]],
    raw: true,
  });

  // ==========================================
  // 4. CUSTOMER LEADERBOARD & STATISTICS
  // ==========================================
  const leaderboard = await getLeaderboardStats({ leaderboardPeriod });
  const topCustomersByOrders = leaderboard.topCustomersByOrders;
  const topCustomersBySpend = leaderboard.topCustomersBySpend;

  // New customers this month
  const newCustomersThisMonth = await User.count({
    where: {
      createdAt: {
        [Op.gte]: startOfThisMonth,
      },
    },
  });

  // Customers with orders
  const customersWithOrdersCount = await User.count({
    distinct: true,
    col: "id",
    include: [
      {
        model: Order,
        as: "orders",
        required: true,
      },
    ],
  });

  // Customers without orders
  const customersWithoutOrdersCount = totalCustomers - customersWithOrdersCount;

  // ==========================================
  // 5. TRENDS (7-DAY, 30-DAY, MONTHLY)
  // ==========================================
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const ordersLast30DaysRaw = await Order.findAll({
    where: {
      createdAt: {
        [Op.gte]: thirtyDaysAgo,
      },
    },
    attributes: ["createdAt", "status", "totalAmount"],
    raw: true,
  });

  // Trend mapping helper for date ranges
  const getTrendDataWithRevenue = (days) => {
    const trendMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
      trendMap[dateString] = { count: 0, revenue: 0 };
    }

    ordersLast30DaysRaw.forEach((o) => {
      const orderDate = new Date(o.createdAt);
      const diffTime = Math.abs(new Date() - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= days) {
        const dateString = orderDate.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
        if (trendMap[dateString] !== undefined) {
          trendMap[dateString].count++;
          if (o.status === "COMPLETED") {
            trendMap[dateString].revenue += Number(o.totalAmount || 0);
          }
        }
      }
    });

    return Object.keys(trendMap).map((date) => ({
      date,
      count: trendMap[date].count,
      revenue: trendMap[date].revenue,
    }));
  };

  const last7DaysTrend = getTrendDataWithRevenue(7);
  const last30DaysTrend = getTrendDataWithRevenue(30);

  // Monthly distribution for this year
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const ordersThisYear = await Order.findAll({
    where: {
      createdAt: {
        [Op.gte]: startOfYear,
      },
    },
    attributes: ["createdAt", "status", "totalAmount"],
    raw: true,
  });

  const monthlyMap = {};
  for (let m = 0; m < 12; m++) {
    monthlyMap[`Th. ${m + 1}`] = { count: 0, revenue: 0 };
  }
  ordersThisYear.forEach((o) => {
    const orderDate = new Date(o.createdAt);
    const monthKey = `Th. ${orderDate.getMonth() + 1}`;
    if (monthlyMap[monthKey] !== undefined) {
      monthlyMap[monthKey].count++;
      if (o.status === "COMPLETED") {
        monthlyMap[monthKey].revenue += Number(o.totalAmount || 0);
      }
    }
  });

  const monthlyTrend = Object.keys(monthlyMap).map((month) => ({
    month,
    count: monthlyMap[month].count,
    revenue: monthlyMap[month].revenue,
  }));

  // Insights: Peak day
  let peakDay = { date: "N/A", count: 0 };
  last30DaysTrend.forEach((item) => {
    if (item.count > peakDay.count) {
      peakDay = { date: item.date, count: item.count };
    }
  });

  // Insights: Peak month
  let peakMonth = { month: "N/A", count: 0 };
  monthlyTrend.forEach((item) => {
    if (item.count > peakMonth.count) {
      peakMonth = { month: item.month, count: item.count };
    }
  });

  // Monthly order count comparison
  const now = new Date();
  const startOfLastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonthDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const thisMonthCount = await Order.count({
    where: {
      createdAt: {
        [Op.gte]: startOfThisMonth,
      },
    },
  });

  const lastMonthCount = await Order.count({
    where: {
      createdAt: {
        [Op.between]: [startOfLastMonthDate, endOfLastMonthDate],
      },
    },
  });

  let orderCountPercentageChange = 0;
  if (lastMonthCount > 0) {
    orderCountPercentageChange = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
  } else if (thisMonthCount > 0) {
    orderCountPercentageChange = 100;
  }

  // ==========================================
  // 6. OPERATIONAL LISTS (ADDITIONAL LISTS)
  // ==========================================
  // 10 latest orders
  const latestOrders = await Order.findAll({
    order: [["createdAt", "DESC"]],
    limit: 10,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email"],
      },
    ],
  });

  // 5 pending orders
  const pendingOrders = await Order.findAll({
    where: { status: "PENDING" },
    order: [["createdAt", "DESC"]],
    limit: 5,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName"],
      },
    ],
  });

  // 5 recently cancelled orders
  const recentlyCancelledOrders = await Order.findAll({
    where: { status: "CANCELLED" },
    order: [["createdAt", "DESC"]],
    limit: 5,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName"],
      },
    ],
  });

  // 5 products low on stock (stock <= 15)
  const lowStockProducts = await Product.findAll({
    where: { stock: { [Op.lte]: 15 } },
    order: [["stock", "ASC"]],
    limit: 5,
  });

  // 5 top selling products
  const topProductsRaw = await OrderItem.findAll({
    attributes: [
      "productId",
      "productName",
      "productSku",
      [fn("SUM", col("quantity")), "totalSold"],
    ],
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["imageUrl"],
      },
    ],
    group: [
      "productId",
      "OrderItem.product_name",
      "OrderItem.product_sku",
      "product.id",
      "product.image_url",
    ],
    order: [[fn("SUM", col("quantity")), "DESC"]],
    limit: 5,
  });

  const topSellingProducts = topProductsRaw.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    productSku: p.productSku,
    totalSold: Number(p.dataValues.totalSold),
    imageUrl: p.product?.imageUrl || null,
  }));

  return {
    overview: {
      totalOrders,
      ordersToday,
      totalCustomers,
      topCustomer,
      totalRevenue,
      averageOrderValue,
      revenueToday,
      revenueThisMonth,
      revenuePercentageChange,
      highestValueOrder,
    },
    statusStats: {
      statuses,
      completionRate,
      cancellationRate,
    },
    customerStats: {
      topCustomersByOrders,
      topCustomersBySpend,
      newCustomersThisMonth,
      customersWithOrdersCount,
      customersWithoutOrdersCount,
    },
    trends: {
      last7Days: last7DaysTrend,
      last30Days: last30DaysTrend,
      monthly: monthlyTrend,
    },
    insights: {
      peakDay,
      peakMonth,
      orderCountPercentageChange,
    },
    operationalLists: {
      latestOrders,
      pendingOrders,
      recentlyCancelledOrders,
      lowStockProducts,
      topSellingProducts,
    },
  };
};

export const getLeaderboardStats = async ({ leaderboardPeriod = "all", startDate, endDate } = {}) => {
  const orderWhere = { status: "COMPLETED" };
  const queryDate = new Date();

  if (leaderboardPeriod === "today") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    orderWhere.createdAt = {
      [Op.between]: [todayStart, todayEnd],
    };
  } else if (leaderboardPeriod === "month") {
    const startOfMonth = new Date(queryDate.getFullYear(), queryDate.getMonth(), 1);
    orderWhere.createdAt = {
      [Op.gte]: startOfMonth,
    };
  } else if (leaderboardPeriod === "year") {
    const startOfYear = new Date(queryDate.getFullYear(), 0, 1);
    orderWhere.createdAt = {
      [Op.gte]: startOfYear,
    };
  } else if (leaderboardPeriod === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    orderWhere.createdAt = {
      [Op.between]: [start, end],
    };
  }

  // Top 5 by order count
  const topCustomersByOrders = await Order.findAll({
    attributes: [
      "userId",
      [fn("COUNT", col("Order.id")), "orderCount"],
    ],
    where: orderWhere,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email", "phone"],
      },
    ],
    group: ["userId", "user.id", "user.full_name", "user.email", "user.phone"],
    order: [[fn("COUNT", col("Order.id")), "DESC"]],
    limit: 5,
  });

  // Top 5 by spending amount
  const topCustomersBySpend = await Order.findAll({
    attributes: [
      "userId",
      [fn("SUM", col("total_amount")), "totalSpend"],
    ],
    where: orderWhere,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email", "phone"],
      },
    ],
    group: ["userId", "user.id", "user.full_name", "user.email", "user.phone"],
    order: [[fn("SUM", col("total_amount")), "DESC"]],
    limit: 5,
  });

  return {
    topCustomersByOrders,
    topCustomersBySpend,
  };
};
