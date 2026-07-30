import assert from "node:assert/strict";
import test from "node:test";
import { Order, User } from "../../src/models/index.js";
import {
  getAnalyticsStats,
  getOverviewStats,
} from "../../src/services/dashboard.service.js";

test("getOverviewStats - Tổng hợp đúng các số liệu đơn hàng, khách hàng và doanh thu", async () => {
  const origOrderCount = Order.count;
  const origUserCount = User.count;
  const origOrderSum = Order.sum;
  const origOrderFindOne = Order.findOne;
  const origOrderFindAll = Order.findAll;

  Order.count = async () => 10;
  User.count = async () => 5;
  Order.sum = async () => 1000000;
  Order.findOne = async () => null;
  Order.findAll = async () => [];

  try {
    const stats = await getOverviewStats();
    assert.equal(stats.totalOrders, 10);
    assert.equal(stats.totalCustomers, 5);
    assert.equal(stats.revenueThisMonth, 1000000);
    assert.equal(typeof stats.revenuePercentageChange, "number");
  } finally {
    Order.count = origOrderCount;
    User.count = origUserCount;
    Order.sum = origOrderSum;
    Order.findOne = origOrderFindOne;
    Order.findAll = origOrderFindAll;
  }
});

test("getAnalyticsStats - Tạo dữ liệu xu hướng bán hàng cho 7 ngày và 30 ngày", async () => {
  const origOrderFindAll = Order.findAll;
  const origOrderCount = Order.count;

  Order.findAll = async () => [
    { createdAt: new Date(), status: "COMPLETED", totalAmount: 200000 },
  ];
  Order.count = async () => 1;

  try {
    const analytics = await getAnalyticsStats();
    assert.ok(analytics.trends.last7Days);
    assert.ok(analytics.trends.last30Days);
    assert.equal(analytics.trends.last7Days.length, 7);
    assert.equal(analytics.trends.last30Days.length, 30);
  } finally {
    Order.findAll = origOrderFindAll;
    Order.count = origOrderCount;
  }
});
