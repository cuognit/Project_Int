import axiosClient from "./axiosClient.js";

const unwrap = (request) => request.then((response) => response.data.data);

export const getAvailableVouchers = () => unwrap(axiosClient.get("/vouchers/available"));
export const validateVoucher = (code) => unwrap(axiosClient.post("/vouchers/validate", { code }));
export const getAdminVouchers = (params) => unwrap(axiosClient.get("/vouchers/admin", { params }));
export const createVoucher = (payload) => unwrap(axiosClient.post("/vouchers", payload));
export const updateVoucher = (id, payload) => unwrap(axiosClient.put(`/vouchers/${id}`, payload));
export const updateVoucherStatus = (id, isActive) =>
  unwrap(axiosClient.patch(`/vouchers/${id}/status`, { isActive }));
