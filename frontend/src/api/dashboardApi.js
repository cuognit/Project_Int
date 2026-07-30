import axiosClient from './axiosClient.js';

const getDashboardResource = (path, options = {}) =>
  axiosClient.get(`/dashboard/${path}`, options).then((response) => response.data.data);

export const getDashboardOverview = (options) => getDashboardResource('overview', options);
export const getDashboardAnalytics = (options) => getDashboardResource('analytics', options);
export const getDashboardCustomers = (params, options = {}) =>
  getDashboardResource('customers', { ...options, params });
export const getDashboardOrders = (options) => getDashboardResource('orders', options);
export const getDashboardProducts = (options) => getDashboardResource('products', options);
export const getLeaderboard = (params, options = {}) =>
  getDashboardResource('leaderboard', { ...options, params });
