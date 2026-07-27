import axiosClient from './axiosClient.js';

export const getOrders = (userId) => axiosClient.get('/orders', { params: userId ? { userId } : {} }).then((response) => response.data.data);
export const getMyOrders = (params) => axiosClient.get('/orders/mine', { params }).then((response) => response.data.data);
export const getOrder = (id) => axiosClient.get(`/orders/${id}`).then((response) => response.data.data);
export const createOrder = (payload) => axiosClient.post('/orders', payload).then((response) => response.data.data);
export const cancelOrder = (id) => axiosClient.patch(`/orders/${id}/cancel`).then((response) => response.data.data);
export const updateOrderStatus = (id, status) => axiosClient.patch(`/orders/${id}/status`, { status }).then((response) => response.data.data);
