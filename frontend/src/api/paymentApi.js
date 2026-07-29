import axiosClient from "./axiosClient.js";

const unwrap = (request) => request.then((response) => response.data.data);

export const getAdminPayments = (params) =>
  unwrap(axiosClient.get("/payments/admin", { params }));
export const getAdminPayment = (id) =>
  unwrap(axiosClient.get(`/payments/admin/${id}`));
export const reconcilePayment = (id) =>
  unwrap(axiosClient.post(`/payments/admin/${id}/reconcile`));
export const refundPayment = (id, reason) =>
  unwrap(axiosClient.post(`/payments/admin/${id}/refund`, { reason }));
