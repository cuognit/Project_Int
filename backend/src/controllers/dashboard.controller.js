import * as dashboardService from "../services/dashboard.service.js";

const sendDashboardData = (service) => async (req, res, next) => {
  try {
    const data = await service(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Trả về các chỉ số tổng quan cho trang quản trị.
export const getOverview = sendDashboardData(() => dashboardService.getOverviewStats());
// Trả về dữ liệu phân tích doanh thu và đơn hàng.
export const getAnalytics = sendDashboardData(() => dashboardService.getAnalyticsStats());
// Trả về thống kê khách hàng theo bộ lọc được yêu cầu.
export const getCustomers = sendDashboardData((req) => {
  const { period = "all", startDate, endDate } = req.query;
  return dashboardService.getCustomerStats({
    leaderboardPeriod: period,
    startDate,
    endDate,
  });
});
// Trả về các danh sách đơn hàng phục vụ dashboard.
export const getOrders = sendDashboardData(() => dashboardService.getOrderLists());
// Trả về thống kê sản phẩm phục vụ dashboard.
export const getProducts = sendDashboardData(() => dashboardService.getProductStats());

// Trả về bảng xếp hạng theo khoảng thời gian và tiêu chí được chọn.
export const getLeaderboard = async (req, res, next) => {
  try {
    const { period = "all", startDate, endDate } = req.query;
    const leaderboard = await dashboardService.getLeaderboardStats({
      leaderboardPeriod: period,
      startDate,
      endDate,
    });
    return res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};
