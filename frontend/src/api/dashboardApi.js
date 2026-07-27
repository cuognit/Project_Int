import axiosClient from './axiosClient.js';

export const getDashboardStats = (period) => axiosClient.get('/dashboard', { params: period ? { period } : {} }).then((response) => response.data.data);

export const getLeaderboard = (params) => axiosClient.get('/dashboard/leaderboard', { params }).then((response) => response.data.data);
