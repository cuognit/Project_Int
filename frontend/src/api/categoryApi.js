import axiosClient from "./axiosClient.js";

const unwrap = (request) => request.then((response) => response.data.data);

export const getCategories = () => unwrap(axiosClient.get("/categories"));
export const createCategory = (name) =>
  unwrap(axiosClient.post("/categories", { name }));
export const updateCategory = (id, name) =>
  unwrap(axiosClient.put(`/categories/${id}`, { name }));
export const deleteCategory = (id) =>
  unwrap(axiosClient.delete(`/categories/${id}`));
