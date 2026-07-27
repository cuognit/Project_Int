import * as dashboardService from "../services/dashboard.service.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const { period = "all" } = req.query;
    const stats = await dashboardService.getDashboardStats({ leaderboardPeriod: period });
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

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
