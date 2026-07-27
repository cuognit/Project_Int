import axiosClient from "./axiosClient.js";

const unwrap = (request) => request.then((response) => response.data.data);
export const getProducts = (params) => unwrap(axiosClient.get("/products", { params }));
export const getProduct = (id) => unwrap(axiosClient.get(`/products/${id}`));
export const createProduct = (payload) => unwrap(axiosClient.post("/products", payload));
export const updateProduct = (id, payload) =>
  unwrap(axiosClient.put(`/products/${id}`, payload));
export const deleteProduct = (id) => unwrap(axiosClient.delete(`/products/${id}`));
